from rest_framework import serializers
from .models import Document, UserConsent, DocumentAccess

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