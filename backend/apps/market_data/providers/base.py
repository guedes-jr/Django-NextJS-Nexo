from abc import ABC, abstractmethod

class BaseMarketProvider(ABC):
    @abstractmethod
    def get_price(self, ticker):
        pass

    @abstractmethod
    def get_history(self, ticker, period):
        pass
