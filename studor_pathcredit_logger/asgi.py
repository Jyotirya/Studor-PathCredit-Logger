import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studor_pathcredit_logger.settings')

application = get_asgi_application()
