# Reconciliação Automática

## Descrição
Sistema automatizado de verificação e correção de inconsistências na carteira de investimentos usando Celery.

## Funcionalidades

### 1. Detecção de Issues
- Quantidade negativa
- Preço faltando
- Posição duplicada
- Posição órfã (sem ativo)
- Ativo não encontrado

### 2. Tasks Celery

| Task | Frequência | Descrição |
|------|------------|-----------|
| `run_portfolio_reconciliation` | 6h | Verifica inconsistências |
| `auto_resolve_issues` | 1h | Tenta resolver automaticamente |
| `cleanup_old_reconciliation_issues` | Semanal | Remove issues >90 dias |
| `check_orphan_positions` | Sob demanda | Verifica posições órfãs |

### 3. Auto-resolução
- Preço faltando → usa preço médio
- Quantidade negativa → converte para positivo

### 4. Interface Admin
- Lista de issues pendentes
- Resolver manualmente
- Ignorar issue
- Executar reconciliação manualmente

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portfolio/reconciliation/` | Listar issues |
| POST | `/api/portfolio/reconciliation/{id}/` | Resolver/ignorar |
| POST | `/api/portfolio/reconciliation/run/` | Executar reconciliação |

## Modelo

### ReconciliationIssue
```python
issue_type       # ORPHAN_POSITION, MISSING_PRICE, etc
description      # Descrição do problema
related_data    # Dados JSON relacionados
status          # PENDING, RESOLVED, IGNORED
resolved_at      # Data de resolução
```

---

**Retornar para:** [Documentação Principal](../README.md)