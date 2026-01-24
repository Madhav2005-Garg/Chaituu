from django.contrib import admin
from .models import Profile, Invitation

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'bio']
    search_fields = ['user__username']

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'status', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['sender__username', 'receiver__username']