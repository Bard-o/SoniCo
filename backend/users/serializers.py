"""
Serializers for the users app.
"""

from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for UserProfile. The 'role' field is read-only —
    per the spec, it can only be changed via direct DB access.
    """

    class Meta:
        model = UserProfile
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'created_at']
        read_only_fields = ['id', 'email', 'role', 'created_at']
