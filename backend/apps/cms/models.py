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