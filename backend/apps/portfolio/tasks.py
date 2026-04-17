"""
Tarefas Celery para o módulo de Portfolio
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import models
import logging

logger = logging.getLogger(__name__)


@shared_task
def run_portfolio_reconciliation():
    """
    Task para executar reconciliação automática da carteira.
    Verifica e cria ReconciliationIssue para problemas encontrados.
    """
    from apps.portfolio.models import Position, Asset, ReconciliationIssue, User
    
    logger.info("Iniciando reconciliação automática de portfólio")
    
    issues_created = 0
    
    for user in User.objects.filter(is_active=True):
        positions = Position.objects.filter(account__user=user).select_related('asset')
        
        for position in positions:
            if position.quantity < 0:
                ReconciliationIssue.objects.get_or_create(
                    user=user,
                    issue_type='NEGATIVE_QUANTITY',
                    defaults={
                        'description': f'Quantidade negativa detectada para {position.asset.ticker}',
                        'related_data': {
                            'position_id': position.id,
                            'ticker': position.asset.ticker,
                            'quantity': str(position.quantity)
                        },
                        'status': 'PENDING'
                    }
                )
                issues_created += 1
            
            if not position.current_price or position.current_price <= 0:
                ReconciliationIssue.objects.get_or_create(
                    user=user,
                    issue_type='MISSING_PRICE',
                    defaults={
                        'description': f'Preço faltando para {position.asset.ticker}',
                        'related_data': {
                            'position_id': position.id,
                            'ticker': position.asset.ticker
                        },
                        'status': 'PENDING'
                    }
                )
                issues_created += 1
        
        duplicate_tickers = positions.values('asset__ticker').annotate(
            count_count=models.Count('id')
        ).filter(count_count__gt=1)
        
        for dup in duplicate_tickers:
            ticker = dup['asset__ticker']
            dup_positions = positions.filter(asset__ticker=ticker)
            
            for pos in dup_positions[1:]:
                ReconciliationIssue.objects.get_or_create(
                    user=user,
                    issue_type='DUPLICATE_POSITION',
                    defaults={
                        'description': f'Posição duplicada detectada para {ticker}',
                        'related_data': {
                            'position_ids': [p.id for p in dup_positions],
                            'ticker': ticker
                        },
                        'status': 'PENDING'
                    }
                )
                break
    
    logger.info(f"Reconciliação concluída. {issues_created} questões criadas/atualizadas.")
    return {
        'issues_created': issues_created,
        'timestamp': timezone.now().isoformat()
    }


@shared_task
def check_orphan_positions():
    """
    Task para verificar posições órfãs (posições sem ativo associado).
    """
    from apps.portfolio.models import Position, ReconciliationIssue
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    logger.info("Verificando posições órfãs")
    issues_created = 0
    
    for user in User.objects.filter(is_active=True):
        orphan_positions = Position.objects.filter(
            account__user=user,
            asset__isnull=True
        )
        
        for position in orphan_positions:
            ReconciliationIssue.objects.get_or_create(
                user=user,
                issue_type='ORPHAN_POSITION',
                defaults={
                    'description': f'Posição órfã encontrada (ID: {position.id})',
                    'related_data': {
                        'position_id': position.id,
                        'account_id': position.account_id
                    },
                    'status': 'PENDING'
                }
            )
            issues_created += 1
    
    logger.info(f"Verificação de órfãos concluída. {issues_created} questões criadas.")
    return {'orphan_issues': issues_created}


@shared_task
def cleanup_old_reconciliation_issues():
    """
    Task para limpar ReconciliationIssues antigos resolvidos.
    Mantém histórico por 90 dias.
    """
    from apps.portfolio.models import ReconciliationIssue
    
    logger.info("Limpando reconciliation issues antigos")
    
    cutoff_date = timezone.now() - timedelta(days=90)
    deleted_count = ReconciliationIssue.objects.filter(
        status__in=['RESOLVED', 'IGNORED'],
        resolved_at__lt=cutoff_date
    ).delete()[0]
    
    logger.info(f"Limpeza concluída. {deleted_count} questões antigas removidas.")
    return {'deleted_count': deleted_count}


@shared_task
def auto_resolve_issues():
    """
    Task para tentar resolver automaticamente issues simples.
    """
    from apps.portfolio.models import ReconciliationIssue, Position
    
    logger.info("Tentando resolver issues automaticamente")
    resolved_count = 0
    
    pending_issues = ReconciliationIssue.objects.filter(status='PENDING')
    
    for issue in pending_issues:
        related_data = issue.related_data or {}
        
        if issue.issue_type == 'MISSING_PRICE':
            position_id = related_data.get('position_id')
            if position_id:
                try:
                    position = Position.objects.get(id=position_id)
                    if position.average_price and position.average_price > 0:
                        position.current_price = position.average_price
                        position.save()
                        issue.status = 'RESOLVED'
                        issue.resolved_at = timezone.now()
                        issue.save()
                        resolved_count += 1
                except Position.DoesNotExist:
                    pass
        
        elif issue.issue_type == 'NEGATIVE_QUANTITY':
            position_id = related_data.get('position_id')
            if position_id:
                try:
                    position = Position.objects.get(id=position_id)
                    if position.quantity < 0:
                        position.quantity = abs(position.quantity)
                        position.save()
                        issue.status = 'RESOLVED'
                        issue.resolved_at = timezone.now()
                        issue.save()
                        resolved_count += 1
                except Position.DoesNotExist:
                    pass
    
    logger.info(f"Autorresolução concluída. {resolved_count} questões resolvidas.")
    return {'resolved_count': resolved_count}