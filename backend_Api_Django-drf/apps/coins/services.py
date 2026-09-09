from django.core.cache import cache
from django.db import transaction
from django.db.models import Sum

from apps.common.exceptions import ServiceException
from apps.common.services import BaseService
from .models import CoinTransaction

BALANCE_CACHE_KEY = "coins:balance:{user_id}"
BALANCE_CACHE_TTL = 60


class InsufficientCoinsException(ServiceException):
    default_message = "موجودی سکه کافی نیست."
    code = "insufficient_coins"


class CoinService(BaseService):
    def __init__(self, user):
        self.user = user

    def get_balance(self) -> int:
        cache_key = BALANCE_CACHE_KEY.format(user_id=self.user.id)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        credit = (
            CoinTransaction.objects.filter(user=self.user, type="credit").aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        debit = (
            CoinTransaction.objects.filter(user=self.user, type="debit").aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        balance = credit - debit
        cache.set(cache_key, balance, BALANCE_CACHE_TTL)
        return balance

    @transaction.atomic
    def credit(
        self, amount: int, reason: str, reference_id: str = ""
    ) -> CoinTransaction:
        tx = CoinTransaction.objects.create(
            user=self.user,
            amount=amount,
            type="credit",
            reason=reason,
            reference_id=reference_id,
        )
        cache.delete(BALANCE_CACHE_KEY.format(user_id=self.user.id))
        return tx

    @transaction.atomic
    def debit(
        self, amount: int, reason: str, reference_id: str = ""
    ) -> CoinTransaction:
        if self.get_balance() < amount:
            raise InsufficientCoinsException()

        tx = CoinTransaction.objects.create(
            user=self.user,
            amount=amount,
            type="debit",
            reason=reason,
            reference_id=reference_id,
        )
        cache.delete(BALANCE_CACHE_KEY.format(user_id=self.user.id))
        return tx

    @transaction.atomic
    def purchase_coins(self, package_id: int) -> dict:
        from apps.wallet.services import WalletService
        from .models import CoinPackage

        package = CoinPackage.objects.get(id=package_id, is_active=True)
        wallet_service = WalletService(self.user)

        if wallet_service.get_balance() < package.price:
            raise ValueError("موجودی کیف پول کافی نیست")

        wallet_service.withdraw(
            amount=package.price,
            description=f"خرید {package.coin_amount} سکه - {package.title}",
        )

        self.credit(
            amount=package.coin_amount,
            reason=CoinTransaction.Reason.PURCHASE,
            reference_id=str(package.id),
        )

        return {
            "success": True,
            "coins": package.coin_amount,
            "balance": self.get_balance(),
            "wallet_balance": wallet_service.get_balance(),
        }

    @transaction.atomic
    def convert_wallet_to_coins(self, amount_toman: int) -> dict:
        from apps.wallet.services import WalletService

        rate = 1000
        coin_amount = amount_toman // rate

        if coin_amount <= 0:
            raise ValueError("مبلغ باید حداقل ۱۰۰۰ تومان باشد")

        wallet_service = WalletService(self.user)

        if wallet_service.get_balance() < amount_toman:
            raise ValueError("موجودی کیف پول کافی نیست")

        wallet_service.withdraw(
            amount=amount_toman,
            description=f"تبدیل {amount_toman} تومان به {coin_amount} سکه",
        )

        self.credit(
            amount=coin_amount,
            reason=CoinTransaction.Reason.CONVERT_FROM_WALLET,
        )

        return {
            "success": True,
            "coins": coin_amount,
            "balance": self.get_balance(),
            "wallet_balance": wallet_service.get_balance(),
        }
