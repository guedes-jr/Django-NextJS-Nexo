# Histórico de Movimentações

## Visão Geral

A página de Movimentações permite ao usuário acompanhar todo o histórico de entradas e saídas da sua carteira, incluindo compras, vendas, dividendos, aportes e resgates.

## Funcionalidades

### Listagem de Transações

- Exibição em ordem cronológica reversa (mais recentes primeiro)
- Cada transação mostra:
  - Tipo de operação (Compra, Venda, Aporte, Resgate, Dividendo, etc.)
  - Ativo envolvido (ticker)
  - Quantidade e preço unitário
  - Valor total
  - Data da transação
  - Observações

### Tipos de Transação

| Tipo | Descrição | Cor |
|------|-----------|-----|
| COMPRA | Aquisição de ativos | #3b82f6 |
| VENDA | Alienação de ativos | #f59e0b |
| APORTE | Depósito de recursos | #10b981 |
| RESGATE | Retirada de recursos | #8b5cf6 |
| DIVIDENDO | Recebimento de proventos | #ec4899 |
| AMORTIZACAO | Amortização de títulos | #a855f7 |
| TRANSFERENCIA | Transferência entre contas | #0ea5e9 |

### Filtros

- Filtragem por tipo de transação
- Ordenação por data

### Resumo Financeiro

- Total de entradas (aportes + dividendos + resgates)
- Total de saídas (compras + resgates)
- Saldo líquido (entradas - saídas)

## API Reference

### Endpoints

```
GET /api/portfolio/transactions/
```

**Parâmetros Query:**
- `type` - Filtrar por tipo de transação
- `start_date` - Data inicial (YYYY-MM-DD)
- `end_date` - Data final (YYYY-MM-DD)
- `asset` - Filtrar por ticker do ativo

**Exemplo:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8001/api/portfolio/transactions/?type=DIVIDENDO&start_date=2024-01-01"
```

### Criar Transação

```
POST /api/portfolio/transactions/
```

**Body:**
```json
{
  "transaction_type": "COMPRA",
  "asset_ticker": "PETR4",
  "quantity": 100,
  "unit_price": 35.50,
  "total_value": 3550.00,
  "transaction_date": "2024-01-15",
  "notes": "Compra mensal"
}
```