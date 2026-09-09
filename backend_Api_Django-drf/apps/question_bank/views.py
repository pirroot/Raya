from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from .models import Category, Question, QuestionLike
from .serializers import CategorySerializer, QuestionSerializer
from .services import QuestionService
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.wallet.services import WalletService


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Question.objects.filter(is_approved=True)

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)

        price_type = self.request.query_params.get("price_type")
        if price_type:
            queryset = queryset.filter(price_type=price_type)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search)
                | models.Q(description__icontains=search)
                | models.Q(teacher__icontains=search)
            )

        sort = self.request.query_params.get("sort", "-created_at")
        queryset = queryset.order_by(sort)

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class QuestionDetailView(generics.RetrieveAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"
    lookup_url_kwarg = "id"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=["views"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class QuestionCreateView(generics.CreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        file = self.request.FILES.get("file")
        if file:
            serializer.save(
                user=self.request.user,
                file_name=file.name,
                file_size=file.size,
                file_mime_type=file.content_type or "",
            )
        else:
            serializer.save(user=self.request.user)


class QuestionDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            question = get_object_or_404(Question, id=pk)

            # ✅ چک کن اگه پولی هست و خریداری نشده
            if question.price_type == Question.PriceType.PAID:
                if not question.purchased_by.filter(id=request.user.id).exists():
                    return Response(
                        {"error": "شما این سوال را خریداری نکرده‌اید"},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            service = QuestionService(request.user)
            result = service.download_question(pk)
            return Response(result, status=status.HTTP_200_OK)

        except Question.DoesNotExist:
            return Response(
                {"error": "سوال یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class QuestionLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service = QuestionService(request.user)
            result = service.toggle_like(pk)
            return Response(result, status=status.HTTP_200_OK)
        except Question.DoesNotExist:
            return Response(
                {"error": "سوال یافت نشد"}, status=status.HTTP_404_NOT_FOUND
            )


class QuestionPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        question = get_object_or_404(Question, id=pk)

        # ✅ چک کن قبلا خریداری شده؟
        if question.purchased_by.filter(id=request.user.id).exists():
            return Response(
                {"error": "این سوال قبلا خریداری شده است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ اگه رایگانه، فقط ثبت کن
        if question.price_type == Question.PriceType.FREE:
            question.purchased_by.add(request.user)
            return Response(
                {
                    "success": True,
                    "message": "دانلود رایگان",
                    "is_free": True,
                },
                status=status.HTTP_200_OK,
            )

        # ✅ چک کن موجودی کیف پول
        wallet_service = WalletService(user=request.user)
        balance = wallet_service.get_balance()

        if balance < question.price:
            return Response(
                {"error": "موجودی کیف پول کافی نیست"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ کسر از کیف پول
        wallet_service.withdraw(
            amount=question.price, description=f"خرید سوال: {question.title}"
        )

        # ✅ ثبت خرید
        question.purchased_by.add(request.user)

        return Response(
            {
                "success": True,
                "message": "خرید با موفقیت انجام شد",
                "balance": wallet_service.get_balance(),
            },
            status=status.HTTP_200_OK,
        )
