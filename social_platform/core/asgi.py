# import os
# import django
# from django.core.asgi import get_asgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
# django.setup()

# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
# import base.routing
# import chat.routing

# # Combine both app routing patterns
# all_websocket_patterns = chat.routing.websocket_urlpatterns + chat.routing.websocket_urlpatterns

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": AuthMiddlewareStack(
#         URLRouter(all_websocket_patterns)
#     ),
# })








import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

# Import routing and middleware AFTER django.setup()
import chat.routing
from chat.middleware import TokenAuthMiddlewareStack

print("=" * 50)
print("Loading ASGI application...")
print(f"Chat patterns: {chat.routing.websocket_urlpatterns}")

# Combine both app routing patterns
all_websocket_patterns = chat.routing.websocket_urlpatterns

print(f"Combined patterns: {all_websocket_patterns}")
print("=" * 50)

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(all_websocket_patterns)
    ),
})