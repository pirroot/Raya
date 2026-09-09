# apps/education/services.py

from django.db import transaction
from django.conf import settings
from django.utils import timezone
from apps.wallet.services import WalletService
from apps.coins.services import CoinService
from apps.coins.models import CoinTransaction
from .models import Course, Enrollment, LessonProgress, Lesson


class EducationService:
    def __init__(self, user):
        self.user = user

    @transaction.atomic
    def enroll_course(self, course_id: int) -> dict:
        print("=" * 50)
        print("📚 EducationService.enroll_course called")

        course = Course.objects.get(id=course_id, is_published=True)
        print(f"📖 Course: {course.title}, Price: {course.price}")

        # ===== ۱. پرداخت با کیف پول (قبل از ثبت‌نام) =====
        if course.price > 0:
            print(f"💰 Course is paid: {course.price} Toman")

            wallet_service = WalletService(self.user)
            balance = wallet_service.get_balance()
            print(f"💳 Wallet balance: {balance}")

            if balance < course.price:
                print(f"❌ Insufficient balance: {balance} < {course.price}")
                raise ValueError(
                    f"موجودی کیف پول کافی نیست. نیاز: {course.price:,} تومان"
                )

            wallet_service.withdraw(
                amount=course.price, description=f"ثبت‌نام در دوره: {course.title}"
            )
            print(f"✅ Wallet deducted: {course.price}")

            # ===== پاداش سکه به استاد =====
            rate = getattr(settings, "COIN_RATE", 1000)
            teacher_coins = (course.price // rate) // 2
            if teacher_coins > 0:
                teacher_service = CoinService(course.teacher)
                teacher_service.credit(
                    amount=teacher_coins,
                    reason=CoinTransaction.Reason.COURSE_ENROLLMENT,
                    reference_id=str(course.id),
                )
                print(f"🎁 Teacher rewarded: {teacher_coins} coins")

        # ===== ۲. ایجاد یا بروزرسانی ثبت‌نام (با try/except) =====
        try:
            # ابتدا سعی کن پیدا کنی
            enrollment = Enrollment.objects.get(user=self.user, course=course)
            # اگر پیدا شد، بروزرسانی کن
            enrollment.status = Enrollment.Status.ACTIVE
            enrollment.price_paid = course.price if course.price > 0 else 0
            enrollment.progress = 0
            enrollment.save()
            created = False
            print(f"✅ Enrollment updated: {enrollment.id}")

        except Enrollment.DoesNotExist:
            # اگر پیدا نشد، ایجاد کن
            enrollment = Enrollment.objects.create(
                user=self.user,
                course=course,
                status=Enrollment.Status.ACTIVE,
                price_paid=course.price if course.price > 0 else 0,
                progress=0,
            )
            created = True
            print(f"✅ Enrollment created: {enrollment.id}")

        # ===== ۳. به‌روزرسانی تعداد دانشجوها =====
        if created:
            course.students_count = Enrollment.objects.filter(
                course=course, status=Enrollment.Status.ACTIVE
            ).count()
            course.save(update_fields=["students_count"])
            print(f"✅ Course students_count updated: {course.students_count}")

        return {
            "success": True,
            "enrollment_id": str(enrollment.id),
            "course_id": str(course.id),
            "status": enrollment.status,
            "price_paid": enrollment.price_paid,
            "message": "ثبت‌نام با موفقیت انجام شد",
        }

    def update_progress(self, course_id: int, progress: int) -> dict:
        enrollment = Enrollment.objects.get(
            user=self.user, course_id=course_id, status=Enrollment.Status.ACTIVE
        )

        enrollment.progress = progress
        if progress >= 100:
            enrollment.status = Enrollment.Status.COMPLETED
            enrollment.completed_at = timezone.now()
        enrollment.save()

        return {
            "success": True,
            "progress": enrollment.progress,
            "status": enrollment.status,
        }

    def mark_lesson_complete(self, enrollment_id: int, lesson_id: int) -> dict:
        enrollment = Enrollment.objects.get(id=enrollment_id, user=self.user)
        lesson = Lesson.objects.get(id=lesson_id, chapter__course=enrollment.course)

        progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment, lesson=lesson
        )
        progress.is_completed = True
        progress.save()

        total_lessons = Lesson.objects.filter(chapter__course=enrollment.course).count()
        completed_lessons = LessonProgress.objects.filter(
            enrollment=enrollment, is_completed=True
        ).count()

        new_progress = (
            int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        )
        self.update_progress(enrollment.course.id, new_progress)

        return {"success": True, "progress": new_progress}
