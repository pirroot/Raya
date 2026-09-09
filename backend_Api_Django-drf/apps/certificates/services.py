from django.db import transaction
from django.utils import timezone
from django.core.files.base import ContentFile
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from PIL import Image
import uuid
import os

from .models import Certificate


class CertificateService:
    def __init__(self, user):
        self.user = user

    @transaction.atomic
    def generate_certificate(self, course_id: int) -> dict:
        """ایجاد گواهی برای کاربر"""
        from apps.education.models import Course, Enrollment

        course = Course.objects.get(id=course_id, is_published=True)

        # چک کن کاربر ثبت‌نام کرده و دوره رو کامل کرده
        enrollment = Enrollment.objects.filter(
            user=self.user,
            course=course,
            status=Enrollment.Status.COMPLETED,
            progress=100,
        ).first()

        if not enrollment:
            raise ValueError("شما این دوره را کامل نکرده‌اید.")

        # چک کن گواهی قبلاً صادر شده
        existing = Certificate.objects.filter(user=self.user, course=course).first()
        if existing:
            return {
                "success": True,
                "certificate": existing,
                "message": "گواهی قبلاً صادر شده است.",
            }

        # ایجاد گواهی
        certificate = Certificate.objects.create(
            user=self.user,
            course=course,
        )

        # تولید فایل PDF
        pdf_file = self._generate_pdf(certificate)
        certificate.certificate_file.save(
            f"certificate_{certificate.code}.pdf", ContentFile(pdf_file.getvalue())
        )
        certificate.save()

        return {
            "success": True,
            "certificate": certificate,
            "message": "گواهی با موفقیت صادر شد.",
        }

    def _generate_pdf(self, certificate) -> BytesIO:
        """تولید فایل PDF گواهی"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)

        styles = getSampleStyleSheet()

        # استایل سفارشی
        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Title"],
            fontSize=32,
            textColor=colors.HexColor("#1a237e"),
            alignment=TA_CENTER,
            spaceAfter=20,
        )

        subtitle_style = ParagraphStyle(
            "SubtitleStyle",
            parent=styles["Normal"],
            fontSize=18,
            textColor=colors.HexColor("#0d47a1"),
            alignment=TA_CENTER,
            spaceAfter=30,
        )

        content_style = ParagraphStyle(
            "ContentStyle",
            parent=styles["Normal"],
            fontSize=14,
            textColor=colors.HexColor("#333333"),
            alignment=TA_CENTER,
            spaceAfter=10,
        )

        # محتوای گواهی
        elements = []

        # عنوان
        elements.append(Paragraph("🎓 گواهی پایان دوره", title_style))
        elements.append(Spacer(1, 20))

        # زیرنویس
        elements.append(Paragraph("این گواهی به اطلاع می‌رساند که", subtitle_style))
        elements.append(Spacer(1, 10))

        # نام کاربر
        user_name = certificate.user.get_full_name() or certificate.user.mobile
        name_style = ParagraphStyle(
            "NameStyle",
            parent=styles["Title"],
            fontSize=24,
            textColor=colors.HexColor("#d32f2f"),
            alignment=TA_CENTER,
            spaceAfter=20,
        )
        elements.append(Paragraph(f"<b>{user_name}</b>", name_style))
        elements.append(Spacer(1, 10))

        # متن اصلی
        elements.append(
            Paragraph(
                f"دوره <b>{certificate.course.title}</b> را با موفقیت به پایان رسانده است.",
                content_style,
            )
        )
        elements.append(Spacer(1, 10))

        # اطلاعات دوره
        elements.append(
            Paragraph(
                f"مدت دوره: {certificate.course.duration} | سطح: {certificate.course.get_level_display()}",
                content_style,
            )
        )
        elements.append(Spacer(1, 10))

        # تاریخ
        from django.utils import timezone

        issued_date = timezone.localtime(certificate.issued_at).strftime("%Y/%m/%d")
        elements.append(Paragraph(f"تاریخ صدور: {issued_date}", content_style))
        elements.append(Spacer(1, 20))

        # کد گواهی
        code_style = ParagraphStyle(
            "CodeStyle",
            parent=styles["Normal"],
            fontSize=12,
            textColor=colors.HexColor("#666666"),
            alignment=TA_CENTER,
            fontName="Helvetica-Oblique",
        )
        elements.append(Paragraph(f"کد گواهی: {certificate.code}", code_style))
        elements.append(Spacer(1, 30))

        # لینک اعتبارسنجی
        verify_url = f"https://yourdomain.com/verify/{certificate.code}/"
        elements.append(Paragraph(f"برای اعتبارسنجی: {verify_url}", code_style))

        # ساخت PDF
        doc.build(elements)
        buffer.seek(0)

        return buffer

    def verify_certificate(self, code: str) -> dict:
        """اعتبارسنجی گواهی با کد"""
        try:
            certificate = Certificate.objects.get(code=code, is_verified=True)
            return {
                "valid": True,
                "user": certificate.user.get_full_name(),
                "course": certificate.course.title,
                "issued_at": certificate.issued_at,
                "code": certificate.code,
            }
        except Certificate.DoesNotExist:
            return {"valid": False, "message": "گواهی یافت نشد یا نامعتبر است."}
