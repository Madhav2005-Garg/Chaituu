# base/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    # Auth
    path('register/', views.register_user, name='register'),
    # path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/', views.login_view, name='login'),
    
    # Search
    path('users/', views.search_users, name='search_users'),
    path('chat/friends/', views.list_friends, name='list_friends'),

    # Invitations
    path('invitations/', views.list_invitations, name='list_invitations'),
    path('invitations/send/', views.send_invitation, name='send_invitation'),
    path('invitations/respond/', views.respond_to_invitation, name='respond_to_invitation'),

    # Friends
    path('friends/', views.list_friends, name='list_friends'),
    path('friends/remove/<int:invite_id>/', views.remove_friend, name='remove_friend'),
    
]