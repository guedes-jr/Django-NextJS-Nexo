import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField("Telefone", max_length=20, blank=True, null=True)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return self.username

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

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        InvestorProfile.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
