from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django.db import models
from apps.common.exceptions import ServiceException
from apps.coins.services import CoinService
from apps.wallet.services import WalletService
from .models import PsychologyTest, TestQuestion, TestOption, TestAttempt, TestAnswer
from .serializers import (
    PsychologyTestSerializer,
    PsychologyTestDetailSerializer,
    TestQuestionSerializer,
    TestAttemptSerializer,
    CompleteTestSerializer,
)


class TestListView(generics.ListAPIView):
    """GET /api/v1/psychology-tests/"""

    serializer_class = PsychologyTestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = PsychologyTest.objects.filter(is_active=True)

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search)
                | models.Q(description__icontains=search)
            )

        return queryset


class TestDetailView(generics.RetrieveAPIView):
    """GET /api/v1/psychology-tests/<id>/"""

    queryset = PsychologyTest.objects.filter(is_active=True)
    serializer_class = PsychologyTestDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class TestQuestionsView(generics.ListAPIView):
    """GET /api/v1/psychology-tests/<id>/questions/"""

    serializer_class = TestQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        test_id = self.kwargs.get("pk")
        return TestQuestion.objects.filter(test_id=test_id).order_by("order")


class TestPurchaseView(APIView):
    """POST /api/v1/psychology-tests/<id>/purchase/"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            test = PsychologyTest.objects.get(pk=pk, is_active=True)
        except PsychologyTest.DoesNotExist:
            return Response({"error": "تست یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        # چک کردن اینکه کاربر قبلاً تست رو نداشته باشه
        if TestAttempt.objects.filter(user=request.user, test=test).exists():
            return Response(
                {"error": "شما قبلاً این تست را خریداری کرده‌اید"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_method = request.data.get("payment_method", "wallet")

        if payment_method == "wallet":
            if test.price <= 0:
                # تست رایگان
                attempt = TestAttempt.objects.create(
                    user=request.user, test=test, total_questions=test.questions_count
                )
                return Response(
                    {"detail": "تست با موفقیت فعال شد.", "attempt_id": attempt.id}
                )

            wallet_service = WalletService(request.user)
            if wallet_service.get_balance() < test.price:
                return Response(
                    {"error": "موجودی کیف پول کافی نیست"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            wallet_service.withdraw(test.price, f"خرید تست {test.title}")

        elif payment_method == "coin":
            if test.coin_price <= 0:
                attempt = TestAttempt.objects.create(
                    user=request.user, test=test, total_questions=test.questions_count
                )
                return Response(
                    {"detail": "تست با موفقیت فعال شد.", "attempt_id": attempt.id}
                )

            coin_service = CoinService(request.user)
            if coin_service.get_balance() < test.coin_price:
                return Response(
                    {"error": "موجودی سکه کافی نیست"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            coin_service.debit(test.coin_price, "purchase_test", str(test.id))

        else:
            return Response(
                {"error": "روش پرداخت نامعتبر"}, status=status.HTTP_400_BAD_REQUEST
            )

        attempt = TestAttempt.objects.create(
            user=request.user, test=test, total_questions=test.questions_count
        )

        return Response(
            {
                "detail": "تست با موفقیت خریداری شد.",
                "attempt_id": attempt.id,
                "test": PsychologyTestSerializer(
                    test, context={"request": request}
                ).data,
            }
        )


class TestCompleteView(APIView):
    """POST /api/v1/psychology-tests/<id>/complete/"""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            attempt = TestAttempt.objects.get(
                user=request.user, test_id=pk, status=TestAttempt.Status.IN_PROGRESS
            )
        except TestAttempt.DoesNotExist:
            return Response(
                {"error": "تست فعالی برای شما وجود ندارد"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompleteTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        answers_data = serializer.validated_data["answers"]
        score = 0

        for answer_data in answers_data:
            try:
                question = TestQuestion.objects.get(
                    id=answer_data["question_id"], test_id=pk
                )
            except TestQuestion.DoesNotExist:
                continue

            try:
                selected_option = TestOption.objects.get(
                    id=answer_data["option_id"], question=question
                )
            except TestOption.DoesNotExist:
                continue

            is_correct = selected_option.is_correct
            if is_correct:
                score += 1

            TestAnswer.objects.create(
                attempt=attempt,
                question=question,
                selected_option=selected_option,
                is_correct=is_correct,
            )

        attempt.score = score
        attempt.status = TestAttempt.Status.COMPLETED
        attempt.completed_at = timezone.now()
        attempt.save(update_fields=["score", "status", "completed_at"])
        attempt.calculate_percentage()

        return Response(
            {
                "detail": "تست با موفقیت تکمیل شد.",
                "attempt": TestAttemptSerializer(attempt).data,
            }
        )


class TestResultView(generics.RetrieveAPIView):
    """GET /api/v1/psychology-tests/<id>/result/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            attempt = TestAttempt.objects.get(
                user=request.user, test_id=pk, status=TestAttempt.Status.COMPLETED
            )
        except TestAttempt.DoesNotExist:
            return Response(
                {"error": "نتیجه‌ای برای این تست پیدا نشد"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TestAttemptSerializer(attempt)
        return Response(serializer.data)


class MyTestResultsView(generics.ListAPIView):
    """GET /api/v1/psychology-tests/results/"""

    serializer_class = TestAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TestAttempt.objects.filter(
            user=self.request.user, status=TestAttempt.Status.COMPLETED
        ).order_by("-completed_at")
