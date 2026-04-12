"""
Script para download e import de dados B3
Execute: python manage.py import_b3_prices --ticker=ALL
"""
import io
import zipfile
from datetime import datetime as dt
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
import requests
from apps.market_data.models import B3StockPrice


B3_URL = "https://bvmf.bmfbovespa.com.br/InstDados/SerHist"


class Command(BaseCommand):
    help = "Importa dados de cotacoes da B3"

    def add_arguments(self, parser):
        parser.add_argument("--ticker", type=str, help="Ticker ou ALL")
        parser.add_argument("--limit", type=int, help="Limite de registros")
        parser.add_argument("--year", type=int, help="Ano (default 2025)")

    def handle(self, *args, **options):
        ticker = options.get("ticker") or "ALL"
        limit = options.get("limit") or 1000
        year = options.get("year") or 2025
        self.stdout.write(f"Importando {ticker} do ano {year}...")
        
        try:
            self._import_ticker(ticker, limit, year)
        except Exception as e:
            import traceback
            self.stdout.write("Erro: " + str(e))
            traceback.print_exc()
        self.stdout.write("OK!")

    def _import_ticker(self, tick, limit, year):
        import requests
        import zipfile
        import io
        
        url = B3_URL + f"/COTAHIST_A{year}.ZIP"
        self.stdout.write(f"Baixando {url}...")
        
        resp = requests.get(url, timeout=120)
        
        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            for name in z.namelist():
                if name.endswith('.TXT'):
                    with z.open(name) as f:
                        lines = f.read().decode('latin-1').split('\n')
                        
                        cnt = 0
                        saved = 0
                        with transaction.atomic():
                            for line in lines[1:]:
                                if len(line) < 70:
                                    continue
                                
                                ticker = line[12:24].strip()
                                prefix = tick[:4] if len(tick) >= 4 else tick
                                
                                if tick != "ALL" and not ticker.startswith(prefix):
                                    continue
                                
                                close_s = line[57:69].strip()
                                if not close_s or close_s == '0000000000000' or len(close_s) < 3:
                                    continue
                                
                                try:
                                    d = int(line[0:2])
                                    m = int(line[6:8])
                                    a = 2000 + int(line[4:6])
                                    if d < 1 or d > 31 or m < 1 or m > 12:
                                        continue
                                    date = dt(a, m, d).date()
                                except:
                                    continue
                                
                                v = line[70:82].strip()
                                
                                try:
                                    obj, created = B3StockPrice.objects.get_or_create(
                                        ticker=ticker[:10],
                                        date=date,
                                        defaults={
                                            'close': Decimal(close_s) / 100,
                                            'volume': int(v) if v else 0,
                                        }
                                    )
                                    if created:
                                        saved += 1
                                except:
                                    pass
                                
                                cnt += 1
                                if saved >= limit:
                                    break
                                if cnt % 50000 == 0:
                                    self.stdout.write(f" processados {cnt}...")
        
        self.stdout.write(f"Importados {saved} registros")