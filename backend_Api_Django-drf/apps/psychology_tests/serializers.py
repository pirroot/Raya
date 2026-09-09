from rest_framework import serializers
from .models import PsychologyTest, TestQuestion, TestOption, TestAttempt, TestAnswer


class TestOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestOption
        fields = ["id", "label", "score", "is_correct"]
        read_only_fields = ["score", "is_correct"]


class TestQuestionSerializer(serializers.ModelSerializer):
    options = TestOptionSerializer(many=True, read_only=True)

    class Meta:
        model = TestQuestion
        fields = ["id", "question", "order", "options"]
        read_only_fields = ["order"]


class PsychologyTestSerializer(serializers.ModelSerializer):
    questions_count = serializers.IntegerField(read_only=True)
    is_purchased = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = PsychologyTest
        fields = [
            "id",
            "title",
            "description",
            "category",
            "price",
            "coin_price",
            "questions_count",
            "duration",
            "level",
            "rating",
            "reviews",
            "is_active",
            "is_purchased",
            "is_completed",
            "created_at",
        ]
        read_only_fields = ["rating", "reviews", "created_at"]

    def get_is_purchased(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return TestAttempt.objects.filter(user=request.user, test=obj).exists()
        return False

    def get_is_completed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return TestAttempt.objects.filter(
                user=request.user, test=obj, status=TestAttempt.Status.COMPLETED
            ).exists()
        return False


class PsychologyTestDetailSerializer(PsychologyTestSerializer):
    questions = TestQuestionSerializer(many=True, read_only=True)

    class Meta(PsychologyTestSerializer.Meta):
        fields = PsychologyTestSerializer.Meta.fields + ["questions"]


class TestAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.question", read_only=True)
    selected_option_label = serializers.CharField(
        source="selected_option.label", read_only=True
    )

    class Meta:
        model = TestAnswer
        fields = [
            "id",
            "question",
            "question_text",
            "selected_option",
            "selected_option_label",
            "is_correct",
        ]


class TestAttemptSerializer(serializers.ModelSerializer):
    test = PsychologyTestSerializer(read_only=True)
    answers = TestAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = TestAttempt
        fields = [
            "id",
            "test",
            "status",
            "started_at",
            "completed_at",
            "score",
            "total_questions",
            "percentage",
            "answers",
        ]
        read_only_fields = [
            "started_at",
            "completed_at",
            "score",
            "total_questions",
            "percentage",
        ]


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    option_id = serializers.UUIDField()


class CompleteTestSerializer(serializers.Serializer):
    answers = SubmitAnswerSerializer(many=True)
