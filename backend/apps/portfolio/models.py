from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.utils import timezone

User = get_user_model()


class TaxReport(models.Model):
    TAX_TYPES = [
        ('IR', 'Imposto de Renda'),
        ('IOF', 'IOF'),
        ('CIDE', 'CIDE-Remuneração'),
    ]
    
    QUARTERS = [
        ('Q1', '1º Trimestre (Jan-Mar)'),
        ('Q2', '2º Trimestre (Abr-Jun)'),
        ('Q3', '3º Trimestre (Jul-Set)'),
        ('Q4', '4º Trimestre (Out-Dez)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tax_reports')
    year = models.IntegerField()
    quarter = models.CharField(max_length=2, choices=QUARTERS)
    tax_type = models.CharField(max_length=10, choices=TAX_TYPES, default='IR')
    
    total_gains = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_losses = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    net_gain = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    aliquot = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    tax_due = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    exempted_gains = models.DecimalField(max_digits=18, decimal_places=2, default=0, help_text="Ganhos isentos (ex: FII)")
    day_trade_gains = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=[
        ('CALCULATED', 'Calculado'),
        ('PAID', 'Pago'),
        ('OVERDUE', 'Vencido'),
    ], default='CALCULATED')
    
    darf_code = models.CharField(max_length=20, blank=True, help_text="Código DARF")
    darf_deadline = models.DateField(blank=True, null=True)
    darf_paid_date = models.DateField(null=True, blank=True)
    darf_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'year', 'quarter', 'tax_type')
        ordering = ['-year', '-quarter']
    
    def save(self, *args, **kwargs):
        if not self.darf_deadline:
            month_map = {'Q1': 3, 'Q2': 6, 'Q3': 9, 'Q4': 12}
            month = month_map.get(self.quarter)
            self.darf_deadline = timezone.datetime(self.year, month, 15).date()
        super().save(*args, **kwargs)
    
    def calculate_tax(self):
        if self.net_gain <= 0:
            self.tax_due = 0
            return
        
        taxable = max(self.net_gain - self.exempted_gains - self.day_trade_gains, 0)
        
        if taxable <= 0:
            self.tax_due = 0
        elif taxable <= 5000000:
            self.aliquot = 15
        else:
            self.aliquot = 20
        
        self.tax_due = (taxable * self.aliquot) / 100
    
    def __str__(self):
        return f"DARF {self.quarter}/{self.year} - {self.user.username}"


class Institution(models.Model):
    name = models.CharField(max_length=100)
    external_id = models.CharField(max_length=50, blank=True, null=True, help_text="Mapping ID for Open Finance")
    logo_url = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.name


class TaxLot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tax_lots')
    asset = models.ForeignKey('portfolio.Asset', on_delete=models.RESTRICT)
    
    acquisition_date = models.DateField()
    quantity = models.DecimalField(max_digits=18, decimal_places=6)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=18, decimal_places=2)
    
    transaction = models.ForeignKey('Transaction', on_delete=models.SET_NULL, null=True, blank=True, related_name='tax_lots')
    is_sold = models.BooleanField(default=False)
    sold_date = models.DateField(null=True, blank=True)
    sold_quantity = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    sold_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gain_loss = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    class Meta:
        ordering = ['acquisition_date']
    
    def calculate_gain(self, sale_price, sale_quantity, sale_date):
        if self.is_sold:
            return 0
        
        qty = min(sale_quantity, self.quantity)
        cost = (self.unit_cost * qty)
        proceeds = (sale_price * qty)
        
        self.gain_loss = proceeds - cost
        return self.gain_loss
    
    def __str__(self):
        return f"Lote {self.asset.ticker} - {self.acquisition_date}"


class Asset(models.Model):
    ASSET_TYPES = [
        ('ACAO', 'Ação (RV)'),
        ('FII', 'Fundo Imobiliário'),
        ('ETF', 'ETF'),
        ('RF', 'Renda Fixa'),
        ('TESOURO', 'Tesouro Direto'),
        ('CRIPTO', 'Criptomoeda'),
        ('FUNDO', 'Fundo de Investimento'),
        ('PREVIDENCIA', 'Previdência Privada'),
    ]
    ticker = models.CharField(max_length=20, unique=True, help_text="Ex: PETR4")
    name = models.CharField(max_length=100, help_text="Petroleo Brasileiro S.A.")
    asset_type = models.CharField(max_length=30, choices=ASSET_TYPES)
    sector = models.CharField(max_length=50, blank=True, null=True)
    is_international = models.BooleanField(default=False)
    currency = models.CharField(max_length=3, default='BRL')
    
    def __str__(self):
        return f"{self.ticker} - {self.name}"

class InvestmentAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investment_accounts')
    institution = models.ForeignKey(Institution, on_delete=models.RESTRICT)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    description = models.CharField(max_length=100, blank=True, help_text="Ex: Minha Conta XP")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'institution', 'account_number')

    def __str__(self):
        return f"{self.institution.name} ({self.user.username})"

class Position(models.Model):
    account = models.ForeignKey(InvestmentAccount, on_delete=models.CASCADE, related_name='positions')
    asset = models.ForeignKey(Asset, on_delete=models.RESTRICT)
    quantity = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    average_price = models.DecimalField("Preco Medio", max_digits=10, decimal_places=2, default=0)
    current_price = models.DecimalField("Preco Atual", max_digits=10, decimal_places=2, null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.asset.ticker} em {self.account.institution.name}"

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('COMPRA', 'Compra'),
        ('VENDA', 'Venda'),
        ('APORTE', 'Aporte'),
        ('RESGATE', 'Resgate'),
        ('DIVIDENDO', 'Dividendo/Juros'),
        ('AMORTIZACAO', 'Amortizacao'),
        ('TRANSFERENCIA', 'Transferencia'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(InvestmentAccount, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    asset = models.ForeignKey(Asset, on_delete=models.RESTRICT, null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_value = models.DecimalField(max_digits=18, decimal_places=2)
    transaction_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.user.username} - {self.transaction_date}"

class Goal(models.Model):
    GOAL_TYPES = [
        ('APOSENTADORIA', 'Aposentadoria'),
        ('IMOVEL', 'Compra de Imovel'),
        ('VIAGEM', 'Viagem'),
        ('EDUCACAO', 'Educacao'),
        ('EMERGENCIA', 'Reserva de Emergencia'),
        ('CRESCIMENTO', 'Crescimento Patrimonial'),
        ('OUTRO', 'Outro'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=100)
    goal_type = models.CharField(max_length=30, choices=GOAL_TYPES)
    target_amount = models.DecimalField(max_digits=18, decimal_places=2)
    current_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    target_date = models.DateField()
    monthly_contribution = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"

    @property
    def progress_percentage(self):
        if self.target_amount > 0:
            return min((self.current_amount / self.target_amount) * 100, 100)
        return 0

    @property
    def remaining_amount(self):
        return max(self.target_amount - self.current_amount, 0)

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('ALERT', 'Alerta'),
        ('INFO', 'Informacao'),
        ('WARNING', 'Aviso'),
        ('SUCCESS', 'Sucesso'),
        ('REGULATORY', 'Aviso Regulatório'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='INFO')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=200, blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class ReconciliationIssue(models.Model):
    TYPES = [
        ('ORPHAN_POSITION', 'Posição órfã'),
        ('MISSING_PRICE', 'Preço faltando'),
        ('NEGATIVE_QUANTITY', 'Quantidade negativa'),
        ('DUPLICATE_POSITION', 'Posição duplicada'),
        ('MISSING_ASSET', 'Ativo não encontrado'),
        ('PRICE_MISMATCH', 'Divergência de preço'),
    ]

    STATUS = [
        ('PENDING', 'Pendente'),
        ('IGNORED', 'Ignorado'),
        ('RESOLVED', 'Resolvido'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reconciliation_issues')
    issue_type = models.CharField(max_length=30, choices=TYPES)
    description = models.TextField()
    related_data = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.issue_type} - {self.user.username}"

class CorporateAction(models.Model):
    ACTION_TYPES = [
        ('DIVIDENDO', 'Dividendo / JCP'),
        ('DESDOBRAMENTO', 'Desdobramento (Split)'),
        ('GRUPAMENTO', 'Grupamento (Reverse Split)'),
        ('BONIFICACAO', 'Bonificação'),
        ('AMORTIZACAO', 'Amortização'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pendente'),
        ('APPLIED', 'Aplicado'),
        ('CANCELLED', 'Cancelado'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='corporate_actions')
    asset = models.ForeignKey(Asset, on_delete=models.RESTRICT, related_name='corporate_actions')
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    date = models.DateField()
    ratio = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True, help_text="Ex: 2 para desdobramento 1:2. 0.5 para grupamento 2:1")
    amount_per_share = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.action_type} - {self.asset.ticker} - {self.date}"


class PortfolioSnapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_snapshots')
    date = models.DateField(help_text="Data do snapshot")
    total_value = models.DecimalField(max_digits=18, decimal_places=2, help_text="Valor total do portfólio")
    cash_value = models.DecimalField(max_digits=18, decimal_places=2, default=0, help_text="Valor em caixa")
    position_value = models.DecimalField(max_digits=18, decimal_places=2, default=0, help_text="Valor em posições")
    variation = models.DecimalField(max_digits=18, decimal_places=2, default=0, help_text="Variação do período")
    variation_percent = models.DecimalField(max_digits=10, decimal_places=4, default=0, help_text="Variação percentual")
    allocation = models.JSONField(default=dict, help_text="Alocação por classe de ativo")
    positions_count = models.IntegerField(default=0, help_text="Número de posições")
    accounts_count = models.IntegerField(default=0, help_text="Número de contas")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ('user', 'date')
    
    def __str__(self):
        return f"{self.user.username} - {self.date} - R$ {self.total_value}"


class BrokerConnection(models.Model):
    PROVIDERS = [
        ('OPEN_FINANCE', 'Open Finance Brasil'),
        ('BELVO', 'Belvo'),
        ('PLAID', 'Plaid'),
        ('MOCK', 'Mock Provider'),
    ]
    
    STATUS = [
        ('CONNECTED', 'Conectado'),
        ('DISCONNECTED', 'Desconectado'),
        ('ERROR', 'Erro'),
        ('PENDING', 'Pendente'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='broker_connections')
    provider = models.CharField(max_length=20, choices=PROVIDERS)
    institution = models.ForeignKey(Institution, on_delete=models.SET_NULL, null=True, blank=True)
    external_account_id = models.CharField(max_length=100, blank=True)
    access_token = models.CharField(max_length=500, blank=True)
    refresh_token = models.CharField(max_length=500, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    last_sync = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=20, choices=[
        ('IDLE', 'Aguardando'),
        ('SYNCING', 'Sincronizando'),
        ('SUCCESS', 'Sucesso'),
        ('FAILED', 'Falhou'),
    ], default='IDLE')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'provider', 'institution')
    
    def __str__(self):
        return f"{self.user.username} - {self.provider}"


class DataImport(models.Model):
    IMPORT_TYPES = [
        ('POSITIONS', 'Posições'),
        ('TRANSACTIONS', 'Transações'),
        ('HISTORIC', 'Histórico'),
        ('DIVIDENDS', 'Dividendos'),
    ]
    
    STATUS = [
        ('PENDING', 'Pendente'),
        ('PROCESSING', 'Processando'),
        ('COMPLETED', 'Completo'),
        ('FAILED', 'Falhou'),
        ('PARTIAL', 'Parcial'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_imports')
    connection = models.ForeignKey(BrokerConnection, on_delete=models.CASCADE, related_name='imports')
    import_type = models.CharField(max_length=20, choices=IMPORT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING')
    imported_count = models.IntegerField(default=0)
    rejected_count = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_log = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.import_type} - {self.user.username} ({self.status})"


class WebhookEvent(models.Model):
    EVENT_TYPES = [
        ('ACCOUNT_UPDATE', 'Atualização de Conta'),
        ('POSITION_UPDATE', 'Atualização de Posição'),
        ('TRANSACTION', 'Nova Transação'),
        ('DIVIDEND', 'Dividendo'),
    ]
    
    provider = models.CharField(max_length=20)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    external_id = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('provider', 'external_id')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event_type} - {self.external_id}"

