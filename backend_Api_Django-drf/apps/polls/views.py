from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from .models import Poll, PollOption, PollVote
from .serializers import PollSerializer, PollVoteSerializer


class PollListView(generics.ListAPIView):
    """GET /api/v1/polls/ - لیست نظرسنجی‌ها"""

    serializer_class = PollSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Poll.objects.filter(
            is_active=True, starts_at__lte=timezone.now(), ends_at__gte=timezone.now()
        ).order_by("-created_at")


class PastPollsView(generics.ListAPIView):
    """GET /api/v1/polls/past/ - نظرسنجی‌های گذشته"""

    serializer_class = PollSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Poll.objects.filter(ends_at__lt=timezone.now()).order_by("-ends_at")


class PollVoteView(APIView):
    """POST /api/v1/polls/<id>/vote/ - ثبت رأی"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            poll = Poll.objects.get(
                pk=pk,
                is_active=True,
                starts_at__lte=timezone.now(),
                ends_at__gte=timezone.now(),
            )
        except Poll.DoesNotExist:
            return Response(
                {"error": "نظرسنجی یافت نشد یا غیرفعال است"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # چک کردن رأی قبلی
        if PollVote.objects.filter(user=request.user, poll=poll).exists():
            return Response(
                {"error": "شما قبلاً در این نظرسنجی شرکت کرده‌اید"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        option_id = request.data.get("option_id")
        if not option_id:
            return Response(
                {"error": "گزینه مورد نظر را انتخاب کنید"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            option = PollOption.objects.get(pk=option_id, poll=poll)
        except PollOption.DoesNotExist:
            return Response(
                {"error": "گزینه یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )

        # ثبت رأی
        vote = PollVote.objects.create(user=request.user, poll=poll, option=option)

        # افزایش تعداد آراء
        option.votes += 1
        option.save(update_fields=["votes"])

        serializer = PollVoteSerializer(vote)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
