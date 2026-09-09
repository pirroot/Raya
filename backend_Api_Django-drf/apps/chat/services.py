import logging
from django.db import transaction
from django.utils import timezone
from apps.chat.models import Conversation, Message
from apps.common.exceptions import APIException
from apps.users.models import User

logger = logging.getLogger(__name__)


class ChatService:
    """سرویس مدیریت چت"""

    def __init__(self, user):
        self.user = user

    def get_or_create_conversation(self, participant_id: str):
        """دریافت یا ایجاد مکالمه با کاربر دیگر"""
        try:
            other_user = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            raise APIException("کاربر مورد نظر یافت نشد")

        if other_user.id == self.user.id:
            raise APIException("نمی‌توانید با خودتان مکالمه ایجاد کنید")

        # پیدا کردن مکالمه موجود
        conversation = (
            Conversation.objects.filter(participants=self.user)
            .filter(participants=other_user)
            .first()
        )

        if conversation:
            return conversation

        # ایجاد مکالمه جدید
        with transaction.atomic():
            conversation = Conversation.objects.create()
            conversation.participants.add(self.user, other_user)

        return conversation

    def get_user_conversations(self):
        """دریافت لیست مکالمات کاربر"""
        return Conversation.objects.filter(participants=self.user).prefetch_related(
            "participants", "messages"
        )

    def get_conversation_detail(self, conversation_id: str):
        """دریافت جزئیات یک مکالمه"""
        try:
            conversation = Conversation.objects.get(
                id=conversation_id, participants=self.user
            )
            return conversation
        except Conversation.DoesNotExist:
            raise APIException("مکالمه یافت نشد", status_code=404)

    def send_message(self, conversation_id: str, content: str):
        """ارسال پیام"""
        conversation = self.get_conversation_detail(conversation_id)

        with transaction.atomic():
            message = Message.objects.create(
                conversation=conversation, sender=self.user, content=content
            )

            conversation.last_message = content
            conversation.last_message_at = timezone.now()
            conversation.save(update_fields=["last_message", "last_message_at"])

        return message

    def mark_messages_as_read(self, conversation_id: str):
        """علامت‌گذاری پیام‌ها به عنوان خوانده شده"""
        conversation = self.get_conversation_detail(conversation_id)

        updated = (
            conversation.messages.filter(is_read=False)
            .exclude(sender=self.user)
            .update(is_read=True, read_at=timezone.now())
        )

        return updated

    def get_unread_count(self):
        """دریافت تعداد پیام‌های خوانده نشده"""
        return (
            Message.objects.filter(conversation__participants=self.user, is_read=False)
            .exclude(sender=self.user)
            .count()
        )
