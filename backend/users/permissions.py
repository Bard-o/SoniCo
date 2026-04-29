"""
Custom DRF permissions for SoniCo.
"""

from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Allows access only to users with the 'owner' role.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and hasattr(request.user, 'role')
            and request.user.role == 'owner'
        )
