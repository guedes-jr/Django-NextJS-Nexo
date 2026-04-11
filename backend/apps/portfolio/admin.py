from django.contrib import admin
from .models import Institution, Asset, InvestmentAccount, Position

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name', 'external_id')

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('ticker', 'name', 'asset_type', 'sector')
    list_filter = ('asset_type', 'sector')
    search_fields = ('ticker', 'name')

@admin.register(InvestmentAccount)
class InvestmentAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'institution', 'account_number')

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('account', 'asset', 'quantity', 'current_price')
