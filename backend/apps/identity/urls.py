from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, UserProfileView, LogoutView, PasswordResetRequestView, PasswordResetConfirmView,
    CurrentUserView, MFAEnableView, MFAVerifyView, MFASetupView, TrustedDeviceView, PreferencesView,
    ConsentListView, ConsentAcceptView, ProfileListView, ProfileDetailView, SupportTicketListView,
    SupportTicketDetailView, SupportMessageView, DocumentUploadView, DocumentListView, DocumentDeleteView,
    AccountVerificationView, AccountVerificationAdminView, AccountVerificationListView
)

urlpatterns = [
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/password/reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/user/', CurrentUserView.as_view(), name='current_user'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('consents/', ConsentListView.as_view(), name='consents_list'),
    path('consents/accept/', ConsentAcceptView.as_view(), name='consents_accept'),
    path('profiles/', ProfileListView.as_view(), name='profile_list'),
    path('profiles/<uuid:pk>/', ProfileDetailView.as_view(), name='profile_detail'),
    path('support/tickets/', SupportTicketListView.as_view(), name='support_tickets'),
    path('support/tickets/<int:pk>/', SupportTicketDetailView.as_view(), name='support_ticket_detail'),
    path('support/tickets/<int:pk>/messages/', SupportMessageView.as_view(), name='support_messages'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa_setup'),
    path('mfa/enable/', MFAEnableView.as_view(), name='mfa_enable'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa_verify'),
    path('devices/', TrustedDeviceView.as_view(), name='trusted_devices'),
    path('documents/upload/', DocumentUploadView.as_view(), name='document_upload'),
    path('documents/', DocumentListView.as_view(), name='document_list'),
    path('documents/<int:pk>/', DocumentDeleteView.as_view(), name='document_delete'),
    path('verification/', AccountVerificationView.as_view(), name='account_verification'),
    path('verification/list/', AccountVerificationListView.as_view(), name='verification_list'),
    path('verification/admin/<uuid:user_id>/', AccountVerificationAdminView.as_view(), name='account_verification_admin'),
]
