# -*- coding: utf-8 -*-
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CommandHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    command = models.TextField()
    output = models.TextField(blank=True)
    exit_code = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Histórico de Comandos'
        verbose_name_plural = 'Histórico de Comandos'
    
    def __str__(self):
        return f"{self.command[:50]} - {self.created_at}"


class QueryHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    query = models.TextField()
    rows_affected = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=[
        ('SUCCESS', 'Sucesso'),
        ('ERROR', 'Erro'),
    ], default='SUCCESS')
    error_message = models.TextField(blank=True)
    execution_time = models.FloatField(default=0, help_text="Tempo em milissegundos")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Histórico de Queries'
        verbose_name_plural = 'Histórico de Queries'
    
    def __str__(self):
        return f"{self.query[:50]} - {self.created_at}"


class AppLog(models.Model):
    LEVELS = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    logger = models.CharField(max_length=100, help_text="Nome do logger")
    level = models.CharField(max_length=20, choices=LEVELS)
    message = models.TextField()
    traceback = models.TextField(blank=True)
    extra_data = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Log de Aplicação'
        verbose_name_plural = 'Logs de Aplicação'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['level']),
            models.Index(fields=['logger']),
        ]
    
    def __str__(self):
        return f"[{self.level}] {self.logger}: {self.message[:50]}"


class FeatureFlag(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Nome da flag")
    description = models.TextField(blank=True)
    value = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    is_global = models.BooleanField(default=False, help_text="Se true, afeta todos os usuários")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_flags')
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Feature Flag'
        verbose_name_plural = 'Feature Flags'
    
    def __str__(self):
        return f"{self.name} = {self.value}"


class ConfigHistory(models.Model):
    config = models.ForeignKey(FeatureFlag, on_delete=models.CASCADE, related_name='history')
    old_value = models.JSONField(default=dict)
    new_value = models.JSONField(default=dict)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    change_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Histórico de Configuração'
        verbose_name_plural = 'Histórico de Configurações'
    
    def __str__(self):
        return f"{self.config.name} - {self.created_at}"