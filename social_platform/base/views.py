# base/views.py
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Invitation
from .serializers import UserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    try:
        user = User.objects.create_user(
            username=data['username'],
            email=data.get('email', ''),
            password=data['password']
        )
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.query_params.get('search', '')
    if query:
        users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)
        results = []
        for user in users:
            # Check for ANY existing relationship
            invite = Invitation.objects.filter(
                (Q(sender=request.user, receiver=user) | Q(sender=user, receiver=request.user))
            ).first()
            
            results.append({
                'id': user.id,
                'username': user.username,
                'status': invite.status if invite else 'none'
            })
        return Response(results)
    return Response([])

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_invitation(request):
    receiver_id = request.data.get('receiver_id')
    try:
        receiver = User.objects.get(id=receiver_id)
        
        # MUTUAL CHECK: Check if an invite exists in EITHER direction
        existing_invite = Invitation.objects.filter(
            (Q(sender=request.user, receiver=receiver) | 
             Q(sender=receiver, receiver=request.user))
        ).first()

        if existing_invite:
            if existing_invite.status == 'accepted':
                return Response({'message': 'You are already friends!'}, status=400)
            return Response({'message': 'An invitation is already pending.'}, status=400)
            
        Invitation.objects.create(sender=request.user, receiver=receiver)
        return Response({'message': 'Invitation sent!'}, status=201)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_invitations(request):
    # Get pending invites sent TO the current user
    invites = Invitation.objects.filter(receiver=request.user, status='pending')
    data = [{'id': i.id, 'sender': i.sender.username} for i in invites]
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_invitation(request):
    invite_id = request.data.get('invite_id')
    action = request.data.get('action') # 'accepted' or 'rejected'
    
    try:
        invitation = Invitation.objects.get(id=invite_id, receiver=request.user)
        invitation.status = action
        invitation.save()
        return Response({'message': f'Invitation {action}'})
    except Invitation.DoesNotExist:
        return Response({'error': 'Invitation not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_friends(request):
    # FIXED: Removed double Q() wrapper
    friends_invites = Invitation.objects.filter(
        (Q(sender=request.user) | Q(receiver=request.user)),
        status='accepted'
    )
    
    friends = []
    for invite in friends_invites:
        # Determine which user is the 'friend' (not the current user)
        friend_user = invite.receiver if invite.sender == request.user else invite.sender
        friends.append({
            'id': friend_user.id,
            'username': friend_user.username,
            'invite_id': invite.id # Needed for unfriending
        })
    return Response(friends)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_friend(request, invite_id):
    try:
        # Ensure the user is part of the invitation they are trying to delete
        invite = Invitation.objects.get(
            id=invite_id, 
            status='accepted'
        )
        if invite.sender == request.user or invite.receiver == request.user:
            invite.delete()
            return Response({'message': 'Friend removed'}, status=200)
        return Response({'error': 'Unauthorized'}, status=403)
    except Invitation.DoesNotExist:
        return Response({'error': 'Invitation not found'}, status=404)  
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    print(f"🔐 Login attempt - Username: {username}")  # Debug
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=400)
    
    user = authenticate(username=username, password=password)
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        print(f"✅ Login successful! Token: {token.key[:10]}...")  # Debug
        
        return Response({
            'token': token.key,
            'username': user.username,
            'user_id': user.id
        }, status=200)
    
    print("❌ Authentication failed - Invalid credentials")  # Debug
    return Response({'error': 'Invalid credentials'}, status=401)