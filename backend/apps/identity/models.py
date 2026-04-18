import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
import pyotp

PERMISSIONS = [
    ('view_dashboard', 'Visualizar Dashboard'),
    ('view_portfolio', 'Visualizar Carteira'),
    ('edit_portfolio', 'Editar Carteira'),
    ('view_positions', 'Visualizar Posições'),
    ('edit_positions', 'Editar Posições'),
    ('view_transactions', 'Visualizar Transações'),
    ('edit_transactions', 'Editar Transações'),
    ('view_goals', 'Visualizar Metas'),
    ('edit_goals', 'Editar Metas'),
    ('view_automations', 'Visualizar Automações'),
    ('edit_automations', 'Editar Automações'),
    ('view_alerts', 'Visualizar Alertas'),
    ('edit_alerts', 'Editar Alertas'),
    ('view_documents', 'Visualizar Documentos'),
    ('edit_documents', 'Editar Documentos'),
    ('view_users', 'Visualizar Usuários'),
    ('edit_users', 'Editar Usuários'),
    ('view_profiles', 'Gerenciar Perfis'),
    ('view_reports', 'Visualizar Relatórios'),
    ('edit_settings', 'Editar Configurações'),
    ('view_billing', 'Visualizar Cobranças'),
    ('edit_billing', 'Editar Cobranças'),
]

ROLE_PERMISSIONS = {
    'USER': ['view_dashboard', 'view_portfolio', 'edit_portfolio', 'view_positions', 'edit_positions', 
             'view_transactions', 'view_goals', 'view_alerts', 'view_documents'],
    'MANAGER': ['view_dashboard', 'view_portfolio', 'edit_portfolio', 'view_positions', 'edit_positions',
              'view_transactions', 'edit_transactions', 'view_goals', 'edit_goals', 'view_automations',
              'view_alerts', 'edit_alerts', 'view_documents', 'edit_documents', 'view_users', 'view_reports', 'view_billing'],
    'SUPPORT': ['view_dashboard', 'view_portfolio', 'view_positions', 'view_transactions',
               'view_goals', 'view_automations', 'view_alerts', 'view_documents', 'view_users', 'view_reports'],
    'ADMIN': PERMISSIONS,
}

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('USER', 'Usuário'),
        ('MANAGER', 'Gerente'),
        ('SUPPORT', 'Suporte'),
        ('ADMIN', 'Administrador'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField("Telefone", max_length=20, blank=True, null=True)
    is_premium = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)
    mfa_backup_codes = models.JSONField(default=list, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    permissions = models.JSONField(default=list, blank=True)
    
    theme = models.CharField(max_length=10, default='dark')
    currency = models.CharField(max_length=3, default='BRL')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    newsletter = models.BooleanField(default=False)
    locale = models.CharField(max_length=5, default='pt-BR')
    
    avatar = models.ImageField(upload_to='avatars/%Y/%m/', blank=True, null=True)
    about = models.TextField(blank=True, default='')

    def __str__(self):
        return self.username
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN' or self.is_superuser
    
    @property
    def is_manager(self):
        return self.role in ('ADMIN', 'MANAGER') or self.is_superuser
    
    @property
    def is_support(self):
        return self.role in ('ADMIN', 'MANAGER', 'SUPPORT') or self.is_superuser
    
    def has_permission(self, permission: str) -> bool:
        if self.is_superuser:
            return True
        base_perms = ROLE_PERMISSIONS.get(self.role, [])
        custom_perms = self.permissions or []
        return permission in base_perms or permission in custom_perms
    
    def get_all_permissions(self) -> list:
        if self.is_superuser:
            return [p[0] for p in PERMISSIONS]
        base_perms = ROLE_PERMISSIONS.get(self.role, [])
        custom_perms = self.permissions or []
        return list(set(base_perms + custom_perms))
    
    def generate_mfa_secret(self):
        secret = pyotp.random_base32()
        self.mfa_secret = secret
        return secret
    
    def verify_mfa_code(self, code):
        if not self.mfa_secret:
            return False
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.verify(code)
    
    def get_mfa_qr_url(self):
        if not self.mfa_secret:
            self.generate_mfa_secret()
        return pyotp.totp.TOTP(self.mfa_secret).provisioning_uri(
            self.email or self.username,
            issuer_name="NEXO Investimentos"
        )


class TrustedDevice(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='trusted_devices')
    device_name = models.CharField(max_length=100)
    device_id = models.CharField(max_length=100, unique=True)
    browser = models.CharField(max_length=50)
    os = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField()
    last_access = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.device_name} - {self.user.username}"

class InvestorProfile(models.Model):
    RISK_CHOICES = [
        ('CONSERVADOR', 'Conservador'),
        ('MODERADO', 'Moderado'),
        ('ARROJADO', 'Arrojado'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    birth_date = models.DateField(blank=True, null=True)
    risk_level = models.CharField(max_length=20, choices=RISK_CHOICES, blank=True, null=True)
    primary_broker = models.CharField(max_length=50, blank=True, null=True)
    financial_goal = models.CharField(max_length=150, blank=True, null=True)
    onboarding_completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Perfil de {self.user.username}"


class SupportTicket(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Aberto'),
        ('IN_PROGRESS', 'Em Andamento'),
        ('WAITING', 'Aguardando Retorno'),
        ('RESOLVED', 'Resolvido'),
        ('CLOSED', 'Fechado'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Baixa'),
        ('MEDIUM', 'Média'),
        ('HIGH', 'Alta'),
        ('URGENT', 'Urgente'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tickets')
    assigned_to = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.id} - {self.title}"


class SupportMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    message = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Mensagem #{self.id} no ticket {self.ticket_id}"

from django.db.models.signals import post_save
from django.dispatch import receiver

class UserDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ('RG', 'RG'),
        ('CPF', 'CPF'),
        ('COMPROVANTE_RESIDENCIA', 'Comprovante de Residência'),
        ('EXTRATO_BANCARIO', 'Extrato Bancário'),
        ('OUTRO', 'Outro'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='user_documents/%Y/%m/%d/')
    original_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pendente'),
        ('APPROVED', 'Aprovado'),
        ('REJECTED', 'Rejeitado'),
    ], default='PENDING')
    rejection_reason = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_documents')

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.document_type} - {self.user.username}"


class AccountVerification(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('IN_REVIEW', 'Em Análise'),
        ('APPROVED', 'Aprovado'),
        ('REJECTED', 'Rejeitado'),
        ('REQUIRES_ACTION', 'Requer Ação'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='account_verification')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    documents_complete = models.BooleanField(default=False)
    verification_level = models.CharField(max_length=20, choices=[
        ('BASIC', 'Básico'),
        ('COMPLETE', 'Completo'),
        ('PREMIUM', 'Premium'),
    ], default='BASIC')
    
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_accounts')
    
    notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Verificação {self.user.username} - {self.status}"


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        InvestorProfile.objects.create(user=instance)
        AccountVerification.objects.create(user=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
    if hasattr(instance, 'account_verification'):
        instance.account_verification.save()
