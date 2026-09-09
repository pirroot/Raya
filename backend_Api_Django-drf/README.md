# Hoshyar Backend (Django + DRF)

The Hoshyar backend, rewritten with **Django** and **Django REST Framework (DRF)** instead of NestJS, with a focus on:

* Docker Compose
* PostgreSQL
* Redis
* Modular architecture
* Service Layer
* Flexible RBAC

Designed to support multiple admin panels (main / teacher).

## Running the Project (Docker Compose Only)

```bash
cp .env.example .env
# Update the .env values, especially SECRET_KEY and POSTGRES_PASSWORD

docker compose up --build
```

After the services are up:

```bash
docker compose exec django python manage.py createsuperuser
```

* API:      http://localhost:8000/api/v1/
* Swagger:  http://localhost:8000/api/docs/
* Admin:    http://localhost:8000/admin/

## Project Structure

```text
config/            Django configuration (settings/base|dev|prod, urls, celery, wsgi/asgi)
apps/
  common/          Base models, pagination, exception handler, shared permissions
  users/           Mobile authentication (OTP) + JWT
  rbac/            Flexible multi-panel role-based access control (Panel/Role/Permission/UserRole)
  education/       Courses, chapters, lessons, enrollments, progress tracking
  coins/           Platform virtual currency (ledger-based)
  wallet/          Fiat wallet (ledger-based)
  banners/         Promotional banners
  storage/         Centralized file and upload management
  ai/              Foundation for AI-powered features
tests/             Integration tests (unit tests are located alongside each app, e.g. apps/users/tests)
```

## Architecture Highlights

* **Service Layer**: Business logic lives in each app's `services.py`, not in `views.py`.
  Views are responsible only for validating serializers and invoking the appropriate service.

* **Flexible RBAC**: `Panel` (main/teacher) → `Role` → `Permission` → `UserRole`.
  To add a new panel (such as the teacher panel), simply create a new `Panel` and its associated roles.
  The `User` model remains unchanged.

* **Ledger-Based Coins & Wallet**: Balances are never updated directly.
  Instead, they are derived from transaction history (`CoinTransaction` / `WalletTransaction`) and cached in Redis for better performance.

* **Environment-Based Configuration**: Everything is configured through environment variables (`.env`).
  No sensitive information is stored in the source code.

## Running Tests

```bash
docker compose exec django pytest
```

## Remaining Tasks

* Integrate a real SMS provider in `apps/users/tasks.py`
* Integrate a payment gateway for the `wallet` and `coins` modules
* Implement the actual AI provider logic in `apps/ai/services.py`
* Create the initial migration (`python manage.py makemigrations`), as migrations have not yet been generated
* Seed the initial roles and permissions (via data migrations or fixtures) for the teacher panel
