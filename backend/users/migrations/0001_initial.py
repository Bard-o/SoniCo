"""
Initial migration for the UserProfile model.

Note: The table was pre-created in Supabase via SQL migration.
This migration file exists so Django's migration framework stays in sync.
Run `python manage.py migrate` after starting the backend container
to create Django's system tables (auth, sessions, admin, etc.)
and record this migration as applied.
"""

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                (
                    'id',
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text='Matches the Supabase Auth user UUID',
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('full_name', models.CharField(blank=True, default='', max_length=255)),
                ('phone', models.CharField(blank=True, default='', max_length=20)),
                (
                    'role',
                    models.CharField(
                        choices=[('user', 'User'), ('owner', 'Owner')],
                        default='user',
                        max_length=10,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'users_userprofile',
                'ordering': ['-created_at'],
            },
        ),
    ]
