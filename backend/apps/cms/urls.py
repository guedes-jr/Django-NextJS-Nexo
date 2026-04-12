from django.urls import path
from .views import BannerListView, FaqListView, MessageListView

urlpatterns = [
    path('banners/', BannerListView.as_view(), name='banners'),
    path('faqs/', FaqListView.as_view(), name='faqs'),
    path('messages/', MessageListView.as_view(), name='messages'),
]