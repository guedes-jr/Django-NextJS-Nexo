from rest_framework import serializers
from .models import Institution, Asset, InvestmentAccount, Position, Transaction, Goal, Notification, ReconciliationIssue, CorporateAction, PortfolioSnapshot, TaxReport, TaxLot

class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = '__all__'


class ReconciliationIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReconciliationIssue
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'

class InvestmentAccountSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)
    
    class Meta:
        model = InvestmentAccount
        fields = '__all__'

class PositionSerializer(serializers.ModelSerializer):
    asset_ticker = serializers.CharField(source='asset.ticker', read_only=True)
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_type = serializers.CharField(source='asset.asset_type', read_only=True)
    institution_name = serializers.CharField(source='account.institution.name', read_only=True)
    asset_ticker_input = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Position
        fields = '__all__'
    
    def create(self, validated_data):
        asset_ticker = validated_data.pop('asset_ticker_input', None)
        
        if asset_ticker:
            user = self.context['request'].user
            asset, _ = Asset.objects.get_or_create(
                ticker=asset_ticker,
                defaults={
                    'name': validated_data.get('asset', Asset()).name or asset_ticker,
                    'asset_type': 'ACAO'
                }
            )
            
            inst, _ = Institution.objects.get_or_create(name="Carteira Manual")
            account, _ = InvestmentAccount.objects.get_or_create(
                user=user,
                institution=inst,
                defaults={'description': 'Carteira Manual'}
            )
            
            validated_data['account'] = account
            validated_data['asset'] = asset
            
        return super().create(validated_data)

class TransactionSerializer(serializers.ModelSerializer):
    asset_ticker = serializers.CharField(source='asset.ticker', read_only=True)
    account_description = serializers.CharField(source='account.description', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'

class GoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Goal
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class CorporateActionSerializer(serializers.ModelSerializer):
    asset_ticker = serializers.CharField(source='asset.ticker', read_only=True)
    asset_name = serializers.CharField(source='asset.name', read_only=True)

    class Meta:
        model = CorporateAction
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class PortfolioSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioSnapshot
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class TaxReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxReport
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at', 'darf_code')


class TaxLotSerializer(serializers.ModelSerializer):
    asset_ticker = serializers.CharField(source='asset.ticker', read_only=True)
    
    class Meta:
        model = TaxLot
        fields = '__all__'