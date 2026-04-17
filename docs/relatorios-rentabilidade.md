# Relatórios de Rentabilidade

## Descrição
Sistema completo de geração de relatórios de rentabilidade da carteira de investimentos, com suporte a download em CSV e JSON.

## Funcionalidades

### 1. Dashboard de Relatórios
- Resumo financiero:
  - Total investido
  - Valor atual
  - Lucro/Prejuízo
  - Percentual de retorno
  - Dividendos recebidos

### 2. Análise por Ativo
- Tabela completa com todos os ativos:
  - Ticker e nome
  - Tipo de ativo
  - Quantidade
  - Preço médio
  - Preço atual
  - Valor investido
  - Valor atual
  - Lucro/Prejuízo
  - Percentual

### 3. Filtros
- Por tipo de ativo (Ação, FII, ETF, Cripto, RF, etc)
- Por ano

### 4. Download
- **CSV**: Planilha para Excel/Numbers
- **JSON**: Dados completos para backup/integração

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portfolio/reports/profitability/` | Relatório completo |
| GET | `/api/portfolio/reports/generate/?format=csv` | Download CSV |
| GET | `/api/portfolio/reports/generate/?format=json` | Download JSON |

## Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| year | int | Ano do relatório (padrão: ano atual) |
| format | string | Formato de saída (csv/json) |

## Cálculos

### Lucro/Prejuízo
```
lucro = (quantidade * preço_atual) - (quantidade * preço_médio)
```

### Percentual de Retorno
```
percentual = (lucro / valor_investido) * 100
```

---

**Retornar para:** [Documentação Principal](../README.md)