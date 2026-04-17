from django.urls import path
from .views import (
    AutomationTriggerListView,
    AutomationTriggerDetailView,
    BrokerConnectionListView,
    BrokerConnectionDetailView,
    SyncStatusView
)
from .broker_comparison import BrokerComparisonView, BrokerFeesCalculatorView

urlpatterns = [
    path('triggers/', AutomationTriggerListView.as_view(), name='triggers'),
    path('triggers/<int:trigger_id>/', AutomationTriggerDetailView.as_view(), name='trigger_detail'),
    path('brokers/', BrokerConnectionListView.as_view(), name='brokers'),
    path('brokers/<int:conn_id>/', BrokerConnectionDetailView.as_view(), name='broker_detail'),
    path('brokers/<int:conn_id>/sync/', SyncStatusView.as_view(), name='sync_status'),
    path('brokers/compare/', BrokerComparisonView.as_view(), name='broker_compare'),
    path('brokers/calculate-fees/', BrokerFeesCalculatorView.as_view(), name='broker_fees'),
]