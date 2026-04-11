import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField("Telefone", max_length=20, blank=True, null=True)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return self.username
