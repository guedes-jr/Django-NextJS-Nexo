# -*- coding: utf-8 -*-
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Document(models.Model):
    DOCUMENT_TYPES = [
        ('TERMO', 'Termo de Uso'),
        ('PRIVACY', 'Politica de Privacidade'),
        ('RISK', 'Termo de Risco'),
        ('SUITABILITY', 'Questionario Suitability'),
        ('CONTRACT', 'Contrato'),
        ('EXTRACT', 'Extrato'),
        ('REPORT', 'Relatorio'),
    ]
    
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    content = models.TextField(blank=True)
    file_url = models.URLField(blank=True, null=True)
    version = models.CharField(max_length=20, default='1.0')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} v{self.version}"

class UserConsent(models.Model):
    CONSENT_TYPES = [
        ('TERMO', 'Termos de Uso'),
        ('PRIVACY', 'Politica de Privacidade'),
        ('MARKETING', 'Marketing'),
        ('DATA_SHARING', 'Compartilhamento de Dados'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consents')
    consent_type = models.CharField(max_length=20, choices=CONSENT_TYPES)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    is_accepted = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'consent_type')
    
    def __str__(self):
        return f"{self.user.username} - {self.consent_type}"

class DocumentAccess(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_accesses')
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'document')