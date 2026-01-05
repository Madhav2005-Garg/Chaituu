import json
import time
import asyncio
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
        # PROFILING: Track when message hits server
        t_receive = time.time()
        msg_len = len(text_data)
        
        data = json.loads(text_data)
        message_type = data.get('type', 'chat_message')
        
        # Extract client timestamp if present
        client_send_ts = data.get('clientSendTs')
        if client_send_ts:
            network_latency = (t_receive * 1000) - client_send_ts
            print(f"📊 Network latency: {network_latency:.1f}ms, size: {msg_len}B")
        
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
        client_msg_id = data.get('clientMsgId')  # For round-trip tracking
        
        if not message_content or not sender_username:
            await self.send(text_data=json.dumps({
                'error': 'Missing message or sender'
            }))
            return

        # Determine receiver from room name (format: user1_user2)
        users = self.room_name.split('_')
        receiver_username = users[1] if users[0] == sender_username else users[0]

        # Use compact timestamp (Unix ms instead of ISO string)
        timestamp = int(time.time() * 1000)
        
        # PROFILING: Track broadcast start
        t_broadcast_start = time.time()
        
        # Broadcast immediately with MINIMAL payload
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'm': message_content,  # Shortened key
                's': sender_username,
                't': timestamp,
                'id': client_msg_id  # Echo back for ack
            }
        )
        
        # PROFILING: Log broadcast time
        broadcast_time = (time.time() - t_broadcast_start) * 1000
        total_time = (time.time() - t_receive) * 1000
        print(f"⚡ Broadcast: {broadcast_time:.1f}ms | Total: {total_time:.1f}ms | Msg: {msg_len}B")
        
        # Save to DB truly async without blocking
        asyncio.create_task(self._save_message_async(sender_username, receiver_username, message_content))

    # Method to send chat message to WebSocket
    async def chat_message(self, event):
        # PROFILING: Track when we send to client
        t_send = time.time()
        
        # Expand compact keys back to full format for client
        await self.send(text_data=json.dumps({
            'message': event['m'],
            'sender': event['s'],
            'timestamp': event['t'],
            'clientMsgId': event.get('id')  # For ack tracking
        }))
        
        print(f"📤 Sent to client at t={t_send*1000:.0f}ms")
    
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
    
    # Async DB save - properly non-blocking
    async def _save_message_async(self, sender_username, receiver_username, content):
        """Async task to save message to DB without blocking WebSocket"""
        try:
            t_db_start = time.time()
            await self._db_save(sender_username, receiver_username, content)
            db_time = (time.time() - t_db_start) * 1000
            print(f"💾 DB save: {db_time:.1f}ms")
        except Exception as e:
            print(f"❌ DB save failed: {str(e)}")
    
    @database_sync_to_async
    def _db_save(self, sender_username, receiver_username, content):
        """Actual DB operation wrapped for async"""
        s = User.objects.get(username=sender_username)
        r = User.objects.get(username=receiver_username)
        Message.objects.create(sender=s, receiver=r, content=content)


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