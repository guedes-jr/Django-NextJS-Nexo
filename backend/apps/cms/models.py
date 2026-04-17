from django.db import models


class Banner(models.Model):
    title = models.CharField(max_length=100)
    message = models.TextField()
    image_url = models.URLField(blank=True, null=True)
    link_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Faq(models.Model):
    question = models.CharField(max_length=200)
    answer = models.TextField()
    category = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    def __str__(self):
        return self.question


class Message(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=[
        ('INFO', 'Info'),
        ('ALERT', 'Alerta'),
        ('SUCCESS', 'Sucesso'),
    ], default='INFO')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class InstitutionalContent(models.Model):
    CONTENT_TYPES = [
        ('PRIVACY_POLICY', 'Política de Privacidade'),
        ('TERMS_OF_USE', 'Termos de Uso'),
        ('REGULATORY_DISCLAIMER', 'Aviso Regulatório'),
        ('RISK_DISCLAIMER', 'Aviso de Risco'),
        ('ABOUT_US', 'Sobre Nós'),
        ('CONTACT', 'Contato'),
        ('FAQ_CATEGORY', 'Categoria FAQ'),
    ]
    
    content_type = models.CharField(max_length=30, choices=CONTENT_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    version = models.CharField(max_length=20, default='1.0')
    is_active = models.BooleanField(default=True)
    is_current = models.BooleanField(default=True)
    effective_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('identity.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_contents')

    class Meta:
        ordering = ['-version', '-effective_date']

    def __str__(self):
        return f"{self.get_content_type_display()} v{self.version}"