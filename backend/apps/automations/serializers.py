from rest_framework import serializers
from .models import AutomationTrigger, AutomationLog, BrokerConnection, SyncLog

class AutomationTriggerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationTrigger
        fields = '__all__'

class BrokerConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrokerConnection
        fields = '__all__'

class SyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncLog
        fields = '__all__'