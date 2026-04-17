# Inteligência de Investimentos

Módulo de análise inteligente de investimentos, incluindo ranking de ações e projeção de ganhos.

## Ranking de Ações (Screening Bazin/Graham)

Sistema de screening que avalia ações segundo critérios fundamentalistas, classificando-as por atratividade.

### Critérios de Avaliação

| Indicador | Descrição | Peso |
|-----------|----------|------|
| Dividend Yield | Rendimento de dividendos anuais | 20% |
| P/L (Price/Earnings) | Preço/Lucro por ação | 15% |
| P/VP (Price/Book Value) | Preço/Valor Patrimonial | 15% |
| ROE | Retorno sobre patrimônio | 15% |
| Dívida/EBITDA | Alavancagem financeira | 10% |
| Crescimento Lucro | Crescimento médio anual | 10% |

### Classificação

| Classificação | Score | Sinal |
|---------------|-------|-------|
| ⭐ Excelente | 80-100 | Compra forte |
| ✅ Bom | 60-79 | Compra |
| ⚠️ Neutro | 40-59 | Manter/Aguardar |
| ❌ Ruim | 20-39 | Vender |
| 🚫 Muito Ruim | 0-19 | Evitar |

### Listas Prontas

- **Na Esteira Bazin** — Ações com DY alto (>6%)
- **Magnata Graham** — Ações com valuation baixo (P/L <15, P/VP <1.5)
- **Crescimento (GARP)** — Ações com crescimento consistente (>5%)

## Projeção de Ganhos

### Projeção Curto Prazo (1-12 meses)

Simulação com cenários:
- **Bullish:** +20% ao ano
- **Neutro:** +8% ao ano
- **Bearish:** -10% ao ano

### Projeção Longo Prazo (1-30 anos)

Parâmetros:
- `valor_inicial` — Valor atual do patrimônio
- `aporte_mensal` — Aporte mensal opcional
- `taxa_retorno` — Taxa de retorno esperada (padrão: 10%)
- `horizonte_meses` — Prazo em meses

### Cenários

| Cenário | Descrição |
|--------|-----------|
| Base | Média histórica (+10% a.a.) |
| Bullish | Crescimento alto (+20% a.a.) |
| Bearish | Recessão (-10% a.a.) |
| Conservador | Mínimo (+6% a.a.) |
| Otimista | Máximo (+15% a.a.) |

## APIs

### Screening

```
GET /api/intelligence/screening/?classificacao=EXCELENTE&limit=10
GET /api/intelligence/ranking/?type=BAZIN&limit=10
POST /api/intelligence/calcular-score/
```

### Projeção

```
GET  /api/intelligence/projecao/          # Lista projeções do usuário
POST /api/intelligence/projecao/           # Cria nova projeção
POST /api/intelligence/projecao/simular/   # Simulação livre (sem auth)
```

## Exemplos

### Criar Projeção

```bash
curl -X POST http://localhost:8000/api/intelligence/projecao/simular/ \
  -H "Content-Type: application/json" \
  -d '{
    "valor_inicial": 10000,
    "aporte_mensal": 500,
    "taxa_retorno": 0.10,
    "horizonte_meses": 120
  }'
```

Resposta:
```json
{
  "parametros": {
    "valor_inicial": 10000,
    "aporte_mensal": 500,
    "taxa_retorno": 0.1,
    "horizonte_meses": 120
  },
  "resultados": {
    "base": 129492.90,
    "bullish": 260730.20,
    "bearish": 41682.94
  },
  "milestones": [
    {"ano": 1, "valor": 17329.91, "retorno_total": 8.31},
    {"ano": 2, "valor": 25427.37, "retorno_total": 15.58}
  ]
}
```

### Screening

```bash
curl "http://localhost:8000/api/intelligence/screening/?sort_by=-score_total&limit=10"
```

## Referências

- Bazin, Guustav — "Investimento Absurdo"
- Graham, Benjamin — "Intelligent Investor"
- Lynch, Peter — "One Up on Wall Street"