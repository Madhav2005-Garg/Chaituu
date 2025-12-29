from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'content', 'timestamp']
    list_filter = ['timestamp', 'sender', 'receiver']
    search_fields = ['sender__username', 'receiver__username', 'content']
    ordering = ['-timestamp']