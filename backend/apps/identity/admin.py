from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'phone', 'is_premium', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Adicionais', {'fields': ('phone', 'is_premium')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
