from django.test import TestCase
from django.contrib.auth.models import User
from .models import Message

class MessageModelTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.user2 = User.objects.create_user(username='user2', password='pass123')
    
    def test_create_message(self):
        message = Message.objects.create(
            sender=self.user1,
            receiver=self.user2,
            content='Hello!'
        )
        self.assertEqual(message.content, 'Hello!')
        self.assertEqual(message.sender, self.user1)
        self.assertEqual(message.receiver, self.user2)
        
    def test_message_ordering(self):
        msg1 = Message.objects.create(sender=self.user1, receiver=self.user2, content='First')
        msg2 = Message.objects.create(sender=self.user1, receiver=self.user2, content='Second')
        
        messages = Message.objects.all()
        self.assertEqual(messages[0], msg1)
        self.assertEqual(messages[1], msg2)