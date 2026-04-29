"""
URL patterns for the users app.
"""

from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('me/', views.me, name='me'),
    path('sync/', views.sync, name='sync'),
]
