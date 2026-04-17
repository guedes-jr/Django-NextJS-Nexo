# Eventos Corporativos

## Descrição
Sistema de rastreamento e registro de eventos corporativos que afetam ativos da carteira, como dividendos, desdobramentos e grupamentos.

## Tipos de Evento

| Tipo | Ícone | Descrição |
|------|-------|-----------|
| DIVIDENDO | 💰 | Dividendos e JCP |
| DESDOBRAMENTO | 📊 | Split (ex: 1:2) |
| GRUPAMENTO | 🔄 | Reverse Split (ex: 2:1) |
| BONIFICACAO | 🎁 | Bonificação em ações |
| AMORTIZACAO | 💵 | Amortização de títulos |

## Funcionalidades

### 1. Dashboard de Eventos
- Estatísticas:
  - Eventos pendentes
  - Eventos aplicados
  - Total em dividendos recebidos
- Filtragem por tipo e ano

### 2. Tabela de Eventos
- Ativo (ticker e nome)
- Tipo de evento
- Data
- Ratio (para splits)
- Valor por ação
- Total recebido
- Status

### 3. Status
- `PENDING` - Pendente de aplicação
- `APPLIED` - Aplicado na carteira
- `CANCELLED` - Cancelado

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portfolio/corporate-actions/` | Listar eventos |

## Modelo

### CorporateAction
```python
asset            # FK para Asset
action_type      # Tipo de evento
date             # Data do evento
ratio            # Razão do split (ex: 2.0 = 1:2)
amount_per_share # Valor por ação
total_amount     # Total recebido
status           # Status
```

---

**Retornar para:** [Documentação Principal](../README.md)