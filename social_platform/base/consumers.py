import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q
from django.contrib.auth.models import User

# Try importing from different app locations
Message = None
Invitation = None

try:
    from .models import Message, Invitation
    print("✅ Models imported from .models")
except ImportError:
    try:
        from base.models import Message, Invitation
        print("✅ Models imported from base.models")
    except ImportError:
        try:
            from chat.models import Message
            print("✅ Message imported from chat.models")
        except ImportError:
            print("❌ ERROR: Could not import Message model from anywhere!")

if not Message:
    print("❌ CRITICAL: Message model is None!")

class ChatConsumer(AsyncWebsocketConsumer):
    
    @database_sync_to_async
    def save_message(self, sender_username, receiver_username, content):
        """Save message to database"""
        if not Message:
            print("❌ Message model not found")
            return {'success': False, 'error': 'Message model not found'}
            
        try:
            print(f"💾 Attempting to save message: {sender_username} -> {receiver_username}")
            
            s = User.objects.get(username=sender_username)
            r = User.objects.get(username=receiver_username)
            
            print(f"✅ Users found: sender_id={s.id}, receiver_id={r.id}")
            
            msg = Message.objects.create(sender=s, receiver=r, content=content)
            
            print(f"✅ Message saved! ID: {msg.id}, Content: '{content[:50]}...'")
            
            # Verify it was saved
            total = Message.objects.filter(
                sender__in=[s, r],
                receiver__in=[s, r]
            ).count()
            print(f"📊 Total messages between {sender_username} and {receiver_username}: {total}")
            
            return {
                'success': True,
                'message_id': msg.id,
                'timestamp': msg.timestamp.isoformat()
            }
        except User.DoesNotExist as e:
            print(f"❌ Error: User {sender_username} or {receiver_username} not found.")
            return {
                'success': False,
                'error': f"User not found: {str(e)}"
            }
        except Exception as e:
            print(f"❌ Error saving message: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }

    async def connect(self):
        """Handle WebSocket connection - FRIENDSHIP CHECK DISABLED"""
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        print(f"🔌 Connection attempt for room: {self.room_name}")
        
        # Validate room name format (should be user1_user2)
        users = self.room_name.split('_')
        if len(users) != 2:
            print(f"❌ Invalid room name format: {self.room_name}")
            await self.close()
            return

        # Check for invalid usernames
        if not users[0] or not users[1] or users[0] == 'undefined' or users[1] == 'undefined':
            print(f"❌ Invalid usernames in room: {users[0]}, {users[1]}")
            await self.close()
            return

        # FRIENDSHIP CHECK DISABLED - ACCEPT ALL CONNECTIONS
        print(f"✅ Accepting connection for {users[0]} <-> {users[1]} (friendship check disabled)")
        
        # Add to channel group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"✅ WebSocket connected to room: {self.room_group_name}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            print(f"🔌 Disconnected from room: {self.room_group_name} (code: {close_code})")

    async def receive(self, text_data):
        """Handle incoming messages, typing indicators, and read receipts"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')
            
            print(f"📥 Received data: type={message_type}, data={data}")
            
            # READ RECEIPT
            if message_type == 'read_receipt':
                sender_username = data.get('sender')
                
                print(f"👁️ Read receipt from {sender_username}")
                
                # Broadcast read receipt to other user
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'read_receipt',
                        'reader': sender_username
                    }
                )
                return
            
            # TYPING INDICATOR
            if message_type == 'typing':
                sender_username = data.get('sender')
                is_typing = data.get('typing', False)
                
                print(f"⌨️ Typing indicator: {sender_username} is {'typing' if is_typing else 'stopped typing'}")
                
                # Broadcast typing status to other user in the room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'sender': sender_username,
                        'typing': is_typing
                    }
                )
                return
            
            # REGULAR MESSAGE
            message_content = data.get('message')
            sender_username = data.get('sender')

            print(f"💬 Processing message: sender={sender_username}, content={message_content[:50] if message_content else 'None'}...")

            if not message_content or not sender_username:
                print("❌ Invalid message data received")
                await self.send(text_data=json.dumps({
                    'error': 'Invalid message format'
                }))
                return

            # Determine receiver from room name
            users = self.room_name.split('_')
            receiver_username = users[1] if users[0] == sender_username else users[0]

            print(f"📨 Message from {sender_username} to {receiver_username}: {message_content[:50]}...")

            # Save message to database
            print(f"🔄 About to call save_message...")
            save_result = await self.save_message(sender_username, receiver_username, message_content)
            print(f"🔄 save_message returned: {save_result}")
            
            if save_result['success']:
                # Broadcast to all clients in the room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_content,
                        'sender': sender_username,
                        'message_id': save_result['message_id'],
                        'timestamp': save_result['timestamp']
                    }
                )
                print(f"✅ Message saved and broadcast (ID: {save_result['message_id']})")
            else:
                # Send error back to sender only
                await self.send(text_data=json.dumps({
                    'error': save_result['error']
                }))
                print(f"❌ Failed to save message: {save_result['error']}")

        except json.JSONDecodeError:
            print("❌ Invalid JSON received")
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            print(f"❌ Error in receive: {e}")
            import traceback
            traceback.print_exc()
            await self.send(text_data=json.dumps({
                'error': 'Internal server error'
            }))

    async def chat_message(self, event):
        """Send message to WebSocket client"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'sender': event['sender'],
            'message_id': event.get('message_id'),
            'timestamp': event.get('timestamp')
        }))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket client"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender': event['sender'],
            'typing': event['typing']
        }))

    async def read_receipt(self, event):
        """Send read receipt to WebSocket client"""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'reader': event['reader']
        }))


class StatusConsumer(AsyncWebsocketConsumer):
    """Handles user online/offline status"""
    
    async def connect(self):
        """Handle status WebSocket connection"""
        self.user = self.scope["url_route"]["kwargs"]["username"]
        self.room_group_name = "user_status"
        
        print(f"👤 Status connection for user: {self.user}")
        
        # Add to status group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        # Broadcast that user is online
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "status_update",
                "user": self.user,
                "status": "online"
            }
        )
        print(f"✅ {self.user} is now ONLINE")

    async def disconnect(self, close_code):
        """Handle status WebSocket disconnection"""
        # Broadcast that user is offline
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "status_update",
                "user": self.user,
                "status": "offline"
            }
        )
        
        # Remove from status group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"🔴 {self.user} is now OFFLINE")

    async def status_update(self, event):
        """Send status update to WebSocket client"""
        await self.send(text_data=json.dumps({
            "user": event["user"],
            "status": event["status"]
        }))