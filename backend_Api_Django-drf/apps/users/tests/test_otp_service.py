from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.users.models import OTPRequest, User
from apps.users.services import InvalidOTPException, OTPService

pytestmark = pytest.mark.django_db


class TestOTPService:
    @patch("apps.users.services.OTPService._send_sms")
    def test_request_otp_creates_record(self, mock_send_sms):
        otp = OTPService().request_otp(mobile="09121234567", purpose="login")

        assert OTPRequest.objects.filter(id=otp.id).exists()
        assert mock_send_sms.called

    @patch("apps.users.services.OTPService._send_sms")
    def test_verify_otp_success_creates_user(self, mock_send_sms):
        service = OTPService()
        otp = service.request_otp(mobile="09121234567", purpose="login")

        from django.contrib.auth.hashers import check_password

        # simulate knowing the plaintext code by re-generating deterministically for test
        with patch.object(service, "_generate_code", return_value="12345"):
            otp2 = service.request_otp(mobile="09129999999", purpose="login")

        user = service.verify_otp(mobile="09129999999", code="12345", purpose="login")

        assert isinstance(user, User)
        assert user.mobile == "09129999999"
        assert user.mobile_verified is True

    @patch("apps.users.services.OTPService._send_sms")
    def test_verify_otp_wrong_code_raises(self, mock_send_sms):
        service = OTPService()
        service.request_otp(mobile="09121234567", purpose="login")

        with pytest.raises(InvalidOTPException):
            service.verify_otp(mobile="09121234567", code="00000", purpose="login")

    @patch("apps.users.services.OTPService._send_sms")
    def test_verify_otp_expired_raises(self, mock_send_sms):
        service = OTPService()
        otp = service.request_otp(mobile="09121234567", purpose="login")
        otp.expires_at = timezone.now() - timezone.timedelta(seconds=1)
        otp.save(update_fields=["expires_at"])

        with pytest.raises(InvalidOTPException):
            service.verify_otp(mobile="09121234567", code="12345", purpose="login")
