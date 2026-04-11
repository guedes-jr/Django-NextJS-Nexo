from rest_framework import serializers
from .models import CustomUser, InvestorProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'phone', 'is_premium')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'phone')

    def create(self, validated_data):
        # Utilizaremos o create_user (do Django Manager nativo) p/ hashear a senha automaticamente.
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            phone=validated_data.get('phone', '')
        )
        return user

class InvestorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorProfile
        fields = ('birth_date', 'risk_level', 'primary_broker', 'financial_goal', 'onboarding_completed')
