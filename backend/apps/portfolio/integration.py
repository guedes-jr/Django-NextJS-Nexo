# -*- coding: utf-8 -*-
"""
APIs para integração com provedores externos (Open Finance, Belvo, etc)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from .models import BrokerConnection, DataImport, WebhookEvent, Position, Transaction, Asset, Institution


class BrokerConnectionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        connections = BrokerConnection.objects.filter(user=request.user)
        return Response([{
            "id": c.id,
            "provider": c.provider,
            "institution": c.institution.name if c.institution else None,
            "status": c.status,
            "last_sync": c.last_sync.isoformat() if c.last_sync else None,
            "sync_status": c.sync_status,
        } for c in connections])
    
    def post(self, request):
        provider = request.data.get('provider')
        institution_id = request.data.get('institution_id')
        
        if not provider:
            return Response({"error": "Provider é obrigatório"}, status=400)
        
        providers = ['OPEN_FINANCE', 'BELVO', 'PLAID', 'MOCK']
        if provider not in providers:
            return Response({"error": "Provider inválido"}, status=400)
        
        institution = None
        if institution_id:
            try:
                institution = Institution.objects.get(id=institution_id)
            except Institution.DoesNotExist:
                pass
        
        connection = BrokerConnection.objects.create(
            user=request.user,
            provider=provider,
            institution=institution,
            status='PENDING'
        )
        
        return Response({
            "id": connection.id,
            "provider": connection.provider,
            "status": connection.status,
            "message": f"Conexão criada com {provider}. Use o link de OAuth para autorizar."
        }, status=201)


class BrokerConnectionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conn_id):
        try:
            conn = BrokerConnection.objects.get(id=conn_id, user=request.user)
        except BrokerConnection.DoesNotExist:
            return Response({"error": "Conexão não encontrada"}, status=404)
        
        return Response({
            "id": conn.id,
            "provider": conn.provider,
            "institution": conn.institution.name if conn.institution else None,
            "status": conn.status,
            "sync_status": conn.sync_status,
            "last_sync": conn.last_sync.isoformat() if conn.last_sync else None,
            "error_message": conn.error_message,
        })
    
    def delete(self, request, conn_id):
        try:
            conn = BrokerConnection.objects.get(id=conn_id, user=request.user)
            conn.delete()
            return Response({"message": "Conexão removida"})
        except BrokerConnection.DoesNotExist:
            return Response({"error": "Conexão não encontrada"}, status=404)


class DataImportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        connection_id = request.query_params.get('connection_id')
        imports = DataImport.objects.filter(user=request.user)
        if connection_id:
            imports = imports.filter(connection_id=connection_id)
        return Response([{
            "id": i.id,
            "connection": i.connection.provider,
            "import_type": i.import_type,
            "status": i.status,
            "imported_count": i.imported_count,
            "rejected_count": i.rejected_count,
            "started_at": i.started_at.isoformat() if i.started_at else None,
            "completed_at": i.completed_at.isoformat() if i.completed_at else None,
        } for i in imports[:20]])
    
    def post(self, request):
        connection_id = request.data.get('connection_id')
        import_type = request.data.get('import_type', 'POSITIONS')
        
        try:
            connection = BrokerConnection.objects.get(id=connection_id, user=request.user)
        except BrokerConnection.DoesNotExist:
            return Response({"error": "Conexão não encontrada"}, status=404)
        
        if connection.status != 'CONNECTED':
            return Response({"error": "Conexão não está ativa"}, status=400)
        
        import_job = DataImport.objects.create(
            user=request.user,
            connection=connection,
            import_type=import_type,
            status='PENDING',
            started_at=timezone.now()
        )
        
        if connection.provider == 'MOCK':
            result = self._import_from_mock(connection, import_job)
        elif connection.provider == 'OPEN_FINANCE':
            result = self._import_from_open_finance(connection, import_job)
        else:
            result = {"error": f"Provider {connection.provider} não implementado"}
        
        return Response({
            "import_id": import_job.id,
            "status": import_job.status,
            "imported": import_job.imported_count,
            "rejected": import_job.rejected_count,
        })
    
    def _import_from_mock(self, connection, import_job):
        mock_data = [
            {"ticker": "PETR4", "quantity": 100, "average_price": 28.50, "current_price": 32.00},
            {"ticker": "VALE3", "quantity": 50, "average_price": 68.00, "current_price": 65.00},
            {"ticker": "ITUB4", "quantity": 200, "average_price": 28.00, "current_price": 30.50},
        ]
        
        inst, _ = Institution.objects.get_or_create(name="Carteira via Integração")
        
        for item in mock_data:
            asset, _ = Asset.objects.get_or_create(
                ticker=item['ticker'],
                defaults={'name': item['ticker'], 'asset_type': 'ACAO'}
            )
            
            account, _ = connection.user.investment_accounts.get_or_create(
                institution=inst,
                defaults={'description': 'Conta via Integração'}
            )
            
            pos, created = Position.objects.get_or_create(
                account=account,
                asset=asset,
                defaults={
                    'quantity': item['quantity'],
                    'average_price': item['average_price'],
                    'current_price': item['current_price']
                }
            )
            
            if not created:
                pos.quantity = item['quantity']
                pos.average_price = item['average_price']
                pos.current_price = item['current_price']
                pos.save()
            
            import_job.imported_count += 1
        
        import_job.status = 'COMPLETED'
        import_job.completed_at = timezone.now()
        import_job.save()
        
        connection.last_sync = timezone.now()
        connection.sync_status = 'SUCCESS'
        connection.save()
        
        return {"imported": import_job.imported_count}
    
    def _import_from_open_finance(self, connection, import_job):
        import_job.status = 'FAILED'
        import_job.error_log = [{"error": "Open Finance ainda não implementado"}]
        import_job.save()
        return {"error": "Open Finance ainda não implementado"}


class SyncView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        connection_id = request.data.get('connection_id')
        
        try:
            connection = BrokerConnection.objects.get(id=connection_id, user=request.user)
        except BrokerConnection.DoesNotExist:
            return Response({"error": "Conexão não encontrada"}, status=404)
        
        connection.sync_status = 'SYNCING'
        connection.save()
        
        import_payloads = {
            'positions': 'POSITIONS',
            'transactions': 'TRANSACTIONS',
            'dividends': 'DIVIDENDS',
        }
        
        for import_type in import_payloads.values():
            DataImport.objects.create(
                user=request.user,
                connection=connection,
                import_type=import_type,
                status='PENDING',
                started_at=timezone.now()
            )
        
        return Response({
            "message": "Sincronização iniciada",
            "connection_id": connection.id,
            "sync_status": connection.sync_status,
        })


class WebhookReceiverView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        provider = request.data.get('provider')
        event_type = request.data.get('event_type')
        external_id = request.data.get('external_id')
        payload = request.data.get('payload', {})
        
        if not all([provider, event_type, external_id]):
            return Response({"error": "Campos obrigatórios faltando"}, status=400)
        
        event, created = WebhookEvent.objects.get_or_create(
            provider=provider,
            external_id=external_id,
            defaults={
                'event_type': event_type,
                'payload': payload
            }
        )
        
        if created:
            self._process_event(event)
        
        return Response({"status": "ok"})
    
    def _process_event(self, event):
        if event.event_type == 'POSITION_UPDATE':
            pass
        elif event.event_type == 'DIVIDEND':
            pass
        
        event.processed = True
        event.processed_at = timezone.now()
        event.save()