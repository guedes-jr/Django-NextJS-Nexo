# Ferramentas de Desenvolvimento (Dev Tools)

## Visão Geral

Conjunto de ferramentas para facilitar o desenvolvimento, debug e acompanhamento em tempo real da aplicação.

---

## 1. WebShell

Terminal web integrado para execução de comandos shell.

### Endpoint
```
GET/POST /api/monitor/shell/
```

### Acessível em
```
/admin/webshell
```

### Comandos Disponíveis
- `ls`, `pwd`, `cd`, `cat`, `whoami`, `ps`, `date`, `uptime`
- `python`, `python3`, `pip`, `npm`, `node`, `git`
- `manage.py <comando>` - Comandos Django
- `help` - Lista de comandos
- `clear` - Limpar terminal

---

## 2. DBShell

Consulta SQL direta via interface web.

### Endpoint
```
GET/POST /api/monitor/db/
```

### Acessível em
```
/admin/dbshell
```

### Funcionalidades
- Consulta SQL direta
- Histórico de queries
- Export JSON/CSV
- Tempo de execução
- Proteção contra comandos perigosos

### Exemplo de Queries
```sql
SELECT * FROM identity_customuser LIMIT 10
SELECT ticker, name FROM portfolio_asset
SELECT COUNT(*) FROM portfolio_position
```

---

## 3. Monitor em Tempo Real

Logs de aplicação em streaming.

### Endpoints
```
GET /api/monitor/logs/
POST /api/monitor/logs/create/
```

### Acessível em
```
/admin/logs
```

### Funcionalidades
- Logs em tempo real (auto-refresh 3s)
- Filtros por nível: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Busca em mensagens
- Download de logs
- Cores por nível

---

## 4. Cache Manager

Gerenciamento de cache da aplicação.

### Endpoint
```
GET/POST /api/monitor/cache/
```

### Acessível em
```
/admin/cache
```

### Funcionalidades
- Listar todas as chaves em cache
- Expirar chaves específicas
- Definir TTL manual
- Limpar todo o cache

---

## 5. Task Monitor

Monitoramento de tasks Celery.

### Endpoints
```
GET /api/monitor/jobs/
POST /api/monitor/jobs/trigger/
```

### Acessível em
```
/admin/tasks
```

### Jobs Disponíveis
- `update_b3_prices` - Atualizar Preços B3
- `update_b3_indices` - Atualizar Índices B3
- `update_all_market_data` - Atualizar Dados de Mercado
- `run_portfolio_reconciliation` - Reconciliar Carteira
- `auto_resolve_issues` - Resolver Issues Automático
- `cleanup_old_reconciliation_issues` - Limpar Issues Antigos

---

## 6. Config Editor

Gerenciamento de feature flags e configurações.

### Endpoints
```
GET/POST /api/monitor/config/
GET /api/monitor/config/<id>/history/
```

### Acessível em
```
/admin/config
```

### Funcionalidades
- Criar feature flags
- Editar valores (JSON)
- Ativar/desativar flags
- Histórico de alterações (rollback)
- Flags globais

---

## Resumo das URLs

| Ferramenta | URL |
|------------|-----|
| WebShell | `/admin/webshell` |
| DBShell | `/admin/dbshell` |
| Logs | `/admin/logs` |
| Cache | `/admin/cache` |
| Tasks | `/admin/tasks` |
| Config | `/admin/config` |