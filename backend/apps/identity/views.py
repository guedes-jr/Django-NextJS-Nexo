from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, InvestorProfileSerializer
from .models import InvestorProfile

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        # Usamos o serializer para validar e criar
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
        # Sempre retorna o perfil amarrado ao Token do User atual
        return self.request.user.profile
