from rest_framework import serializers
from .models import AssetPrice, MarketIndex

class AssetPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetPrice
        fields = '__all__'

class MarketIndexSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketIndex
        fields = '__all__'