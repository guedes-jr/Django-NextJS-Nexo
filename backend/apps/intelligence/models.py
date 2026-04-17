from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class StockScore(models.Model):
    CLASSIFICATION_CHOICES = [
        ('EXCELENTE', 'Excelente'),
        ('BOM', 'Bom'),
        ('NEUTRO', 'Neutro'),
        ('RUIM', 'Ruim'),
        ('MUITO_RUIM', 'Muito Ruim'),
    ]

    ticker = models.CharField(max_length=10, db_index=True)
    date = models.DateField(db_index=True)

    dividend_yield = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    pe_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pb_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ev_ebitda = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    roe = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    divida_ebitda = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    crescimento_lucro = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    margem_liquida = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    crescimento_receita = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    score_dy = models.IntegerField(null=True, blank=True)
    score_pe = models.IntegerField(null=True, blank=True)
    score_pb = models.IntegerField(null=True, blank=True)
    score_roe = models.IntegerField(null=True, blank=True)
    score_divida = models.IntegerField(null=True, blank=True)
    score_crescimento = models.IntegerField(null=True, blank=True)

    score_total = models.IntegerField()
    classificacao = models.CharField(max_length=20, choices=CLASSIFICATION_CHOICES)

    price = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    market_cap = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-score_total']
        indexes = [
            models.Index(fields=['ticker', '-date']),
            models.Index(fields=['classificacao', '-date']),
            models.Index(fields=['score_total', '-date']),
        ]
        unique_together = ['ticker', 'date']

    def __str__(self):
        return f"{self.ticker} - {self.date} - Score: {self.score_total}"


class Watchlist(models.Model):
    LIST_TYPE_CHOICES = [
        ('FAVORITOS', 'Favoritos'),
        ('BAZIN', 'Na Esteira Bazin'),
        ('GRAHAM', 'Magnata Graham'),
        ('GARP', 'Crescimento'),
        ('CUSTOM', 'Personalizada'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlists')
    name = models.CharField(max_length=100)
    list_type = models.CharField(max_length=20, choices=LIST_TYPE_CHOICES, default='CUSTOM')
    tickers = models.JSONField(default=list, help_text="Lista de tickers")
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Projecao(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projecoes')

    nome = models.CharField(max_length=100, blank=True, null=True)
    valor_inicial = models.DecimalField(max_digits=18, decimal_places=2)
    aporte_mensal = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    taxa_retorno = models.DecimalField(max_digits=10, decimal_places=4, help_text="Taxa anual em formato decimal (ex: 0.10 para 10%)", default=Decimal('0.10'))
    horizonte_meses = models.IntegerField(help_text="Horizonte em meses")

    taxa_retorno_bullish = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0.20'))
    taxa_retorno_bearish = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('-0.10'))

    resultado_base = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    resultado_bullish = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    resultado_bearish = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    resultado_conservador = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    resultado_otimista = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)

    cenarios = models.JSONField(default=dict, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Proj {self.nome or self.id} - {self.user.username}"

    def calcular(self):
        meses = self.horizonte_meses
        taxa_mensal = self.taxa_retorno / 12

        valor = self.valor_inicial
        for _ in range(meses):
            valor = valor * (1 + taxa_mensal) + self.aporte_mensal
        self.resultado_base = valor

        taxa_bullish = self.taxa_retorno_bullish / 12
        valor_bullish = self.valor_inicial
        for _ in range(meses):
            valor_bullish = valor_bullish * (1 + taxa_bullish) + self.aporte_mensal
        self.resultado_bullish = valor_bullish

        taxa_bearish = self.taxa_retorno_bearish / 12
        valor_bearish = self.valor_inicial
        for _ in range(meses):
            valor_bearish = valor_bearish * (1 + taxa_bearish) + self.aporte_mensal
        self.resultado_bearish = valor_bearish

        self.resultado_conservador = Decimal(str(self.resultado_base)) * Decimal('0.6')
        self.resultado_otimista = Decimal(str(self.resultado_base)) * Decimal('1.5')

        milestones = []
        valor_atual = self.valor_inicial
        taxa = self.taxa_retorno / 12

        for i in range(1, meses + 1):
            valor_atual = valor_atual * (1 + taxa) + self.aporte_mensal
            if i % 12 == 0:
                milestones.append({
                    'ano': i // 12,
                    'valor': float(valor_atual.quantize(Decimal('0.01'))),
                    'retorno_total': float((valor_atual - self.valor_inicial - (self.aporte_mensal * i)) / (self.valor_inicial + (self.aporte_mensal * i)) * 100)
                })

        self.cenarios = {
            'base': float(self.resultado_base),
            'bullish': float(self.resultado_bullish),
            'bearish': float(self.resultado_bearish),
            'conservador': float(self.resultado_conservador),
            'otimista': float(self.resultado_otimista),
            'milestones': milestones
        }

        return self.cenarios