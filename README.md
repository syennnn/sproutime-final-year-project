# Sproutime

Sproutime is a beginner-friendly Django project for a gamified productivity app. Users will create tasks, add subtasks, grow a virtual garden, and complete focus sessions.

## Tech Stack

- Backend: Django
- Database: MySQL
- Frontend: Django templates + Bootstrap + custom CSS
- JavaScript for page interactivity
- OpenAI API support planned later

## Setup

1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - Windows:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the example environment file and update it:
   ```bash
   copy .env.example .env
   ```
5. Create a MySQL database for Sproutime.
6. Run migrations:
   ```bash
   python manage.py migrate
   ```
7. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Project Structure

- `sproutime_project/`: Django project configuration
- `accounts/`, `tasks/`, `garden/`, `focus/`, `dashboard/`: app folders
- `templates/`: base and page templates
- `static/`: CSS, JavaScript, and images

## Notes

This is the initial project foundation. App logic and features will be built step by step.
