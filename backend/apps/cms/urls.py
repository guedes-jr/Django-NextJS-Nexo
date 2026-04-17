from django.urls import path
from .views import (
    BannerListView, FaqListView, MessageListView,
    InstitutionalContentListView, InstitutionalContentAdminView,
    RegulatoryNoticeListView
)

urlpatterns = [
    path('banners/', BannerListView.as_view(), name='banners'),
    path('faqs/', FaqListView.as_view(), name='faqs'),
    path('messages/', MessageListView.as_view(), name='messages'),
    path('institutional/', InstitutionalContentListView.as_view(), name='institutional'),
    path('institutional/admin/', InstitutionalContentAdminView.as_view(), name='institutional_admin'),
    path('regulatory/', RegulatoryNoticeListView.as_view(), name='regulatory'),
]