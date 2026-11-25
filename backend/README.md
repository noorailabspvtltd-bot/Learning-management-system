# Student Management Module

Part of the Learning Management System (LMS). This module handles student records: add, view, update, delete, search and pagination.

**Branch:** `feature/student-management`
**Status:** Backend API complete. Frontend in progress.

## Tech Stack

- Backend: Python 3.13, Django, Django REST Framework
- Database: PostgreSQL
- Frontend: React + TypeScript + Tailwind CSS (in progress)

## Student Model

| Field | Type | Notes |
|---|---|---|
| id | Integer | Primary key (use this for foreign keys in other modules) |
| first_name | String | Required |
| last_name | String | Required |
| email | Email | Required, unique |
| phone | String | Optional |
| date_of_birth | Date | Optional |
| gender | String | Optional |
| address | Text | Optional |
| enrollment_date | Date | Set automatically |
| is_active | Boolean | Default: true |
| created_at / updated_at | DateTime | Set automatically |

## API Endpoints

Base URL: `http://127.0.0.1:8000/api`

| Action | Method | Endpoint |
|---|---|---|
| List students (paginated, 10 per page) | GET | `/students/` |
| Search by name or email | GET | `/students/?search=faizan` |
| Add a student | POST | `/students/` |
| View a student | GET | `/students/{id}/` |
| Update a student | PUT / PATCH | `/students/{id}/` |
| Delete a student | DELETE | `/students/{id}/` |

## Local Setup

### 1. Clone and switch to the branch

```bash
git clone <repo-url>
cd Learning-management-system
git checkout feature/student-management
```

### 2. Create the database

Create an empty PostgreSQL database named `lms_db` (for example in pgAdmin).

### 3. Backend

```bash
cd backend
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a file `backend/.env` (never commit this file):

```
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Then run:

```bash
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000/api/students/ to test the API.

## Folder Structure

```
backend/
  config/      Django project settings and main URLs
  students/    Student app (models, serializers, views, urls)
  manage.py
  requirements.txt
```

## Notes for Other Modules

Batch, Attendance and Assignment modules can link to students with
`ForeignKey("students.Student")`. Please tell me before any change to the Student model so migrations don't conflict.