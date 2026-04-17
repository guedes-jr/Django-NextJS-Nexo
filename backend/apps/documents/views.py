from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Document, UserConsent, DocumentAccess, Note, Informe, Comprovante
from .serializers import NoteSerializer, InformeSerializer, ComprovanteSerializer

User = get_user_model()

class DocumentListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        documents = Document.objects.filter(is_active=True).order_by('-created_at')
        data = [{
            "id": d.id,
            "title": d.title,
            "document_type": d.document_type,
            "version": d.version,
            "created_at": d.created_at.isoformat()
        } for d in documents]
        
        user_consents = UserConsent.objects.filter(user=request.user)
        consents_data = {c.consent_type: c.is_accepted for c in user_consents}
        
        return Response({
            "documents": data,
            "user_consents": consents_data
        })

class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, doc_id):
        try:
            doc = Document.objects.get(id=doc_id, is_active=True)
        except Document.DoesNotExist:
            return Response({"error": "Documento nao encontrado"}, status=404)
        
        DocumentAccess.objects.update_or_create(
            user=request.user,
            document=doc,
            defaults={"ip_address": self.get_client_ip(request)}
        )
        
        return Response({
            "id": doc.id,
            "title": doc.title,
            "document_type": doc.document_type,
            "content": doc.content,
            "version": doc.version,
            "created_at": doc.created_at.isoformat(),
            "updated_at": doc.updated_at.isoformat()
        })
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class AcceptConsentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        consent_type = request.data.get('consent_type')
        is_accepted = request.data.get('is_accepted', False)
        
        if not consent_type:
            return Response({"error": "consent_type Obrigatorio"}, status=400)
        
        doc = Document.objects.filter(
            document_type=consent_type,
            is_active=True
        ).first()
        
        consent, created = UserConsent.objects.update_or_create(
            user=request.user,
            consent_type=consent_type,
            defaults={
                "document": doc,
                "is_accepted": is_accepted,
                "accepted_at": timezone.now() if is_accepted else None,
                "ip_address": self.get_client_ip(request)
            }
        )
        
        return Response({
            "consent_type": consent_type,
            "is_accepted": is_accepted,
            "accepted_at": consent.accepted_at.isoformat() if consent.accepted_at else None
        })
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class UserConsentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        consents = UserConsent.objects.filter(user=request.user)
        return Response([{
            "consent_type": c.consent_type,
            "is_accepted": c.is_accepted,
            "accepted_at": c.accepted_at.isoformat() if c.accepted_at else None,
            "document_title": c.document.title if c.document else None
        } for c in consents])


class NoteListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        notes = Note.objects.filter(user=request.user)
        return Response(NoteSerializer(notes, many=True).data)
    
    def post(self, request):
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)


class NoteDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, note_id):
        try:
            note = Note.objects.get(id=note_id, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Nota não encontrada"}, status=404)
        return Response(NoteSerializer(note).data)
    
    def put(self, request, note_id):
        try:
            note = Note.objects.get(id=note_id, user=request.user)
        except Note.DoesNotExist:
            return Response({"error": "Nota não encontrada"}, status=404)
        serializer = NoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def delete(self, request, note_id):
        try:
            note = Note.objects.get(id=note_id, user=request.user)
            note.delete()
            return Response({"message": "Nota deletada"})
        except Note.DoesNotExist:
            return Response({"error": "Nota não encontrada"}, status=404)


class InformeListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year')
        informes = Informe.objects.filter(user=request.user)
        if year:
            informes = informes.filter(year=int(year))
        return Response(InformeSerializer(informes, many=True).data)
    
    def post(self, request):
        serializer = InformeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)


class InformeGenerateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from apps.portfolio.models import Position, Transaction
        
        year = request.data.get('year')
        report_type = request.data.get('report_type', 'ANNUAL')
        
        if not year:
            return Response({"error": "Ano é obrigatório"}, status=400)
        
        positions = Position.objects.filter(user=request.user)
        transactions = Transaction.objects.filter(
            user=request.user,
            date__year=int(year)
        )
        
        total_dividends = sum(t.value for t in transactions if t.transaction_type == 'DIVIDEND')
        total_taxes = sum(t.value for t in transactions if t.transaction_type == 'TAX')
        
        assets_summary = []
        for pos in positions:
            assets_summary.append({
                "ticker": pos.ticker,
                "quantity": float(pos.quantity),
                "current_value": float(pos.current_value) if pos.current_value else 0,
            })
        
        transactions_summary = []
        for t in transactions[:50]:
            transactions_summary.append({
                "date": t.date.isoformat() if t.date else None,
                "type": t.transaction_type,
                "ticker": t.ticker,
                "value": float(t.value) if t.value else 0,
            })
        
        informe = Informe.objects.create(
            user=request.user,
            title=f"Informe {year}",
            report_type=report_type,
            year=int(year),
            total_dividends=total_dividends,
            total_taxes=total_taxes,
            assets_summary=assets_summary,
            transactions_summary=transactions_summary,
        )
        
        return Response(InformeSerializer(informe).data, status=201)


class ComprovanteListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        comprovantes = Comprovante.objects.filter(user=request.user)
        return Response(ComprovanteSerializer(comprovantes, many=True).data)
    
    def post(self, request):
        serializer = ComprovanteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)


class ComprovanteDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, comp_id):
        try:
            comp = Comprovante.objects.get(id=comp_id, user=request.user)
        except Comprovante.DoesNotExist:
            return Response({"error": "Comprovante não encontrado"}, status=404)
        return Response(ComprovanteSerializer(comp).data)
    
    def delete(self, request, comp_id):
        try:
            comp = Comprovante.objects.get(id=comp_id, user=request.user)
            comp.delete()
            return Response({"message": "Comprovante deletado"})
        except Comprovante.DoesNotExist:
            return Response({"error": "Comprovante não encontrado"}, status=404)