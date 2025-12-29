from django.test import TestCase
from django.contrib.auth.models import User
from .models import Invitation, Message, Profile

class InvitationModelTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.user2 = User.objects.create_user(username='user2', password='pass123')
    
    def test_create_invitation(self):
        invitation = Invitation.objects.create(
            sender=self.user1,
            receiver=self.user2,
            status='pending'
        )
        self.assertEqual(invitation.status, 'pending')
        self.assertEqual(str(invitation), 'user1 to user2 (pending)')

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