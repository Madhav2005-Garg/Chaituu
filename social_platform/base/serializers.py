from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Invitation

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'username', 'bio', 'image']

class InvitationSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    receiver_username = serializers.ReadOnlyField(source='receiver.username')
    
    class Meta:
        model = Invitation
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username', 'status', 'timestamp']