# Conexão de Corretoras

## Descrição
Sistema para conectar corretoras de valores mobiliários via Open Finance Brasil, permitindo sincronização automática de posições e transações.

## Funcionalidades

### 1. Adicionar Corretora
- Modal com lista de corretoras disponíveis:
  - XP Investimentos
  - Clear Corretora
  - B3 Direct
  - Rico Corretora
  - ModalMais
  - Nubank
  - Banco Inter
  - Citi
  - UBS
- Em produção: redirecionamento para login da corretora

### 2. Status de Conexão
- `PENDING` - Aguardando conexão
- `CONNECTED` - Conectado
- `ERROR` - Erro na conexão
- `DISABLED` - Desativado

### 3. Sincronização
- Botão para sincronização manual
- Histórico de sincronizações
- Contador de posições e transações sincronizadas

### 4. Gestão
- Remover conexão
- Visualizar logs de sincronização

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/automations/brokers/` | Listar conexões |
| POST | `/api/automations/brokers/` | Criar conexão |
| DELETE | `/api/automations/brokers/{id}/` | Remover conexão |
| POST | `/api/automations/brokers/{id}/sync/` | Sincronizar |
| GET | `/api/automations/brokers/{id}/sync/` | Ver logs |

## Modelo

### BrokerConnection
```python
broker_name      # Nome da corretora
broker_code      # Código (XP, CLEAR, etc)
account_number   # Número da conta
status           # Status da conexão
api_key          # Chave API (criptografada)
last_sync        # Última sincronização
```

### SyncLog
```python
connection       # FK para BrokerConnection
status           # SUCCESS, ERROR
positions_synced # Qtd posições sincronizadas
transactions_synced # Qtd transações
error_message    # Mensagem de erro (se aplicável)
```

## Mock de Sincronização

A sincronização atual é um mock que:
- Cria logs de sucesso automaticamente
- Atualiza last_sync
- Simula 5 posições e 10 transações

---

**Retornar para:** [Documentação Principal](../README.md)