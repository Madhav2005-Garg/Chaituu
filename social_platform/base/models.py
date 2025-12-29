# base/models.py
from django.db import models
from django.contrib.auth.models import User

class Invitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    sender = models.ForeignKey(User, related_name="sent_invitations", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_invitations", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f"{self.sender.username} to {self.receiver.username} ({self.status})"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) 
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to='profile_pics', default='default.jpg')

    def __str__(self):
        return self.user.username

class Message(models.Model):
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='base_sent_messages'
    )
    receiver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='base_received_messages'
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender.username} to {self.receiver.username}: {self.content[:20]}"