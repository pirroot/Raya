from django.core.cache import cache
from django.db import transaction
from django.db.models import Sum, Q
from apps.common.services import BaseService
from .models import Wallet, WalletTransaction

WALLET_BALANCE_CACHE_KEY = "wallet:balance:{user_id}"
WALLET_BALANCE_CACHE_TTL = 60


class WalletService(BaseService):
    def __init__(self, user):
        self.user = user

    def _calculate_real_balance(self):
        deposits = (
            WalletTransaction.objects.filter(
                user=self.user,
                status=WalletTransaction.Status.SUCCESS,
                type__in=[
                    WalletTransaction.Type.DEPOSIT,
                    WalletTransaction.Type.PAYOUT,
                    WalletTransaction.Type.REFUND,
                ],
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        withdrawals = (
            WalletTransaction.objects.filter(
                user=self.user,
                status=WalletTransaction.Status.SUCCESS,
                type__in=[
                    WalletTransaction.Type.WITHDRAWAL,
                    WalletTransaction.Type.TRANSFER,
                ],
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )

        return deposits - withdrawals

    def _sync_wallet_balance(self):
        real_balance = self._calculate_real_balance()
        wallet, _ = Wallet.objects.get_or_create(user=self.user)

        if wallet.balance != real_balance:
            wallet.balance = real_balance
            wallet.save(update_fields=["balance"])

        return wallet

    def _fix_transaction_balances(self):
        transactions = WalletTransaction.objects.filter(user=self.user).order_by(
            "created_at"
        )

        running_balance = 0

        for tx in transactions:
            if tx.status == WalletTransaction.Status.SUCCESS:
                if tx.type in [
                    WalletTransaction.Type.DEPOSIT,
                    WalletTransaction.Type.PAYOUT,
                    WalletTransaction.Type.REFUND,
                ]:
                    running_balance += tx.amount
                elif tx.type in [
                    WalletTransaction.Type.WITHDRAWAL,
                    WalletTransaction.Type.TRANSFER,
                ]:
                    running_balance -= tx.amount

            if tx.balance_after != running_balance:
                tx.balance_after = running_balance
                tx.save(update_fields=["balance_after"])

        return running_balance

    def get_balance(self):
        cache_key = WALLET_BALANCE_CACHE_KEY.format(user_id=self.user.id)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        wallet = self._sync_wallet_balance()
        cache.set(cache_key, wallet.balance, WALLET_BALANCE_CACHE_TTL)
        return wallet.balance

    def credit(self, amount: int, description: str = "", reference: str = ""):
        """واریز به کیف پول"""
        if amount <= 0:
            raise ValueError("مبلغ واریز باید بیشتر از صفر باشد")

        with transaction.atomic():
            wallet = self._sync_wallet_balance()
            wallet.add_balance(amount)

            transaction_record = WalletTransaction.objects.create(
                user=self.user,
                amount=amount,
                type=WalletTransaction.Type.PAYOUT,
                status=WalletTransaction.Status.SUCCESS,
                description=description,
                reference=reference,
                balance_after=wallet.balance,
            )

            self._fix_later_transactions(transaction_record, wallet.balance)

        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=self.user.id))
        return wallet.balance

    def debit(self, amount: int, description: str = "", reference: str = ""):
        """برداشت از کیف پول"""
        if amount <= 0:
            raise ValueError("مبلغ برداشت باید بیشتر از صفر باشد")

        if self.get_balance() < amount:
            raise ValueError("موجودی کیف پول کافی نیست")

        with transaction.atomic():
            wallet = self._sync_wallet_balance()
            wallet.deduct_balance(amount)

            transaction_record = WalletTransaction.objects.create(
                user=self.user,
                amount=amount,
                type=WalletTransaction.Type.WITHDRAWAL,
                status=WalletTransaction.Status.SUCCESS,
                description=description,
                reference=reference,
                balance_after=wallet.balance,
            )

            self._fix_later_transactions(transaction_record, wallet.balance)

        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=self.user.id))
        return wallet.balance

    def deposit(self, amount: int, description: str = "", gateway_ref: str = ""):
        if amount <= 0:
            raise ValueError("مبلغ واریز باید بیشتر از صفر باشد")

        with transaction.atomic():
            wallet = self._sync_wallet_balance()
            wallet.add_balance(amount)

            new_transaction = WalletTransaction.objects.create(
                user=self.user,
                amount=amount,
                type=WalletTransaction.Type.DEPOSIT,
                status=WalletTransaction.Status.SUCCESS,
                description=description,
                gateway_ref=gateway_ref,
                balance_after=wallet.balance,
            )

            self._fix_later_transactions(new_transaction, wallet.balance)

        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=self.user.id))
        return wallet.balance

    def withdraw(self, amount: int, description: str = "", reference: str = ""):
        if self.get_balance() < amount:
            raise ValueError("موجودی کیف پول کافی نیست")

        with transaction.atomic():
            wallet = self._sync_wallet_balance()
            wallet.deduct_balance(amount)

            new_transaction = WalletTransaction.objects.create(
                user=self.user,
                amount=amount,
                type=WalletTransaction.Type.WITHDRAWAL,
                status=WalletTransaction.Status.SUCCESS,
                description=description,
                reference=reference,
                balance_after=wallet.balance,
            )

            self._fix_later_transactions(new_transaction, wallet.balance)

        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=self.user.id))
        return wallet.balance

    def transfer(self, from_user, to_user, amount: int, description: str = ""):
        if from_user == to_user:
            raise ValueError("انتقال به خود مجاز نیست")

        from_service = WalletService(from_user)
        if from_service.get_balance() < amount:
            raise ValueError("موجودی کیف پول فرستنده کافی نیست")

        with transaction.atomic():
            from_wallet = from_service._sync_wallet_balance()
            from_wallet.deduct_balance(amount)

            from_transaction = WalletTransaction.objects.create(
                user=from_user,
                amount=amount,
                type=WalletTransaction.Type.TRANSFER,
                status=WalletTransaction.Status.SUCCESS,
                description=f"انتقال به {to_user.mobile} - {description}",
                balance_after=from_wallet.balance,
            )

            from_service._fix_later_transactions(from_transaction, from_wallet.balance)

            to_service = WalletService(to_user)
            to_wallet = to_service._sync_wallet_balance()
            to_wallet.add_balance(amount)

            to_transaction = WalletTransaction.objects.create(
                user=to_user,
                amount=amount,
                type=WalletTransaction.Type.PAYOUT,
                status=WalletTransaction.Status.SUCCESS,
                description=f"دریافت از {from_user.mobile} - {description}",
                balance_after=to_wallet.balance,
            )

            to_service._fix_later_transactions(to_transaction, to_wallet.balance)

        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=from_user.id))
        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=to_user.id))

        return to_wallet.balance

    def transfer_with_fee(
        self,
        buyer,
        seller,
        amount: int,
        description: str = "",
        reference: str = "",
        fee_percent: int = 10,
    ):
        if buyer == seller:
            raise ValueError("انتقال به خود مجاز نیست")

        fee = int(amount * fee_percent / 100)
        seller_amount = amount - fee

        buyer_service = WalletService(buyer)
        if buyer_service.get_balance() < amount:
            raise ValueError("موجودی کیف پول خریدار کافی نیست")

        with transaction.atomic():
            buyer_wallet = buyer_service._sync_wallet_balance()
            buyer_wallet.deduct_balance(amount)

            buyer_transaction = WalletTransaction.objects.create(
                user=buyer,
                amount=amount,
                type=WalletTransaction.Type.TRANSFER,
                status=WalletTransaction.Status.SUCCESS,
                description=f"پرداخت برای {description}",
                reference=reference,
                balance_after=buyer_wallet.balance,
            )
            buyer_service._fix_later_transactions(
                buyer_transaction, buyer_wallet.balance
            )

            seller_service = WalletService(seller)
            seller_wallet = seller_service._sync_wallet_balance()
            seller_wallet.add_balance(seller_amount)

            seller_transaction = WalletTransaction.objects.create(
                user=seller,
                amount=seller_amount,
                type=WalletTransaction.Type.PAYOUT,
                status=WalletTransaction.Status.SUCCESS,
                description=f"فروش {description}",
                reference=reference,
                balance_after=seller_wallet.balance,
            )
            seller_service._fix_later_transactions(
                seller_transaction, seller_wallet.balance
            )

            admin_user = self._get_admin_user()
            admin_service = WalletService(admin_user)
            admin_wallet = admin_service._sync_wallet_balance()
            admin_wallet.add_balance(fee)

            admin_transaction = WalletTransaction.objects.create(
                user=admin_user,
                amount=fee,
                type=WalletTransaction.Type.FEE,
                status=WalletTransaction.Status.SUCCESS,
                description=f"کارمزد {description} ({fee_percent}%)",
                reference=reference,
                balance_after=admin_wallet.balance,
            )
            admin_service._fix_later_transactions(
                admin_transaction, admin_wallet.balance
            )

        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=buyer.id))
        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=seller.id))
        cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=admin_user.id))

        return {
            "buyer_amount": amount,
            "seller_amount": seller_amount,
            "fee": fee,
            "fee_percent": fee_percent,
        }

    def _fix_later_transactions(self, reference_transaction, current_balance):
        later_transactions = WalletTransaction.objects.filter(
            user=self.user, created_at__gt=reference_transaction.created_at
        ).order_by("created_at")

        running_balance = current_balance
        for tx in later_transactions:
            if tx.status == WalletTransaction.Status.SUCCESS:
                if tx.type in [
                    WalletTransaction.Type.DEPOSIT,
                    WalletTransaction.Type.PAYOUT,
                    WalletTransaction.Type.REFUND,
                ]:
                    running_balance += tx.amount
                elif tx.type in [
                    WalletTransaction.Type.WITHDRAWAL,
                    WalletTransaction.Type.TRANSFER,
                ]:
                    running_balance -= tx.amount

            if tx.balance_after != running_balance:
                tx.balance_after = running_balance
                tx.save(update_fields=["balance_after"])

        return running_balance

    def repair_all_transactions(self):
        with transaction.atomic():
            wallet = self._sync_wallet_balance()
            final_balance = self._fix_transaction_balances()

            if wallet.balance != final_balance:
                wallet.balance = final_balance
                wallet.save(update_fields=["balance"])

            cache.delete(WALLET_BALANCE_CACHE_KEY.format(user_id=self.user.id))

            return {
                "balance": wallet.balance,
                "transactions_fixed": WalletTransaction.objects.filter(
                    user=self.user
                ).count(),
            }

    def _get_admin_user(self):
        from apps.users.models import User

        admin = User.objects.filter(is_staff=True).first()
        if not admin:
            admin = User.objects.create_superuser(
                mobile="09123456789", password="admin123"
            )
        return admin
