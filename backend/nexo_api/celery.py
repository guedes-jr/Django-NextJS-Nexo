"""
Celery app configuration for NEXO
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexo_api.settings')

app = Celery('nexo')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks(['apps.market_data'])

# Schedule for periodic tasks
app.conf.beat_schedule = {
    'update-b3-prices-daily': {
        'task': 'apps.market_data.tasks.update_b3_prices',
        'schedule': 60.0 * 60 * 18,  # Every 18 hours
    },
    'update-indices-hourly': {
        'task': 'apps.market_data.tasks.update_b3_indices',
        'schedule': 60.0 * 60,  # Every hour
    },
}

app.conf.task_routes = {
    'apps.market_data.tasks.*': {'queue': 'market_data'},
    'apps.portfolio.tasks.*': {'queue': 'portfolio'},
}

app.conf.task_default_queue = 'default'
app.conf.task_default_exchange = 'default'
app.conf.task_default_routing_key = 'default'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')