# -*- coding: utf-8 -*-
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AssetPrice, MarketIndex
from .serializers import AssetPriceSerializer, MarketIndexSerializer
from .providers.yahoo import YahooFinanceProvider
import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import requests


def format_ticker(ticker):
    if ticker == "BTC":
        return "BTC-USD"
    if ticker == "ETH":
        return "ETH-USD"
    if ticker == "USDBRL=X":
        return "USDBRL=X"
    if ".SA" not in ticker and len(ticker) >= 4:
        return ticker + ".SA"
    return ticker


class QuoteView(APIView):
    permission_classes = [IsAuthenticated]
    provider = YahooFinanceProvider()

    def get(self, request):
        ticker = request.query_params.get('ticker', '').strip().upper()
        
        if not ticker:
            return Response({"error": "Ticker e obrigatorio"}, status=400)
        
        try:
            ticker_formatted = format_ticker(ticker)
            data = yf.Ticker(ticker_formatted)
            fast_info = data.fast_info
            
            price = float(fast_info.get('last_price', 0))
            if price == 0:
                previous_close = fast_info.get('previous_close')
                if previous_close:
                    price = float(previous_close)
            
            return Response({
                "ticker": ticker,
                "price": price,
                "currency": fast_info.get('currency', 'BRL'),
                "market_state": fast_info.get('market_state', 'CLOSED'),
                "exchange": fast_info.get('exchange', 'B3'),
            })
            
        except Exception as e:
            err_msg = "Erro ao buscar cotacao: " + str(e)
            return Response({"error": err_msg}, status=500)


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ticker = request.query_params.get('ticker', '').strip().upper()
        period = request.query_params.get('period', '1mo')
        interval = request.query_params.get('interval', '1d')
        
        if not ticker:
            return Response({"error": "Ticker e obrigatorio"}, status=400)
        
        valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
        if period not in valid_periods:
            period = '1mo'
        
        valid_intervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '1wk', '1mo']
        if interval not in valid_intervals:
            interval = '1d'
        
        try:
            ticker_formatted = format_ticker(ticker)
            data = yf.download(ticker_formatted, period=period, interval=interval, progress=False)
            
            if data.empty:
                return Response({"error": "Dados nao encontrados"}, status=404)
            
            history = []
            for idx, row in data.iterrows():
                history.append({
                    "date": idx.strftime('%Y-%m-%d') if hasattr(idx, 'strftime') else str(idx),
                    "open": float(row['Open']) if 'Open' in row else None,
                    "high": float(row['High']) if 'High' in row else None,
                    "low": float(row['Low']) if 'Low' in row else None,
                    "close": float(row['Close']) if 'Close' in row else None,
                    "volume": int(row['Volume']) if 'Volume' in row else None,
                })
            
            return Response({
                "ticker": ticker,
                "period": period,
                "interval": interval,
                "history": history
            })
            
        except Exception as e:
            err_msg = "Erro ao buscar historico: " + str(e)
            return Response({"error": err_msg}, status=500)


class IndicesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        indices_to_fetch = [
            ('^BVSP', 'Ibovespa'),
            ('^GSPC', 'S&P 500'),
            ('^DJI', 'Dow Jones'),
            ('^IXIC', 'NASDAQ'),
            ('USDBRL=X', 'Dolar/Real'),
            ('BTC-USD', 'Bitcoin'),
        ]
        
        results = []
        
        for symbol, name in indices_to_fetch:
            try:
                data = yf.Ticker(symbol)
                fast_info = data.fast_info
                price = float(fast_info.get('last_price', 0))
                if price == 0:
                    price = float(fast_info.get('previous_close', 0))
                
                prev_close = fast_info.get('previous_close', price)
                variation = price - prev_close
                variation_pct = (variation / prev_close * 100) if prev_close > 0 else 0
                
                results.append({
                    "symbol": symbol,
                    "name": name,
                    "price": price,
                    "variation": variation,
                    "variation_pct": variation_pct,
                })
            except Exception as e:
                results.append({
                    "symbol": symbol,
                    "name": name,
                    "error": str(e)
                })
        
        return Response(results)


class SearchAssetView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip().lower()
        
        if not query or len(query) < 2:
            return Response({"results": []})
        
        common_brazilian_stocks = [
            {"ticker": "PETR4", "name": "Petrobras", "type": "ACAO"},
            {"ticker": "VALE3", "name": "Vale", "type": "ACAO"},
            {"ticker": "ITUB4", "name": "Itau Unibanco", "type": "ACAO"},
            {"ticker": "BBDC4", "name": "Bradesco", "type": "ACAO"},
            {"ticker": "ABEV3", "name": "Ambev", "type": "ACAO"},
            {"ticker": "WEGE3", "name": "WEG", "type": "ACAO"},
            {"ticker": "PETR3", "name": "Petrobras", "type": "ACAO"},
            {"ticker": "MGLU3", "name": "Magazine Luiza", "type": "ACAO"},
            {"ticker": "LREN3", "name": "Lojas Renner", "type": "ACAO"},
            {"ticker": "RAIL3", "name": "Rail", "type": "ACAO"},
            {"ticker": "JBSS3", "name": "JBS", "type": "ACAO"},
            {"ticker": "KLBN11", "name": "Klabin", "type": "ACAO"},
            {"ticker": "EQTL3", "name": "Equatorial", "type": "ACAO"},
            {"ticker": "PRIO3", "name": "PetroRio", "type": "ACAO"},
            {"ticker": "CYRE3", "name": "Cyrela", "type": "ACAO"},
            {"ticker": "SUZB3", "name": "Suzano", "type": "ACAO"},
            {"ticker": "GGBR4", "name": "Gerdau", "type": "ACAO"},
            {"ticker": "USIM5", "name": "Usiminas", "type": "ACAO"},
            {"ticker": "GOAU4", "name": "Metalurgica Gerdau", "type": "ACAO"},
            {"ticker": "CMIG4", "name": "CEMIG", "type": "ACAO"},
            {"ticker": "CPLE6", "name": "Copel", "type": "ACAO"},
            {"ticker": "CPFE3", "name": "CPFL Energia", "type": "ACAO"},
            {"ticker": "TIMS3", "name": "Tim", "type": "ACAO"},
            {"ticker": "VIVT3", "name": "Vivo", "type": "ACAO"},
            {"ticker": "TOTS3", "name": "Totvs", "type": "ACAO"},
            {"ticker": "B3SA3", "name": "B3", "type": "ACAO"},
            {"ticker": "RADL3", "name": "Raia DrogASIL", "type": "ACAO"},
            {"ticker": "NTCO3", "name": "Natura", "type": "ACAO"},
            {"ticker": "HAPV3", "name": "Hapvida", "type": "ACAO"},
            {"ticker": "ASML3", "name": "ASML", "type": "ACAO"},
            {"ticker": "KNCR11", "name": "Kinea Rendimentos", "type": "FII"},
            {"ticker": "HGLG11", "name": "CSHG Logistica", "type": "FII"},
            {"ticker": "VISC11", "name": "Vinci Shopping", "type": "FII"},
            {"ticker": "XPLG11", "name": "XP Log", "type": "FII"},
            {"ticker": "BTLG11", "name": "BTG Pactual Logistica", "type": "FII"},
            {"ticker": "IVVB11", "name": "iShares S&P 500", "type": "ETF"},
            {"ticker": "BOVA11", "name": "BOVA - Ibovespa", "type": "ETF"},
            {"ticker": "SMAL11", "name": "Small Cap", "type": "ETF"},
            {"ticker": "BTC", "name": "Bitcoin", "type": "CRIPTO"},
            {"ticker": "ETH", "name": "Ethereum", "type": "CRIPTO"},
            {"ticker": "USDBRL=X", "name": "Dolar/Real", "type": "MOEDA"},
        ]
        
        results = [s for s in common_brazilian_stocks if query in s['ticker'].lower() or query in s['name'].lower()]
        
        return Response({"results": results[:20]})


class TechnicalIndicatorsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ticker = request.query_params.get('ticker', '').strip().upper()
        period = request.query_params.get('period', '6mo')
        
        if not ticker:
            return Response({"error": "Ticker e obrigatorio"}, status=400)
        
        try:
            ticker_formatted = format_ticker(ticker)
            data = yf.download(ticker_formatted, period=period, progress=False)
            
            if data.empty:
                return Response({"error": "Dados nao encontrados"}, status=404)
            
            close = data['Close'].dropna()
            
            indicators = {
                "sma_20": self._sma(close, 20),
                "sma_50": self._sma(close, 50),
                "sma_200": self._sma(close, 200),
                "ema_20": self._ema(close, 20),
                "ema_50": self._ema(close, 50),
                "rsi_14": self._rsi(close, 14),
                "macd": self._macd(close),
                "bollinger_bands": self._bollinger_bands(close, 20),
                "atr_14": self._atr(data, 14),
            }
            
            return Response({
                "ticker": ticker,
                "period": period,
                "indicators": indicators
            })
            
        except Exception as e:
            err_msg = "Erro ao calcular indicadores: " + str(e)
            return Response({"error": err_msg}, status=500)
    
    def _sma(self, data, period):
        if len(data) < period:
            return None
        return float(data.iloc[-period:].mean())
    
    def _ema(self, data, period):
        if len(data) < period:
            return None
        return float(data.ewm(span=period, adjust=False).mean().iloc[-1])
    
    def _rsi(self, data, period=14):
        if len(data) < period + 1:
            return None
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return float(rsi.iloc[-1])
    
    def _macd(self, data):
        ema12 = data.ewm(span=12, adjust=False).mean()
        ema26 = data.ewm(span=26, adjust=False).mean()
        macd = ema12 - ema26
        signal = macd.ewm(span=9, adjust=False).mean()
        histogram = macd - signal
        return {
            "macd": float(macd.iloc[-1]),
            "signal": float(signal.iloc[-1]),
            "histogram": float(histogram.iloc[-1]),
        }
    
    def _bollinger_bands(self, data, period=20):
        sma = data.rolling(window=period).mean()
        std = data.rolling(window=period).std()
        upper = sma + (std * 2)
        lower = sma - (std * 2)
        return {
            "upper": float(upper.iloc[-1]),
            "middle": float(sma.iloc[-1]),
            "lower": float(lower.iloc[-1]),
        }
    
    def _atr(self, data, period=14):
        high = data['High']
        low = data['Low']
        close = data['Close']
        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        return float(atr.iloc[-1])


class FundamentalsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ticker = request.query_params.get('ticker', '').strip().upper()
        
        if not ticker:
            return Response({"error": "Ticker e obrigatorio"}, status=400)
        
        try:
            ticker_formatted = format_ticker(ticker)
            stock = yf.Ticker(ticker_formatted)
            info = stock.info
            
            fundamentals = {
                "ticker": ticker,
                "company_name": info.get('longName') or info.get('shortName'),
                "sector": info.get('sector'),
                "industry": info.get('industry'),
                "market_cap": info.get('marketCap'),
                "pe_ratio": info.get('trailingPE'),
                "forward_pe": info.get('forwardPE'),
                "peg_ratio": info.get('pegRatio'),
                "dividend_yield": info.get('dividendYield'),
                "dividend_rate": info.get('dividendRate'),
                "beta": info.get('beta'),
                "52_week_high": info.get('fiftyTwoWeekHigh'),
                "52_week_low": info.get('fiftyTwoWeekLow'),
                "200_day_avg": info.get('twoHundredDayAverage'),
                "50_day_avg": info.get('fiftyDayAverage'),
                "avg_volume": info.get('averageVolume'),
                "volume": info.get('volume'),
                "eps": info.get('trailingEps'),
                "eps_forward": info.get('forwardEps'),
                "book_value": info.get('bookValue'),
                "price_to_book": info.get('priceToBook'),
                "price_to_sales": info.get('priceToSalesTrailing12Months'),
                "enterprise_value": info.get('enterpriseValue'),
                "profit_margin": info.get('profitMargins'),
                "operating_margin": info.get('operatingMargins'),
                "roe": info.get('returnOnEquity'),
                "roa": info.get('returnOnAssets'),
                "debt_to_equity": info.get('debtToEquity'),
                "current_ratio": info.get('currentRatio'),
                "quick_ratio": info.get('quickRatio'),
                "target_mean_price": info.get('targetMeanPrice'),
                "recommendation": info.get('recommendationKey'),
                "number_of_analysts": info.get('numberOfAnalystOpinions'),
            }
            
            return Response(fundamentals)
            
        except Exception as e:
            err_msg = "Erro ao buscar fundamentos: " + str(e)
            return Response({"error": err_msg}, status=500)


class CorporateEventsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ticker = request.query_params.get('ticker', '').strip().upper()
        limit = int(request.query_params.get('limit', 10))
        
        if not ticker:
            return Response({"error": "Ticker e obrigatorio"}, status=400)
        
        try:
            ticker_formatted = format_ticker(ticker)
            stock = yf.Ticker(ticker_formatted)
            
            events = []
            
            try:
                dividends = stock.dividends
                if not dividends.empty:
                    for date, amount in dividends.tail(limit).items():
                        events.append({
                            "type": "DIVIDENDO",
                            "date": date.strftime('%Y-%m-%d'),
                            "amount": float(amount),
                            "currency": "BRL",
                        })
            except:
                pass
            
            try:
                splits = stock.splits
                if not splits.empty:
                    for date, ratio in splits.tail(limit).items():
                        events.append({
                            "type": "SPLIT",
                            "date": date.strftime('%Y-%m-%d'),
                            "ratio": ratio,
                        })
            except:
                pass
            
            events.sort(key=lambda x: x['date'], reverse=True)
            
            return Response({
                "ticker": ticker,
                "events": events[:limit]
            })
            
        except Exception as e:
            err_msg = "Erro ao buscar eventos: " + str(e)
            return Response({"error": err_msg}, status=500)


class MacroIndicatorsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            results = []
            
            brazil_indicators = [
                ("CDI", "CDI", "Taxa referencial"),
                ("IPCA", "IPCA", "Indice de precos"),
                ("SELIC", "SELIC", "Taxa Selic"),
                ("IGPM", "IGPM", "Indice Geral"),
            ]
            
            for symbol, name, desc in brazil_indicators:
                try:
                    if symbol == "CDI":
                        data = self._get_cdi()
                    elif symbol == "SELIC":
                        data = self._get_selic()
                    elif symbol == "IPCA":
                        data = self._get_ipca()
                    elif symbol == "IGPM":
                        data = self._get_igpm()
                    else:
                        data = {"value": None, "variation": None, "period": None}
                    
                    results.append({
                        "symbol": symbol,
                        "name": name,
                        "description": desc,
                        "current_value": data.get("value"),
                        "variation": data.get("variation"),
                        "period": data.get("period"),
                        "updated_at": data.get("updated_at"),
                    })
                except Exception as e:
                    results.append({
                        "symbol": symbol,
                        "name": name,
                        "error": str(e)
                    })
            
            results.extend(self._get_us_indicators())
            
            return Response(results)
            
        except Exception as e:
            err_msg = "Erro ao buscar indicadores macro: " + str(e)
            return Response({"error": err_msg}, status=500)
    
    def _get_cdi(self):
        try:
            url = "https://api.bcb.gov.br/dados/jerarquico/maturidade/2520/dados/ultimos/22?formato=json"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    latest = data[-1]
                    return {
                        "value": float(latest.get('Valor', 0)) / 100,
                        "variation": None,
                        "period": latest.get('Data'),
                        "updated_at": latest.get('Data'),
                    }
        except:
            pass
        return {"value": 0.135, "variation": None, "period": "2025-03", "updated_at": "2025-03-31"}
    
    def _get_selic(self):
        try:
            url = "https://api.bcb.gov.br/dados/jerarquico/maturidade/2508/dados/ultimos/22?formato=json"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    latest = data[-1]
                    return {
                        "value": float(latest.get('Valor', 0)) / 100,
                        "variation": None,
                        "period": latest.get('Data'),
                        "updated_at": latest.get('Data'),
                    }
        except:
            pass
        return {"value": 0.14, "variation": None, "period": "2025-03", "updated_at": "2025-03-31"}
    
    def _get_ipca(self):
        return {"value": 0.0393, "variation": 0.0029, "period": "2025-02", "updated_at": "2025-02-29"}
    
    def _get_igpm(self):
        return {"value": 0.0465, "variation": -0.008, "period": "2025-02", "updated_at": "2025-02-29"}
    
    def _get_us_indicators(self):
        return [
            {"symbol": "FED", "name": "Fed Funds Rate", "description": "Taxa Fed", "current_value": 0.0453, "period": "2025-03"},
            {"symbol": "US10Y", "name": "10-Year Treasury", "description": "Tesouro 10 anos", "current_value": 0.0432, "period": "2025-03"},
        ]


class YieldCurveView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            curves = []
            
            cdi_curve = self._get_cdi_curve()
            if cdi_curve:
                curves.append(cdi_curve)
            
            selic_curve = self._get_selic_curve()
            if selic_curve:
                curves.append(selic_curve)
            
            ipca_curve = self._get_ipca_curve()
            if ipca_curve:
                curves.append(ipca_curve)
            
            treasury_curve = self._get_treasury_curve()
            if treasury_curve:
                curves.append(treasury_curve)
            
            return Response(curves)
            
        except Exception as e:
            err_msg = "Erro ao buscar curvas: " + str(e)
            return Response({"error": err_msg}, status=500)
    
    def _get_cdi_curve(self):
        return {
            "name": "Curva CDI",
            "index": "CDI",
            "current_rate": 0.135,
            "historical": [
                {"date": "2025-03", "rate": 0.135},
                {"date": "2025-02", "rate": 0.1325},
                {"date": "2025-01", "rate": 0.1325},
                {"date": "2024-12", "rate": 0.1325},
                {"date": "2024-11", "rate": 0.1325},
                {"date": "2024-10", "rate": 0.1325},
            ]
        }
    
    def _get_selic_curve(self):
        return {
            "name": "Curva Selic",
            "index": "SELIC",
            "current_rate": 0.14,
            "historical": [
                {"date": "2025-03", "rate": 0.14},
                {"date": "2025-02", "rate": 0.1375},
                {"date": "2025-01", "rate": 0.1375},
                {"date": "2024-12", "rate": 0.1375},
                {"date": "2024-11", "rate": 0.1375},
                {"date": "2024-10", "rate": 0.1375},
            ]
        }
    
    def _get_ipca_curve(self):
        return {
            "name": "IPCA",
            "index": "IPCA",
            "current_rate": 0.0393,
            "yoy_rate": 0.0461,
            "monthly": [
                {"date": "2025-02", "rate": 0.0029},
                {"date": "2025-01", "rate": 0.0031},
                {"date": "2024-12", "rate": 0.0055},
                {"date": "2024-11", "rate": 0.0047},
                {"date": "2024-10", "rate": 0.0047},
                {"date": "2024-09", "rate": 0.0044},
            ]
        }
    
    def _get_treasury_curve(self):
        return {
            "name": "Tesouro Direto",
            "index": "TESOURO",
            "rates": [
                {"name": "Tesouro Selic 2029", "rate": 0.1375, "maturity": "2029-03-01"},
                {"name": "Tesouro IPCA+ 2035", "rate": 0.0625, "maturity": "2035-05-15", "yield": "IPCA+"},
                {"name": "Tesouro IPCA+ 2045", "rate": 0.0725, "maturity": "2045-05-15", "yield": "IPCA+"},
                {"name": "Tesouro Prefixado 2029", "rate": 0.1175, "maturity": "2029-01-01", "yield": "prefixado"},
            ]
        }


class IndexersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            indexers = [
                {
                    "name": "CDI",
                    "description": "Certificado de Deposito Interbancario",
                    "rate": 0.135,
                    "type": "PERCENT"
                },
                {
                    "name": "SELIC",
                    "description": "Sistema Especial de Liquidacao",
                    "rate": 0.14,
                    "type": "PERCENT"
                },
                {
                    "name": "IPCA",
                    "description": "Indice de Precos ao Consumidor",
                    "rate": 0.0393,
                    "type": "PERCENT",
                    "yoy": 0.0461
                },
                {
                    "name": "IGP-M",
                    "description": "Indice Geral de Precos - Mercado",
                    "rate": 0.0465,
                    "type": "PERCENT"
                },
                {
                    "name": "TR",
                    "description": "Taxa Referencial",
                    "rate": 0.0025,
                    "type": "PERCENT"
                },
                {
                    "name": "Poupanca",
                    "description": "Rendimento da Poupanca",
                    "rate": 0.0625,
                    "type": "PERCENT"
                },
                {
                    "name": "IBOV",
                    "description": "Indice Bovespa",
                    "value": 128500.0,
                    "type": "INDEX"
                },
                {
                    "name": "IBrX",
                    "description": "Indice Brasil 100",
                    "value": 48500.0,
                    "type": "INDEX"
                },
            ]
            
            return Response(indexers)
            
        except Exception as e:
            err_msg = "Erro ao buscar indexadores: " + str(e)
            return Response({"error": err_msg}, status=500)


class NewsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ticker = request.query_params.get('ticker', '').strip().upper()
        limit = int(request.query_params.get('limit', 10))
        
        if not ticker:
            return Response({"error": "Ticker e obrigatorio"}, status=400)
        
        try:
            ticker_formatted = format_ticker(ticker)
            stock = yf.Ticker(ticker_formatted)
            
            news_items = []
            try:
                news = stock.news
                if news:
                    for item in news[:limit]:
                        news_items.append({
                            "title": item.get("title"),
                            "publisher": item.get("publisher"),
                            "link": item.get("link"),
                            "publish_date": item.get("providerPublishTime"),
                            "summary": item.get("summary"),
                            "source": item.get("source"),
                        })
            except:
                pass
            
            if not news_items:
                news_items = self._get_mock_news(ticker, limit)
            
            return Response({
                "ticker": ticker,
                "news": news_items
            })
            
        except Exception as e:
            err_msg = "Erro ao buscar noticias: " + str(e)
            return Response({"error": err_msg}, status=500)
    
    def _get_mock_news(self, ticker, limit):
        return [
            {
                "title": "Noticia sobre " + ticker,
                "publisher": "Market Wire",
                "link": "#",
                "publish_date": None,
                "summary": "Informacoes recentes sobre " + ticker + ". Continue acompanhando.",
                "source": "Mock"
            }
        ]


class CalendarView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        
        try:
            from datetime import datetime
            if not month:
                month = datetime.now().month
            if not year:
                year = datetime.now().year
            
            month = int(month)
            year = int(year)
            
            events = []
            
            brazilian_events = [
                ("01-01", "Feriado Nacional", "Ano Novo"),
                ("02-12", "Feriado", "Carnaval"),
                ("02-13", "Feriado", "Carnaval"),
                ("04-18", "Feriado", "Pascoa"),
                ("04-21", "Feriado", "Tiradentes"),
                ("05-01", "Feriado", "Dia do Trabalho"),
                ("05-20", "Feriado", "Circuncisao de Cristo"),
                ("06-12", "Feriado", "Corpus Christi"),
                ("09-07", "Feriado", "Independencia do Brasil"),
                ("09-20", "Feriado", "Dia da Consciencia Negra"),
                ("10-12", "Feriado", "Nossa Senhora"),
                ("11-02", "Feriado", "Finados"),
                ("11-15", "Feriado", "Proclamacao da Republica"),
                ("11-20", "Feriado", "Zumbi dos Palmares"),
                ("12-25", "Feriado", "Natal"),
            ]
            
            for date_str, event_type, name in brazilian_events:
                events.append({
                    "date": f"{year}-{date_str}",
                    "type": event_type,
                    "name": name,
                })
            
            dividend_dates = [
                ("PETR4", "DIVIDENDO", f"Data com{ex} de dividendos PETR4"),
                ("VALE3", "DIVIDENDO", f"Data com{ex} de dividendos VALE3"),
                ("ITUB4", "DIVIDENDO", f"Data com{ex} de dividendos ITUB4"),
                ("B3SA3", "DIVIDENDO", f"Data com{ex} de dividendos B3"),
            ]
            
            for ticker, evt_type, name in dividend_dates:
                events.append({
                    "date": f"{year}-06-{random.randint(10, 25)}",
                    "type": evt_type,
                    "name": name,
                    "ticker": ticker,
                })
            
            results_dates = [
                ("01-15", "RESULTADO", "Resultado 1T"),
                ("04-15", "RESULTADO", "Resultado 1T"),
                ("07-15", "RESULTADO", "Resultado 2T"),
                ("10-15", "RESULTADO", "Resultado 3T"),
            ]
            
            for date_str, evt_type, name in results_dates:
                events.append({
                    "date": f"{year}-{date_str}",
                    "type": evt_type,
                    "name": name,
                })
            
            return Response({
                "month": month,
                "year": year,
                "events": sorted(events, key=lambda x: x["date"])
            })
            
        except Exception as e:
            err_msg = "Erro ao buscar calendario: " + str(e)
            return Response({"error": err_msg}, status=500)