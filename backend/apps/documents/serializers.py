from rest_framework import serializers
from .models import Document, UserConsent, DocumentAccess, Note, Informe, Comprovante

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

class UserConsentSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source='document.title', read_only=True)
    
    class Meta:
        model = UserConsent
        fields = '__all__'

class AcceptConsentSerializer(serializers.Serializer):
    consent_type = serializers.CharField()
    is_accepted = serializers.BooleanField()


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class InformeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Informe
        fields = '__all__'
        read_only_fields = ('user', 'generated_at')


class ComprovanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comprovante
        fields = '__all__'
        read_only_fields = ('user', 'created_at')