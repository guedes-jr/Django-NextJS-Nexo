# -*- coding: utf-8 -*-
"""
Decorators e helpers para auditoria
"""
from functools import wraps
from django.utils.timezone import now


def audit_action(action, resource):
    """Decorator para自动 logging de ações"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            response = view_func(request, *args, **kwargs)
            
            if hasattr(request, 'user') and request.user.is_authenticated:
                from .audit import AuditLog
                
                ip_address = get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
                
                AuditLog.log(
                    user=request.user,
                    action=action,
                    resource=resource,
                    resource_id=kwargs.get('pk') or kwargs.get('id'),
                    ip_address=ip_address,
                    user_agent=user_agent,
                    endpoint=request.path,
                    status='SUCCESS' if response.status_code < 400 else 'FAILURE',
                )
            
            return response
        return wrapper
    return decorator


def get_client_ip(request):
    """Get client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_login(user, request):
    """Log de login"""
    from .audit import AuditLog
    
    AuditLog.log(
        user=user,
        action='LOGIN',
        resource='auth',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
    )


def log_logout(user, request):
    """Log de logout"""
    from .audit import AuditLog
    
    AuditLog.log(
        user=user,
        action='LOGOUT',
        resource='auth',
        ip_address=get_client_ip(request),
    )


def log_model_change(instance, action, user, old_values=None, new_values=None):
    """Log de alteração de modelo"""
    from .audit import AuditLog
    
    AuditLog.log(
        user=user,
        action=action,
        resource=instance.__class__.__name__,
        resource_id=instance.pk,
        changes={'old': old_values, 'new': new_values},
    )