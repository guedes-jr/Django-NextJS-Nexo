# Análise de Concentração

## Visão Geral

A página de Concentração permite ao usuário identificar riscos de concentração excessiva na carteira, tanto por ativo individual quanto por emissor.

## Funcionalidades

### Indicador de Diversificação

- Badge mostrando se a carteira está "Diversificada" ou "Concentrada"
- Cálculo automático baseado em limites seguros (máximo 20% por ativo)

### Alertas de Risco

Sistema de alertas com severidade:
- **HIGH** - Concentração superior a 20%
- **MEDIUM** - Concentração entre 10% e 20%
- **LOW** - Concentração abaixo de 10%

### Gráficos de Concentração

#### Top Ativos por Ticker
Lista dos 5 maiores ativos da carteira com:
- Valor em reais
- Percentual do patrimônio
- Barra visual proporcional

#### Concentração por Emissor
Agrupamento por emissor/companhia para identificar exposição setorial

### Estatísticas

- Total de posições na carteira
- Nível de diversificação
- Ativo com maior concentração

### Recomendações

Sugestões automáticas baseadas na análise:
- Diversificar entre mais ativos
- Evitar concentração acima de 20%
- Reduzir posição em ativos muito concentrados

## API Reference

### Obter Análise de Concentração

```
GET /api/portfolio/concentration/
```

**Resposta:**
```json
{
  "top_concentration": [
    {"ticker": "PETR4", "value": 25000.00, "percentage": 25.0},
    {"ticker": "VALE3", "value": 15000.00, "percentage": 15.0},
    {"ticker": "ITUB4", "value": 10000.00, "percentage": 10.0}
  ],
  "issuer_concentration": [
    {"issuer": "PETROBRAS", "value": 25000.00, "percentage": 25.0},
    {"issuer": "VALE", "value": 15000.00, "percentage": 15.0}
  ],
  "alerts": [
    {
      "type": "CONCENTRATION",
      "severity": "HIGH",
      "message": "Alta concentracao em PETR4"
    }
  ],
  "total_positions": 15,
  "diversified": false
}
```

## Boas Práticas

1. **Limite por ativo**: Não concentrar mais de 20% do patrimônio em um único ativo
2. **Diversificação setorial**: Evitar exposição excessiva a um único setor
3. **Revisão periódica**: Monitorar concentração mensalmente
4. **Rebalanceamento**: Manter alocação alinhada com objetivos