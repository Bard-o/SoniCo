"""
API views for user authentication and profile management.

Endpoints:
  GET  /api/auth/me/   — Get current user's profile
  PATCH /api/auth/me/  — Update full_name and phone
  POST /api/auth/sync/ — Sync/create UserProfile from JWT (called after first login)
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile
from .serializers import UserProfileSerializer


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    GET  — Returns the authenticated user's profile.
    PATCH — Updates mutable fields (full_name, phone).
    """
    user_profile = request.user

    if request.method == 'GET':
        serializer = UserProfileSerializer(user_profile)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = UserProfileSerializer(
            user_profile,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync(request):
    """
    Ensures a UserProfile exists for the authenticated Supabase user.
    Called by the frontend right after login/register.
    Updates full_name if provided in the request body.
    """
    user_profile = request.user
    full_name = request.data.get('full_name', '')

    if full_name and not user_profile.full_name:
        user_profile.full_name = full_name
        user_profile.save(update_fields=['full_name'])

    serializer = UserProfileSerializer(user_profile)
    return Response(serializer.data, status=status.HTTP_200_OK)
