from src.database import db
from datetime import datetime
from enum import Enum
import uuid

class PaymentStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELED = "canceled"

class PaymentMethod(Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    CRYPTO = "crypto"

class Payment(db.Model):
    """Модель платежей"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    payment_id = db.Column(db.String(100), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Связи
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('user_subscriptions.id'))
    marketplace_item_id = db.Column(db.Integer, db.ForeignKey('marketplace_items.id'))  # Для покупок в marketplace
    
    # Платежная информация
    amount = db.Column(db.Decimal(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='USD')
    status = db.Column(db.Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    
    # Внешние ID
    stripe_payment_intent_id = db.Column(db.String(255))
    stripe_charge_id = db.Column(db.String(255))
    paypal_order_id = db.Column(db.String(255))
    
    # Метаданные
    description = db.Column(db.String(500))
    metadata = db.Column(db.JSON)  # Дополнительная информация о платеже
    
    # Даты
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    failed_at = db.Column(db.DateTime)
    refunded_at = db.Column(db.DateTime)
    
    # Связи
    user = db.relationship('User', backref='payments')
    invoice = db.relationship('Invoice', backref='payment', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'payment_id': self.payment_id,
            'user_id': self.user_id,
            'subscription_id': self.subscription_id,
            'marketplace_item_id': self.marketplace_item_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'status': self.status.value,
            'payment_method': self.payment_method.value,
            'description': self.description,
            'metadata': self.metadata or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'failed_at': self.failed_at.isoformat() if self.failed_at else None,
            'refunded_at': self.refunded_at.isoformat() if self.refunded_at else None
        }
    
    def mark_completed(self):
        """Отметить платеж как завершенный"""
        self.status = PaymentStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        db.session.commit()
    
    def mark_failed(self, reason=None):
        """Отметить платеж как неудачный"""
        self.status = PaymentStatus.FAILED
        self.failed_at = datetime.utcnow()
        if reason:
            if not self.metadata:
                self.metadata = {}
            self.metadata['failure_reason'] = reason
        db.session.commit()
    
    def mark_refunded(self, refund_amount=None):
        """Отметить платеж как возвращенный"""
        self.status = PaymentStatus.REFUNDED
        self.refunded_at = datetime.utcnow()
        if refund_amount:
            if not self.metadata:
                self.metadata = {}
            self.metadata['refund_amount'] = float(refund_amount)
        db.session.commit()
    
    @classmethod
    def get_user_payments(cls, user_id, limit=50):
        """Получить платежи пользователя"""
        return cls.query.filter_by(user_id=user_id).order_by(cls.created_at.desc()).limit(limit).all()
    
    @classmethod
    def get_successful_payments(cls, start_date=None, end_date=None):
        """Получить успешные платежи за период"""
        query = cls.query.filter_by(status=PaymentStatus.COMPLETED)
        
        if start_date:
            query = query.filter(cls.completed_at >= start_date)
        if end_date:
            query = query.filter(cls.completed_at <= end_date)
        
        return query.order_by(cls.completed_at.desc()).all()
    
    @classmethod
    def get_revenue_stats(cls, start_date=None, end_date=None):
        """Получить статистику доходов"""
        query = cls.query.filter_by(status=PaymentStatus.COMPLETED)
        
        if start_date:
            query = query.filter(cls.completed_at >= start_date)
        if end_date:
            query = query.filter(cls.completed_at <= end_date)
        
        payments = query.all()
        
        total_revenue = sum(float(p.amount) for p in payments)
        total_count = len(payments)
        
        # Группировка по валютам
        by_currency = {}
        for payment in payments:
            currency = payment.currency
            if currency not in by_currency:
                by_currency[currency] = {'amount': 0, 'count': 0}
            by_currency[currency]['amount'] += float(payment.amount)
            by_currency[currency]['count'] += 1
        
        return {
            'total_revenue': total_revenue,
            'total_count': total_count,
            'average_payment': total_revenue / total_count if total_count > 0 else 0,
            'by_currency': by_currency
        }
    
    def __repr__(self):
        return f'<Payment {self.payment_id} - {self.amount} {self.currency} ({self.status.value})>'

