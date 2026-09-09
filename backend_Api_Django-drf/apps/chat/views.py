from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.chat.models import Conversation, Message
from apps.chat.serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
)
from apps.chat.services import ChatService
from apps.common.pagination import StandardPagination


class ConversationListView(generics.ListAPIView):
    """لیست مکالمات کاربر"""

    permission_classes = [IsAuthenticated]
    serializer_class = ConversationListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        service = ChatService(self.request.user)
        return service.get_user_conversations()


class ConversationCreateView(APIView):
    """ایجاد مکالمه جدید"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConversationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = ChatService(request.user)
        conversation = service.get_or_create_conversation(
            serializer.validated_data["participant_id"]
        )

        return Response(
            ConversationDetailSerializer(
                conversation, context={"request": request}
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(generics.RetrieveAPIView):
    """جزئیات مکالمه"""

    permission_classes = [IsAuthenticated]
    serializer_class = ConversationDetailSerializer
    lookup_field = "id"

    def get_queryset(self):
        service = ChatService(self.request.user)
        return service.get_user_conversations()


class MessageSendView(APIView):
    """ارسال پیام"""

    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        content = request.data.get("content")
        if not content or not content.strip():
            return Response(
                {"error": "متن پیام نمی‌تواند خالی باشد"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = ChatService(request.user)
        message = service.send_message(conversation_id, content)

        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MessageListView(generics.ListAPIView):
    """دریافت پیام‌های یک مکالمه"""

    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        service = ChatService(self.request.user)
        conversation = service.get_conversation_detail(self.kwargs["conversation_id"])
        return conversation.messages.all().order_by("created_at")


class MarkAsReadView(APIView):
    """علامت‌گذاری پیام‌ها به عنوان خوانده شده"""

    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        service = ChatService(request.user)
        count = service.mark_messages_as_read(conversation_id)

        return Response({"success": True, "marked_count": count})


class UnreadCountView(APIView):
    """دریافت تعداد پیام‌های خوانده نشده"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = ChatService(request.user)
        count = service.get_unread_count()

        return Response({"unread_count": count})
