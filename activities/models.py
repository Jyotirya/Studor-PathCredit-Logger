from django.conf import settings
from django.db import models


class Activity(models.Model):
    class Category(models.TextChoices):
        ACADEMIC = 'Academic', 'Academic'
        TECHNICAL = 'Technical', 'Technical'
        CULTURAL = 'Cultural', 'Cultural'
        SPORTS = 'Sports', 'Sports'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-date', '-created_at')

    def __str__(self):
        return f'{self.user.username}: {self.name}'
