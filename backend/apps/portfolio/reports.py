from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from .models import Position, Transaction, Goal
import decimal
import io
import csv
from datetime import datetime

class PortfolioReportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        positions = Position.objects.filter(account__user=user).select_related('asset', 'account__institution')
        
        total_value = sum(
            pos.quantity * (pos.current_price or pos.average_price) 
            for pos in positions
        )
        
        total_cost = sum(
            pos.quantity * pos.average_price 
            for pos in positions
        )
        
        total_profit = total_value - total_cost
        profit_pct = (total_profit / total_cost * 100) if total_cost > 0 else 0
        
        asset_allocations = {}
        for pos in positions:
            asset_type = pos.asset.asset_type
            value = pos.quantity * (pos.current_price or pos.average_price)
            asset_allocations[asset_type] = asset_allocations.get(asset_type, 0) + float(value)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Relatório de Carteira - NEXO</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; color: #333; }}
                h1 {{ color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }}
                h2 {{ color: #555; margin-top: 30px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f8f9fa; font-weight: bold; }}
                .summary {{ display: flex; gap: 40px; margin: 20px 0; }}
                .summary-item {{ background: #f8f9fa; padding: 20px; border-radius: 8px; }}
                .summary-label {{ font-size: 14px; color: #666; }}
                .summary-value {{ font-size: 24px; font-weight: bold; color: #333; }}
                .positive {{ color: #10b981; }}
                .negative {{ color: #f85149; }}
                .footer {{ margin-top: 40px; text-align: center; color: #999; font-size: 12px; }}
            </style>
        </head>
        <body>
            <h1>Relatório de Carteira</h1>
            <p>Data de geração: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            
            <h2>Resumo Geral</h2>
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-label">Patrimônio Total</div>
                    <div class="summary-value">R$ {total_value:,.2f}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Custo Total</div>
                    <div class="summary-value">R$ {total_cost:,.2f}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Resultado</div>
                    <div class="summary-value {'positive' if total_profit >= 0 else 'negative'}">
                        R$ {total_profit:,.2f} ({profit_pct:.2f}%)
                    </div>
                </div>
            </div>
            
            <h2>Alocação por Classe</h2>
            <table>
                <tr>
                    <th>Classe de Ativo</th>
                    <th>Valor (R$)</th>
                    <th>Percentual</th>
                </tr>
        """
        
        for asset_type, value in asset_allocations.items():
            pct = (value / total_value * 100) if total_value > 0 else 0
            html_content += f"""
                <tr>
                    <td>{asset_type}</td>
                    <td>R$ {value:,.2f}</td>
                    <td>{pct:.1f}%</td>
                </tr>
            """
        
        html_content += """
            </table>
            
            <h2>Posições Detalhadas</h2>
            <table>
                <tr>
                    <th>Ativo</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Preço Médio</th>
                    <th>Preço Atual</th>
                    <th>Valor Total</th>
                    <th>Resultado</th>
                </tr>
        """
        
        for pos in positions:
            current_price = pos.current_price or pos.average_price
            total_pos_value = pos.quantity * current_price
            pos_cost = pos.quantity * pos.average_price
            pos_profit = total_pos_value - pos_cost
            pos_profit_pct = (pos_profit / pos_cost * 100) if pos_cost > 0 else 0
            
            html_content += f"""
                <tr>
                    <td><strong>{pos.asset.ticker}</strong><br><small>{pos.asset.name}</small></td>
                    <td>{pos.asset.asset_type}</td>
                    <td>{pos.quantity:,.4f}</td>
                    <td>R$ {pos.average_price:,.2f}</td>
                    <td>R$ {current_price:,.2f}</td>
                    <td>R$ {total_pos_value:,.2f}</td>
                    <td class="{'positive' if pos_profit >= 0 else 'negative'}">
                        R$ {pos_profit:,.2f} ({pos_profit_pct:.2f}%)
                    </td>
                </tr>
            """
        
        html_content += f"""
            </table>
            
            <div class="footer">
                <p>Gerado pela plataforma NEXO - Gestão de Investimentos</p>
            </div>
        </body>
        </html>
        """
        
        response = HttpResponse(html_content, content_type='text/html; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="relatorio_carteira_{datetime.now().strftime("%Y%m%d")}.html"'
        return response


class PortfolioReportExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        positions = Position.objects.filter(account__user=user).select_related('asset', 'account__institution')
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Relatório de Carteira - NEXO'])
        writer.writerow([f'Data de geração: {datetime.now().strftime("%d/%m/%Y %H:%M")}'])
        writer.writerow([])
        
        total_value = sum(pos.quantity * (pos.current_price or pos.average_price) for pos in positions)
        total_cost = sum(pos.quantity * pos.average_price for pos in positions)
        total_profit = total_value - total_cost
        
        writer.writerow(['RESUMO'])
        writer.writerow(['Patrimônio Total', f'R$ {total_value:,.2f}'])
        writer.writerow(['Custo Total', f'R$ {total_cost:,.2f}'])
        writer.writerow(['Resultado', f'R$ {total_profit:,.2f}'])
        writer.writerow([])
        
        writer.writerow(['ALOCAÇÃO POR CLASSE'])
        writer.writerow(['Classe', 'Valor (R$)', 'Percentual'])
        
        asset_allocations = {}
        for pos in positions:
            asset_type = pos.asset.asset_type
            value = pos.quantity * (pos.current_price or pos.average_price)
            asset_allocations[asset_type] = asset_allocations.get(asset_type, 0) + float(value)
        
        for asset_type, value in asset_allocations.items():
            pct = (value / total_value * 100) if total_value > 0 else 0
            writer.writerow([asset_type, f'R$ {value:,.2f}', f'{pct:.1f}%'])
        
        writer.writerow([])
        writer.writerow(['POSIÇÕES DETALHADAS'])
        writer.writerow(['Ticker', 'Nome', 'Tipo', 'Quantidade', 'Preço Médio', 'Preço Atual', 'Valor Total', 'Resultado', '%'])
        
        for pos in positions:
            current_price = pos.current_price or pos.average_price
            total_pos_value = pos.quantity * current_price
            pos_cost = pos.quantity * pos.average_price
            pos_profit = total_pos_value - pos_cost
            pos_profit_pct = (pos_profit / pos_cost * 100) if pos_cost > 0 else 0
            
            writer.writerow([
                pos.asset.ticker,
                pos.asset.name,
                pos.asset.asset_type,
                f'{pos.quantity:,.4f}',
                f'R$ {pos.average_price:,.2f}',
                f'R$ {current_price:,.2f}',
                f'R$ {total_pos_value:,.2f}',
                f'R$ {pos_profit:,.2f}',
                f'{pos_profit_pct:.2f}%'
            ])
        
        from datetime import datetime
        
        output.seek(0)
        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="relatorio_carteira_{datetime.now().strftime("%Y%m%d")}.csv"'
        return response


class TransactionReportExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        transactions = Transaction.objects.filter(user=user).order_by('-transaction_date')
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Relatório de Movimentações - NEXO'])
        writer.writerow([f'Data de geração: {datetime.now().strftime("%d/%m/%Y %H:%M")}'])
        writer.writerow([])
        
        writer.writerow(['MOVIMENTAÇÕES'])
        writer.writerow(['Data', 'Tipo', 'Ativo', 'Quantidade', 'Preço Unitário', 'Valor Total', 'Notas'])
        
        for tx in transactions:
            writer.writerow([
                tx.transaction_date.strftime('%d/%m/%Y'),
                tx.transaction_type,
                tx.asset.ticker if tx.asset else '-',
                f'{tx.quantity:,.4f}' if tx.quantity else '-',
                f'R$ {tx.unit_price:,.2f}' if tx.unit_price else '-',
                f'R$ {tx.total_value:,.2f}',
                tx.notes or ''
            ])
        
        from datetime import datetime
        
        output.seek(0)
        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="relatorio_movimentacoes_{datetime.now().strftime("%Y%m%d")}.csv"'
        return response


class GoalsReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        goals = Goal.objects.filter(user=user, is_active=True)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Relatório de Metas - NEXO'])
        writer.writerow([f'Data de geração: {datetime.now().strftime("%d/%m/%Y %H:%M")}'])
        writer.writerow([])
        
        writer.writerow(['METAS FINANCEIRAS'])
        writer.writerow(['Nome', 'Tipo', 'Meta (R$)', 'Atual (R$)', 'Progresso', 'Prazo', 'Aporte Mensal'])
        
        for goal in goals:
            progress = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
            writer.writerow([
                goal.name,
                goal.goal_type,
                f'R$ {goal.target_amount:,.2f}',
                f'R$ {goal.current_amount:,.2f}',
                f'{progress:.1f}%',
                goal.target_date.strftime('%d/%m/%Y'),
                f'R$ {goal.monthly_contribution:,.2f}' if goal.monthly_contribution else '-'
            ])
        
        from datetime import datetime
        
        output.seek(0)
        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="relatorio_metas_{datetime.now().strftime("%Y%m%d")}.csv"'
        return response