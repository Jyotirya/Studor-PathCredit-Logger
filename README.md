# Studor PathCredit Logger

A Django app for students to log and track milestone activities with filtering, search, and editing.

## Quick Start

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000 in your browser.

## What's Built

- **Authentication**: Register, login, logout with JWT tokens stored in cookies
- **Activity Logging**: Create activities with name, category (Academic, Technical, Cultural, Sports), and date
- **Activity Management**: View, search, filter by category, sort, edit, delete activities
- **Per-User Data**: Each user only sees their own activities
- **Responsive UI**: Clean dashboard that works on mobile and desktop
- **No Page Reloads**: All create/filter/search/edit/delete actions happen instantly with JavaScript

## Project Structure

- `studor_pathcredit_logger/` – Django settings, root URLs, ASGI/WSGI
- `activities/` – Models, serializers, API views, page views, URLs
- `templates/` – Register, login, dashboard HTML pages
- `static/css/` – Styling
- `static/js/` – Frontend logic and API interactions
- `manage.py` – Django management script

## What I'd Add in Another Hour

- User activity statistics (total count, breakdown by category)
- Export activities as CSV
- Enhanced UI & Dark mode toggle
- Activity duplication feature (copy existing activity)
- Bulk delete selected activities
- File upload/attachment for activities
