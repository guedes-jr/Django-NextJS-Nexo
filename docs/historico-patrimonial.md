# Evolução Patrimonial (Snapshots)

## Visão Geral

A funcionalidade de Snapshots permite ao usuário acompanhar a evolução do patrimônio ao longo do tempo, através de registros diários do valor total da carteira.

## Funcionalidades

### Geração de Snapshot

O usuário pode gerar um snapshot manualmente a qualquer momento, ou o sistema pode criar automaticamente (via tarefas Celery).

**Dados registrados em cada snapshot:**
- Data do snapshot
- Valor total do portfólio
- Valor em posições (ações, FIIs, etc.)
- Valor em caixa
- Variação do período
- Alocação por classe de ativo (JSON)
- Número de posições
- Número de contas

### Visualização da Evolução

#### Gráfico de Evolução
Representação visual do patrimônio ao longo do tempo com barras proporcionais

#### Timeline
Lista cronológica de snapshots com:
- Data
- Valor total
- Variação em relação ao snapshot anterior
- Barra de alocação por tipo de ativo

#### Estatísticas
- Patrimônio atual
- Variação do período (mais recente vs anterior)
- Variação total (primeiro vs último snapshot)

## API Reference

### Listar Snapshots

```
GET /api/portfolio/snapshots/
```

**Resposta:**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "total_value": 55000.00,
    "cash_value": 5000.00,
    "position_value": 50000.00,
    "variation": 1000.00,
    "variation_percent": 1.85,
    "allocation": {
      "ACAO": 30000.00,
      "FII": 15000.00,
      "RF": 5000.00
    },
    "positions_count": 12,
    "accounts_count": 2
  }
]
```

### Gerar Novo Snapshot

```
POST /api/portfolio/snapshots/generate/
```

**Resposta:**
```json
{
  "message": "Snapshot gerado com sucesso",
  "snapshot_id": 5,
  "total_value": 55000.00,
  "created": true
}
```

### Detalhar Snapshot

```
GET /api/portfolio/snapshots/{id}/
```

### Deletar Snapshot

```
DELETE /api/portfolio/snapshots/{id}/
```

## Tarefas Automáticas

### Reconciliação Diária
Job Celery que executa `run_portfolio_reconciliation` diariamente, incluindo geração de snapshots.

### Limpeza de Old Issues
Job semanal `cleanup_old_reconciliation_issues` para limpar issues antigos.

## Uso

1. Acesse a página `/historico`
2. Clique em "Gerar Snapshot" para criar um registro do dia atual
3. Acompanhe a evolução através do gráfico e timeline
4. Compare variações entre períodos diferentes