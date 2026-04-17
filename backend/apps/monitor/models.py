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
    
    def __str__(self):
        return f"{self.command[:50]} - {self.created_at}"