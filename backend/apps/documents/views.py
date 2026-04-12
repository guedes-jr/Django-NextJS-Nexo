from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Document, UserConsent, DocumentAccess

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