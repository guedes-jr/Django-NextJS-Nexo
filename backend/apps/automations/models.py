# -*- coding: utf-8 -*-
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AutomationTrigger(models.Model):
    TRIGGER_TYPES = [
        ('PRICE_ABOVE', 'Preco acima de'),
        ('PRICE_BELOW', 'Preco abaixo de'),
        ('PROFIT_ABOVE', 'Lucro acima de %'),
        ('PROFIT_BELOW', 'Prejuizo acima de %'),
        ('PORTFOLIO_VALUE', 'Valor da carteira'),
        ('DAILY_CONTRIBUTION', 'Aporte diario'),
        ('GOAL_PROGRESS', 'Progresso da meta'),
    ]
    
    ACTION_TYPES = [
        ('NOTIFY', 'Notificacao'),
        ('ALERT', 'Alerta'),
        ('REBALANCE', 'Sugerir rebalanceamento'),
        ('CONTRIBUTION', 'Sugerir aporte'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='automation_triggers')
    name = models.CharField(max_length=100)
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPES)
    condition_value = models.DecimalField(max_digits=18, decimal_places=2)
    asset_ticker = models.CharField(max_length=20, blank=True, null=True, help_text="Se vazio, aplica a todos")
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.trigger_type}"

class AutomationLog(models.Model):
    trigger = models.ForeignKey(AutomationTrigger, on_delete=models.CASCADE, related_name='logs')
    triggered_at = models.DateTimeField(auto_now_add=True)
    condition_met = models.BooleanField()
    action_taken = models.CharField(max_length=100, blank=True)
    details = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-triggered_at']
    
    def __str__(self):
        return f"{self.trigger.name} - {self.triggered_at}"

class BrokerConnection(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('CONNECTED', 'Conectado'),
        ('ERROR', 'Erro'),
        ('DISABLED', 'Desativado'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='broker_connections')
    broker_name = models.CharField(max_length=50)
    broker_code = models.CharField(max_length=20)
    account_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    api_key = models.CharField(max_length=200, blank=True, help_text="Criptografado")
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'broker_code')
    
    def __str__(self):
        return f"{self.broker_name} - {self.user.username}"

class SyncLog(models.Model):
    connection = models.ForeignKey(BrokerConnection, on_delete=models.CASCADE, related_name='sync_logs')
    sync_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20)
    positions_synced = models.IntegerField(default=0)
    transactions_synced = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-sync_date']
    
    def __str__(self):
        return f"{self.connection.broker_name} - {self.sync_date}"