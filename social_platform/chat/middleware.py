"""
WebSocket Token Authentication Middleware for Django Channels.
This middleware extracts the token from the WebSocket URL query string
and authenticates the user.
"""

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token
from django.conf import settings
from urllib.parse import parse_qs


@database_sync_to_async
def get_user_from_token(token_key):
    """
    Retrieve user from the auth token.
    Returns AnonymousUser if token is invalid or not found.
    """
    try:
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that authenticates WebSocket connections
    using a token passed in the query string.
    
    Usage in frontend:
        new WebSocket(`ws://localhost:8000/ws/chat/room/?token=${authToken}`)
    """

    async def __call__(self, scope, receive, send):
        # Check origin for WebSocket connections
        headers = dict(scope.get("headers", []))
        origin = headers.get(b"origin", b"").decode("utf-8")
        
        allowed_origins = getattr(settings, 'ALLOWED_WEBSOCKET_ORIGINS', [])
        
        # Allow connection if no origin check configured or origin is allowed
        # Also allow if DEBUG is True (development mode)
        if not getattr(settings, 'DEBUG', False):
            if allowed_origins and origin and origin not in allowed_origins:
                # Reject connection from unauthorized origin
                await send({
                    "type": "websocket.close",
                    "code": 4003,
                })
                return
        
        # Parse query string from the WebSocket URL
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        
        # Extract token from query params
        token_key = query_params.get("token", [None])[0]
        
        if token_key:
            # Authenticate user using token
            scope["user"] = await get_user_from_token(token_key)
        else:
            # No token provided - anonymous user
            scope["user"] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def TokenAuthMiddlewareStack(inner):
    """
    Convenience function to wrap the ASGI application with token auth middleware.
    """
    return TokenAuthMiddleware(inner)
