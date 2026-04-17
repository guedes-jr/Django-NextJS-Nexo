# Integração com Provedores Externos

## Visão Geral

Módulo para integração com provedores externos de dados financeiros (Open Finance, Belvo, Plaid).

---

## Modelos de Dados

### BrokerConnection

Conexão com um provedor:

```python
class BrokerConnection(models.Model):
    provider = models.CharField()  # OPEN_FINANCE, BELVO, PLAID, MOCK
    institution = models.ForeignKey(Institution)
    access_token = models.CharField()
    refresh_token = models.CharField()
    token_expires_at = models.DateTimeField()
    status = models.CharField()  # CONNECTED, DISCONNECTED, ERROR, PENDING
    sync_status = models.CharField()  # IDLE, SYNCING, SUCCESS, FAILED
    last_sync = models.DateTimeField()
```

### DataImport

Registro de importações:

```python
class DataImport(models.Model):
    import_type = models.CharField()  # POSITIONS, TRANSACTIONS, DIVIDENDS
    status = models.CharField()  # PENDING, PROCESSING, COMPLETED, FAILED
    imported_count = models.IntegerField()
    rejected_count = models.IntegerField()
```

---

## APIs

### Listar Conexões

```http
GET /api/portfolio/integrations/connections/
Authorization: Bearer <token>
```

### Criar Conexão

```http
POST /api/portfolio/integrations/connect/
Authorization: Bearer <token>

{
  "provider": "MOCK",
  "institution_id": 1
}
```

### Importar Dados

```http
POST /api/portfolio/integrations/import/
Authorization: Bearer <token>

{
  "connection_id": 1,
  "import_type": "POSITIONS"
}
```

### Sincronizar

```http
POST /api/portfolio/integrations/sync/
Authorization: Bearer <token>

{
  "connection_id": 1
}
```

### Receber Webhook

```http
POST /api/portfolio/integrations/webhook/
{
  "provider": "MOCK",
  "event_type": "POSITION_UPDATE",
  "external_id": "123",
  "payload": {}
}
```

---

## Provedores Suportados

### Mock Provider

Provider de teste que simula dados.

### Open Finance (Futuro)

Integração com Open Finance Brasil.

### Belvo (Futuro)

Integração com Belvo.

### Plaid (Futuro)

Integração com Plaid.