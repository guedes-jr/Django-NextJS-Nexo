# -*- coding: utf-8 -*-
"""
APIs de Auditoria
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q
from .audit import AuditLog

User = get_user_model()


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        
        action = request.query_params.get('action')
        resource = request.query_params.get('resource')
        user_id = request.query_params.get('user_id')
        status = request.query_params.get('status')
        
        logs = AuditLog.objects.all()
        
        if action:
            logs = logs.filter(action=action)
        if resource:
            logs = logs.filter(resource=resource)
        if user_id:
            logs = logs.filter(user_id=user_id)
        if status:
            logs = logs.filter(status=status)
        
        total = logs.count()
        offset = (page - 1) * page_size
        logs = logs[offset:offset + page_size]
        
        return Response({
            "total": total,
            "page": page,
            "page_size": page_size,
            "logs": [{
                "id": log.id,
                "username": log.username,
                "action": log.action,
                "resource": log.resource,
                "resource_id": log.resource_id,
                "ip_address": log.ip_address,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
            } for log in logs]
        })


class AuditLogDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, log_id):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        try:
            log = AuditLog.objects.get(id=log_id)
        except AuditLog.DoesNotExist:
            return Response({"error": "Log não encontrado"}, status=404)
        
        return Response({
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "resource": log.resource,
            "resource_id": log.resource_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "endpoint": log.endpoint,
            "status": log.status,
            "error_message": log.error_message,
            "created_at": log.created_at.isoformat(),
        })


class UserActivityView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_id = request.query_params.get('user_id', request.user.id)
        
        logs = AuditLog.objects.filter(user_id=user_id)[:20]
        
        return Response([{
            "id": log.id,
            "action": log.action,
            "resource": log.resource,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "status": log.status,
            "created_at": log.created_at.isoformat(),
        } for log in logs])