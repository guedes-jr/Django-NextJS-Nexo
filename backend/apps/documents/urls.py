from django.urls import path
from .views import DocumentListView, DocumentDetailView, AcceptConsentView, UserConsentsView

urlpatterns = [
    path('', DocumentListView.as_view(), name='documents'),
    path('<int:doc_id>/', DocumentDetailView.as_view(), name='document_detail'),
    path('accept/', AcceptConsentView.as_view(), name='accept_consent'),
    path('consents/', UserConsentsView.as_view(), name='user_consents'),
]