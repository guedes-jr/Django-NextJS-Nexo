from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Institution(models.Model):
    name = models.CharField(max_length=100)
    external_id = models.CharField(max_length=50, blank=True, null=True, help_text="Mapping ID for Open Finance")
    logo_url = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.name

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

