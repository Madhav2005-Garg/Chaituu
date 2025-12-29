from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from base.models import Message  # FIXED: Import from base.models instead of .models

# 1. User Search
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.query_params.get('search', '')
    if query:
        # Finds users that match the search, excluding yourself
        users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)
        data = [{"id": u.id, "username": u.username} for u in users]
        return Response(data)
    return Response([])

# 2. Get Friends List
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    # Logic: Show everyone you've ever talked to
    user = request.user
    messages = Message.objects.filter(Q(sender=user) | Q(receiver=user))
    
    friend_ids = set()
    for m in messages:
        if m.sender == user:
            friend_ids.add(m.receiver.id)
        else:
            friend_ids.add(m.sender.id)
            
    friends = User.objects.filter(id__in=friend_ids)
    
    # If the list is empty, show all other users so you have someone to click on initially
    if not friends.exists():
        friends = User.objects.exclude(id=user.id)

    data = [{"id": f.id, "username": f.username} for f in friends]
    return Response(data)

# 3. Message History
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def MessageHistoryView(request, username):
    try:
        other_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    messages = Message.objects.filter(
        (Q(sender=request.user) & Q(receiver=other_user)) |
        (Q(sender=other_user) & Q(receiver=request.user))
    ).order_by('timestamp')

    data = [
        {
            "sender_username": m.sender.username,
            "content": m.content,
            "timestamp": m.timestamp.isoformat()
        } for m in messages
    ]
    
    print(f"📚 Returning {len(data)} messages for {request.user.username} <-> {username}")
    return Response(data)