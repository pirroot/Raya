from rest_framework import serializers
from .models import Poll, PollOption, PollVote


class PollOptionSerializer(serializers.ModelSerializer):
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "label", "votes", "percentage"]

    def get_percentage(self, obj):
        total = obj.poll.total_votes if obj.poll else 0
        if total == 0:
            return 0
        return round((obj.votes / total) * 100, 1)


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    is_voted = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "id",
            "title",
            "description",
            "is_active",
            "starts_at",
            "ends_at",
            "options",
            "total_votes",
            "is_voted",
            "user_vote",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_is_voted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return PollVote.objects.filter(user=request.user, poll=obj).exists()
        return False

    def get_user_vote(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            vote = PollVote.objects.filter(user=request.user, poll=obj).first()
            if vote:
                return vote.option.id
        return None


class PollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PollVote
        fields = ["id", "user", "poll", "option", "created_at"]
        read_only_fields = ["user", "created_at"]
