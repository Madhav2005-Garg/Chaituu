import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Message

# 1. CHAT CONSUMER: Handles Real-time Messaging
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'chat_message')
        
        # Handle typing indicator
        if message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'sender': data.get('sender'),
                    'typing': data.get('typing', False)
                }
            )
            return
        
        # Handle read receipt
        if message_type == 'read_receipt':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt_message',
                    'reader': data.get('sender')
                }
            )
            return
        
        # Handle regular chat message
        message_content = data.get('message')
        sender_username = data.get('sender')
        
        if not message_content or not sender_username:
            await self.send(text_data=json.dumps({
                'error': 'Missing message or sender'
            }))
            return

        # Determine receiver from room name (format: user1_user2)
        users = self.room_name.split('_')
        receiver_username = users[1] if users[0] == sender_username else users[0]

        # 1. Save to DB (with correct 3 parameters)
        save_result = await self.save_message(sender_username, receiver_username, message_content)

        if save_result['success']:
            # 2. Broadcast to Group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_content,
                    'sender': sender_username,
                    'timestamp': save_result['timestamp']
                }
            )
        else:
            # Send error back to sender
            await self.send(text_data=json.dumps({
                'error': save_result['error']
            }))

    # Method to send chat message to WebSocket
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'timestamp': event.get('timestamp')
        }))
    
    # Method to send typing indicator to WebSocket
    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender': event['sender'],
            'typing': event['typing']
        }))
    
    # Method to send read receipt to WebSocket
    async def read_receipt_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'reader': event['reader']
        }))

    @database_sync_to_async
    def save_message(self, sender_username, receiver_username, content):
        try:
            s = User.objects.get(username=sender_username)
            r = User.objects.get(username=receiver_username)
            msg = Message.objects.create(sender=s, receiver=r, content=content)
            return {
                'success': True,
                'timestamp': msg.timestamp.isoformat()
            }
        except User.DoesNotExist as e:
            print(f"Error: User not found - {str(e)}")
            return {
                'success': False,
                'error': f"User not found: {str(e)}"
            }


# 2. STATUS CONSUMER: Handles Online/Offline Indicators
class StatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['username']
        self.status_group_name = 'user_status'

        await self.channel_layer.group_add(self.status_group_name, self.channel_name)
        await self.accept()

        # Broadcast that user is online
        await self.channel_layer.group_send(
            self.status_group_name,
            {
                'type': 'status_update',
                'user': self.username,
                'status': 'online'
            }
        )

    async def disconnect(self, close_code):
        # Broadcast that user is offline
        await self.channel_layer.group_send(
            self.status_group_name,
            {
                'type': 'status_update',
                'user': self.username,
                'status': 'offline'
            }
        )
        await self.channel_layer.group_discard(self.status_group_name, self.channel_name)

    async def status_update(self, event):
        # Send status update to all connected clients
        await self.send(text_data=json.dumps({
            'user': event['user'],
            'status': event['status']
        }))