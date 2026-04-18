from django.contrib import admin

from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'category', 'date', 'created_at')
    list_filter = ('category', 'date')
    search_fields = ('name', 'user__username')
