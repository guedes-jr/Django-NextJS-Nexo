# -*- coding: utf-8 -*-
from celery import shared_task
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random


@shared_task
def update_stock_scores():
    from .models import StockScore
    
    tickers = [
        'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'MGLU3', 'LREN3',
        'PETR3', 'IBOV', 'BBAS3', 'B3SA3', 'SANB3', 'CMIG4', 'EQTL3', 'RADL3',
        'KLBN4', 'BRKM5', 'CCRO3', 'CIEL3', 'CSNA3', 'CYRE3', 'ECOR3', 'EGIE3',
        'ELPV3', 'EMBR3', 'ENBR3', 'ENGI11', 'EOAN3', 'EQTA3', 'EZTC3', 'FLRY3',
        'GMAT3', 'GOLL4', 'HAPV3', 'HYPE3', 'IGTA3', 'IRBR3', 'ITSA4', 'JBSS3',
        'LWSA3', 'MRFG3', 'MRVE3', 'MTRE3', 'NEOE3', 'NTCO3', 'PCAR3', 'PDGR3',
        'ONCO3', 'PNVL3', 'POSI3', 'QUAL3', 'RAIL3', 'RAPT4', 'RDOR3', 'RENT3',
    ]
    
    today = date.today()
    
    for ticker in tickers:
        dy = Decimal(str(random.uniform(0, 12)))
        pe = Decimal(str(random.uniform(5, 25)))
        pb = Decimal(str(random.uniform(0.5, 4)))
        roe = Decimal(str(random.uniform(0, 30)))
        divida = Decimal(str(random.uniform(0, 5)))
        crescimento = Decimal(str(random.uniform(-5, 20)))
        margem = Decimal(str(random.uniform(2, 25)))
        price = Decimal(str(random.uniform(10, 100)))
        
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
            score_pb = 10
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
        
        StockScore.objects.update_or_create(
            ticker=ticker,
            date=today,
            defaults={
                'dividend_yield': dy,
                'pe_ratio': pe,
                'pb_ratio': pb,
                'roe': roe,
                'divida_ebitda': divida,
                'crescimento_lucro': crescimento,
                'margem_liquida': margem,
                'score_dy': score_dy,
                'score_pe': score_pe,
                'score_pb': score_pb,
                'score_roe': score_roe,
                'score_divida': score_divida,
                'score_crescimento': score_crescimento,
                'score_total': score_total,
                'classificacao': classificacao,
                'price': price,
            }
        )
    
    return f"Atualizados {len(tickers)} scores"


@shared_task
def generate_mock_scores():
    return update_stock_scores()