from rest_framework import serializers
from .models import ClassSchedule


class ClassScheduleSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()

    class Meta:
        model = ClassSchedule
        fields = [
            "id",
            "course_name",
            "teacher",
            "day",
            "time_start",
            "time_end",
            "time",
            "faculty",
            "room",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_time(self, obj):
        return obj.time
