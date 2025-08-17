from src.database import db
from datetime import datetime, timedelta
from enum import Enum

class SubscriptionStatus(Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    EXPIRED = "expired"
    PENDING = "pending"
    SUSPENDED = "suspended"

class BillingCycle(Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"

class UserSubscription(db.Model):
    """Модель подписок пользователей"""
    __tablename__ = 'user_subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=False)
    
    # Статус подписки
    status = db.Column(db.Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.ACTIVE)
    billing_cycle = db.Column(db.Enum(BillingCycle), nullable=False, default=BillingCycle.MONTHLY)
    
    # Даты
    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    canceled_at = db.Column(db.DateTime)
    
    # Платежная информация
    stripe_subscription_id = db.Column(db.String(255))  # ID подписки в Stripe
    stripe_customer_id = db.Column(db.String(255))     # ID клиента в Stripe
    
    # Статистика использования
    referrals_used_this_month = db.Column(db.Integer, default=0)
    last_usage_reset = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Метаданные
    auto_renew = db.Column(db.Boolean, default=True)
    trial_ends_at = db.Column(db.DateTime)  # Для пробных периодов
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    user = db.relationship('User', backref='subscriptions')
    payments = db.relationship('Payment', backref='subscription', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_id': self.plan_id,
            'plan': self.plan.to_dict() if self.plan else None,
            'status': self.status.value,
            'billing_cycle': self.billing_cycle.value,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'canceled_at': self.canceled_at.isoformat() if self.canceled_at else None,
            'auto_renew': self.auto_renew,
            'trial_ends_at': self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            'referrals_used_this_month': self.referrals_used_this_month,
            'is_active': self.is_active(),
            'is_trial': self.is_trial(),
            'days_remaining': self.days_remaining(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_active(self):
        """Проверить, активна ли подписка"""
        return (
            self.status == SubscriptionStatus.ACTIVE and 
            self.expires_at > datetime.utcnow()
        )
    
    def is_trial(self):
        """Проверить, является ли подписка пробной"""
        return (
            self.trial_ends_at is not None and 
            self.trial_ends_at > datetime.utcnow()
        )
    
    def days_remaining(self):
        """Количество дней до окончания подписки"""
        if self.expires_at:
            delta = self.expires_at - datetime.utcnow()
            return max(0, delta.days)
        return 0
    
    def can_use_referrals(self, count=1):
        """Проверить, можно ли использовать рефералы"""
        if not self.is_active():
            return False
        
        # Сброс счетчика в начале месяца
        self.reset_monthly_usage_if_needed()
        
        # Проверяем лимит (0 = unlimited)
        if self.plan.max_referrals_per_month == 0:
            return True
        
        return (self.referrals_used_this_month + count) <= self.plan.max_referrals_per_month
    
    def use_referrals(self, count=1):
        """Использовать рефералы (увеличить счетчик)"""
        if self.can_use_referrals(count):
            self.referrals_used_this_month += count
            db.session.commit()
            return True
        return False
    
    def reset_monthly_usage_if_needed(self):
        """Сбросить месячное использование если прошел месяц"""
        now = datetime.utcnow()
        if (now - self.last_usage_reset).days >= 30:
            self.referrals_used_this_month = 0
            self.last_usage_reset = now
            db.session.commit()
    
    def extend_subscription(self, months=1):
        """Продлить подписку на указанное количество месяцев"""
        if self.billing_cycle == BillingCycle.YEARLY:
            months = 12
        
        self.expires_at = self.expires_at + timedelta(days=30 * months)
        self.status = SubscriptionStatus.ACTIVE
        db.session.commit()
    
    def cancel_subscription(self):
        """Отменить подписку"""
        self.status = SubscriptionStatus.CANCELED
        self.canceled_at = datetime.utcnow()
        self.auto_renew = False
        db.session.commit()
    
    @classmethod
    def get_user_active_subscription(cls, user_id):
        """Получить активную подписку пользователя"""
        return cls.query.filter_by(
            user_id=user_id,
            status=SubscriptionStatus.ACTIVE
        ).filter(
            cls.expires_at > datetime.utcnow()
        ).first()
    
    @classmethod
    def create_free_subscription(cls, user_id):
        """Создать бесплатную подписку для нового пользователя"""
        from src.models.subscription_plan import SubscriptionPlan, PlanType
        
        free_plan = SubscriptionPlan.get_plan_by_type(PlanType.FREE)
        if not free_plan:
            return None
        
        subscription = cls(
            user_id=user_id,
            plan_id=free_plan.id,
            expires_at=datetime.utcnow() + timedelta(days=365 * 10)  # 10 лет для бесплатного плана
        )
        
        db.session.add(subscription)
        db.session.commit()
        return subscription
    
    def __repr__(self):
        return f'<UserSubscription {self.user_id} - {self.plan.name if self.plan else "Unknown"}>'

