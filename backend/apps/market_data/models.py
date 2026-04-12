from django.db import models


class AssetPrice(models.Model):
    ticker = models.CharField(max_length=20, db_index=True)
    price = models.DecimalField(max_digits=18, decimal_places=8)
    volume = models.BigIntegerField(null=True, blank=True)
    high = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    low = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    open_price = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    close_price = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['ticker', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.ticker} - {self.price}"


class MarketIndex(models.Model):
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=20, unique=True)
    current_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    variation = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    variation_pct = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.symbol})"


class B3StockPrice(models.Model):
    ticker = models.CharField(max_length=20, db_index=True)
    date = models.DateField(db_index=True)
    open_price = models.DecimalField(max_digits=18, decimal_places=2, null=True)
    high = models.DecimalField(max_digits=18, decimal_places=2, null=True)
    low = models.DecimalField(max_digits=18, decimal_places=2, null=True)
    close = models.DecimalField(max_digits=18, decimal_places=2)
    volume = models.BigIntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['ticker', '-date']),
        ]
        unique_together = ['ticker', 'date']

    def __str__(self):
        return f"{self.ticker} - {self.date}"


class B3Index(models.Model):
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=20, unique=True)
    date = models.DateField(db_index=True)
    close = models.DecimalField(max_digits=18, decimal_places=2)
    variation = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    variation_pct = models.DecimalField(max_digits=10, decimal_places=4, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['symbol', '-date']),
        ]

    def __str__(self):
        return f"{self.symbol} - {self.date}"


class B3CorporateEvent(models.Model):
    ticker = models.CharField(max_length=20, db_index=True)
    event_type = models.CharField(max_length=20, choices=[
        ('DIVIDENDO', 'Dividendo'),
        ('JRS', 'Juros'),
        ('SPLIT', 'Split'),
        ('GRUP', 'Grouping'),
        ('BONUS', 'Bonus'),
        ('RED', 'Rights'),
    ])
    event_date = models.DateField()
    value = models.DecimalField(max_digits=18, decimal_places=6, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-event_date']

    def __str__(self):
        return f"{self.ticker} - {self.event_type} - {self.event_date}"