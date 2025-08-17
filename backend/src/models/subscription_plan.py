from src.database import db
from datetime import datetime
from enum import Enum

class PlanType(Enum):
    FREE = "free"
    STARTER = "starter"
    GROWTH = "growth"
    ENTERPRISE = "enterprise"

class SubscriptionPlan(db.Model):
    """Модель тарифных планов подписки"""
    __tablename__ = 'subscription_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # "Dino Egg", "Baby Dino", "T-Rex", "Dino King"
    plan_type = db.Column(db.Enum(PlanType), nullable=False, unique=True)
    price_monthly = db.Column(db.Decimal(10, 2), nullable=False, default=0)  # Цена в USD
    price_yearly = db.Column(db.Decimal(10, 2), nullable=False, default=0)   # Цена в USD за год
    
    # Ограничения плана
    max_referrals_per_month = db.Column(db.Integer, nullable=False, default=0)  # 0 = unlimited
    max_active_projects = db.Column(db.Integer, nullable=False, default=1)
    max_team_members = db.Column(db.Integer, nullable=False, default=1)
    
    # Функциональность
    has_advanced_analytics = db.Column(db.Boolean, default=False)
    has_api_access = db.Column(db.Boolean, default=False)
    has_white_label = db.Column(db.Boolean, default=False)
    has_priority_support = db.Column(db.Boolean, default=False)
    has_custom_rewards = db.Column(db.Boolean, default=False)
    has_marketplace_access = db.Column(db.Boolean, default=False)
    
    # Метаданные
    description = db.Column(db.Text)
    features = db.Column(db.JSON)  # Список особенностей плана
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)  # Для выделения рекомендуемого плана
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    subscriptions = db.relationship('UserSubscription', backref='plan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'plan_type': self.plan_type.value,
            'price_monthly': float(self.price_monthly),
            'price_yearly': float(self.price_yearly),
            'max_referrals_per_month': self.max_referrals_per_month,
            'max_active_projects': self.max_active_projects,
            'max_team_members': self.max_team_members,
            'has_advanced_analytics': self.has_advanced_analytics,
            'has_api_access': self.has_api_access,
            'has_white_label': self.has_white_label,
            'has_priority_support': self.has_priority_support,
            'has_custom_rewards': self.has_custom_rewards,
            'has_marketplace_access': self.has_marketplace_access,
            'description': self.description,
            'features': self.features or [],
            'is_active': self.is_active,
            'is_popular': self.is_popular,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_free_plan(cls):
        """Получить бесплатный план"""
        return cls.query.filter_by(plan_type=PlanType.FREE).first()
    
    @classmethod
    def get_plan_by_type(cls, plan_type):
        """Получить план по типу"""
        if isinstance(plan_type, str):
            plan_type = PlanType(plan_type)
        return cls.query.filter_by(plan_type=plan_type).first()
    
    @classmethod
    def get_active_plans(cls):
        """Получить все активные планы"""
        return cls.query.filter_by(is_active=True).order_by(cls.price_monthly.asc()).all()
    
    def __repr__(self):
        return f'<SubscriptionPlan {self.name} ({self.plan_type.value})>'

