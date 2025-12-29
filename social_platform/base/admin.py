from django.contrib import admin
from .models import Profile, Message, Invitation

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'bio']
    search_fields = ['user__username']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'content', 'timestamp']
    list_filter = ['timestamp', 'sender', 'receiver']
    search_fields = ['sender__username', 'receiver__username', 'content']
    ordering = ['-timestamp']

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'status', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['sender__username', 'receiver__username']