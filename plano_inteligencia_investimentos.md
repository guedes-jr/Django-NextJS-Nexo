# Plano de Implementação — Inteligência de Investimentos

## Visão Geral

Este documento detalha o planejamento para implementar duas funcionalidades chave de inteligência de investimentos:

1. **Ranking de Ações** — Sistema de screening e recomendação estilo Bazin/Graham
2. **Projeção de Ganhos** — Projeção de rentabilidade curto e longo prazo

**Meta:** Tornar a plataforma verdadeiramente "inteligente", indo além de consolidação e mostrando valor analítico real.

---

## 1. Ranking de Ações (Estilo Bazin/Graham)

### 1.1 O que é

Um sistema de screening que avalia ações brasileiras (e internacionais) segundo critérios fundamentalistas, classificando-as por atratividade de investimento.

Inspirado na metodologia de:
- **Guustav Bazin** — Dividend Yield alto e sustentável
- **Benjamin Graham** — Valuation adequado, margem de segurança
- **Peter Lynch** — Crescimento a preço razoável (GARP)

### 1.2 Critérios de Avaliação

| Indicador | Descrição | Peso | Threshold |
|----------|----------|------|-----------|
| Dividend Yield | Rendimento de dividendos | 20% | > 6% |
| P/L (Price/Earnings) | Preço/Lucro | 15% | < 15 |
| P/VP (Price/Book Value) | Preço/Valor Patrimonial | 15% | < 1.5 |
| EV/EBITDA | Enterprise Value/EBITDA | 10% | < 8 |
| ROE | Retorno sobre patrimônio | 15% | > 15% |
| Dívida/EBITDA | Alavancagem | 10% | < 3.0 |
| Crescimento Lucro (5a) | Crescimento médio anual | 10% | > 5% |
| Margem Líquida | Profitabilidade | 5% | > 10% |

### 1.3 Score e Classificação

```
Score = Σ(critério × peso)
```

| Classificação | Score | Sinal |
|--------------|-------|-------|
| ⭐ **Excelente** | 80-100 | Compra forte |
| ✅ **Bom** | 60-79 | Compra |
| ⚠️ **Neutro** | 40-59 | Manter/Aguardar |
| ❌ **Ruim** | 20-39 | Vender |
| 🚫 **Muito Ruim** | 0-19 | Evitar |

### 1.4 Funcionalidades

#### Módulo de Screening
- [ ] Tela de screening com filtros
- [ ] Campo de busca por ticker/nome
- [ ] Filtros por: setor, faixa de DY, faixa de P/L, faixa de ROE
- [ ] Ordenação por qualquer indicador
- [ ] Lista de favoritos/seguindo

#### Lista de Recomendação
- [ ] Top 10 ações por classificação
- [ ] Lista "Na Esteira Bazin" (DY alto)
- [ ] Lista "Magnata Graham" (valuation baixo)
- [ ] Lista "Crescimento" (GARP)
- [ ] Atualização diária automática

#### Détalhes do Ativo
- [ ] Página de detalhes com score
- [ ] Gráfico radar de indicadores
- [ ] Histórico de score
- [ ] Comparativo com setor
- [ ] Alertas por mudança de classificação

---

## 2. Análise de Carteira

### 2.1 Análise de Composição

- [ ] Breakdown por setor (setor econômico)
- [ ] Breakdown por estilo (value, growth, blend)
- [ ] Breakdown por região (BR, US, Global)
- [ ] Breakdown por moeda (BRL, USD, outras)
- [ ] Concentração por ativo (top holdings)
- [ ] Alocação vs. target ideal

### 2.2 Métricas de Carteira

| Métrica | Descrição |
|---------|-----------|
| Patrimônio Total | Soma de todos os ativos |
| Variação Dia | Ganho/perda do dia |
| Variação Mês | Ganzo/perda no mês |
| Variação Ano | Ganho/perda no ano |
| Variação Acumulada | Ganho/perda total |
| Yield Médio | Dividend yield médio da carteira |
| P/L Médio | Preço/lucro médio |
| ROE Médio | Retorno médio |

### 2.3 Score de Carteira

- [ ] Score geral (0-100)
- [ ] Score diversificação
- [ ] Score rendimento
- [ ] Score risco
- [ ] Alertas (concentração, desvio, risco)

---

## 3. Projeção de Ganhos

### 3.1 Projeção Curto Prazo (1-12 meses)

| Cenário | Probabilidade | Premissa |
|---------|---------------|----------|
| Bullish | 25% | +20% ao ano |
| Neutro | 50% | +8% ao ano |
| Bearish | 25% | -10% ao ano |

**Método:** Simulação de Monte Carlo com 10.000 cenários

### 3.2 Projeção Longo Prazo (1-30 anos)

| Cenário | Descrição | Retorno Anual |
|--------|----------|-------------|
| Otimista | Crescimento alto | +15% |
| Base | Média histórica | +10% |
| Conservador | Crescimento modesto | +6% |
| Pessimista | Recessão | +2% |

**Cálculo:**
```
Valor Futuro = Valor Atual × (1 + r)^n
```

Onde:
- `r` = taxa de retorno anual
- `n` = número de anos

### 3.3 Cenários Personalizáveis

- [ ] Ajustar taxa de contribuição mensal
- [ ] Ajustar taxa de retorno esperada
- [ ] Incluir/excluir aportes
- [ ] Simular resgate parcial
- [ ] Simular taxes (IR, come-cotas)

### 3.4 Visualização

- [ ] Gráfico de evolução patrimonial
- [ ] Intervalo de confiança (5%-95%)
- [ ] Tabela de milestones
- [ ] Comparar com metas existentes

---

## 4. Stack Técnica

### 4.1 Backend (Django)

Novos endpoints:
```
GET  /api/v1/screening/
GET  /api/v1/screening/{ticker}/
GET  /api/v1/ranking/
GET  /api/v1/carteira/analise/
GET  /api/v1/carteira/score/
GET  /api/v1/projecao/curto-prazo/
GET  /api/v1/projecao/longo-prazo/
POST /api/v1/projecao/simular/
```

### 4.2 Modelos (novos)

```python
# screening/models.py
class AcaoScore(models.Model):
    ticker = models.CharField(max_length=10)
    data = models.DateField()
    dividend_yield = models.DecimalField(...)
    pe_ratio = models.DecimalField(...)
    pb_ratio = models.DecimalField(...)
    ev_ebitda = models.DecimalField(...)
    roe = models.DecimalField(...)
    divida_ebitda = models.DecimalField(...)
    crescimento_lucro = models.DecimalField(...)
    margem_liquida = models.DecimalField(...)
    score_total = models.IntegerField()
    classificacao = models.CharField(...)

class Projecao(models.Model):
    usuario = models.ForeignKey(User)
    valor_inicial = models.DecimalField(...)
    aporte_mensal = models.DecimalField(...)
    taxa_retorno = models.DecimalField(...)
    horizonte = models.IntegerField()  # meses
    cenarios = models.JSONField(...)  # resultados
    criado_em = models.DateTimeField()
```

### 4.3 Tasks (Celery)

- [ ] Diária: atualizar scores de todas ações
- [ ] Semanal: run screening completo
- [ ] Mensal: projections recalc

### 4.4 Fontes de Dados

| Dado | Fonte |
|------|-------|
| Indicadores fundamentals | Twelve Data / Alpha Vantage |
| Quotes | Yahoo Finance (free) |
| Dividendos | B3 / provedor |

---

## 5. Roadmap de Implementação

### Fase A — Base de Dados (Semana 1-2)

- [ ] Criar modelos `Acao`, `AcaoScore`
- [ ] Criar modelo `Projecao`
- [ ] Criar endpoint de quotes (Yahoo Finance)
- [ ] Criar task de fetch de dados diarios

### Fase B — Screening (Semana 3-4)

- [ ] Implementar cálculo de score
- [ ] Criar endpoint `/api/v1/screening/`
- [ ] Implementar filtros e ordenação
- [ ] Criar task de update diário

### Fase C — Ranking (Semana 5)

- [ ] Criar endpoint `/api/v1/ranking/`
- [ ] Implementar listas (Bazin, Graham, GARP)
- [ ] Criar página de detalhes

### Fase D — Análise de Carteira (Semana 6)

- [ ] Endpoint de análise completa
- [ ] Calcular métricas agregadas
- [ ] Score de carteira
- [ ] Breakdown por dimensão

### Fase E — Projeção (Semana 7-8)

- [ ] Algoritmo de Monte Carlo
- [ ] Projeção curto prazo
- [ ] Projeção longo prazo
- [ ] Cenários customizáveis
- [ ] Visualização em gráficos

### Fase F — UI/UX (Semana 9-10)

- [ ] Tela de screening
- [ ] Tela de ranking
- [ ] Tela de análise de carteira
- [ ] Tela de projeção
- [ ] Integração com dashboard

---

## 6.prioridades de Implementação

### Prioridade 1 (MVP)
1. Modelos de dados
2. Fetch de quotes
3. Cálculo de score
4. Ranking básico
5. Projeção simples (longo prazo)

### Prioridade 2 (Produto Completo)
1. Screening com filtros
2. Listas organizadas
3. Análise de carteira
4. Projeção com Monte Carlo

### Prioridade 3 (Premium)
1. Comparativo com benchmarks
2. Alertas por mudança
3. Histórico de scores
4. Simulador "e se..."

---

## 7. Dependencies

- `yfinance` — quotes free
- `numpy` / `scipy` — cálculos estatísticos
- `celery` — tarefas diarias
- `redis` — cache de quotes

---

## 8. Success Metrics

| Métrica | Meta |
|--------|-----|
| Usuários que usam screening | > 50% |
| Usuários que fazem projeção | > 30% |
| Acurácia de projeção (1 ano) | ±20% |
| Tempo de resposta APIs | < 500ms |

---

## Próximos Passos

1. ✅ Planejar funcionalidades — este documento
2. [ ] Criar modelos no Django
3. [ ] Implementar fetch de dados
4. [ ] Implementar cálculo de score
5. [ ] Criar screening UI
6. [ ] Implementar projeção
7. [ ] Criar projeção UI

---

## Referências

- Bazin, Guustav — "Investimento Absurdo"
- Graham, Benjamin — "Intelligent Investor"
- Lynch, Peter — "One Up on Wall Street"
- Damodaran, Aswath — Valuation data