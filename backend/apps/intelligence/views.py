# -*- coding: utf-8 -*-
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from django.db.models import Max, Min
from decimal import Decimal
from datetime import date, timedelta
import random
import math

from .models import StockScore, Watchlist, Projecao
from .serializers import StockScoreSerializer, WatchlistSerializer, ProjecaoSerializer


class ScreeningView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tickers = request.query_params.get('tickers', '')
        classificacao = request.query_params.get('classificacao', '')
        setor = request.query_params.get('setor', '')
        sort_by = request.query_params.get('sort_by', '-score_total')
        limit = int(request.query_params.get('limit', 50))

        scores = StockScore.objects.filter(date=StockScore.objects.all().aggregate(Max('date'))['date__max'])

        if tickers:
            ticker_list = [t.strip().upper() for t in tickers.split(',')]
            scores = scores.filter(ticker__in=ticker_list)

        if classificacao:
            scores = scores.filter(classificacao=classificacao.upper())

        valid_sorts = ['score_total', '-score_total', 'dividend_yield', '-dividend_yield', 'pe_ratio', '-pe_ratio', 'roe', '-roe']
        if sort_by in valid_sorts:
            scores = scores.order_by(sort_by)
        else:
            scores = scores.order_by('-score_total')

        scores = scores[:limit]

        data = StockScoreSerializer(scores, many=True).data
        return Response({
            'count': len(data),
            'results': data
        })


class StockScoreDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, ticker):
        ticker = ticker.upper()

        latest = StockScore.objects.filter(ticker=ticker).order_by('-date').first()
        if not latest:
            return Response({'error': 'Ticker não encontrado'}, status=404)

        history = StockScore.objects.filter(ticker=ticker).order_by('-date')[:30]
        history_data = StockScoreSerializer(history, many=True).data

        return Response({
            'current': StockScoreSerializer(latest).data,
            'history': history_data
        })


class RankingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        list_type = request.query_params.get('type', 'EXCELENTE')
        limit = int(request.query_params.get('limit', 10))

        date_latest = StockScore.objects.all().aggregate(Max('date'))['date__max']

        scores = StockScore.objects.filter(
            date=date_latest
        )

        if list_type == 'BAZIN':
            scores = scores.filter(dividend_yield__gte=6).order_by('-dividend_yield')
        elif list_type == 'GRAHAM':
            scores = scores.filter(pe_ratio__lte=15, pb_ratio__lte=1.5).order_by('pe_ratio')
        elif list_type == 'GARP':
            scores = scores.filter(crescimento_lucro__gte=5).order_by('-crescimento_lucro')
        elif list_type == 'EXCELENTE':
            scores = scores.filter(classificacao='EXCELENTE').order_by('-score_total')
        else:
            scores = scores.order_by('-score_total')

        scores = scores[:limit]

        data = StockScoreSerializer(scores, many=True).data
        return Response({
            'type': list_type,
            'count': len(data),
            'results': data
        })


class CalcularScoreView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ticker = request.data.get('ticker', '').upper()
        if not ticker:
            return Response({'error': 'Ticker obrigatório'}, status=400)

        params = request.data
        dy = Decimal(str(params.get('dividend_yield', 0)))
        pe = Decimal(str(params.get('pe_ratio', 0)))
        pb = Decimal(str(params.get('pb_ratio', 0)))
        roe = Decimal(str(params.get('roe', 0)))
        divida = Decimal(str(params.get('divida_ebitda', 0)))
        crescimento = Decimal(str(params.get('crescimento_lucro', 0)))
        margem = Decimal(str(params.get('margem_liquida', 0)))

        score_dy = 0
        if dy >= 8:
            score_dy = 20
        elif dy >= 6:
            score_dy = 15
        elif dy >= 4:
            score_dy = 10
        elif dy >= 2:
            score_dy = 5

        score_pe = 0
        if pe <= 8:
            score_pe = 15
        elif pe <= 12:
            score_pe = 10
        elif pe <= 15:
            score_pe = 5

        score_pb = 0
        if pb <= 1:
            score_pb = 15
        elif pb <= 1.5:
            score_pe = 10
        elif pb <= 2:
            score_pb = 5

        score_roe = 0
        if roe >= 20:
            score_roe = 15
        elif roe >= 15:
            score_roe = 10
        elif roe >= 10:
            score_roe = 5

        score_divida = 0
        if divida <= 1:
            score_divida = 10
        elif divida <= 2:
            score_divida = 7
        elif divida <= 3:
            score_divida = 4

        score_crescimento = 0
        if crescimento >= 10:
            score_crescimento = 10
        elif crescimento >= 5:
            score_crescimento = 7
        elif crescimento >= 2:
            score_crescimento = 3

        score_total = score_dy + score_pe + score_pb + score_roe + score_divida + score_crescimento

        if score_total >= 80:
            classificacao = 'EXCELENTE'
        elif score_total >= 60:
            classificacao = 'BOM'
        elif score_total >= 40:
            classificacao = 'NEUTRO'
        elif score_total >= 20:
            classificacao = 'RUIM'
        else:
            classificacao = 'MUITO_RUIM'

        return Response({
            'ticker': ticker,
            'scores': {
                'dividend_yield': score_dy,
                'pe_ratio': score_pe,
                'pb_ratio': score_pb,
                'roe': score_roe,
                'divida_ebitda': score_divida,
                'crescimento_lucro': score_crescimento,
            },
            'score_total': score_total,
            'classificacao': classificacao
        })


class ProjecaoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjecaoSerializer

    def get_queryset(self):
        return Projecao.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        proj = serializer.save(user=self.request.user)
        proj.calcular()
        proj.save()


class ProjecaoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjecaoSerializer

    def get_queryset(self):
        return Projecao.objects.filter(user=self.request.user)


class SimularProjecaoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        valor_inicial = Decimal(str(request.data.get('valor_inicial', 0)))
        aporte_mensal = Decimal(str(request.data.get('aporte_mensal', 0)))
        taxa_retorno = Decimal(str(request.data.get('taxa_retorno', 0.10)))
        horizonte_meses = int(request.data.get('horizonte_meses', 120))
        taxa_bullish = Decimal(str(request.data.get('taxa_retorno_bullish', 0.20)))
        taxa_bearish = Decimal(str(request.data.get('taxa_retorno_bearish', -0.10)))

        proj = Projecao(
            user=request.user if request.user.is_authenticated else None,
            valor_inicial=valor_inicial,
            aporte_mensal=aporte_mensal,
            taxa_retorno=taxa_retorno,
            horizonte_meses=horizonte_meses,
            taxa_retorno_bullish=taxa_bullish,
            taxa_retorno_bearish=taxa_bearish
        )

        cenarios = proj.calcular()

        return Response({
            'parametros': {
                'valor_inicial': float(valor_inicial),
                'aporte_mensal': float(aporte_mensal),
                'taxa_retorno': float(taxa_retorno),
                'horizonte_meses': horizonte_meses
            },
            'resultados': {
                'base': float(cenarios['base']),
                'bullish': float(cenarios['bullish']),
                'bearish': float(cenarios['bearish']),
                'conservador': float(cenarios['conservador']),
                'otimista': float(cenarios['otimista']),
            },
            'milestones': cenarios['milestones']
        })


class WatchlistListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WatchlistSerializer

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)


class WatchlistDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WatchlistSerializer

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)