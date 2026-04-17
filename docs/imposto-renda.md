# Cálculo de Imposto de Renda e Geração de DARF

## Visão Geral

Módulo de cálculo automático de IR sobre ganhos de capital nas alienações de ativos financeiros, com geração de DARF para recolhimento trimestral.

---

## Base de Cálculo

### Tipos de Operação

| Tipo | Alíquota | Base de Cálculo |
|------|---------|----------------|
| Swing Trade (15%) | 15% | Ganho líquido até R$ 5M |
| Swing Trade (20%) | 20% | Ganho líquido acima de R$ 5M |
| Day Trade | 20% | Ganho líquido no mesmo dia |
| FII/ETF | Isento | Ganhos de fundos imobiliários |
| Dividendos | Isento | JCP, dividendos |

### Regras Vigentes (2025)

- **Ganho Bruto** = Preço de Venda - Custos de Aquisição
- **Período de Apropriação** = FIFO (First In, First Out)
- **Isenção** = R$ 20.000/mês para pessoa física (day trade)

---

## Modelos de Dados

### TaxReport

```python
class TaxReport(models.Model):
    year = models.IntegerField()           # Ano base
    quarter = models.CharField()            # Q1, Q2, Q3, Q4
    total_gains = DecimalField()          # Ganhos realizados
    total_losses = DecimalField()        # Perdas realizadas
    net_gain = DecimalField()            # Ganho líquido
    exempted_gains = DecimalField()      #_isentos (FII/ETF)
    day_trade_gains = DecimalField()    # Day trade taxado 20%
    aliquot = DecimalField()           # 15% ou 20%
    tax_due = DecimalField()           # IR a recolher
    darf_code = models.CharField()       # 6015 (DARF-IR)
    darf_deadline = models.DateField() # Vencimento
```

### TaxLot

```python
class TaxLot(models.Model):
    user = ForeignKey(User)
    asset = ForeignKey(Asset)
    acquisition_date = DateField()
    quantity = DecimalField()
    unit_cost = DecimalField()
    is_sold = BooleanField()
    gain_loss = DecimalField()
```

---

## APIs

### Calcular IR do Trimestre

```http
POST /api/portfolio/tax/calculate/
Authorization: Bearer <token>

{
  "year": 2025,
  "quarter": "Q4"
}
```

**Response:**
```json
{
  "id": 1,
  "year": 2025,
  "quarter": "Q4",
  "total_gains": 15000.00,
  "total_losses": 2000.00,
  "net_gain": 13000.00,
  "exempted_gains": 3000.00,
  "day_trade_gains": 0.00,
  "aliquot": 15,
  "tax_due": 1500.00,
  "darf_code": "6015",
  "darf_deadline": "2025-12-15",
  "status": "CALCULATED"
}
```

### Listar Relatórios

```http
GET /api/portfolio/tax/calculate/?year=2025
Authorization: Bearer <token>
```

### Gerar DARF

```http
POST /api/portfolio/tax/darf/
Authorization: Bearer <token>

{
  "report_id": 1
}
```

**Response:**
```json
{
  "message": "DARF gerado",
  "darf_code": "6015",
  "darf_value": 1500.00,
  "deadline": "2025-12-15",
  "reference": "2025Q4"
}
```

### Registrar Pagamento

```http
POST /api/portfolio/tax/darf/pay/
Authorization: Bearer <token>

{
  "report_id": 1,
  "paid_date": "2025-12-10",
  "paid_value": 1500.00
}
```

### Listar Lotes Fiscais

```http
GET /api/portfolio/tax/lots/?ticker=PETR4
Authorization: Bearer <token>
```

---

## Fluxo de Uso

### 1. Calcular IR Trimestral

```bash
curl -X POST http://localhost:8001/api/portfolio/tax/calculate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2025, "quarter": "Q4"}'
```

### 2. Verificar Valor

```json
{
  "tax_due": 1500.00,
  "darf_deadline": "2025-12-15"
}
```

### 3. Gerar DARF

```bash
curl -X POST http://localhost:8001/api/portfolio/tax/darf/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"report_id": 1}'
```

### 4. Pagar via Guia DARF

O código **6015** deve ser utilizado em:

- Internet Banking (Banco do Brasil, Itaú, etc)
- App da Receita (Receita Federal)
- Lotéricas

---

## Vencimentos DARF

| Trimestre | Meses | Vencimento |
|----------|------|----------|
| Q1 | Jan-Mar | 15/Abr |
| Q2 | Abr-Jun | 15/Jul |
| Q3 | Jul-Set | 15/Out |
| Q4 | Out-Dez | 15/Dez |

---

## Observações

1. **FII/ETF** = Isentos de IR (porém sujeitos a come-cotas)
2. **Day Trade** = Não tem isenção mensal
3. **Perdas** = Podem ser compensadas em trimestres futuros
4. **Previdência PGBL** = Deduzir até 12% do IR devido

---

## Referências

- [Receita Federal - DARF](https://www.gov.br/receitafederal)
- [Lei 13.586/2017](http://www.planalto.gov.br/ccivil_03/_Ato2015-2018/2017/Lei/L13586.htm)