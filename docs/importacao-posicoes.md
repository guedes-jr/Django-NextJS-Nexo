# Importação de Posições (CSV/Excel)

## Descrição
Funcionalidade para importar posições de ativos financeiros via arquivos CSV ou Excel (XLSX).

## Funcionalidades

### 1. Upload de Arquivos
- Aceita arquivos `.csv` e `.xlsx`
- Drag & drop no frontend
- Limite de 10MB

### 2. Template para Download
- Templates em CSV e Excel
- Colunas: ticker, name, asset_type, quantity, average_price, current_price
- Exemplos pré-preenchidos

### 3. Preview de Dados
- Visualização das primeiras 20 linhas antes de confirmar
- Validação de dados
- Exibição de erros encontrados

### 4. Importação
- Criação automática de ativos (se não existirem)
- Criação/atualização de posições
- Reconciliação automática

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/portfolio/positions/import/` | Importar arquivo |
| GET | `/api/portfolio/positions/import/template/` | Download template |
| POST | `/api/portfolio/positions/import/preview/` | Preview do arquivo |

## Formato do Arquivo

### CSV
```csv
ticker,name,asset_type,quantity,average_price,current_price
PETR4,Petroleo Brasileiro,ACAO,100,35.50,42.30
ITUB4,Itau Unibanco,ACAO,200,28.00,32.50
BTC,Bitcoin,CRIPTO,0.5,180000.00,210000.00
```

### Tipos de Ativo Suportados
- `ACAO` - Ações
- `FII` - Fundos Imobiliários
- `ETF` - ETFs
- `CRIPTO` - Criptomoedas
- `RF` - Renda Fixa
- `TESOURO` - Tesouro Direto
- `FUNDO` - Fundos de Investimento
- `PREVIDENCIA` - Previdência Privada

## Tratamento de Erros

- Colunas obrigatórias: ticker, quantity, average_price, current_price
- Separação decimal: vírgula ou ponto
- Ticker em uppercase automático
- Criação de instituição "Importação Manual" padrão

---

**Retornar para:** [Documentação Principal](../README.md)