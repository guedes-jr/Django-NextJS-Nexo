# -*- coding: utf-8 -*-
"""
Modelo de Trilha de Auditoria
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLog(models.Model):
    ACTION_TYPES = [
        ('CREATE', 'Criação'),
        ('UPDATE', 'Atualização'),
        ('DELETE', 'Exclusão'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Exportação'),
        ('IMPORT', 'Importação'),
        ('VIEW', 'Visualização'),
        ('APPROVE', 'Aprovação'),
        ('REJECT', 'Rejeição'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    username = models.CharField(max_length=150, help_text="Username preserved even if user is deleted")
    
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    resource = models.CharField(max_length=100, help_text="Ex: User, Position, Transaction")
    resource_id = models.CharField(max_length=50, null=True, blank=True)
    
    changes = models.JSONField(default=dict, help_text="Before/after values")
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    endpoint = models.CharField(max_length=500, null=True, blank=True)
    
    status = models.CharField(max_length=10, choices=[
        ('SUCCESS', 'Sucesso'),
        ('FAILURE', 'Falha'),
    ], default='SUCCESS')
    
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Trilha de Auditoria'
        verbose_name_plural = 'Trilhas de Auditoria'
    
    def __str__(self):
        return f"{self.action} - {self.resource} - {self.username} - {self.created_at}"
    
    @classmethod
    def log(cls, user, action, resource, resource_id=None, changes=None, ip_address=None, user_agent=None, endpoint=None, status='SUCCESS', error_message=None):
        old = changes.get('old') if changes else {}
        new = changes.get('new') if changes else {}
        
        return cls.objects.create(
            user=user,
            username=user.username if user else 'Anonymous',
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id else None,
            old_values=old,
            new_values=new,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            status=status,
            error_message=error_message,
        )