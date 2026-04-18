# -*- coding: utf-8 -*-
from rest_framework.views import APIView
from django.utils import timezone
import datetime as dt
import datetime
import decimal
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Sum
from .models import Position, Asset, Institution, InvestmentAccount, Transaction, Goal, Notification, ReconciliationIssue, CorporateAction, PortfolioSnapshot, TaxReport, TaxLot
from .serializers import (
    InstitutionSerializer, 
    AssetSerializer, 
    InvestmentAccountSerializer, 
    PositionSerializer,
    TransactionSerializer,
    GoalSerializer,
    NotificationSerializer,
    ReconciliationIssueSerializer,
    CorporateActionSerializer,
    PortfolioSnapshotSerializer,
    TaxReportSerializer,
    TaxLotSerializer
)
import decimal
import csv
import io
import json
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from django.http import HttpResponse

class PortfolioSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if not Position.objects.filter(account__user=user).exists():
            self._generate_mock_seed(user)
            
        positions = Position.objects.filter(account__user=user)
        
        total_balance = decimal.Decimal('0.0')
        allocations = {}
        processed_positions = []
        
        total_cost = decimal.Decimal('0.0')
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            total_balance += total_value
            total_cost += pos.quantity * pos.average_price
            
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
        
        total_profit = total_balance - total_cost
        total_profit_pct = float((total_profit / total_cost) * 100) if total_cost > 0 else 0
        
        recent_transactions = Transaction.objects.filter(user=user).order_by('-transaction_date')[:10]
        transactions_data = [{
            "id": t.id,
            "transaction_type": t.transaction_type,
            "asset_ticker": t.asset.ticker if t.asset else None,
            "asset_name": t.asset.name if t.asset else None,
            "quantity": float(t.quantity) if t.quantity else None,
            "unit_price": float(t.unit_price) if t.unit_price else None,
            "total_value": float(t.total_value),
            "transaction_date": t.transaction_date.isoformat(),
        } for t in recent_transactions]
        
        corporate_events = CorporateAction.objects.filter(
            user=user, date__gte=datetime.date.today() - datetime.timedelta(days=30)
        ).order_by('-date')[:5]
        events_data = [{
            "id": e.id,
            "asset_ticker": e.asset.ticker,
            "action_type": e.action_type,
            "date": e.date.isoformat(),
            "ratio": float(e.ratio) if e.ratio else None,
            "amount_per_share": float(e.amount_per_share) if e.amount_per_share else None,
        } for e in corporate_events]
        
        dividends_gains = Transaction.objects.filter(
            user=user, transaction_type__in=['DIVIDENDO', 'JRS']
        ).aggregate(total=Sum('total_value'))
        
        snapshots = PortfolioSnapshot.objects.filter(user=user).order_by('-date')[:365]
        growth_data = [{
            "date": s.date.isoformat(),
            "value": float(s.total_value)
        } for s in snapshots]
        
        daily_variation = decimal.Decimal('0.0')
        if snapshots.exists():
            latest = snapshots.first()
            yesterday = snapshots.filter(date=latest.date - datetime.timedelta(days=1)).first()
            if yesterday:
                daily_variation = latest.total_value - yesterday.total_value
                daily_variation_pct = (daily_variation / yesterday.total_value * 100) if yesterday.total_value > 0 else 0
            else:
                daily_variation_pct = 0
        else:
            daily_variation_pct = 0
        
        goals = Goal.objects.filter(user=user, is_active=True)
        goals_data = [{
            "name": g.name,
            "target_amount": float(g.target_amount),
            "current_amount": float(g.current_amount),
            "progress": float(g.progress_percentage),
            "target_date": g.target_date.isoformat(),
        } for g in goals[:3]]
        
        return Response({
            "total_balance": float(total_balance),
            "total_cost": float(total_cost),
            "total_profit": float(total_profit),
            "total_profit_pct": total_profit_pct,
            "daily_variation": float(daily_variation),
            "daily_variation_pct": float(daily_variation_pct),
            "dividends_received": float(dividends_gains['total'] or 0),
            "positions_count": len(processed_positions),
            "allocations_value": {k: float(v) for k, v in allocations.items()},
            "allocations_pct": allocation_pct,
            "positions": processed_positions,
            "recent_transactions": transactions_data,
            "corporate_events": events_data,
            "portfolio_growth": growth_data,
            "goals": goals_data
        })

    def _generate_mock_seed(self, user):
        inst, _ = Institution.objects.get_or_create(name="Banco Centralizado MVP")
        acc, _ = InvestmentAccount.objects.get_or_create(user=user, institution=inst, description="Carteira Simulada")
        
        a1, _ = Asset.objects.get_or_create(ticker="ITUB4", defaults={"name": "Itaú Unibanco", "asset_type": "ACAO"})
        a2, _ = Asset.objects.get_or_create(ticker="WEGE3", defaults={"name": "WEG S.A.", "asset_type": "ACAO"})
        a3, _ = Asset.objects.get_or_create(ticker="BTC", defaults={"name": "Bitcoin", "asset_type": "CRIPTO"})
        a4, _ = Asset.objects.get_or_create(ticker="KNCR11", defaults={"name": "Kinea Rendimentos", "asset_type": "FII"})
        
        Position.objects.get_or_create(account=acc, asset=a1, defaults={"quantity": 1500, "average_price": 38.50, "current_price": 45.20})
        Position.objects.get_or_create(account=acc, asset=a2, defaults={"quantity": 800, "average_price": 32.00, "current_price": 38.45})
        Position.objects.get_or_create(account=acc, asset=a3, defaults={"quantity": decimal.Decimal('0.45'), "average_price": 210000.0, "current_price": 355000.0})
        Position.objects.get_or_create(account=acc, asset=a4, defaults={"quantity": 300, "average_price": 98.00, "current_price": 104.50})

class InstitutionListCreateView(generics.ListCreateAPIView):
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    permission_classes = [IsAuthenticated]

class AssetListCreateView(generics.ListCreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

class InvestmentAccountListCreateView(generics.ListCreateAPIView):
    serializer_class = InvestmentAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvestmentAccount.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PositionListCreateView(generics.ListCreateAPIView):
    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Position.objects.filter(account__user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        user = request.user
        asset_ticker = request.data.get('asset_ticker')
        quantity = request.data.get('quantity')
        average_price = request.data.get('average_price')
        current_price = request.data.get('current_price', average_price)
        
        if not asset_ticker or not quantity or not average_price:
            return Response({"error": " asset_ticker, quantity e average_price sao obrigatorios"}, status=400)
        
        try:
            asset, _ = Asset.objects.get_or_create(
                ticker=asset_ticker.upper(),
                defaults={
                    "name": asset_ticker.upper(),
                    "asset_type": "ACAO"
                }
            )
            
            inst, _ = Institution.objects.get_or_create(name="Carteira Manual")
            account, _ = InvestmentAccount.objects.get_or_create(
                user=user,
                institution=inst,
                defaults={"description": "Carteira Manual"}
            )
            
            position, created = Position.objects.get_or_create(
                account=account,
                asset=asset,
                defaults={
                    "quantity": decimal.Decimal(str(quantity)),
                    "average_price": decimal.Decimal(str(average_price)),
                    "current_price": decimal.Decimal(str(current_price)) if current_price else decimal.Decimal(str(average_price))
                }
            )
            
            if not created:
                position.quantity = decimal.Decimal(str(quantity))
                position.average_price = decimal.Decimal(str(average_price))
                position.current_price = decimal.Decimal(str(current_price)) if current_price else decimal.Decimal(str(average_price))
                position.save()
            
            serializer = self.get_serializer(position)
            return Response(serializer.data, status=201)
            
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).order_by('-transaction_date')
        
        transaction_type = self.request.query_params.get('type')
        if transaction_type and transaction_type != 'all':
            queryset = queryset.filter(transaction_type=transaction_type)
        
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
        
        asset_ticker = self.request.query_params.get('asset')
        if asset_ticker:
            queryset = queryset.filter(asset__ticker__icontains=asset_ticker)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_id = request.data.get('notification_id')
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Marcada como lida"})
        except Notification.DoesNotExist:
            return Response({"error": "Notificacao nao encontrada"}, status=404)

class CorporateActionListCreateView(generics.ListCreateAPIView):
    serializer_class = CorporateActionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CorporateAction.objects.filter(user=self.request.user)
        asset_id = self.request.query_params.get('asset_id')
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ImportPositionsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    ALLOWED_EXTENSIONS = ['.csv', '.xlsx']

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "Nenhum arquivo enviado"}, status=400)
        
        ext = '.' + file.name.split('.')[-1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response({"error": "Apenas arquivos CSV ou XLSX sao aceitos"}, status=400)
        
        try:
            rows = self._parse_file(file, ext)
            
            required_columns = ['ticker', 'quantity', 'average_price', 'current_price']
            first_row = rows[0] if rows else {}
            missing = [col for col in required_columns if col not in first_row]
            if missing:
                return Response({"error": "Colunas obrigatorias faltando: " + str(missing)}, status=400)
            
            user = request.user
            
            default_institution, _ = Institution.objects.get_or_create(name="Importacao Manual")
            account, _ = InvestmentAccount.objects.get_or_create(
                user=user,
                institution=default_institution,
                defaults={"description": "Conta importada"}
            )
            
            created_count = 0
            updated_count = 0
            
            for row in rows:
                ticker = row.get('ticker', '').strip().upper()
                quantity = row.get('quantity', '0').replace(',', '.').strip()
                avg_price = row.get('average_price', '0').replace(',', '.').strip()
                curr_price = row.get('current_price', avg_price).replace(',', '.').strip()
                
                if not ticker:
                    continue
                    
                asset, created = Asset.objects.get_or_create(
                    ticker=ticker,
                    defaults={
                        "name": row.get('name', ticker),
                        "asset_type": row.get('asset_type', 'ACAO').upper()
                    }
                )
                
                position, created = Position.objects.get_or_create(
                    account=account,
                    asset=asset,
                    defaults={
                        "quantity": decimal.Decimal(quantity),
                        "average_price": decimal.Decimal(avg_price),
                        "current_price": decimal.Decimal(curr_price) if curr_price else decimal.Decimal(avg_price)
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    position.quantity = decimal.Decimal(quantity)
                    position.average_price = decimal.Decimal(avg_price)
                    position.current_price = decimal.Decimal(curr_price) if curr_price else decimal.Decimal(avg_price)
                    position.save()
                    updated_count += 1
            
            return Response({
                "message": "Importacao concluida: " + str(created_count) + " criados, " + str(updated_count) + " atualizados"
            })
            
        except Exception as e:
            return Response({"error": "Erro ao processar arquivo: " + str(e)}, status=400)
    
    def _parse_file(self, file, ext):
        if ext == '.csv':
            decoded = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
            return list(reader)
        elif ext == '.xlsx':
            import pandas as pd
            df = pd.read_excel(file)
            return df.fillna('').to_dict('records')
        return []


class ImportTemplateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        format_type = request.query_params.get('format', 'csv')
        
        if format_type == 'xlsx':
            wb = Workbook()
            ws = wb.active
            ws.title = "Template Importacao"
            
            headers = ['ticker', 'name', 'asset_type', 'quantity', 'average_price', 'current_price']
            ws.append(headers)
            
            examples = [
                ['PETR4', 'Petroleo Brasileiro S.A.', 'ACAO', '100', '35.50', '42.30'],
                ['ITUB4', 'Itau Unibanco Holding', 'ACAO', '200', '28.00', '32.50'],
                ['BTC', 'Bitcoin', 'CRIPTO', '0.5', '180000.00', '210000.00'],
                ['KNCR11', 'Kinea Rendimentos', 'FII', '50', '100.00', '105.00'],
            ]
            for ex in examples:
                ws.append(ex)
            
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename=nexo_importacao_template.xlsx'
            wb.save(response)
            return response
        else:
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['ticker', 'name', 'asset_type', 'quantity', 'average_price', 'current_price'])
            writer.writerow(['PETR4', 'Petroleo Brasileiro S.A.', 'ACAO', '100', '35.50', '42.30'])
            writer.writerow(['ITUB4', 'Itau Unibanco Holding', 'ACAO', '200', '28.00', '32.50'])
            writer.writerow(['BTC', 'Bitcoin', 'CRIPTO', '0.5', '180000.00', '210000.00'])
            writer.writerow(['KNCR11', 'Kinea Rendimentos', 'FII', '50', '100.00', '105.00'])
            
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename=nexo_importacao_template.csv'
            return response


class ImportPreviewView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    ALLOWED_EXTENSIONS = ['.csv', '.xlsx']
    
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "Nenhum arquivo enviado"}, status=400)
        
        ext = '.' + file.name.split('.')[-1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response({"error": "Apenas arquivos CSV ou XLSX sao aceitos"}, status=400)
        
        try:
            rows = self._parse_file(file, ext)
            
            required_columns = ['ticker', 'quantity', 'average_price', 'current_price']
            if rows:
                missing = [col for col in required_columns if col not in rows[0]]
                if missing:
                    return Response({"error": "Colunas obrigatorias faltando: " + str(missing)}, status=400)
            
            preview_rows = []
            errors = []
            
            for idx, row in enumerate(rows[:20]):
                ticker = row.get('ticker', '').strip().upper()
                quantity = row.get('quantity', '').replace(',', '.').strip()
                avg_price = row.get('average_price', '').replace(',', '.').strip()
                curr_price = row.get('current_price', avg_price).replace(',', '.').strip()
                
                if not ticker:
                    errors.append(f"Linha {idx + 1}: ticker vazio")
                    continue
                
                try:
                    qty = decimal.Decimal(quantity) if quantity else decimal.Decimal('0')
                except:
                    errors.append(f"Linha {idx + 1}: quantidade invalida")
                    continue
                
                try:
                    avg = decimal.Decimal(avg_price) if avg_price else decimal.Decimal('0')
                except:
                    errors.append(f"Linha {idx + 1}: preco medio invalido")
                    continue
                
                curr = decimal.Decimal(curr_price) if curr_price else avg
                
                preview_rows.append({
                    "ticker": ticker,
                    "name": row.get('name', ticker),
                    "asset_type": row.get('asset_type', 'ACAO').upper(),
                    "quantity": float(qty),
                    "average_price": float(avg),
                    "current_price": float(curr),
                    "total_value": float(qty * curr),
                    "row_index": idx + 1
                })
            
            return Response({
                "total_rows": len(rows),
                "preview_rows": preview_rows,
                "errors": errors[:10],
                "has_more": len(rows) > 20
            })
            
        except Exception as e:
            return Response({"error": "Erro ao processar arquivo: " + str(e)}, status=400)
    
    def _parse_file(self, file, ext):
        if ext == '.csv':
            decoded = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
            return list(reader)
        elif ext == '.xlsx':
            import pandas as pd
            df = pd.read_excel(file)
            return df.fillna('').to_dict('records')
        return []

class RebalanceView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        positions = Position.objects.filter(account__user=user)
        
        total_balance = decimal.Decimal('0.0')
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_balance += pos.quantity * current_p
        
        if total_balance == 0:
            return Response({"error": "Carteira vazia"}, status=400)
        
        current_allocations = {}
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            asset_type = pos.asset.asset_type
            if asset_type not in current_allocations:
                current_allocations[asset_type] = decimal.Decimal('0.0')
            current_allocations[asset_type] += total_value
        
        current_alloc_pct = {k: float((v / total_balance) * 100) for k, v in current_allocations.items()}
        
        target_allocations = {
            'ACAO': 40,
            'FII': 15,
            'ETF': 15,
            'RF': 15,
            'CRIPTO': 5,
            'FUNDO': 10,
        }
        
        suggestions = []
        for asset_type, target_pct in target_allocations.items():
            current_pct = current_alloc_pct.get(asset_type, 0)
            diff = target_pct - current_pct
            if abs(diff) > 5:
                action = 'COMPRAR' if diff > 0 else 'VENDER'
                value = abs(diff / 100) * float(total_balance)
                suggestions.append({
                    "asset_type": asset_type,
                    "current_pct": round(current_pct, 1),
                    "target_pct": target_pct,
                    "diff_pct": round(diff, 1),
                    "action": action,
                    "suggested_value": round(value, 2),
                    "reason": "Alocacao differe da recomendada" if abs(diff) > 10 else "Ajuste menor"
                })
        
        return Response({
            "total_balance": float(total_balance),
            "current_allocations": current_alloc_pct,
            "target_allocations": target_allocations,
            "suggestions": suggestions
        })

class BenchmarkView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        period = request.query_params.get('period', '6mo')
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"portfolio": {}, "benchmarks": []})
        
        import yfinance as yf
        benchmarks = [
            ('^BVSP', 'Ibovespa', 'IBOV'),
            ('^GSPC', 'S&P 500', 'SP500'),
            ('CDI', 'CDI', 'CDI'),
        ]
        
        now = timezone.now().date()
        start_map = {'1mo': 30, '3mo': 90, '6mo': 180, '1y': 365}
        days = start_map.get(period, 180)
        start_date = now - dt.timedelta(days=days)
        
        total_cost = decimal.Decimal('0.0')
        for pos in positions:
            total_cost += pos.quantity * pos.average_price
        
        if total_cost == 0:
            return Response({"portfolio": {}, "benchmarks": []})
        
        portfolio_variation = 0
        
        benchmark_data = []
        for symbol, name, code in benchmarks:
            if code == 'CDI':
                cdi_rate = 0.11
                period_years = days / 365
                cdi_return = ((1 + cdi_rate) ** period_years - 1) * 100
                benchmark_data.append({
                    "symbol": code,
                    "name": name,
                    "variation_pct": round(cdi_return, 2),
                    "period": period
                })
            else:
                try:
                    data = yf.download(symbol, start=start_date, end=now, progress=False)
                    if len(data) >= 2:
                        first_close = data['Close'].iloc[0]
                        last_close = data['Close'].iloc[-1]
                        if first_close > 0:
                            variation = ((last_close - first_close) / first_close) * 100
                            benchmark_data.append({
                                "symbol": symbol,
                                "name": name,
                                "variation_pct": round(float(variation), 2),
                                "period": period
                            })
                except:
                    pass
        
        return Response({
            "portfolio": {
                "variation_pct": portfolio_variation,
                "total_cost": float(total_cost),
                "period": period
            },
            "benchmarks": benchmark_data
        })

class InsightsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        positions = Position.objects.filter(account__user=user)
        
        insights = []
        total_balance = decimal.Decimal('0.0')
        positions_data = []
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            total_balance += total_value
            positions_data.append({
                'ticker': pos.asset.ticker,
                'asset_type': pos.asset.asset_type,
                'value': float(total_value),
                'profit_pct': float(((current_p - pos.average_price) / pos.average_price) * 100) if pos.average_price > 0 else 0
            })
        
        if total_balance == 0:
            return Response({"insights": []})
        
        concentration_by_type = {}
        for pos in positions_data:
            at = pos['asset_type']
            if at not in concentration_by_type:
                concentration_by_type[at] = 0
            concentration_by_type[at] += pos['value']
        
        for at, value in concentration_by_type.items():
            pct = (value / float(total_balance)) * 100
            if pct > 40:
                insights.append({
                    "type": "CONCENTRATION",
                    "severity": "HIGH" if pct > 60 else "MEDIUM",
                    "title": "Alta concentracao em " + at,
                    "message": at + " representa " + str(round(pct, 1)) + "% da carteira. Considere diversificar.",
                    "recommendation": "Reducao de " + at + " em favor de outras classes"
                })
        
        for pos in positions_data:
            if pos['profit_pct'] > 50:
                insights.append({
                    "type": "PROFIT",
                    "severity": "MEDIUM",
                    "title": "Lucro expressivo em " + pos['ticker'],
                    "message": pos['ticker'] + " subiu " + str(round(pos['profit_pct'], 1)) + "%. Considere realizar lucro.",
                    "recommendation": "Verificar necessidade de rebalanceamento"
                })
            elif pos['profit_pct'] < -30:
                insights.append({
                    "type": "LOSS",
                    "severity": "HIGH",
                    "title": "Prejuizo em " + pos['ticker'],
                    "message": pos['ticker'] + " caiu " + str(round(abs(pos['profit_pct']), 1)) + "%. Avalie perspectiva.",
                    "recommendation": "Verificar fundamentos antes de decidir"
                })
        
        crypto_value = concentration_by_type.get('CRIPTO', 0)
        if (crypto_value / float(total_balance)) * 100 > 20:
            insights.append({
                    "type": "RISK",
                    "severity": "HIGH",
                    "title": "Exposicao elevada em cripto",
                    "message": "Criptomoedas representam mais de 20% da carteira.",
                    "recommendation": "Reduzir exposicao para maximo 10%",
                    "explanation": "Altas concentracoes em ativos volateis aumentam o risco geral da carteira. Recomenda-se diversificar para reduzir a volatilidade total.",
                    "impact": "Alto",
                    "action_steps": ["Reduzir posicao em cripto para 10%", "Realocar para investimentos mais estaveis"]
                })
        
        if len(positions_data) < 5:
            insights.append({
                "type": "DIVERSIFICATION",
                "severity": "LOW",
                "title": "Carteira pouco diversificada",
                "message": "Apenas " + str(len(positions_data)) + " ativos.",
                "recommendation": "Adicionar mais ativos para diversificar",
                "explanation": "Com pocos ativos, movimentos de preco individuais tem impacto maior no patrimonio. A diversificacao reduz risco especifico.",
                "impact": "Medio",
                "action_steps": ["Adicionar 3-5 ativos de classes diferentes", "Considerar ETFs diversificados"]
            })
        
        for pos in positions_data:
            if pos['profit_pct'] > 50:
                insights.append({
                    "type": "PROFIT",
                    "severity": "MEDIUM",
                    "title": "Lucro expressivo em " + pos['ticker'],
                    "message": pos['ticker'] + " subiu " + str(round(pos['profit_pct'], 1)) + "%. Considere realizar lucro.",
                    "recommendation": "Verificar necessidade de rebalanceamento",
                    "explanation": "Lucros acima de 50% podem ser徒. Considere realizar lucro parcial para捉urar ganhos e rebalancear a carteira.",
                    "action_steps": ["Avaliar fundamentos do ativo", "Considerar realizacao parcial de lucro", "Verificar implicacoes tributarias"]
                })
        
        return Response({
            "total_balance": float(total_balance),
            "insights": insights,
            "summary": {
                "total_insights": len(insights),
                "high_priority": len([i for i in insights if i.get('severity') == 'HIGH']),
                "action_recommended": len([i for i in insights if i.get('action_steps')])
            }
        })

class SimulatorView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        initial = decimal.Decimal(str(request.data.get('initial', 0)))
        monthly = decimal.Decimal(str(request.data.get('monthly', 0)))
        rate = decimal.Decimal(str(request.data.get('annual_rate', 10))) / 100
        months = int(request.data.get('months', 120))
        
        if initial <= 0 and monthly <= 0:
            return Response({"error": "Valores iniciais invalidos"}, status=400)
        
        sc = request.data.get('scenarios', False)
        
        if sc:
            scenarios = [
                {"name": "Conservador", "rate": 6},
                {"name": "Moderado", "rate": 10},
                {"name": "Agressivo", "rate": 15},
                {"name": "Muito Agressivo", "rate": 25},
            ]
            
            results = []
            for scn in scenarios:
                scn_rate = decimal.Decimal(str(scn['rate'])) / 100
                scn_monthly_rate = (1 + scn_rate) ** (decimal.Decimal('1') / 12) - 1
                scn_current = initial
                
                scn_projections = []
                for month in range(1, months + 1):
                    scn_current = scn_current * (1 + scn_monthly_rate) + monthly
                    
                    if month % 12 == 0:
                        year = month // 12
                        scn_projections.append({
                            "year": year,
                            "value": float(scn_current),
                            "invested": float(initial + (monthly * month)),
                            "profit": float(scn_current - initial - (monthly * month))
                        })
                
                results.append({
                    "scenario": scn['name'],
                    "rate": scn['rate'],
                    "final_value": float(scn_current),
                    "total_profit": float(scn_current - initial - (monthly * months)),
                    "projections": scn_projections
                })
            
            return Response({
                "scenarios": results,
                "initial": float(initial),
                "monthly": float(monthly),
                "months": months
            })
        
        monthly_rate = (1 + rate) ** (decimal.Decimal('1') / 12) - 1
        
        projections = []
        current = initial
        
        for month in range(1, months + 1):
            current = current * (1 + monthly_rate) + monthly
            
            if month % 12 == 0:
                year = month // 12
                total_invested = float(initial + (monthly * month))
                yearly_return = float((current - total_invested) / total_invested) * 100 if total_invested > 0 else 0
                projections.append({
                    "month": month,
                    "year": year,
                    "value": float(current),
                    "total_invested": float(initial + (monthly * month)),
                    "profit": float(current - initial - (monthly * month)),
                    "yearly_return_pct": yearly_return
                })
        
        final_value = float(current)
        total_invested = float(initial + (monthly * months))
        
        return Response({
            "final_value": final_value,
            "total_invested": total_invested,
            "total_profit": final_value - total_invested,
            "projections": projections
        })


class AllocationAnalysisView(APIView):
    permission_classes = [IsAuthenticated]
    
    TARGET_ALLOCATION = {
        "ACAO": 30,
        "FII": 15,
        "ETF": 15,
        "RF": 20,
        "CRIPTO": 5,
        "PREVIDENCIA": 10,
        "TESOURO": 5,
    }
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"error": "Carteira vazia"}, status=400)
        
        total_balance = decimal.Decimal('0.0')
        current_alloc = {}
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            total_balance += total_value
            
            asset_type = pos.asset.asset_type
            if asset_type not in current_alloc:
                current_alloc[asset_type] = decimal.Decimal('0.0')
            current_alloc[asset_type] += total_value
        
        current_pct = {}
        if total_balance > 0:
            for k, v in current_alloc.items():
                current_pct[k] = float((v / total_balance) * 100)
        
        deviations = []
        for asset_type, target in self.TARGET_ALLOCATION.items():
            current = current_pct.get(asset_type, 0)
            diff = current - target
            deviations.append({
                "asset_type": asset_type,
                "current_pct": round(current, 2),
                "target_pct": target,
                "deviation": round(diff, 2),
                "action": "COMPRAR" if diff < -5 else ("VENDER" if diff > 5 else "MANTER")
            })
        
        return Response({
            "total_balance": float(total_balance),
            "current_allocation": current_pct,
            "target_allocation": self.TARGET_ALLOCATION,
            "deviations": deviations,
            "score": self._calculate_score(deviations)
        })
    
    def _calculate_score(self, deviations):
        max_dev = max(abs(d["deviation"]) for d in deviations)
        if max_dev <= 5:
            return 100
        elif max_dev <= 15:
            return 80
        elif max_dev <= 25:
            return 60
        else:
            return 40


class RebalanceSuggestionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        amount = request.query_params.get('amount')
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"error": "Carteira vazia"}, status=400)
        
        total_balance = decimal.Decimal('0.0')
        current_alloc = {}
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            total_balance += total_value
            
            asset_type = pos.asset.asset_type
            if asset_type not in current_alloc:
                current_alloc[asset_type] = decimal.Decimal('0.0')
            current_alloc[asset_type] += total_value
        
        TARGET_ALLOCATION = {
            "ACAO": 30, "FII": 15, "ETF": 15, "RF": 20,
            "CRIPTO": 5, "PREVIDENCIA": 10, "TESOURO": 5,
        }
        
        current_pct = {}
        if total_balance > 0:
            for k, v in current_alloc.items():
                current_pct[k] = float((v / total_balance) * 100)
        
        add_amount = decimal.Decimal(amount) if amount else decimal.Decimal('0.0')
        investable = total_balance + add_amount
        
        suggestions = []
        for asset_type, target in TARGET_ALLOCATION.items():
            current = current_pct.get(asset_type, 0)
            target_value = investable * decimal.Decimal(str(target)) / 100
            current_value = current_alloc.get(asset_type, decimal.Decimal('0.0'))
            diff = target_value - current_value
            
            if abs(diff) > 100:
                action = "COMPRAR" if diff > 0 else "VENDER"
                suggestions.append({
                    "asset_type": asset_type,
                    "action": action,
                    "amount": float(abs(diff)),
                    "percentage": abs(current - target)
                })
        suggestions.sort(key=lambda x: x["amount"], reverse=True)
        
        return Response({
            "current_balance": float(total_balance),
            "add_amount": float(add_amount),
            "projected_balance": float(investable),
            "suggestions": suggestions[:5]
        })


class ConcentrationRiskView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"error": "Carteira vazia"}, status=400)
        
        by_ticker = {}
        by_issuer = {}
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            
            ticker = pos.asset.ticker
            by_ticker[ticker] = float(total_value)
            
            issuer = getattr(pos.asset, 'issuer', None) or ticker[:4]
            if issuer not in by_issuer:
                by_issuer[issuer] = decimal.Decimal('0.0')
            by_issuer[issuer] += total_value
        
        total = sum(by_ticker.values())
        
        top_concentration = []
        for ticker, value in sorted(by_ticker.items(), key=lambda x: x[1], reverse=True)[:5]:
            pct = (value / total * 100) if total > 0 else 0
            top_concentration.append({
                "ticker": ticker,
                "value": value,
                "percentage": round(pct, 2)
            })
        
        issuer_concentration = []
        for issuer, value in sorted(by_issuer.items(), key=lambda x: float(x[1]), reverse=True)[:5]:
            value = float(value)
            pct = (value / total * 100) if total > 0 else 0
            issuer_concentration.append({
                "issuer": issuer,
                "value": value,
                "percentage": round(pct, 2)
            })
        
        alerts = []
        if top_concentration and top_concentration[0]["percentage"] > 20:
            alerts.append({
                "type": "CONCENTRATION",
                "severity": "HIGH",
                "message": "Alta concentracao em " + top_concentration[0]["ticker"]
            })
        
        high_risk = [c for c in top_concentration if c["percentage"] > 15]
        if high_risk:
            alerts.append({
                "type": "CONCENTRATION",
                "severity": "MEDIUM",
                "message": "Concentracao acima de 15% em alguns ativos"
            })
        
        return Response({
            "by_ticker": top_concentration,
            "by_issuer": issuer_concentration,
            "alerts": alerts
        })


class PortfolioHealthScoreView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"score": 0, "details": {"message": "Carteira vazia"}})
        
        total_balance = sum(
            float(pos.quantity * (pos.current_price or pos.average_price))
            for pos in positions
        )
        
        by_type = {}
        for pos in positions:
            at = pos.asset.asset_type
            current_p = pos.current_price or pos.average_price
            value = float(pos.quantity * current_p)
            by_type[at] = by_type.get(at, 0) + value
        
        type_count = len(by_type)
        diversification_score = min(100, type_count * 20)
        
        unique_tickers = len(set(pos.asset.ticker for pos in positions))
        variety_score = min(100, unique_tickers * 10)
        
        single_holding = max(by_type.values()) if by_type else 0
        concentration_score = 100 if total_balance == 0 else max(0, 100 - (single_holding / total_balance * 200))
        
        has_international = any(t in ["CRIPTO", "ETF"] for t in by_type.keys())
        global_score = 100 if has_international else 50
        
        total_score = (
            diversification_score * 0.2 +
            variety_score * 0.2 +
            concentration_score * 0.3 +
            global_score * 0.1 +
            (by_type.get("RF", 0) / total_balance * 100 if total_balance > 0 else 0) * 0.2
        )
        
        return Response({
            "score": round(total_score, 1),
            "breakdown": {
                "diversification": round(diversification_score, 1),
                "variety": round(variety_score, 1),
                "concentration": round(concentration_score, 1),
                "global_exposure": round(global_score, 1),
                "fixed_income_allocation": round(by_type.get("RF", 0) / total_balance * 100, 1) if total_balance > 0 else 0
            },
            "recommendations": self._get_recommendations(total_score, by_type, total_balance)
        })
    
    def _get_recommendations(self, score, by_type, total):
        recs = []
        if score < 70:
            recs.append("Considere diversificar para mais classes de ativos")
        if by_type.get("RF", 0) / total < 0.15 if total > 0 else True:
            recs.append("Aumente alocacao em renda fixa para protecao")
        if "CRIPTO" not in by_type and total > 10000:
            recs.append("Considere pequena alocacao em criptomoedas")
        return recs


class RiskByClassView(APIView):
    permission_classes = [IsAuthenticated]
    
    RISK_PROFILE = {
        "ACAO": 0.8,
        "FII": 0.5,
        "ETF": 0.6,
        "RF": 0.2,
        "CRIPTO": 1.0,
        "PREVIDENCIA": 0.3,
        "TESOURO": 0.1,
    }
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"error": "Carteira vazia"}, status=400)
        
        total_balance = decimal.Decimal('0.0')
        by_type = {}
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            total_value = pos.quantity * current_p
            total_balance += total_value
            
            asset_type = pos.asset.asset_type
            if asset_type not in by_type:
                by_type[asset_type] = decimal.Decimal('0.0')
            by_type[asset_type] += total_value
        
        weighted_risk = 0
        risk_by_class = []
        
        for asset_type, value in by_type.items():
            pct = float(value / total_balance) if total_balance > 0 else 0
            risk = self.RISK_PROFILE.get(asset_type, 0.5)
            weighted_risk += risk * pct
            
            risk_by_class.append({
                "asset_type": asset_type,
                "value": float(value),
                "percentage": round(pct * 100, 2),
                "risk_level": risk,
                "risk_label": "ALTO" if risk >= 0.7 else ("MEDIO" if risk >= 0.4 else "BAIXO")
            })
        
        overall_risk = weighted_risk * 100
        
        return Response({
            "overall_risk": round(overall_risk, 1),
            "risk_label": "ALTO" if overall_risk >= 70 else ("MEDIO" if overall_risk >= 40 else "BAIXO"),
            "by_class": sorted(risk_by_class, key=lambda x: x["risk_level"], reverse=True),
            "recommendations": self._get_risk_recommendations(overall_risk, by_type, total_balance)
        })
    
    def _get_risk_recommendations(self, risk, by_type, total):
        recs = []
        if risk >= 80:
            recs.append("Considere reduzir exposicao a ativos de alto risco")
            recs.append("Aumente reserva de emergencia em renda fixa")
        elif risk >= 60:
            recs.append("Diversifique com ativos de menor risco")
        if by_type.get("CRIPTO", 0) / total > 0.15 if total > 0 else False:
            recs.append("Exposicao em cripto acima de 15% - avaliar reducao")
        if by_type.get("ACAO", 0) / total > 0.5 if total > 0 else False:
            recs.append("Alta concentracao em acoes - considere diversificar")
        return recs


class VolatilityView(APIView):
    permission_classes = [IsAuthenticated]
    
    VOLATILITY_PROFILE = {
        "ACAO": 0.25,
        "FII": 0.15,
        "ETF": 0.18,
        "RF": 0.05,
        "CRIPTO": 0.8,
        "PREVIDENCIA": 0.08,
        "TESOURO": 0.03,
    }
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"error": "Carteira vazia"}, status=400)
        
        total_balance = sum(
            float(pos.quantity * (pos.current_price or pos.average_price))
            for pos in positions
        )
        
        by_type = {}
        for pos in positions:
            at = pos.asset.asset_type
            value = float(pos.quantity * (pos.current_price or pos.average_price))
            by_type[at] = by_type.get(at, 0) + value
        
        weighted_vol = 0
        vol_by_class = []
        
        for asset_type, value in by_type.items():
            pct = value / total_balance if total_balance > 0 else 0
            vol = self.VOLATILITY_PROFILE.get(asset_type, 0.15)
            weighted_vol += vol * pct
            
            vol_by_class.append({
                "asset_type": asset_type,
                "volatility": round(vol * 100, 1),
                "label": "ALTA" if vol >= 0.5 else ("MEDIA" if vol >= 0.2 else "BAIXA"),
                "contribution": round(vol * pct * 100, 2)
            })
        
        annual_std = weighted_vol * 100
        var_95 = annual_std * 1.65
        var_99 = annual_std * 2.33
        
        return Response({
            "annual_volatility": round(annual_std, 1),
            "var_95": round(var_95, 1),
            "var_99": round(var_99, 1),
            "risk_label": "ALTA" if annual_std >= 25 else ("MEDIA" if annual_std >= 15 else "BAIXA"),
            "by_class": sorted(vol_by_class, key=lambda x: x["volatility"], reverse=True),
            "recommendations": self._get_vol_recommendations(annual_std)
        })
    
    def _get_vol_recommendations(self, vol):
        recs = []
        if vol >= 30:
            recs.append("Volatilidade elevada - considere ativos defensivos")
            recs.append("Aumente reserva de liquidez")
        elif vol >= 20:
            recs.append("Volatilidade moderada - mantenha monitoramento")
        return recs


class CorrelationView(APIView):
    permission_classes = [IsAuthenticated]
    
    CORRELATION_MATRIX = {
        ("ACAO", "FII"): 0.4,
        ("ACAO", "ETF"): 0.8,
        ("ACAO", "RF"): -0.1,
        ("ACAO", "CRIPTO"): 0.3,
        ("FII", "ETF"): 0.5,
        ("FII", "RF"): 0.2,
        ("FII", "CRIPTO"): 0.2,
        ("ETF", "RF"): 0.1,
        ("ETF", "CRIPTO"): 0.4,
        ("RF", "CRIPTO"): 0.0,
    }
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"error": "Carteira vazia"}, status=400)
        
        by_type = {}
        total = 0
        for pos in positions:
            at = pos.asset.asset_type
            value = float(pos.quantity * (pos.current_price or pos.average_price))
            by_type[at] = by_type.get(at, 0) + value
            total += value
        
        classes = list(by_type.keys())
        correlations = []
        
        for i, c1 in enumerate(classes):
            for c2 in classes[i+1:]:
                corr = self.CORRELATION_MATRIX.get((c1, c2)) or self.CORRELATION_MATRIX.get((c2, c1)) or 0.3
                correlations.append({
                    "class1": c1,
                    "class2": c2,
                    "correlation": round(corr, 2),
                    "label": "ALTA" if corr >= 0.6 else ("MEDIA" if corr >= 0.3 else "BAIXA")
                })
        
        diversification_score = self._calc_diversification_score(correlations, by_type, total)
        
        return Response({
            "diversification_score": diversification_score,
            "correlations": sorted(correlations, key=lambda x: abs(x["correlation"]), reverse=True),
            "recommendations": self._get_corr_recommendations(correlations, diversification_score)
        })
    
    def _calc_diversification_score(self, correlations, by_type, total):
        if not correlations:
            return 100
        
        total_corr = sum(abs(c["correlation"]) for c in correlations)
        avg_corr = total_corr / len(correlations)
        if avg_corr <= 0.2:
            return 100
        elif avg_corr <= 0.4:
            return 75
        elif avg_corr <= 0.6:
            return 50
        else:
            return 25
    
    def _get_corr_recommendations(self, correlations, score):
        recs = []
        high_corr = [c for c in correlations if c["correlation"] >= 0.6]
        
        if high_corr:
            recs.append("Ativos altamente correlacionados - considere diversificar")
            for c in high_corr[:2]:
                recs.append(c["class1"] + " e " + c["class2"] + " (" + str(c["correlation"]) + ")")
        
        if score < 50:
            recs.append("Baixa diversificacao - adicione classes descorrelacionadas")
        
        return recs


class DrawdownView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"error": "Carteira vazia"}, status=400)
        
        total_balance = sum(
            float(pos.quantity * (pos.current_price or pos.average_price))
            for pos in positions
        )
        
        by_type = {}
        for pos in positions:
            at = pos.asset.asset_type
            value = float(pos.quantity * (pos.current_price or pos.average_price))
            by_type[at] = by_type.get(at, 0) + value
        
        max_drawdown_estimate = self._estimate_drawdown(by_type)
        
        return Response({
            "estimated_max_drawdown": round(max_drawdown_estimate, 1),
            "severity": "ALTO" if max_drawdown_estimate >= 30 else ("MEDIO" if max_drawdown_estimate >= 15 else "BAIXO"),
            "recovery_time": self._estimate_recovery(max_drawdown_estimate),
            "by_class": [
                {"asset_type": k, "value": v, "estimated_dd": self._estimate_drawdown({k: v})}
                for k, v in sorted(by_type.items(), key=lambda x: x[1], reverse=True)
            ],
            "recommendations": self._get_dd_recommendations(max_drawdown_estimate)
        })
    
    def _estimate_drawdown(self, by_type):
        estimates = {
            "ACAO": 35, "FII": 20, "ETF": 25, "RF": 5,
            "CRIPTO": 70, "PREVIDENCIA": 10, "TESOURO": 3
        }
        total = sum(by_type.values())
        if total == 0:
            return 0
        
        weighted = sum(estimates.get(k, 15) * v / total for k, v in by_type.items())
        return weighted
    
    def _estimate_recovery(self, dd):
        if dd >= 50:
            return "24-36 meses"
        elif dd >= 30:
            return "12-18 meses"
        elif dd >= 15:
            return "6-12 meses"
        else:
            return "3-6 meses"
    
    def _get_dd_recommendations(self, dd):
        recs = []
        if dd >= 40:
            recs.append("Drawdown maximo estimado elevado")
            recs.append("Considere aumentar reserva de emergencia")
            recs.append("Evite vendas forçadas em momentos de stress")
        elif dd >= 25:
            recs.append("Mantenha reserva de liquidez")
        return recs


class MaturityAlertsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        from datetime import date
        
        today = date.today()
        alerts = []
        
        from_date = today.replace(year=today.year)
        to_date = today.replace(year=today.year + 1)
        
        rfs = Position.objects.filter(
            account__user=user,
            asset__asset_type__in=["RF", "TESOURO"]
        )
        
        for pos in rfs:
            if hasattr(pos, 'maturity_date') and pos.maturity_date:
                md = pos.maturity_date.date() if hasattr(pos.maturity_date, 'date') else pos.maturity_date
                if from_date <= md <= to_date:
                    days = (md - today).days
                    alerts.append({
                        "asset": pos.asset.ticker,
                        "type": "VENCIMENTO",
                        "date": md.isoformat(),
                        "days_until": days,
                        "severity": "HIGH" if days <= 30 else ("MEDIUM" if days <= 90 else "LOW"),
                        "action": "Resgatar ou rolhar"
                    })
        
        goals = Goal.objects.filter(user=user, target_date__gte=from_date, target_date__lte=to_date)
        for goal in goals:
            days = (goal.target_date.date() - today).days
            alerts.append({
                "goal": goal.name,
                "type": "META",
                "target": float(goal.target_amount),
                "current": float(goal.current_amount),
                "date": goal.target_date.date().isoformat(),
                "days_until": days,
                "severity": "MEDIUM",
                "action": "Acompanhar progresso"
            })
        
        return Response({
            "alerts": sorted(alerts, key=lambda x: x["days_until"]),
            "count": len(alerts)
        })


class TaxesCalculatorView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        transactions = Transaction.objects.filter(user=user)
        if not transactions.exists():
            return Response({"error": "Nenhuma movimentacao encontrada"}, status=400)
        
        total_in = decimal.Decimal('0.0')
        total_out = decimal.Decimal('0.0')
        dividends = decimal.Decimal('0.0')
        
        for tx in transactions:
            value = tx.total_value
            
            if tx.transaction_type in ['VENDA']:
                total_out += value
            elif tx.transaction_type in ['APORTE', 'RESGATE']:
                total_in += value
            elif tx.transaction_type in ['DIVIDENDO']:
                dividends += value
        
        capital_gain = total_out - total_in
        irrf = self._calculate_irrf(dividends)
        inss = self._calculate_inss(capital_gain)
        
        return Response({
            "total_inflows": float(total_in),
            "total_outflows": float(total_out),
            "dividends": float(dividends),
            "capital_gain": float(capital_gain),
            "estimated_taxes": {
                "irrf_dividends": float(irrf),
                "inss": float(inss),
                "total": float(irrf + inss)
            },
            "alerts": self._get_tax_alerts(capital_gain, dividends)
        })
    
    def _calculate_irrf(self, dividends):
        return dividends * decimal.Decimal('0.0')
    
    def _calculate_inss(self, gain):
        if gain > 0:
            base = min(gain, decimal.Decimal('4663.75'))
            return base * decimal.Decimal('0.14')
        return decimal.Decimal('0.0')
    
    def _get_tax_alerts(self, gain, dividends):
        alerts = []
        if dividends * decimal.Decimal('0.15') >= 100:
            alerts.append({
                "type": "IR",
                "message": "Considere ajustar IR para dividendos",
                "severity": "MEDIUM"
            })
        if gain > 0:
            alerts.append({
                "type": "GANHO_CAPITAL",
                "message": "Ha gains - declare no IR",
                "severity": "HIGH"
            })
        return alerts


class TaxReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = int(request.query_params.get('year', datetime.now().year))
        user = request.user
        
        transactions = Transaction.objects.filter(
            user=user,
            transaction_date__year=year
        )
        
        report = {
            "year": year,
            "summary": {},
            "by_type": {},
            "assets": []
        }
        
        for tx in transactions:
            tx_type = tx.transaction_type
            if tx_type not in report["by_type"]:
                report["by_type"][tx_type] = decimal.Decimal('0.0')
            report["by_type"][tx_type] += tx.total_value
        
        for k, v in report["by_type"].items():
            report["summary"][k] = float(v)
        
        return Response(report)


class OpportunityAlertsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        positions = Position.objects.filter(account__user=user)
        if not positions.exists():
            return Response({"alerts": []})
        
        alerts = []
        total_balance = sum(
            float(pos.quantity * (pos.current_price or pos.average_price))
            for pos in positions
        )
        
        for pos in positions:
            current_p = pos.current_price or pos.average_price
            avg_p = pos.average_price
            if avg_p > 0:
                change = (current_p - avg_p) / avg_p * 100
                
                if change >= 20:
                    alerts.append({
                        "type": "OPPORTUNITY",
                        "severity": "HIGH",
                        "title": "Alta valorização",
                        "message": pos.asset.ticker + " valorizaram +20%",
                        "action": "Considerar realizado parcial"
                    })
                elif change <= -15:
                    alerts.append({
                        "type": "OPPORTUNITY",
                        "severity": "MEDIUM",
                        "title": "Queda significativa",
                        "message": pos.asset.ticker + " caiu mais de 15%",
                        "action": "Avaliarstop loss"
                    })
        
        by_type = {}
        for pos in positions:
            at = pos.asset.asset_type
            value = float(pos.quantity * (pos.current_price or pos.average_price))
            by_type[at] = by_type.get(at, 0) + value
        
        if by_type.get("CRIPTO", 0) / total_balance > 0.2 if total_balance > 0 else False:
            alerts.append({
                "type": "OPPORTUNITY",
                "severity": "HIGH",
                "title": "Alta concentracao em cripto",
                "message": "Mais de 20% em cripto",
                "action": "Diversificar"
            })
        
        if by_type.get("ACAO", 0) / total_balance < 0.1 if total_balance > 0 else False:
            alerts.append({
                "type": "OPPORTUNITY",
                "severity": "LOW",
                "title": "Baixa exposicao em acoes",
                "message": "Considere investir em acoes",
                "action": "Avaliar alocacao"
            })
        
        return Response({
            "alerts": sorted(alerts, key=lambda x: x["severity"], reverse=True),
            "count": len(alerts)
        })


class MarketOpportunitiesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import yfinance as yf
        opportunities = []
        
        tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "WEGE3"]
        
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker + ".SA")
                info = stock.info
                
                if info.get("dividendYield") and info.get("dividendYield") > 0.05:
                    opportunities.append({
                        "ticker": ticker,
                        "type": "DIVIDEND",
                        "title": "Alto dividend yield",
                        "message": "Yield de " + str(round(info.get("dividendYield") * 100, 1)) + "%",
                        "severity": "MEDIUM"
                    })
                
                if info.get("trailingPE") and info.get("trailingPE") < 10:
                    opportunities.append({
                        "ticker": ticker,
                        "type": "VALUE",
                        "title": "Acao subvalorizada",
                        "message": "P/L de " + str(round(info.get("trailingPE"), 1)),
                        "severity": "LOW"
                    })
            except:
                pass
        
        return Response({
            "opportunities": opportunities[:10]
        })


class CampaignView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        
        segments = []
        
        if profile and profile.risk_level:
            segments.append(profile.risk_level)
        
        positions = Position.objects.filter(account__user=user)
        total = sum(float(p.quantity * (p.current_price or p.average_price)) for p in positions)
        
        if total > 50000:
            segments.append("PREMIUM")
        if total > 10000:
            segments.append("ACTIVE")
        if not positions.exists() or total < 1000:
            segments.append("NEW_USER")
        
        campaigns = [
            {
                "id": 1,
                "title": "Bem-vindo ao NEXO",
                "content": "Comece a construir seu patrimonio hoje",
                "segment": "NEW_USER",
                "cta": "Explorar funcionalidades"
            },
            {
                "id": 2,
                "title": "Diversifique sua carteira",
                "content": "Considere adicionar FIIs para estabilidade",
                "segment": "CONSERVADOR",
                "cta": "Ver FIIs"
            },
            {
                "id": 3,
                "title": "Plano Premium",
                "content": "Tenha acesso a analise completa",
                "segment": "PREMIUM",
                "cta": "Assinar Premium"
            },
        ]
        
        user_campaigns = [c for c in campaigns if c["segment"] in segments]
        
        return Response({
            "campaigns": user_campaigns,
            "segments": segments
        })


class ReconciliationIssueListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ReconciliationIssueSerializer
    
    def get_queryset(self):
        return ReconciliationIssue.objects.filter(user=self.request.user)


class ReconciliationIssueResolveView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request, pk):
        issue = get_object_or_404(ReconciliationIssue, pk=pk, user=request.user)
        action = request.data.get('action')
        
        if action == 'resolve':
            issue.status = 'RESOLVED'
            from django.utils.timezone import now
            issue.resolved_at = now()
            issue.save()
        elif action == 'ignore':
            issue.status = 'IGNORED'
            issue.save()
        
        return Response({"status": issue.status})


class RunReconciliationView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check user's positions
        accounts = InvestmentAccount.objects.filter(user=request.user)
        issues_found = 0
        
        for account in accounts:
            positions = Position.objects.filter(account=account)
            
            for pos in positions:
                # Check negative quantity
                if pos.quantity < 0:
                    ReconciliationIssue.objects.get_or_create(
                        user=request.user,
                        issue_type='NEGATIVE_QUANTITY',
                        related_data={'ticker': pos.asset.ticker, 'quantity': str(pos.quantity)},
                        defaults={'description': f'Quantidade negativa para {pos.asset.ticker}'}
                    )
                    issues_found += 1
                
                # Check missing price
                if not pos.current_price or pos.current_price == 0:
                    ReconciliationIssue.objects.get_or_create(
                        user=request.user,
                        issue_type='MISSING_PRICE',
                        related_data={'ticker': pos.asset.ticker},
                        defaults={'description': f'Preço faltando para {pos.asset.ticker}'}
                    )
                    issues_found += 1
        
        return Response({
            "message": "Reconciliação concluída",
            "issues_found": issues_found
        })


class ProfitabilityReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = int(request.query_params.get('year', datetime.now().year))
        user = request.user
        
        positions = Position.objects.filter(account__user=user).select_related('asset')
        
        total_invested = decimal.Decimal('0.0')
        current_value = decimal.Decimal('0.0')
        total_profit = decimal.Decimal('0.0')
        
        by_asset = []
        
        for pos in positions:
            invested = pos.quantity * pos.average_price
            current = pos.quantity * (pos.current_price or pos.average_price)
            profit = current - invested
            profit_pct = (profit / invested * 100) if invested > 0 else decimal.Decimal('0')
            
            total_invested += invested
            current_value += current
            total_profit += profit
            
            by_asset.append({
                "ticker": pos.asset.ticker,
                "name": pos.asset.name,
                "asset_type": pos.asset.asset_type,
                "quantity": float(pos.quantity),
                "average_price": float(pos.average_price),
                "current_price": float(pos.current_price or pos.average_price),
                "invested_value": float(invested),
                "current_value": float(current),
                "profit": float(profit),
                "profit_percentage": float(profit_pct)
            })
        
        total_profit_pct = (total_profit / total_invested * 100) if total_invested > 0 else decimal.Decimal('0')
        
        by_type = {}
        for pos in positions:
            at = pos.asset.asset_type
            value = float(pos.quantity * (pos.current_price or pos.average_price))
            by_type[at] = by_type.get(at, 0) + value
        
        transactions = Transaction.objects.filter(
            user=user,
            transaction_date__year=year
        ).order_by('transaction_date')
        
        monthly_history = {}
        for tx in transactions:
            month = tx.transaction_date.strftime('%Y-%m')
            if month not in monthly_history:
                monthly_history[month] = {'inflow': 0, 'outflow': 0}
            
            if tx.transaction_type in ['APORTE', 'RESGATE']:
                value = float(tx.total_value)
                if tx.transaction_type == 'APORTE':
                    monthly_history[month]['inflow'] += value
                else:
                    monthly_history[month]['outflow'] += value
        
        return Response({
            "period": year,
            "summary": {
                "total_invested": float(total_invested),
                "current_value": float(current_value),
                "total_profit": float(total_profit),
                "profit_percentage": float(total_profit_pct),
                "positions_count": len(by_asset)
            },
            "by_asset": sorted(by_asset, key=lambda x: x['current_value'], reverse=True),
            "by_type": by_type,
            "monthly_history": monthly_history,
            "dividends_received": float(sum(
                float(tx.total_value) for tx in transactions if tx.transaction_type == 'DIVIDENDO'
            ))
        })


class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        format_type = request.query_params.get('format', 'json')
        year = int(request.query_params.get('year', datetime.now().year))
        user = request.user
        
        positions = Position.objects.filter(account__user=user).select_related('asset')
        
        rows = [['Ativo', 'Tipo', 'Quantidade', 'Preço Médio', 'Preço Atual', 'Valor Investido', 'Valor Atual', 'Lucro/Prejuízo', '%']]
        
        total_profit = decimal.Decimal('0')
        total_invested = decimal.Decimal('0')
        
        for pos in positions:
            invested = pos.quantity * pos.average_price
            current = pos.quantity * (pos.current_price or pos.average_price)
            profit = current - invested
            profit_pct = (profit / invested * 100) if invested > 0 else 0
            
            total_profit += profit
            total_invested += invested
            
            rows.append([
                pos.asset.ticker,
                pos.asset.asset_type,
                str(pos.quantity),
                f"{pos.average_price:.2f}",
                f"{pos.current_price or pos.average_price:.2f}",
                f"{invested:.2f}",
                f"{current:.2f}",
                f"{profit:.2f}",
                f"{profit_pct:.2f}%"
            ])
        
        rows.append(['', '', '', '', '', '', '', '', ''])
        rows.append(['TOTAL', '', '', '', '', f"{total_invested:.2f}", f"{total_invested + total_profit:.2f}", f"{total_profit:.2f}", f"{(total_profit/total_invested*100) if total_invested > 0 else 0:.2f}%"])
        
        if format_type == 'csv':
            import io
            output = io.StringIO()
            import csv
            writer = csv.writer(output)
            for row in rows:
                writer.writerow(row)
            
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename=relatorio_rentabilidade_{year}.csv'
            return response
        else:
            return Response({
                "filename": f"relatorio_rentabilidade_{year}",
                "format": format_type,
                "rows": rows
            })


class BackupExportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        format_type = request.query_params.get('format', 'json')
        user = request.user
        include_positions = request.query_params.get('positions', 'true') == 'true'
        include_transactions = request.query_params.get('transactions', 'true') == 'true'
        include_goals = request.query_params.get('goals', 'true') == 'true'
        include_automations = request.query_params.get('automations', 'true') == 'true'
        
        export_data = {
            "export_date": timezone.now().isoformat(),
            "user": {
                "username": user.username,
                "email": user.email,
            },
            "version": "1.0"
        }
        
        if include_positions:
            positions = Position.objects.filter(account__user=user).select_related('asset', 'account__institution')
            export_data["positions"] = [{
                "ticker": p.asset.ticker,
                "name": p.asset.name,
                "asset_type": p.asset.asset_type,
                "quantity": float(p.quantity),
                "average_price": float(p.average_price),
                "current_price": float(p.current_price or p.average_price),
                "institution": p.account.institution.name,
                "account": p.account.description,
            } for p in positions]
        
        if include_transactions:
            transactions = Transaction.objects.filter(user=user)
            export_data["transactions"] = [{
                "asset_ticker": tx.asset.ticker if tx.asset else None,
                "transaction_type": tx.transaction_type,
                "quantity": float(tx.quantity) if tx.quantity else None,
                "total_value": float(tx.total_value),
                "date": tx.transaction_date.isoformat(),
            } for tx in transactions[:1000]]
        
        if include_goals:
            goals = Goal.objects.filter(user=user)
            export_data["goals"] = [{
                "name": g.name,
                "target_amount": float(g.target_amount),
                "current_amount": float(g.current_amount),
                "horizon_months": g.horizon_months,
                "monthly_contribution": float(g.monthly_contribution),
            } for g in goals]
        
        if include_automations:
            from apps.automations.models import AutomationTrigger
            automations = AutomationTrigger.objects.filter(user=user)
            export_data["automations"] = [{
                "name": a.name,
                "trigger_type": a.trigger_type,
                "condition_value": float(a.condition_value),
                "asset_ticker": a.asset_ticker,
                "action_type": a.action_type,
                "is_active": a.is_active,
            } for a in automations]
        
        export_data["summary"] = {
            "positions_count": len(export_data.get("positions", [])),
            "transactions_count": len(export_data.get("transactions", [])),
            "goals_count": len(export_data.get("goals", [])),
            "automations_count": len(export_data.get("automations", [])),
        }
        
        if format_type == 'json':
            return Response(export_data)
        elif format_type == 'csv':
            import io
            import csv
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            writer.writerow(["NEXO Backup Export"])
            writer.writerow([f"Export Date: {export_data['export_date']}"])
            writer.writerow([f"User: {export_data['user']['username']}"])
            writer.writerow([])
            
            if export_data.get("positions"):
                writer.writerow(["=== POSITIONS ==="])
                writer.writerow(["Ticker", "Name", "Type", "Quantity", "Avg Price", "Current Price", "Institution"])
                for p in export_data["positions"]:
                    writer.writerow([p["ticker"], p["name"], p["asset_type"], p["quantity"], p["average_price"], p["current_price"], p["institution"]])
            
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename=nexo_backup_{datetime.now().strftime("%Y%m%d")}.csv'
            return response
        
        return Response({"error": "Formato não suportado"}, status=400)


class PortfolioSnapshotView(generics.ListCreateAPIView):
    serializer_class = PortfolioSnapshotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PortfolioSnapshot.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        date = serializer.validated_data.get('date')

        if PortfolioSnapshot.objects.filter(user=user, date=date).exists():
            return Response({"error": "Snapshot já existe para esta data"}, status=400)

        positions = Position.objects.filter(account__user=user).select_related('asset', 'account__institution')
        accounts = InvestmentAccount.objects.filter(user=user)

        total_value = decimal.Decimal('0.0')
        position_value = decimal.Decimal('0.0')
        cash_value = decimal.Decimal('0.0')
        allocations = {}
        positions_count = 0

        for pos in positions:
            if pos.quantity > 0:
                current_p = pos.current_price or pos.average_price
                value = pos.quantity * current_p
                position_value += value
                total_value += value
                positions_count += 1

                asset_type = pos.asset.asset_type
                if asset_type not in allocations:
                    allocations[asset_type] = decimal.Decimal('0.0')
                allocations[asset_type] += value

        for acc in accounts:
            cash_value += decimal.Decimal('1000.00')

        serializer.save(
            user=user,
            total_value=total_value + cash_value,
            position_value=position_value,
            cash_value=cash_value,
            allocation=allocations,
            positions_count=positions_count,
            accounts_count=accounts.count()
        )


class PortfolioSnapshotDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = PortfolioSnapshotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PortfolioSnapshot.objects.filter(user=self.request.user)


class GenerateSnapshotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone
        import datetime

        user = request.user
        today = timezone.now().date()

        positions = Position.objects.filter(account__user=user).select_related('asset', 'account__institution')
        accounts = InvestmentAccount.objects.filter(user=user)

        total_value = decimal.Decimal('0.0')
        position_value = decimal.Decimal('0.0')
        cash_value = decimal.Decimal('0.0')
        allocations = {}
        positions_count = 0

        for pos in positions:
            if pos.quantity > 0:
                current_p = pos.current_price or pos.average_price
                value = pos.quantity * current_p
                position_value += value
                total_value += value
                positions_count += 1

                asset_type = pos.asset.asset_type
                if asset_type not in allocations:
                    allocations[asset_type] = decimal.Decimal('0.0')
                allocations[asset_type] += value

        for acc in accounts:
            cash_value += decimal.Decimal('1000.00')

        total_value += cash_value

        snapshot, created = PortfolioSnapshot.objects.update_or_create(
            user=user,
            date=today,
            defaults={
                'total_value': total_value,
                'position_value': position_value,
                'cash_value': cash_value,
                'allocation': allocations,
                'positions_count': positions_count,
                'accounts_count': accounts.count(),
            }
        )

        return Response({
            "message": "Snapshot gerado com sucesso",
            "snapshot_id": snapshot.id,
            "total_value": float(total_value),
            "created": created
        })


class TaxCalculationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year', timezone.now().year)
        quarter = request.query_params.get('quarter')
        
        reports = TaxReport.objects.filter(user=request.user, year=int(year))
        if quarter:
            reports = reports.filter(quarter=quarter)
        
        return Response(TaxReportSerializer(reports, many=True).data)
    
    def post(self, request):
        year = request.data.get('year')
        quarter = request.data.get('quarter')
        
        if not year or not quarter:
            return Response({"error": "Ano e trimestre são obrigatórios"}, status=400)
        
        quarter_months = {
            'Q1': (1, 2, 3),
            'Q2': (4, 5, 6),
            'Q3': (7, 8, 9),
            'Q4': (10, 11, 12),
        }
        
        months = quarter_months.get(quarter, (1, 2, 3))
        
        transactions = Transaction.objects.filter(
            user=request.user,
            transaction_date__year=int(year),
            transaction_date__month__in=months,
            transaction_type__in=['VENDA', 'COMPRA']
        ).order_by('transaction_date')
        
        total_gains = decimal.Decimal('0.0')
        total_losses = decimal.Decimal('0.0')
        day_trade_gains = decimal.Decimal('0.0')
        exempted_gains = decimal.Decimal('0.0')
        
        sells = transactions.filter(transaction_type='VENDA')
        buys = transactions.filter(transaction_type='COMPRA')
        
        sell_dates = {}
        sell_quantities = {}
        
        for t in sells:
            ticker = t.asset.ticker
            date_key = (t.transaction_date, t.quantity)
            
            if ticker not in sell_dates:
                sell_dates[ticker] = []
            sell_dates[ticker].append({
                'date': t.transaction_date,
                'quantity': t.quantity,
                'price': t.unit_price,
                'is_day_trade': False,
            })
        
        for t in sells:
            buy_same_day = Transaction.objects.filter(
                user=request.user,
                asset=t.asset,
                transaction_type='COMPRA',
                transaction_date=t.transaction_date
            ).exists()
            
            if buy_same_day:
                day_trade_gains += t.total_value
                continue
            
            buys_for_asset = Transaction.objects.filter(
                user=request.user,
                asset=t.asset,
                transaction_type='COMPRA',
                transaction_date__lt=t.transaction_date,
                quantity__gt=0
            ).order_by('transaction_date')
            
            remaining_sell_qty = t.quantity
            
            for buy in buys_for_asset:
                if remaining_sell_qty <= 0:
                    break
                
                buy_qty = buy.quantity
                cost = buy.unit_price * min(remaining_sell_qty, buy_qty)
                proceeds = t.unit_price * min(remaining_sell_qty, buy_qty)
                gain = proceeds - cost
                
                if gain > 0:
                    if t.asset.asset_type in ['FII', 'ETF']:
                        exempted_gains += gain
                    else:
                        total_gains += gain
                else:
                    total_losses += abs(gain)
                
                remaining_sell_qty -= min(remaining_sell_qty, buy_qty)
        
        net_gain = max(total_gains - total_losses, 0)
        
        tax_report, created = TaxReport.objects.update_or_create(
            user=request.user,
            year=int(year),
            quarter=quarter,
            defaults={
                'total_gains': total_gains,
                'total_losses': total_losses,
                'net_gain': net_gain,
                'day_trade_gains': day_trade_gains,
                'exempted_gains': exempted_gains,
            }
        )
        tax_report.calculate_tax()
        tax_report.save()
        
        return Response(TaxReportSerializer(tax_report).data, status=201)


class DARFGenerationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year', timezone.now().year)
        quarter = request.query_params.get('quarter')
        
        reports = TaxReport.objects.filter(
            user=request.user,
            year=int(year),
            status__in=['CALCULATED', 'OVERDUE']
        )
        if quarter:
            reports = reports.filter(quarter=quarter)
        
        return Response(TaxReportSerializer(reports, many=True).data)
    
    def post(self, request):
        report_id = request.data.get('report_id')
        
        try:
            tax_report = TaxReport.objects.get(id=report_id, user=request.user)
        except TaxReport.DoesNotExist:
            return Response({"error": "Relatório não encontrado"}, status=404)
        
        if tax_report.net_gain <= 0 or tax_report.tax_due <= 0:
            return Response({"error": "IR não devido para este período"}, status=400)
        
        darf_codes = {
            'Q1': '6015',
            'Q2': '6015',
            'Q3': '6015',
            'Q4': '6015',
        }
        
        tax_report.darf_code = darf_codes.get(tax_report.quarter, '6015')
        tax_report.status = 'CALCULATED'
        tax_report.save()
        
        return Response({
            "message": "DARF gerado",
            "darf_code": tax_report.darf_code,
            "darf_value": float(tax_report.tax_due),
            "deadline": tax_report.darf_deadline,
            "reference": f"{tax_report.year}{tax_report.quarter}",
        })


class DARFPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        report_id = request.data.get('report_id')
        paid_date = request.data.get('paid_date')
        paid_value = request.data.get('paid_value')
        
        try:
            tax_report = TaxReport.objects.get(id=report_id, user=request.user)
        except TaxReport.DoesNotExist:
            return Response({"error": "Relatório não encontrado"}, status=404)
        
        from datetime import datetime
        if paid_date:
            tax_report.darf_paid_date = datetime.strptime(paid_date, '%Y-%m-%d').date()
        if paid_value:
            tax_report.darf_value = decimal.Decimal(str(paid_value))
        
        tax_report.status = 'PAID'
        tax_report.save()
        
        return Response({
            "message": "Pagamento registrado",
            "status": tax_report.status,
            "paid_date": tax_report.darf_paid_date,
        })


class TaxLotManagementView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        asset_ticker = request.query_params.get('ticker')
        
        lots = TaxLot.objects.filter(user=request.user)
        if asset_ticker:
            lots = lots.filter(asset__ticker=asset_ticker)
        
        return Response(TaxLotSerializer(lots, many=True).data)
