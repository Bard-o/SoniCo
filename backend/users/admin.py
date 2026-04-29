from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'role', 'created_at']
    list_filter = ['role']
    search_fields = ['email', 'full_name']
    readonly_fields = ['id', 'created_at']
