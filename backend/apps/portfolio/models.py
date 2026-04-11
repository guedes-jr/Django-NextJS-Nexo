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
        ('RF', 'Renda Fixa'),
        ('TESOURO', 'Tesouro Direto'),
        ('CRIPTO', 'Criptomoeda'),
        ('FUNDO', 'Fundo de Investimento'),
    ]
    ticker = models.CharField(max_length=20, unique=True, help_text="Ex: PETR4")
    name = models.CharField(max_length=100, help_text="Petróleo Brasileiro S.A.")
    asset_type = models.CharField(max_length=30, choices=ASSET_TYPES)
    sector = models.CharField(max_length=50, blank=True, null=True)
    
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
    average_price = models.DecimalField("Preço Médio", max_digits=10, decimal_places=2, default=0)
    current_price = models.DecimalField("Preço Atual", max_digits=10, decimal_places=2, null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.asset.ticker} em {self.account.institution.name}"
