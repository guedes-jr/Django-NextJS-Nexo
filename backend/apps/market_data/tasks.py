"""
Tarefas Celery para atualizacao diaria de dados B3
"""
from celery import shared_task
from datetime import datetime


@shared_task
def update_b3_prices():
    """Task para atualizar precos B3 - executada diariamente as 18:00"""
    from django.core.management import call_command
    from io import StringIO
    
    output = StringIO()
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    try:
        call_command('import_b3_prices', date=date_str, stdout=output)
        return {"status": "success", "message": output.getvalue()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@shared_task
def update_b3_indices():
    """Task para atualizar indices B3"""
    from apps.market_data.models import B3Index
    
    indices = [
        ("IBOVESPA", "^BVSP"),
    ]
    
    import yfinance as yf
    
    results = []
    for symbol, name in indices:
        try:
            data = yf.Ticker(symbol)
            info = data.info
            
            close = info.get("regularMarketPreviousClose") or info.get("previousClose")
            if close:
                B3Index.objects.update_or_create(
                    symbol=symbol,
                    date=datetime.now().date(),
                    defaults={
                        "name": name,
                        "close": close,
                    }
                )
                results.append(f"{symbol}: {close}")
        except Exception as e:
            results.append(f"{symbol}: erro - {e}")
    
    return {"status": "success", "results": results}


@shared_task
def update_all_market_data():
    """Task principal que coordena todas as atualizacoes"""
    result_prices = update_b3_prices.delay()
    result_indices = update_b3_indices.delay()
    
    return {
        "status": "scheduled",
        "task_ids": {
            "prices": str(result_prices.id),
            "indices": str(result_indices.id),
        }
    }