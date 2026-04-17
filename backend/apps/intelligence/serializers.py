# -*- coding: utf-8 -*-
from rest_framework import serializers
from .models import StockScore, Watchlist, Projecao


class StockScoreSerializer(serializers.ModelSerializer):
    ticker = serializers.CharField(read_only=True)
    classificacao_display = serializers.CharField(source='get_classificacao_display', read_only=True)

    class Meta:
        model = StockScore
        fields = [
            'id', 'ticker', 'date',
            'dividend_yield', 'pe_ratio', 'pb_ratio', 'ev_ebitda', 'roe',
            'divida_ebitda', 'crescimento_lucro', 'margem_liquida', 'crescimento_receita',
            'score_total', 'classificacao', 'classificacao_display',
            'price', 'market_cap',
            'score_dy', 'score_pe', 'score_pb', 'score_roe', 'score_divida', 'score_crescimento',
            'created_at'
        ]


class StockScoreDetailSerializer(serializers.ModelSerializer):
    classificacao_display = serializers.CharField(source='get_classificacao_display', read_only=True)

    class Meta:
        model = StockScore
        fields = '__all__'


class WatchlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Watchlist
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class WatchlistDetailSerializer(serializers.ModelSerializer):
    tickers = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Watchlist
        fields = '__all__'


class ProjecaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projecao
        fields = [
            'id', 'nome', 'valor_inicial', 'aporte_mensal', 'taxa_retorno',
            'horizonte_meses', 'taxa_retorno_bullish', 'taxa_retorno_bearish',
            'resultado_base', 'resultado_bullish', 'resultado_bearish',
            'resultado_conservador', 'resultado_otimista', 'cenarios',
            'created_at'
        ]
        read_only_fields = ['resultado_base', 'resultado_bullish', 'resultado_bearish', 'resultado_conservador', 'resultado_otimista', 'cenarios', 'created_at']


class ProjecaoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projecao
        fields = '__all__'