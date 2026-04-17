# Benchmarks

## Visão Geral

A página de Benchmarks permite ao usuário comparar a performance do seu portfólio com os principais índices de mercado, como Ibovespa, S&P 500 e CDI.

## Funcionalidades

### Comparativo de Performance

O usuário pode comparar a variação percentual do seu portfólio em diferentes períodos com os benchmarks disponíveis:

- **Ibovespa (IBOV)** - Principal índice da bolsa brasileira
- **S&P 500** - Índice das 500 maiores empresas dos EUA
- **CDI** - Taxa DI, rendimento médio dos investimentos de renda fixa

### Seletor de Período

- 1M (1 mês)
- 3M (3 meses)
- 6M (6 meses)
- 1A (1 ano)

### Visualização

- Cards individuais para cada benchmark com variação percentual
- Gráfico comparativo de barras
- Indicador se o portfólio está acima ou abaixo de cada benchmark

## API Reference

### Obter Benchmarks

```
GET /api/portfolio/benchmark/?period=6mo
```

**Parâmetros:**
- `period` - Período de análise (1mo, 3mo, 6mo, 1y)

**Resposta:**
```json
{
  "portfolio": {
    "variation_pct": 5.2,
    "total_cost": 50000.00,
    "period": "6mo"
  },
  "benchmarks": [
    {
      "symbol": "^BVSP",
      "name": "Ibovespa",
      "variation_pct": 8.5,
      "period": "6mo"
    },
    {
      "symbol": "^GSPC",
      "name": "S&P 500",
      "variation_pct": 12.3,
      "period": "6mo"
    },
    {
      "symbol": "CDI",
      "name": "CDI",
      "variation_pct": 5.1,
      "period": "6mo"
    }
  ]
}
```

## Detalhes dos Benchmarks

### Ibovespa (IBOV)
Principal índice da bolsa brasileira. Representa as 50 maiores empresas listadas na B3.

### S&P 500
Índice das 500 maiores empresas dos EUA. Representa o mercado americano.

### CDI
Taxa DI. Rendimento médio dos investimentos de renda fixa pós-fixados. Usado como referência para investimentos de baixo risco.