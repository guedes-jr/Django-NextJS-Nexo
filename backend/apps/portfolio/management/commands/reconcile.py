"""
Command to run reconciliation checks
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.portfolio.models import Position, Asset, InvestmentAccount, ReconciliationIssue
from apps.market_data.models import AssetPrice, B3StockPrice

User = get_user_model()

class Command(BaseCommand):
    help = "Executa reconciliação de dados da carteira"

    def add_arguments(self, parser):
        parser.add_argument("--user", type=str, help="ID do usuário (opcional)")
        parser.add_argument("--fix", action="store_true", help="Tentar corrigir automaticamente")

    def handle(self, *args, **options):
        user_id = options.get("user")
        auto_fix = options.get("fix", False)
        
        if user_id:
            users = [User.objects.get(pk=user_id)]
        else:
            users = User.objects.all()
        
        for user in users:
            self.stdout.write(f"Reconciliando {user.username}...")
            self._check_positions(user, auto_fix)
        
        self.stdout.write(self.style.SUCCESS("Reconciliação concluída!"))

    def _check_positions(self, user, auto_fix):
        accounts = InvestmentAccount.objects.filter(user=user)
        
        for account in accounts:
            positions = Position.objects.filter(account=account)
            
            for pos in positions:
                # Check negative quantity
                if pos.quantity < 0:
                    issue, _ = ReconciliationIssue.objects.get_or_create(
                        user=user,
                        issue_type='NEGATIVE_QUANTITY',
                        related_data={'ticker': pos.asset.ticker, 'quantity': str(pos.quantity)},
                        status='PENDING',
                        defaults={'description': f'Quantidade negativa para {pos.asset.ticker}'}
                    )
                    if auto_fix:
                        pos.quantity = abs(pos.quantity)
                        pos.save()
                        issue.status = 'RESOLVED'
                        issue.save()
                        self.stdout.write(f"  Corrigido: {pos.asset.ticker} quantity")

                # Check missing price
                if not pos.current_price or pos.current_price == 0:
                    issue, _ = ReconciliationIssue.objects.get_or_create(
                        user=user,
                        issue_type='MISSING_PRICE',
                        related_data={'ticker': pos.asset.ticker},
                        status='PENDING',
                        defaults={'description': f'Preço faltando para {pos.asset.ticker}'}
                    )
                    # Try to get price from market data
                    try:
                        market_price = AssetPrice.objects.filter(asset__ticker=pos.asset.ticker).first()
                        if market_price:
                            pos.current_price = market_price.price
                            pos.save()
                            issue.status = 'RESOLVED'
                            issue.save()
                            self.stdout.write(f"  Corrigido: {pos.asset.ticker} price from market")
                    except:
                        pass

        # Check orphan positions (positions without account)
        orphan_count = Position.objects.filter(account__isnull=True).count()
        if orphan_count > 0:
            self.stdout.write(f"  Encontradas {orphan_count} posições órfãs")

    def _check_duplicates(self, user):
        accounts = InvestmentAccount.objects.filter(user=user)
        
        for account in accounts:
            positions = Position.objects.filter(account=account)
            tickers = {}
            
            for pos in positions:
                ticker = pos.asset.ticker
                if ticker in tickers:
                    issue, _ = ReconciliationIssue.objects.get_or_create(
                        user=user,
                        issue_type='DUPLICATE_POSITION',
                        related_data={'tickers': [ticker]},
                        status='PENDING',
                        defaults={'description': f'Posições duplicadas para {ticker}'}
                    )
                else:
                    tickers[ticker] = pos