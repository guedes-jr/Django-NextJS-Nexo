from django.contrib import admin
from .models import Institution, Asset, InvestmentAccount, Position, Transaction, Goal, Notification

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name', 'external_id', 'logo_url')
    search_fields = ('name',)

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('ticker', 'name', 'asset_type', 'sector', 'is_international', 'currency')
    list_filter = ('asset_type', 'sector', 'is_international', 'currency')
    search_fields = ('ticker', 'name')

@admin.register(InvestmentAccount)
class InvestmentAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'institution', 'account_number', 'description', 'created_at')
    list_filter = ('institution',)
    search_fields = ('user__username', 'description', 'account_number')

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('account', 'asset', 'quantity', 'average_price', 'current_price', 'last_updated')
    list_filter = ('account__institution', 'asset__asset_type')
    search_fields = ('asset__ticker', 'account__user__username')
    raw_id_fields = ('account', 'asset')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'asset', 'total_value', 'transaction_date', 'created_at')
    list_filter = ('transaction_type', 'transaction_date')
    search_fields = ('user__username', 'asset__ticker', 'notes')
    date_hierarchy = 'transaction_date'

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'goal_type', 'target_amount', 'current_amount', 'target_date', 'is_active')
    list_filter = ('goal_type', 'is_active')
    search_fields = ('user__username', 'name')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('user__username', 'title', 'message')
    date_hierarchy = 'created_at'