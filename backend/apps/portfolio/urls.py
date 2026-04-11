from django.urls import path
from .views import PortfolioSummaryView

urlpatterns = [
    path('summary/', PortfolioSummaryView.as_view(), name='portfolio_summary'),
]
