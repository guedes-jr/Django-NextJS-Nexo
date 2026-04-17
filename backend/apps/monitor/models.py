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