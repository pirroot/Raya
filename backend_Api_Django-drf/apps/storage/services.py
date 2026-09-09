from apps.common.exceptions import ServiceException
from apps.common.services import BaseService

from .models import MediaFile

MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
ALLOWED_MIME_PREFIXES = ("image/", "video/", "application/pdf")


class InvalidFileException(ServiceException):
    default_message = "فایل ارسالی نامعتبر است."
    code = "invalid_file"


class MediaUploadService(BaseService):
    def upload(self, file, file_type: str) -> MediaFile:
        if file.size > MAX_UPLOAD_SIZE_BYTES:
            raise InvalidFileException("حجم فایل بیشتر از حد مجاز است.")

        content_type = getattr(file, "content_type", "") or ""
        if not content_type.startswith(ALLOWED_MIME_PREFIXES):
            raise InvalidFileException("نوع فایل مجاز نیست.")

        return MediaFile.objects.create(
            owner=self.user,
            file=file,
            file_type=file_type,
            original_name=file.name,
            size_bytes=file.size,
            mime_type=content_type,
        )
