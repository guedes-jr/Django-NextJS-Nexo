from rest_framework import serializers
from .models import CustomUser, InvestorProfile, SupportTicket, SupportMessage, UserDocument, AccountVerification
from apps.documents.models import UserConsent, Document

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'phone', 'is_premium', 'theme', 'currency', 'email_notifications', 'push_notifications', 'newsletter', 'locale', 'avatar', 'about')

class PreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('theme', 'currency', 'email_notifications', 'push_notifications', 'newsletter', 'locale', 'avatar', 'about')

class ProfileUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'phone', 'about', 'avatar')

class ProfileListSerializer(serializers.ModelSerializer):
    all_permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'permissions', 'all_permissions', 'is_active', 'date_joined', 'last_login')
    
    def get_all_permissions(self, obj):
        return obj.get_all_permissions()

class RoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('role', 'permissions')


from apps.identity.models import SupportTicket, SupportMessage

class SupportMessageSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportMessage
        fields = ('id', 'user', 'user_username', 'message', 'is_internal', 'created_at')
        read_only_fields = ('user', 'created_at')
    
    def get_user_username(self, obj):
        return obj.user.username


class SupportTicketSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()
    assigned_username = serializers.SerializerMethodField()
    messages = SupportMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ('id', 'user', 'user_username', 'assigned_to', 'assigned_username', 'title', 'description', 
                'status', 'priority', 'created_at', 'updated_at', 'resolved_at', 'messages')
        read_only_fields = ('user', 'created_at', 'updated_at')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'phone')

    def create(self, validated_data):
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


class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = ('id', 'document_type', 'file', 'original_name', 'status', 'rejection_reason', 'uploaded_at', 'reviewed_at')
        read_only_fields = ('status', 'rejection_reason', 'uploaded_at', 'reviewed_at')


class UserDocumentUploadSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=UserDocument.DOCUMENT_TYPE_CHOICES)
    file = serializers.FileField()


class AccountVerificationSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = AccountVerification
        fields = ('id', 'user', 'user_username', 'status', 'documents_complete', 'verification_level', 
                  'submitted_at', 'reviewed_at', 'notes', 'documents')
        read_only_fields = ('submitted_at', 'reviewed_at')
    
    def get_user_username(self, obj):
        return obj.user.username
    
    def get_documents(self, obj):
        docs = obj.user.documents.all()
        return UserDocumentSerializer(docs, many=True).data

class ConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserConsent
        fields = ('id', 'consent_type', 'is_accepted', 'accepted_at', 'document', 'created_at')
        read_only_fields = ('accepted_at', 'created_at', 'document')

class ConsentAcceptSerializer(serializers.Serializer):
    consent_type = serializers.ChoiceField(choices=UserConsent.CONSENT_TYPES)
    accepted = serializers.BooleanField()

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
