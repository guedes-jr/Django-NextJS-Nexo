# Notificações Avançadas

## Descrição
Central de notificações com múltiplos canais, tipos e configurações personalizadas.

## Tipos de Notificação

| Tipo | Ícone | Cor | Descrição |
|------|-------|-----|-----------|
| ALERT | 🔔 | Vermelho | Alertas importantes |
| INFO | ℹ️ | Azul | Informações gerais |
| SUCCESS | ✅ | Verde | Operações bem-sucedidas |
| WARNING | ⚠️ | Amarelo | Avisos e precauções |
| GOAL | 🎯 | Roxo | Metas e progresso |
| PRICE | 📈 | Ciano | Alertas de preço |
| MARKET | 📊 | Rosa | Notícias do mercado |

## Funcionalidades

### 1. Lista de Notificações
- Visualização de todas as notificações
- Indicador de não lidas
- Marcar como lida (click)
- Marcar todas como lidas

### 2. Filtros
- Por tipo de notificação
- Todas / Não lidas

### 3. Configurações
- Tipos de alerta:
  - Alertas de preço
  - Alertas de meta
  - Notícias do mercado
- Canais de envio:
  - Push notifications (navegador)
  - E-mail

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portfolio/notifications/` | Listar notificações |
| POST | `/api/portfolio/notifications/mark-read/` | Marcar como lida |

## Modelo

### Notification
```python
title            # Título da notificação
message          # Conteúdo
notification_type # Tipo (ALERT, INFO, etc)
is_read          # Status de leitura
link             # Link opcional (para navegar)
created_at       # Data de criação
```

---

**Retornar para:** [Documentação Principal](../README.md)