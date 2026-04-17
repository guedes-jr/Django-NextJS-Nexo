from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from django.utils.timezone import now
from .models import Banner, Faq, Message, InstitutionalContent


class BannerListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        banners = Banner.objects.filter(is_active=True)
        return Response([{
            "id": b.id,
            "title": b.title,
            "message": b.message,
            "image_url": b.image_url,
            "link_url": b.link_url,
        } for b in banners])


class FaqListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        category = request.query_params.get('category')
        faqs = Faq.objects.filter(is_active=True)
        if category:
            faqs = faqs.filter(category=category)
        return Response([{
            "id": f.id,
            "question": f.question,
            "answer": f.answer,
            "category": f.category,
        } for f in faqs.order_by('order')])


class MessageListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        messages = Message.objects.filter(is_active=True)
        return Response([{
            "id": m.id,
            "title": m.title,
            "content": m.content,
            "message_type": m.message_type,
        } for m in messages])


class InstitutionalContentSerializer:
    pass


class InstitutionalContentListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        content_type = request.query_params.get('type')
        contents = InstitutionalContent.objects.filter(is_active=True, is_current=True)
        if content_type:
            contents = contents.filter(content_type=content_type)
        return Response([{
            "id": c.id,
            "content_type": c.content_type,
            "title": c.title,
            "content": c.content,
            "version": c.version,
            "effective_date": c.effective_date.isoformat() if c.effective_date else None,
        } for c in contents])


class InstitutionalContentAdminView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        content_type = request.query_params.get('type')
        contents = InstitutionalContent.objects.all()
        if content_type:
            contents = contents.filter(content_type=content_type)
        return Response([{
            "id": c.id,
            "content_type": c.content_type,
            "title": c.title,
            "content": c.content,
            "version": c.version,
            "is_active": c.is_active,
            "is_current": c.is_current,
            "effective_date": c.effective_date.isoformat() if c.effective_date else None,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
        } for c in contents])
    
    def post(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        content_type = request.data.get('content_type')
        title = request.data.get('title')
        content = request.data.get('content')
        version = request.data.get('version', '1.0')
        effective_date = request.data.get('effective_date')
        
        if not all([content_type, title, content]):
            return Response({"error": "Campos obrigatórios faltando"}, status=400)
        
        if effective_date:
            from datetime import datetime
            effective_date = datetime.strptime(effective_date, '%Y-%m-%d').date()
        
        # Mark previous versions as not current
        InstitutionalContent.objects.filter(
            content_type=content_type, is_current=True
        ).update(is_current=False)
        
        new_content = InstitutionalContent.objects.create(
            content_type=content_type,
            title=title,
            content=content,
            version=version,
            effective_date=effective_date or now().date(),
            is_active=True,
            is_current=True,
            created_by=request.user
        )
        
        return Response({
            "message": "Conteúdo criado",
            "id": new_content.id
        }, status=201)
    
    def put(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        content_id = request.data.get('id')
        try:
            content = InstitutionalContent.objects.get(id=content_id)
        except InstitutionalContent.DoesNotExist:
            return Response({"error": "Conteúdo não encontrado"}, status=404)
        
        if request.data.get('title'):
            content.title = request.data.get('title')
        if request.data.get('content'):
            content.content = request.data.get('content')
        if request.data.get('is_active'):
            content.is_active = request.data.get('is_active')
        
        content.save()
        return Response({"message": "Conteúdo atualizado"})


class RegulatoryNoticeListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        notices = InstitutionalContent.objects.filter(
            content_type='REGULATORY_DISCLAIMER',
            is_active=True,
            is_current=True
        )
        return Response([{
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "version": n.version,
            "effective_date": n.effective_date.isoformat() if n.effective_date else None,
        } for n in notices])