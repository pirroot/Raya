from rest_framework import permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import MediaFileSerializer, MediaUploadSerializer
from .services import MediaUploadService


class MediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = MediaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        media_file = MediaUploadService(user=request.user).upload(**serializer.validated_data)
        return Response(MediaFileSerializer(media_file).data, status=201)
