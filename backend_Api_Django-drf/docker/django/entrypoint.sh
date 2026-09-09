#!/bin/sh

echo "⏳ Waiting for postgres..."
while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
    sleep 0.1
done
echo "✅ PostgreSQL started"

python manage.py migrate
python manage.py collectstatic --noinput

python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        mobile='09123456789',
        password='admin123',
        first_name='Admin',
        last_name='Hoshyar'
    )
    print('✅ Superuser created!')
"

exec python manage.py runserver 0.0.0.0:8000
