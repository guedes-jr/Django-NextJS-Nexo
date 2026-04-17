from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsManagerUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_manager


def require_permission(permission: str):
    class PermissionClass(BasePermission):
        def has_permission(self, request, view):
            return request.user.is_authenticated and request.user.has_permission(permission)
    return PermissionClass


class PermissionMixin:
    def check_permission(self, permission: str) -> bool:
        return self.request.user.has_permission(permission)
    
    def require(self, permission: str):
        from rest_framework.exceptions import PermissionDenied
        if not self.check_permission(permission):
            raise PermissionDenied("Permissão insuficiente")
from django.utils.timezone import now
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from .serializers import RegisterSerializer, InvestorProfileSerializer, PasswordResetSerializer, UserSerializer, PreferencesSerializer, ConsentSerializer, ConsentAcceptSerializer, ProfileListSerializer, RoleUpdateSerializer, SupportTicketSerializer, SupportMessageSerializer, UserDocumentSerializer, UserDocumentUploadSerializer, AccountVerificationSerializer
from .models import InvestorProfile, TrustedDevice, SupportTicket, SupportMessage, UserDocument, AccountVerification
from apps.documents.models import UserConsent
from django.core.mail import send_mail

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Usuário criado com sucesso", "username": user.username}, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

    def perform_create(self, serializer):
        return serializer.save()

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = InvestorProfileSerializer

    def get_object(self):
        return self.request.user.profile

class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class PreferencesView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PreferencesSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class ConsentListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ConsentSerializer

    def get_queryset(self):
        return UserConsent.objects.filter(user=self.request.user)

class ConsentAcceptView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ConsentAcceptSerializer

    def post(self, request):
        serializer = ConsentAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        consent_type = serializer.validated_data['consent_type']
        accepted = serializer.validated_data['accepted']
        
        consent, _ = UserConsent.objects.update_or_create(
            user=request.user,
            consent_type=consent_type,
            defaults={
                'is_accepted': accepted,
                'accepted_at': now() if accepted else None,
                'ip_address': self.get_client_ip(request),
            }
        )
        
        return Response({
            "message": "Consentimento salvo",
            "consent_type": consent.consent_type,
            "is_accepted": consent.is_accepted,
        })

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class LogoutView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        return Response(
            {"message": "Logout realizado com sucesso"},
            status=status.HTTP_200_OK
        )

class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PasswordResetSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            return Response({
                "message": "Token de recuperação enviado",
                "reset_token": token,
                "uid": uid
            })
        except User.DoesNotExist:
            return Response(
                {"message": "Se o e-mail existir, o token será enviado"},
                status=status.HTTP_200_OK
            )

class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not all([uid, token, new_password]):
            return Response(
                {"error": "UID, token e nova senha são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
            
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"message": "Senha alterada com sucesso"})
            else:
                return Response(
                    {"error": "Token invalido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception:
            return Response(
                {"error": "Erro ao processar requisicao"},
                status=status.HTTP_400_BAD_REQUEST
            )


class MFAEnableView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        
        if user.mfa_enabled:
            return Response({"error": "MFA ja esta habilitado"}, status=400)
        
        secret = user.generate_mfa_secret()
        user.mfa_enabled = True
        user.save()
        
        return Response({
            "message": "MFA habilitado com sucesso",
            "secret": secret,
            "qr_url": user.get_mfa_qr_url()
        })
    
    def delete(self, request):
        user = request.user
        code = request.data.get('code')
        
        if not user.verify_mfa_code(code):
            return Response({"error": "Codigo invalido"}, status=400)
        
        user.mfa_enabled = False
        user.mfa_secret = None
        user.save()
        
        return Response({"message": "MFA desabilitado com sucesso"})


class MFAVerifyView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        user_id = request.data.get('user_id')
        code = request.data.get('code')
        
        if not user_id or not code:
            return Response({"error": "user_id e code sao obrigatorios"}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Usuario nao encontrado"}, status=404)
        
        if not user.mfa_enabled:
            return Response({"error": "MFA nao habilitado para este usuario"}, status=400)
        
        if user.verify_mfa_code(code):
            return Response({
                "valid": True,
                "message": "Codigo verificado com sucesso"
            })
        else:
            return Response({
                "valid": False,
                "error": "Codigo invalido"
            }, status=400)


class MFASetupView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        
        if user.mfa_enabled:
            return Response({
                "enabled": True,
                "qr_url": user.get_mfa_qr_url()
            })
        
        if not user.mfa_secret:
            secret = user.generate_mfa_secret()
            user.save()
        
        return Response({
            "enabled": False,
            "secret": user.mfa_secret,
            "qr_url": user.get_mfa_qr_url()
        })


class TrustedDeviceView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        devices = request.user.trusted_devices.filter(is_active=True)
        return Response([{
            "id": d.id,
            "device_name": d.device_name,
            "browser": d.browser,
            "os": d.os,
            "last_access": d.last_access.isoformat(),
        } for d in devices])
    
    def post(self, request):
        device_id = request.data.get('device_id')
        device_name = request.data.get('device_name', 'Novo dispositivo')
        
        if not device_id:
            return Response({"error": "device_id e obrigatorio"}, status=400)
        
        device, created = TrustedDevice.objects.update_or_create(
            device_id=device_id,
            user=request.user,
            defaults={
                "device_name": device_name,
                "browser": request.data.get('browser', 'Unknown'),
                "os": request.data.get('os', 'Unknown'),
                "ip_address": self._get_client_ip(request),
            }
        )
        
        return Response({
            "message": "Dispositivo salvo" if not created else "Dispositivo adicionado",
            "device_id": device.id
        })
    
    def delete(self, request):
        device_id = request.query_params.get('device_id')
        if not device_id:
            return Response({"error": "device_id obrigatorio"}, status=400)
        
        try:
            device = TrustedDevice.objects.get(id=device_id, user=request.user)
            device.is_active = False
            device.save()
            return Response({"message": "Dispositivo removido"})
        except TrustedDevice.DoesNotExist:
            return Response({"error": "Dispositivo nao encontrado"}, status=404)
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ProfileListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileListSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return User.objects.all()
        elif user.is_manager:
            return User.objects.filter(is_superuser=False)
        return User.objects.none()


class ProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileListSerializer
    queryset = User.objects.all()
    
    def get_permissions(self):
        method = self.request.method
        if method == 'DELETE':
            return [IsAdminUser()]
        if method in ['PUT', 'PATCH']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return RoleUpdateSerializer
        return ProfileListSerializer
    
    def get_object(self):
        pk = self.kwargs.get('pk')
        if pk:
            return get_object_or_404(User, pk=pk)
        return self.request.user
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response({"error": "Nao pode excluir a si mesmo"}, status=400)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SupportTicketListView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SupportTicketSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return SupportTicket.objects.all()
        elif user.is_support and user.is_manager:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SupportTicketDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SupportTicketSerializer
    queryset = SupportTicket.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_support:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(user=user)


class SupportMessageView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SupportMessageSerializer
    
    def get(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        if ticket.user != request.user and not request.user.is_support:
            return Response({"error": "Acesso negado"}, status=403)
        messages = ticket.messages.all()
        serializer = SupportMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    def post(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        if ticket.user != request.user and not request.user.is_support:
            return Response({"error": "Acesso negado"}, status=403)
        
        message_text = request.data.get('message')
        if not message_text:
            return Response({"error": "Mensagem obrigatória"}, status=400)
        
        is_internal = request.user.is_support and request.data.get('is_internal', False)
        
        message = SupportMessage.objects.create(
            ticket=ticket,
            user=request.user,
            message=message_text,
            is_internal=is_internal
        )
        
        if ticket.status == 'CLOSED':
            ticket.status = 'IN_PROGRESS'
            ticket.save()
        
        return Response({"message": "Mensagem enviada"}, status=201)


class DocumentUploadView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserDocumentUploadSerializer
    
    def post(self, request):
        serializer = UserDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file_obj = serializer.validated_data['file']
        doc_type = serializer.validated_data['document_type']
        
        doc = UserDocument.objects.create(
            user=request.user,
            document_type=doc_type,
            file=file_obj,
            original_name=file_obj.name
        )
        
        return Response({
            "message": "Documento enviado com sucesso",
            "document_id": doc.id,
            "document_type": doc.document_type
        }, status=201)


class DocumentListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserDocumentSerializer
    
    def get_queryset(self):
        return UserDocument.objects.filter(user=self.request.user)


class DocumentDeleteView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = UserDocument.objects.all()
    
    def get_queryset(self):
        return UserDocument.objects.filter(user=self.request.user)


class AccountVerificationView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AccountVerificationSerializer
    
    def get(self, request):
        try:
            verification = request.user.account_verification
        except AccountVerification.DoesNotExist:
            verification = AccountVerification.objects.create(user=request.user)
        
        serializer = AccountVerificationSerializer(verification)
        return Response(serializer.data)
    
    def post(self, request):
        try:
            verification = request.user.account_verification
        except AccountVerification.DoesNotExist:
            verification = AccountVerification.objects.create(user=request.user)
        
        required_docs = ['RG', 'CPF', 'COMPROVANTE_RESIDENCIA']
        uploaded_types = list(request.user.documents.values_list('document_type', flat=True))
        
        verification.documents_complete = all(doc in uploaded_types for doc in required_docs)
        
        if verification.status == 'PENDING':
            verification.status = 'IN_REVIEW'
            verification.submitted_at = now()
        
        verification.save()
        
        serializer = AccountVerificationSerializer(verification)
        return Response(serializer.data)


class AccountVerificationAdminView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AccountVerificationSerializer
    queryset = AccountVerification.objects.all()
    lookup_field = 'user_id'
    
    def get_queryset(self):
        if not self.request.user.is_admin:
            return AccountVerification.objects.none()
        return AccountVerification.objects.all()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status in ['APPROVED', 'REJECTED']:
            instance.status = new_status
            instance.reviewed_at = now()
            instance.reviewed_by = request.user
            instance.notes = notes
            instance.save()
            
            if new_status == 'APPROVED':
                if hasattr(instance.user, 'profile'):
                    instance.user.profile.onboarding_completed = True
                    instance.user.profile.save()
        else:
            instance.notes = notes
            instance.save()
        
        serializer = AccountVerificationSerializer(instance)
        return Response(serializer.data)
