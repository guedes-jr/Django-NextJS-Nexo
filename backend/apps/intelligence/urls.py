# -*- coding: utf-8 -*-
from django.urls import path
from .views import (
    ScreeningView,
    StockScoreDetailView,
    RankingView,
    CalcularScoreView,
    ProjecaoListCreateView,
    ProjecaoDetailView,
    SimularProjecaoView,
    WatchlistListCreateView,
    WatchlistDetailView,
)

urlpatterns = [
    path('screening/', ScreeningView.as_view(), name='screening'),
    path('screening/<str:ticker>/', StockScoreDetailView.as_view(), name='stock-score-detail'),
    path('ranking/', RankingView.as_view(), name='ranking'),
    path('calcular-score/', CalcularScoreView.as_view(), name='calcular-score'),
    
    path('projecao/', ProjecaoListCreateView.as_view(), name='projecao-list-create'),
    path('projecao/<int:pk>/', ProjecaoDetailView.as_view(), name='projecao-detail'),
    path('projecao/simular/', SimularProjecaoView.as_view(), name='projecao-simular'),
    
    path('watchlist/', WatchlistListCreateView.as_view(), name='watchlist-list-create'),
    path('watchlist/<int:pk>/', WatchlistDetailView.as_view(), name='watchlist-detail'),
]