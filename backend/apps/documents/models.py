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


class Note(models.Model):
    NOTE_TYPES = [
        ('PORTFOLIO', 'Nota de Carteira'),
        ('PERFORMANCE', 'Nota de Desempenho'),
        ('TAX', 'Nota Fiscal'),
        ('ANALYSIS', 'Análise'),
        ('GENERAL', 'Geral'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=200)
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES, default='GENERAL')
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class Informe(models.Model):
    TYPE_CHOICES = [
        ('ANNUAL', 'Informe Anual'),
        ('QUARTERLY', 'Informe Trimestral'),
        ('MONTHLY', 'Informe Mensal'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='informes')
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    year = models.IntegerField()
    period = models.CharField(max_length=20, blank=True)
    total_capital_gains = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_dividends = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_taxes = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    assets_summary = models.JSONField(default=list)
    transactions_summary = models.JSONField(default=list)
    file_url = models.URLField(blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'report_type', 'year', 'period')
        ordering = ['-year', '-report_type']
    
    def __str__(self):
        return f"{self.report_type} {self.year} - {self.user.username}"


class Comprovante(models.Model):
    TYPE_CHOICES = [
        ('DEPOSIT', 'Depósito'),
        ('WITHDRAWAL', 'Saque'),
        ('TRANSFER', 'Transferência'),
        ('PURCHASE', 'Compra'),
        ('SALE', 'Venda'),
        ('DIVIDEND', 'Dividendo'),
        ('FEE', 'Taxa'),
        ('OTHER', 'Outro'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comprovantes')
    comprovante_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    ticker = models.CharField(max_length=20, blank=True, null=True)
    quantity = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    total_value = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField(blank=True)
    transaction_date = models.DateField()
    file_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
    
    def __str__(self):
        return f"{self.comprovante_type} - {self.user.username} - {self.transaction_date}"