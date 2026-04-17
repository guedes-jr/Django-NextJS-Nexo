# -*- coding: utf-8 -*-
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import AutomationTrigger, AutomationLog, BrokerConnection, SyncLog

class AutomationTriggerListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        triggers = AutomationTrigger.objects.filter(user=request.user)
        return Response([{
            "id": t.id,
            "name": t.name,
            "trigger_type": t.trigger_type,
            "condition_value": float(t.condition_value),
            "asset_ticker": t.asset_ticker,
            "action_type": t.action_type,
            "is_active": t.is_active,
            "last_triggered": t.last_triggered.isoformat() if t.last_triggered else None
        } for t in triggers])
    
    def post(self, request):
        data = request.data
        trigger = AutomationTrigger.objects.create(
            user=request.user,
            name=data.get('name'),
            trigger_type=data.get('trigger_type'),
            condition_value=data.get('condition_value'),
            asset_ticker=data.get('asset_ticker'),
            action_type=data.get('action_type'),
            is_active=True
        )
        return Response({"id": trigger.id, "message": "Gatilho criado"})

class AutomationTriggerDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, trigger_id):
        try:
            trigger = AutomationTrigger.objects.get(id=trigger_id, user=request.user)
            trigger.delete()
            return Response({"message": "Gatilho removido"})
        except AutomationTrigger.DoesNotExist:
            return Response({"error": "Gatilho nao encontrado"}, status=404)

class BrokerConnectionListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        connections = BrokerConnection.objects.filter(user=request.user)
        return Response([{
            "id": c.id,
            "broker_name": c.broker_name,
            "broker_code": c.broker_code,
            "status": c.status,
            "last_sync": c.last_sync.isoformat() if c.last_sync else None,
            "created_at": c.created_at.isoformat()
        } for c in connections])
    
    def post(self, request):
        data = request.data
        broker = BrokerConnection.objects.create(
            user=request.user,
            broker_name=data.get('broker_name'),
            broker_code=data.get('broker_code'),
            account_number=data.get('account_number', ''),
            status='PENDING'
        )
        return Response({"id": broker.id, "message": "Conexao criada"})

class BrokerConnectionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, conn_id):
        try:
            conn = BrokerConnection.objects.get(id=conn_id, user=request.user)
            conn.delete()
            return Response({"message": "Conexao removida"})
        except BrokerConnection.DoesNotExist:
            return Response({"error": "Conexao nao encontrada"}, status=404)

class SyncStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conn_id):
        try:
            connection = BrokerConnection.objects.get(id=conn_id, user=request.user)
            logs = SyncLog.objects.filter(connection=connection)[:10]
            return Response({
                "connection": {
                    "id": connection.id,
                    "broker_name": connection.broker_name,
                    "status": connection.status,
                    "last_sync": connection.last_sync.isoformat() if connection.last_sync else None
                },
                "logs": [{
                    "sync_date": l.sync_date.isoformat(),
                    "status": l.status,
                    "positions_synced": l.positions_synced,
                    "transactions_synced": l.transactions_synced,
                    "error_message": l.error_message
                } for l in logs]
            })
        except BrokerConnection.DoesNotExist:
            return Response({"error": "Conexao nao encontrada"}, status=404)
    
    def post(self, request, conn_id):
        try:
            connection = BrokerConnection.objects.get(id=conn_id, user=request.user)
            
            SyncLog.objects.create(
                connection=connection,
                status='SUCCESS',
                positions_synced=5,
                transactions_synced=10,
                error_message=''
            )
            
            connection.status = 'CONNECTED'
            connection.last_sync = timezone.now()
            connection.save()
            
            return Response({"message": "Sincronizacao simulada com sucesso"})
        except BrokerConnection.DoesNotExist:
            return Response({"error": "Conexao nao encontrada"}, status=404)