# -*- coding: utf-8 -*-
from django.contrib import admin
from .models import StockScore, Watchlist, Projecao


@admin.register(StockScore)
class StockScoreAdmin(admin.ModelAdmin):
    list_display = ['ticker', 'date', 'score_total', 'classificacao', 'dividend_yield', 'pe_ratio', 'roe']
    list_filter = ['classificacao', 'date']
    search_fields = ['ticker']
    date_hierarchy = 'date'
    ordering = ['-date', '-score_total']


@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'list_type', 'is_public', 'updated_at']
    list_filter = ['list_type', 'is_public']
    search_fields = ['name', 'user__username']


@admin.register(Projecao)
class ProjecaoAdmin(admin.ModelAdmin):
    list_display = ['user', 'nome', 'valor_inicial', 'aporte_mensal', 'taxa_retorno', 'horizonte_meses', 'resultado_base', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'nome']
    date_hierarchy = 'created_at'