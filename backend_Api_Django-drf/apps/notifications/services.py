import logging
from django.utils import timezone
from django.db import transaction
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def create_notification(
        user,
        notification_type,
        title,
        message,
        link=None,
        priority=Notification.Priority.NORMAL,
        metadata=None,
    ):
        """ایجاد اعلان جدید"""
        try:
            notification = Notification.objects.create(
                user=user,
                type=notification_type,
                priority=priority,
                title=title,
                message=message,
                link=link,
                metadata=metadata or {},
                sent_at=timezone.now(),
            )
            return notification
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None

    @staticmethod
    def get_user_notifications(user, limit=50, only_unread=False):
        """دریافت اعلان‌های کاربر"""
        queryset = Notification.objects.filter(user=user)
        if only_unread:
            queryset = queryset.filter(is_read=False)
        return queryset[:limit]

    @staticmethod
    def mark_as_read(notification_id, user):
        """علامت‌گذاری اعلان به عنوان خوانده شده"""
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False

    @staticmethod
    def mark_all_as_read(user):
        """علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده"""
        return Notification.objects.filter(user=user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )

    @staticmethod
    def get_unread_count(user):
        """دریافت تعداد اعلان‌های خوانده نشده"""
        return Notification.objects.filter(user=user, is_read=False).count()

    @staticmethod
    def delete_old_notifications(days=30):
        """حذف اعلان‌های قدیمی"""
        cutoff = timezone.now() - timezone.timedelta(days=days)
        count, _ = Notification.objects.filter(
            created_at__lt=cutoff, is_read=True
        ).delete()
        return count
