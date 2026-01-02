# # base/routing.py
# from django.urls import re_path
# from . import consumers

# websocket_urlpatterns = [
#     # FIXED: Changed \w+ to [\w_]+ to allow underscores in room names
#     re_path(r'ws/chat/(?P<room_name>[\w_]+)/$', consumers.ChatConsumer.as_asgi()),
#     re_path(r'ws/status/(?P<username>\w+)/$', consumers.StatusConsumer.as_asgi()),
# ]