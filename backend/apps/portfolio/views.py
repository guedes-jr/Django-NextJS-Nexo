from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Position, Asset, Institution, InvestmentAccount
import decimal

class PortfolioSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Opcional Seed Mock para MVP (se banco estiver cru e limpo para esse user):
        if not Position.objects.filter(account__user=user).exists():
            self._generate_mock_seed(user)
            
        positions = Position.objects.filter(account__user=user)
        
        total_balance = decimal.Decimal('0.0')
        allocations = {}
        processed_positions = []
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            total_balance += total_value
            
            asset_type = pos.asset.asset_type
            if asset_type not in allocations:
                allocations[asset_type] = decimal.Decimal('0.0')
            allocations[asset_type] += total_value
            
            profit_pct = decimal.Decimal('0.0')
            if pos.average_price > 0:
                profit_pct = ((current_p - pos.average_price) / pos.average_price) * 100
                
            processed_positions.append({
                "id": pos.id,
                "asset": {
                    "ticker": pos.asset.ticker,
                    "name": pos.asset.name,
                    "asset_type": asset_type
                },
                "quantity": float(pos.quantity),
                "average_price": float(pos.average_price),
                "current_price": float(current_p),
                "total_value": float(total_value),
                "profit_pct": float(profit_pct)
            })
            
        allocation_pct = {}
        if total_balance > 0:
            for k, v in allocations.items():
                allocation_pct[k] = float((v / total_balance) * 100)
                
        return Response({
            "total_balance": float(total_balance),
            "allocations_value": {k: float(v) for k, v in allocations.items()},
            "allocations_pct": allocation_pct,
            "positions": processed_positions
        })

    def _generate_mock_seed(self, user):
        # Setup Institution
        inst, _ = Institution.objects.get_or_create(name="Banco Centralizado MVP")
        
        # Setup Account
        acc, _ = InvestmentAccount.objects.get_or_create(user=user, institution=inst, description="Carteira Simulada")
        
        # Asssets
        a1, _ = Asset.objects.get_or_create(ticker="ITUB4", defaults={"name": "Itaú Unibanco", "asset_type": "ACAO"})
        a2, _ = Asset.objects.get_or_create(ticker="WEGE3", defaults={"name": "WEG S.A.", "asset_type": "ACAO"})
        a3, _ = Asset.objects.get_or_create(ticker="BTC", defaults={"name": "Bitcoin", "asset_type": "CRIPTO"})
        a4, _ = Asset.objects.get_or_create(ticker="KNCR11", defaults={"name": "Kinea Rendimentos", "asset_type": "FII"})
        
        # Positions
        Position.objects.get_or_create(account=acc, asset=a1, defaults={"quantity": 1500, "average_price": 38.50, "current_price": 45.20})
        Position.objects.get_or_create(account=acc, asset=a2, defaults={"quantity": 800, "average_price": 32.00, "current_price": 38.45})
        Position.objects.get_or_create(account=acc, asset=a3, defaults={"quantity": decimal.Decimal('0.45'), "average_price": 210000.0, "current_price": 355000.0})
        Position.objects.get_or_create(account=acc, asset=a4, defaults={"quantity": 300, "average_price": 98.00, "current_price": 104.50})
