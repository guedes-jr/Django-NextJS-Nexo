import yfinance as yf
from .base import BaseMarketProvider

class YahooFinanceProvider(BaseMarketProvider):
    def get_price(self, ticker):
        # Trata tickers da B3 e Criptos para o padrão Yahoo
        ticker_formatted = ticker
        if ".SA" not in ticker and len(ticker) >= 5 and ticker != "BTC":
             ticker_formatted = f"{ticker}.SA"
        elif ticker == "BTC":
             ticker_formatted = "BTC-USD"
             
        try:
            data = yf.Ticker(ticker_formatted)
            # Tenta pegar o preço atual
            return data.fast_info['last_price']
        except Exception as e:
            print(f"Erro ao buscar preço para {ticker}: {e}")
            return None

    def get_history(self, ticker, period="1mo"):
        ticker_formatted = ticker
        if ".SA" not in ticker and len(ticker) >= 5 and ticker != "BTC":
             ticker_formatted = f"{ticker}.SA"
        elif ticker == "BTC":
             ticker_formatted = "BTC-USD"

        try:
            data = yf.Ticker(ticker_formatted)
            return data.history(period=period)
        except Exception as e:
            print(f"Erro ao buscar histórico para {ticker}: {e}")
            return None
