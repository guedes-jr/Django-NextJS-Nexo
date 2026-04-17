# Auditoria e Segurança

## Visão Geral

Sistema completo de trilha de auditoria para compliance e segurança, com logging de todas as ações realizadas no sistema.

---

## Trilha de Auditoria

### Modelo de Dados

O modelo `AuditLog` registra:

- **Usuário**: Username e ID
- **Ação**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, IMPORT, EXPORT, VIEW, APPROVE, REJECT
- **Recurso**: Model afetado (User, Position, Transaction, etc)
- **Valores**: old_values e new_values
- **IP**: Endereço IP do cliente
- **User Agent**: Browser/App do cliente
- **Endpoint**: URL acessada
- **Status**: SUCCESS ou FAILURE
- **Timestamp**: Data/hora da ação

### APIs

| Endpoint | Descrição |
|---------|-----------|
| `GET /api/audit/` | Lista todos os logs (admin) |
| `GET /api/audit/<id>/` | Detalhe de um log |
| `GET /api/audit/user/<user_id>/` | Atividade de um usuário |

### Filtros disponíveis

- `action` - Tipo de ação
- `resource` - Recurso/model
- `user_id` - Usuário específico
- `status` - SUCCESS/FAILURE

---

## Auditoria de Login

### Login

O login é automaticamente registrado:
- **Endpoint**: `/api/auth/token/`
- **Dados**: IP, User Agent, Timestamp

### Logout

O logout é automaticamente registrado:
- **Endpoint**: `/api/auth/logout/`
- **Dados**: IP, Timestamp

---

## Interface Admin

Acesse em `/admin/auditoria` para visualizar os logs.

### Funcionalidades

- Lista paginada de logs
- Filtros por ação, recurso, usuário
- Cores por tipo de ação
- Status de sucesso/falha