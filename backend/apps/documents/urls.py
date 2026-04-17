from django.urls import path
from .views import (
    DocumentListView, DocumentDetailView, AcceptConsentView, UserConsentsView,
    NoteListView, NoteDetailView, InformeListView, InformeGenerateView,
    ComprovanteListView, ComprovanteDetailView
)

urlpatterns = [
    path('', DocumentListView.as_view(), name='documents'),
    path('<int:doc_id>/', DocumentDetailView.as_view(), name='document_detail'),
    path('accept/', AcceptConsentView.as_view(), name='accept_consent'),
    path('consents/', UserConsentsView.as_view(), name='user_consents'),
    
    path('notes/', NoteListView.as_view(), name='notes'),
    path('notes/<int:note_id>/', NoteDetailView.as_view(), name='note_detail'),
    path('informes/', InformeListView.as_view(), name='informes'),
    path('informes/generate/', InformeGenerateView.as_view(), name='informe_generate'),
    path('comprovantes/', ComprovanteListView.as_view(), name='comprovantes'),
    path('comprovantes/<int:comp_id>/', ComprovanteDetailView.as_view(), name='comprovante_detail'),
]