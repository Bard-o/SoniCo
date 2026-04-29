"""
User profile model — synced from Supabase Auth.

The canonical auth state lives in Supabase. This model mirrors it
so Django ORM queries and DRF permission checks have a local record.
"""

import uuid
from django.db import models


class UserProfile(models.Model):
    """
    Represents a registered user in the SoniCo system.
    The `id` field matches the Supabase Auth UID (UUID).
    """

    class Role(models.TextChoices):
        USER = 'user', 'User'
        OWNER = 'owner', 'Owner'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Matches the Supabase Auth user UUID',
    )
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users_userprofile'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.full_name or self.email} ({self.role})'

    @property
    def is_owner(self):
        return self.role == self.Role.OWNER
