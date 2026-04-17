# -*- coding: utf-8 -*-
"""
Custom Login View com Auditoria
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            user = self.get_user(request)
            if user:
                try:
                    from apps.identity.audit import AuditLog
                    ip_address = self.get_client_ip(request)
                    user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
                    
                    AuditLog.log(
                        user=user,
                        action='LOGIN',
                        resource='auth',
                        ip_address=ip_address,
                        user_agent=user_agent,
                        endpoint=request.path,
                        status='SUCCESS',
                    )
                except Exception:
                    pass
        
        return response
    
    def get_user(self, request):
        username = request.data.get('username')
        if not username:
            return None
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip