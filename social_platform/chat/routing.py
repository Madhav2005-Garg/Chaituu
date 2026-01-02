# from django.urls import re_path
# from . import consumers

# print("Loading chat routing patterns...")  # Debug line

# websocket_urlpatterns = [
#     re_path(r'ws/chat/(?P<room_name>[\w_]+)/$', consumers.ChatConsumer.as_asgi()),
#     re_path(r'ws/status/(?P<username>\w+)/$', consumers.StatusConsumer.as_asgi()),
# ]

# print(f"Chat websocket patterns loaded: {websocket_urlpatterns}")  # Debug line








from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room_name>[\w_]+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'^ws/status/(?P<username>\w+)/$', consumers.StatusConsumer.as_asgi()),
]