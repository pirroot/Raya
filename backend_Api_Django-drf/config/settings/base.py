"""
Base settings shared across all environments.
All secrets/config must come from environment variables — nothing sensitive is hardcoded here.
"""

from datetime import timedelta
from pathlib import Path

import environ
from django.templatetags.static import static
from django.urls import NoReverseMatch, reverse
from django.utils.translation import gettext_lazy as _


def safe_admin_link(viewname):
    """
    Wraps reverse() for Unfold sidebar links so a wrong/renamed model name
    hides that sidebar item instead of crashing the whole admin (NoReverseMatch).
    """

    def _resolve(request):
        try:
            return reverse(viewname)
        except NoReverseMatch:
            return None

    return _resolve


BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "simpleui",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "django_filters",
    "corsheaders",
    "axes",
    "django_celery_beat",
    "nested_admin",
]

LOCAL_APPS = [
    "apps.common",
    "apps.users",
    "apps.rbac",
    "apps.education",
    "apps.coins",
    "apps.wallet",
    "apps.banners",
    "apps.storage",
    "apps.ai",
    "apps.market",
    "apps.suggestions",
    "apps.qna",
    "apps.competitions",
    "apps.announcements",
    "apps.chat",
    "apps.contact",
    "apps.gifts",
    "apps.schedule",
    "apps.polls",
    "apps.psychology_tests",
    "apps.question_bank",
    "apps.payment",
    "apps.certificates",
    "apps.notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "axes.middleware.AxesMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.common.middleware.RequestLogMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database (Postgres)
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST", default="postgres"),
        "PORT": env("POSTGRES_PORT", default="5432"),
        "CONN_MAX_AGE": 60,
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Auth / Custom user model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "users.User"

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# i18n / timezone
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "fa"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_L10N = True
USE_TZ = True

LOCALE_PATHS = [BASE_DIR / "locale"]

# ---------------------------------------------------------------------------
# Static / media
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "mediafiles"

# ---------------------------------------------------------------------------
# Cache / Redis
# ---------------------------------------------------------------------------
REDIS_URL = (
    f"redis://:{env('REDIS_PASSWORD', default='')}@{env('REDIS_HOST', default='redis')}:"
    f"{env('REDIS_PORT', default='6379')}/{env('REDIS_DB', default='0')}"
)

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://redis:6379/1")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://redis:6379/2")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# ---------------------------------------------------------------------------
# DRF / JWT / API docs
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
    "DEFAULT_THROTTLE_RATES": {
        "otp_request": "5/min",
        "otp_verify": "10/min",
        "auth": "20/min",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "EXCEPTION_HANDLER": "apps.common.exceptions.custom_exception_handler",
    "DATETIME_FORMAT": "iso-8601",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=env.int("ACCESS_TOKEN_LIFETIME_MIN", default=15)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=env.int("REFRESH_TOKEN_LIFETIME_DAYS", default=7)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Hoshyar API",
    "DESCRIPTION": "Hoshyar backend API (Django + DRF)",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/v[0-9]+",
}

# ===== CSRF =====
CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_USE_SESSIONS = False
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# ===== CORS =====
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "x-csrf-token",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_EXPOSE_HEADERS = [
    "content-type",
    "x-csrf-token",
]

# ---------------------------------------------------------------------------
# Security hardening (django-axes brute force protection)
# ---------------------------------------------------------------------------
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = 1  # hours
AXES_LOCKOUT_PARAMETERS = ["ip_address", "username"]

# ---------------------------------------------------------------------------
# Project-specific: OTP / mobile auth
# ---------------------------------------------------------------------------
OTP_TTL_SECONDS = env.int("OTP_TTL_SECONDS", default=120)
OTP_CODE_LENGTH = env.int("OTP_CODE_LENGTH", default=5)
SMS_PROVIDER_API_KEY = env("SMS_PROVIDER_API_KEY", default="")

TEACHER_PANEL_HOST = env("TEACHER_PANEL_HOST", default="teacher.domain.ir")
MAIN_PANEL_HOST = env("MAIN_PANEL_HOST", default="domain.ir")

# ---------------------------------------------------------------------------
# Admin panel customization
# ---------------------------------------------------------------------------
ADMIN_SITE_HEADER = "پنل مدیریت هشیار"
ADMIN_SITE_TITLE = "پنل مدیریت هشیار"
ADMIN_INDEX_TITLE = "داشبورد مدیریت"


# # --------------------------------------------------------------------------- (غیرفعال - simpleui جایگزینش شد)
# # Unfold Settings
# # ---------------------------------------------------------------------------
# UNFOLD = {
#     "SITE_TITLE": "پنل مدیریت هشیار",
#     "SITE_HEADER": "هشیار",
#     "SITE_SUBHEADER": "داشبورد مدیریت",
#     "SITE_URL": "/",
#     "STYLES": [
#         lambda request: static("admin/css/custom.css"),
#     ],
#     "BORDER_RADIUS": "10px",
#     "SHOW_HISTORY": True,
#     "SHOW_VIEW_ON_SITE": True,
#     "SHOW_BACK_BUTTON": True,
#     "COLORS": {
#         "base": {
#             "50": "249 250 251",
#             "100": "243 244 246",
#             "200": "229 231 235",
#             "300": "209 213 219",
#             "400": "156 163 175",
#             "500": "107 114 128",
#             "600": "75 85 99",
#             "700": "55 65 81",
#             "800": "31 41 55",
#             "900": "17 24 39",
#             "950": "3 7 18",
#         },
#         "primary": {
#             "50": "239 246 255",
#             "100": "219 234 254",
#             "200": "191 219 254",
#             "300": "147 197 253",
#             "400": "96 165 250",
#             "500": "37 99 235",
#             "600": "29 78 216",
#             "700": "30 64 175",
#             "800": "30 58 138",
#             "900": "23 37 84",
#             "950": "12 20 47",
#         },
#     },
#     # -------------------------------------------------------------------
#     # نکته‌ی مهم: هر عضو navigation باید یه "گروه" باشه که کلید "items"
#     # داره (لیستی از لینک‌ها). یه لینک تنها بدون "items" باعث
#     # KeyError: 'items' توی get_sidebar_list میشه.
#     # -------------------------------------------------------------------
#     "SIDEBAR": {
#         "show_search": True,
#         "show_all_applications": True,
#         "navigation": [
#             # ===== داشبورد: حتی یه لینک تنها هم باید توی گروه با items باشه =====
#             {
#                 "title": None,
#                 "separator": False,
#                 "collapsible": False,
#                 "items": [
#                     {
#                         "title": _("داشبورد"),
#                         "icon": "dashboard",
#                         "link": "/admin/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                 ],
#             },
#             {
#                 "title": _("کاربران و دسترسی‌ها"),
#                 "separator": True,
#                 "items": [
#                     {
#                         "title": _("کاربران"),
#                         "icon": "person",
#                         "link": "/admin/users/user/",
#                         "permission": lambda request: request.user.is_superuser,
#                     },
#                     {
#                         "title": _("نقش‌ها و دسترسی‌ها"),
#                         "icon": "shield",
#                         "link": "/admin/rbac/role/",
#                         "permission": lambda request: request.user.is_superuser,
#                     },
#                     {
#                         "title": _("درخواست‌های OTP"),
#                         "icon": "sms",
#                         "link": "/admin/users/otprequest/",
#                         "permission": lambda request: request.user.is_superuser,
#                     },
#                 ],
#             },
#             {
#                 "title": _("محتوا و آموزش"),
#                 "separator": True,
#                 "items": [
#                     {
#                         "title": _("دوره‌ها"),
#                         "icon": "school",
#                         "link": "/admin/education/course/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("فصل‌ها"),
#                         "icon": "format_list_numbered",
#                         "link": "/admin/education/chapter/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("درس‌ها"),
#                         "icon": "play_circle",
#                         "link": "/admin/education/lesson/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("ثبت‌نام‌ها"),
#                         "icon": "assignment_ind",
#                         "link": "/admin/education/enrollment/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("دسته‌بندی‌ها"),
#                         "icon": "category",
#                         "link": "/admin/education/category/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                 ],
#             },
#             {
#                 "title": _("بانک سوالات"),
#                 "separator": True,
#                 "items": [
#                     {
#                         "title": _("سوالات"),
#                         "icon": "quiz",
#                         "link": "/admin/question_bank/question/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("دسته‌بندی سوالات"),
#                         "icon": "category",
#                         "link": "/admin/question_bank/category/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("دانلودها"),
#                         "icon": "download",
#                         "link": "/admin/question_bank/questiondownload/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("لایک‌ها"),
#                         "icon": "favorite",
#                         "link": "/admin/question_bank/questionlike/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                 ],
#             },
#             {
#                 "title": _("مالی"),
#                 "separator": True,
#                 "items": [
#                     {
#                         "title": _("کیف پول"),
#                         "icon": "account_balance_wallet",
#                         "link": "/admin/wallet/wallettransaction/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("سکه‌ها"),
#                         "icon": "toll",
#                         "link": "/admin/coins/cointransaction/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("بسته‌های سکه"),
#                         "icon": "shopping_bag",
#                         "link": "/admin/coins/coinpackage/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                 ],
#             },
#             {
#                 "title": _("هوش مصنوعی"),
#                 "separator": True,
#                 "items": [
#                     {
#                         "title": _("مکالمات"),
#                         "icon": "chat",
#                         "link": "/admin/ai/aisession/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("پیام‌ها"),
#                         "icon": "message",
#                         "link": "/admin/ai/aimessage/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("فایل‌ها"),
#                         "icon": "attach_file",
#                         "link": "/admin/ai/aifile/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("مصرف روزانه"),
#                         "icon": "bar_chart",
#                         "link": "/admin/ai/aiusage/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                 ],
#             },
#             {
#                 "title": _("بخش‌های دیگر"),
#                 "separator": True,
#                 "items": [
#                     {
#                         "title": _("آگهی‌ها"),
#                         "icon": "campaign",
#                         "link": "/admin/ads/ad/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("بنرها"),
#                         "icon": "image",
#                         "link": "/admin/banners/banner/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("نظرسنجی‌ها"),
#                         "icon": "poll",
#                         "link": "/admin/polls/poll/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("مسابقات"),
#                         "icon": "emoji_events",
#                         "link": "/admin/competitions/competition/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("برنامه کلاسی"),
#                         "icon": "calendar_month",
#                         "link": "/admin/schedule/classschedule/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("هدایا و تخفیف‌ها"),
#                         "icon": "card_giftcard",
#                         "link": "/admin/gifts/gift/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("تست‌های روانشناسی"),
#                         "icon": "psychology",
#                         "link": "/admin/psychology_tests/psychologytest/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("پرسش و پاسخ"),
#                         "icon": "help",
#                         "link": "/admin/qna/qa/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("پیشنهادات"),
#                         "icon": "lightbulb",
#                         "link": "/admin/suggestions/suggestion/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("اطلاعیه‌ها"),
#                         "icon": "campaign",
#                         "link": "/admin/announcements/announcement/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("پیام‌ها"),
#                         "icon": "chat_bubble",
#                         "link": "/admin/chat/conversation/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("تماس با ما"),
#                         "icon": "contact_mail",
#                         "link": "/admin/contact/contactmessage/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                     {
#                         "title": _("فایل‌های ذخیره‌سازی"),
#                         "icon": "folder",
#                         "link": "/admin/storage/mediafile/",
#                         "permission": lambda request: request.user.is_staff,
#                     },
#                 ],
#             },
#         ],
#     },
# }

# ---------------------------------------------------------------------------
# SimpleUI Settings
# ---------------------------------------------------------------------------
# مستندات: https://newpanjing.github.io/simpleui_docs/config.html
SIMPLEUI_HOME_INFO = False  # اطلاعات سرور توی داشبورد خاموش
SIMPLEUI_ANALYSIS = False  # آنالیز/تلمتری simpleui خاموش
SIMPLEUI_DEFAULT_THEME = (
    "simpleui.css"  # element-ui تم پیش‌فرض. گزینه‌های دیگه: admin.lte.css / layui.css
)

# نکته: اگه بخوای منوی سایدبار رو دستی بسازی (نه بر پایه‌ی پرمیشن‌های واقعی)،
# باید از SIMPLEUI_CONFIG با کلید "menus" استفاده کنی — ولی این کار باعث میشه
# منو دیگه بر اساس دسترسی واقعی کاربر فیلتر نشه. فعلاً خاموشش می‌گذاریم تا
# دسترسی‌های RBAC خودتون دست‌نخورده بمونه.
# SIMPLEUI_CONFIG = {
#     "system_keep": False,
#     "menus": [...],
# }

# آیکون هر اپ/مدل (اختیاری) — کلید فارسی/انگلیسی verbose_name اپ رو بگیر
SIMPLEUI_ICON = {
    "کاربران و دسترسی‌ها": "fas fa-user-shield",
    "آموزش": "fas fa-graduation-cap",
    "بانک سوالات": "fas fa-question-circle",
    "کیف پول": "fas fa-wallet",
    "سکه‌ها": "fas fa-coins",
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
        "simple": {"format": "[%(asctime)s] %(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "apps": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}


# ======= AI Key ========
GAPGPT_API_KEY = env("GAPGPT_API_KEY", default="")

# ===== AI Settings =====
AI_DAILY_FREE_LIMIT = env.int("AI_DAILY_FREE_LIMIT", default=5)
AI_COIN_COST_PER_MESSAGE = env.int("AI_COIN_COST_PER_MESSAGE", default=1)
