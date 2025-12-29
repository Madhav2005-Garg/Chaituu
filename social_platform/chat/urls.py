from django.urls import path
from . import views  # Import from chat/views.py (current directory)

urlpatterns = [
    # Friends list endpoint
    path('friends/', views.get_friends, name='friends_list'),
    
    # Message history for a specific user
    path('messages/<str:username>/', views.MessageHistoryView, name='chat_history'),
    
    # User search endpoint
    path('users/', views.search_users, name='search'),
]