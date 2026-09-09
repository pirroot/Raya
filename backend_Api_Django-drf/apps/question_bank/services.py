from django.db import transaction
from django.conf import settings
from apps.wallet.services import WalletService
from apps.coins.services import CoinService
from apps.coins.models import CoinTransaction
from .models import Question, QuestionDownload


class QuestionService:
    def __init__(self, user):
        self.user = user

    def download_question(self, question_id: int) -> dict:
        question = Question.objects.get(id=question_id, is_approved=True)

        # Check if already downloaded
        existing_download = QuestionDownload.objects.filter(
            user=self.user, question=question
        ).first()

        if existing_download:
            return {
                "success": True,
                "already_downloaded": True,
                "file_url": question.file.url,
                "message": "این فایل قبلاً دانلود شده است",
            }

        if question.price_type == Question.PriceType.PAID and question.price > 0:
            wallet_service = WalletService(self.user)
            balance = wallet_service.get_balance()

            if balance < question.price:
                raise ValueError(
                    f"موجودی کیف پول کافی نیست. نیاز: {question.price:,} تومان"
                )

            wallet_service.withdraw(
                amount=question.price, description=f"خرید جزوه: {question.title}"
            )

        rate = getattr(settings, "COIN_RATE", 1000)

        base_reward = getattr(settings, "QUESTION_DOWNLOAD_COIN_REWARD", 1)

        if question.price_type == Question.PriceType.PAID and question.price > 0:
            seller_coins = (question.price // rate) // 2
            if seller_coins > 0:
                seller_service = CoinService(question.user)
                seller_service.credit(
                    amount=seller_coins,
                    reason=CoinTransaction.Reason.SELL_NOTE,
                    reference_id=str(question.id),
                )
        else:
            if base_reward > 0:
                seller_service = CoinService(question.user)
                seller_service.credit(
                    amount=base_reward,
                    reason=CoinTransaction.Reason.SELL_NOTE,
                    reference_id=str(question.id),
                )

        # Create download record
        QuestionDownload.objects.create(
            user=self.user, question=question, coins_spent=0, is_first_download=True
        )

        question.downloads += 1
        question.save(update_fields=["downloads"])

        return {
            "success": True,
            "already_downloaded": False,
            "file_url": question.file.url,
            "coins_spent": 0,
            "message": "دانلود با موفقیت انجام شد",
        }

    def toggle_like(self, question_id: int) -> dict:
        from .models import QuestionLike

        question = Question.objects.get(id=question_id)
        like, created = QuestionLike.objects.get_or_create(
            user=self.user, question=question
        )

        if not created:
            like.delete()
            question.likes -= 1
            question.save(update_fields=["likes"])
            return {"liked": False, "likes_count": question.likes}

        question.likes += 1
        question.save(update_fields=["likes"])
        return {"liked": True, "likes_count": question.likes}
