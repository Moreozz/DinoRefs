from src.database import db
from datetime import datetime, timedelta
from enum import Enum
import uuid

class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELED = "canceled"

class Invoice(db.Model):
    """Модель инвойсов"""
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    
    # Связи
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'))
    subscription_id = db.Column(db.Integer, db.ForeignKey('user_subscriptions.id'))
    
    # Информация об инвойсе
    status = db.Column(db.Enum(InvoiceStatus), nullable=False, default=InvoiceStatus.DRAFT)
    amount = db.Column(db.Decimal(10, 2), nullable=False)
    tax_amount = db.Column(db.Decimal(10, 2), default=0)
    total_amount = db.Column(db.Decimal(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='USD')
    
    # Описание
    description = db.Column(db.String(500))
    line_items = db.Column(db.JSON)  # Детализация позиций
    
    # Даты
    issue_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=False)
    paid_date = db.Column(db.DateTime)
    
    # Метаданные
    notes = db.Column(db.Text)
    metadata = db.Column(db.JSON)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    user = db.relationship('User', backref='invoices')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        if not self.due_date:
            self.due_date = datetime.utcnow() + timedelta(days=30)
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'user_id': self.user_id,
            'payment_id': self.payment_id,
            'subscription_id': self.subscription_id,
            'status': self.status.value,
            'amount': float(self.amount),
            'tax_amount': float(self.tax_amount),
            'total_amount': float(self.total_amount),
            'currency': self.currency,
            'description': self.description,
            'line_items': self.line_items or [],
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'notes': self.notes,
            'metadata': self.metadata or {},
            'is_overdue': self.is_overdue(),
            'days_overdue': self.days_overdue(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def generate_invoice_number(self):
        """Генерировать номер инвойса"""
        year = datetime.utcnow().year
        month = datetime.utcnow().month
        
        # Подсчитываем количество инвойсов в текущем месяце
        count = Invoice.query.filter(
            db.extract('year', Invoice.created_at) == year,
            db.extract('month', Invoice.created_at) == month
        ).count() + 1
        
        return f"INV-{year}{month:02d}-{count:04d}"
    
    def is_overdue(self):
        """Проверить, просрочен ли инвойс"""
        return (
            self.status in [InvoiceStatus.SENT] and
            self.due_date < datetime.utcnow()
        )
    
    def days_overdue(self):
        """Количество дней просрочки"""
        if not self.is_overdue():
            return 0
        return (datetime.utcnow() - self.due_date).days
    
    def mark_sent(self):
        """Отметить инвойс как отправленный"""
        self.status = InvoiceStatus.SENT
        db.session.commit()
    
    def mark_paid(self, payment_date=None):
        """Отметить инвойс как оплаченный"""
        self.status = InvoiceStatus.PAID
        self.paid_date = payment_date or datetime.utcnow()
        db.session.commit()
    
    def mark_overdue(self):
        """Отметить инвойс как просроченный"""
        self.status = InvoiceStatus.OVERDUE
        db.session.commit()
    
    def cancel(self):
        """Отменить инвойс"""
        self.status = InvoiceStatus.CANCELED
        db.session.commit()
    
    def add_line_item(self, description, quantity, unit_price, total_price=None):
        """Добавить позицию в инвойс"""
        if not self.line_items:
            self.line_items = []
        
        if total_price is None:
            total_price = quantity * unit_price
        
        item = {
            'description': description,
            'quantity': quantity,
            'unit_price': float(unit_price),
            'total_price': float(total_price)
        }
        
        self.line_items.append(item)
        self.recalculate_total()
    
    def recalculate_total(self):
        """Пересчитать общую сумму инвойса"""
        if self.line_items:
            self.amount = sum(item['total_price'] for item in self.line_items)
        self.total_amount = self.amount + self.tax_amount
    
    @classmethod
    def get_user_invoices(cls, user_id, limit=50):
        """Получить инвойсы пользователя"""
        return cls.query.filter_by(user_id=user_id).order_by(cls.created_at.desc()).limit(limit).all()
    
    @classmethod
    def get_overdue_invoices(cls):
        """Получить просроченные инвойсы"""
        return cls.query.filter(
            cls.status == InvoiceStatus.SENT,
            cls.due_date < datetime.utcnow()
        ).all()
    
    @classmethod
    def create_subscription_invoice(cls, user_id, subscription, amount, description=None):
        """Создать инвойс для подписки"""
        if not description:
            description = f"Подписка {subscription.plan.name} - {subscription.billing_cycle.value}"
        
        invoice = cls(
            user_id=user_id,
            subscription_id=subscription.id,
            amount=amount,
            total_amount=amount,
            description=description
        )
        
        # Добавляем позицию
        invoice.add_line_item(
            description=description,
            quantity=1,
            unit_price=amount,
            total_price=amount
        )
        
        db.session.add(invoice)
        db.session.commit()
        return invoice
    
    def __repr__(self):
        return f'<Invoice {self.invoice_number} - {self.total_amount} {self.currency} ({self.status.value})>'

