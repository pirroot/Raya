import logging
import time

logger = logging.getLogger("apps.common")


class RequestLogMiddleware:
    """Logs method, path, status code and duration of every request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000

        logger.info(
            "%s %s -> %s (%.2fms)",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        return response
