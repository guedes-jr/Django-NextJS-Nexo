from django.urls import path
from .views import QuoteView, HistoryView, IndicesView, SearchAssetView, TechnicalIndicatorsView, FundamentalsView, CorporateEventsView, MacroIndicatorsView, NewsView, CalendarView, YieldCurveView, IndexersView

urlpatterns = [
    path('quote/', QuoteView.as_view(), name='quote'),
    path('history/', HistoryView.as_view(), name='history'),
    path('indices/', IndicesView.as_view(), name='indices'),
    path('search/', SearchAssetView.as_view(), name='search'),
    path('technical/', TechnicalIndicatorsView.as_view(), name='technical'),
    path('fundamentals/', FundamentalsView.as_view(), name='fundamentals'),
    path('events/', CorporateEventsView.as_view(), name='events'),
    path('macro/', MacroIndicatorsView.as_view(), name='macro'),
    path('news/', NewsView.as_view(), name='news'),
    path('calendar/', CalendarView.as_view(), name='calendar'),
    path('yield-curve/', YieldCurveView.as_view(), name='yield_curve'),
    path('indexers/', IndexersView.as_view(), name='indexers'),
]