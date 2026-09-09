from rest_framework import serializers
from .models import Banner


class BannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = [
            "id",
            "title",
            "subtitle",
            "image",
            "image_url",
            "link_url",
            "placement",
            "order",
            "is_active",
            "starts_at",
            "ends_at",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
