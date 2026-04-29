"""
Custom DRF authentication backend for Supabase JWT tokens.

Flow:
1. Frontend authenticates via Supabase JS SDK (email/password or Google OAuth).
2. Frontend sends the Supabase access_token in Authorization: Bearer <token>.
3. This class verifies the JWT using the SUPABASE_JWT_SECRET.
4. On success, it looks up or creates a local UserProfile record.
"""

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import UserProfile


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Verifies Supabase-issued JWTs and returns a UserProfile instance
    as request.user for DRF views.
    """

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request)
        if not auth_header:
            return None

        parts = auth_header.split()
        if parts[0].lower() != b'bearer':
            return None

        if len(parts) == 1:
            raise exceptions.AuthenticationFailed(
                'Invalid token header. No credentials provided.'
            )
        elif len(parts) > 2:
            raise exceptions.AuthenticationFailed(
                'Invalid token header. Token string should not contain spaces.'
            )

        token = parts[1].decode('utf-8')

        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                audience='authenticated',
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError as e:
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')

        # Extract user info from JWT payload
        supabase_uid = payload.get('sub')
        email = payload.get('email', '')

        if not supabase_uid:
            raise exceptions.AuthenticationFailed(
                'Token payload missing user ID (sub).'
            )

        # Get or create local UserProfile (just-in-time sync)
        try:
            user_profile = UserProfile.objects.get(id=supabase_uid)
        except UserProfile.DoesNotExist:
            # Auto-create on first API call after Supabase registration
            user_profile = UserProfile.objects.create(
                id=supabase_uid,
                email=email,
                full_name=payload.get('user_metadata', {}).get('full_name', ''),
            )

        return (user_profile, token)

    def authenticate_header(self, request):
        return 'Bearer'
