from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Banner, Faq, Message


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