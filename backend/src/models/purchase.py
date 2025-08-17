from src.database import db
from datetime import datetime
from enum import Enum
import uuid

class PurchaseStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    REFUNDED = "refunded"
    FAILED = "failed"

class Purchase(db.Model):
    """Модель покупок в marketplace"""
    __tablename__ = 'purchases'
    
    id = db.Column(db.Integer, primary_key=True)
    purchase_id = db.Column(db.String(100), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Участники сделки
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('marketplace_items.id'), nullable=False)
    
    # Платежная информация
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'))
    amount = db.Column(db.Decimal(10, 2), nullable=False)
    platform_commission = db.Column(db.Decimal(10, 2), nullable=False)
    seller_earnings = db.Column(db.Decimal(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='USD')
    
    # Статус
    status = db.Column(db.Enum(PurchaseStatus), nullable=False, default=PurchaseStatus.PENDING)
    
    # Доступ к файлам
    download_token = db.Column(db.String(255))  # Токен для скачивания файлов
    download_expires_at = db.Column(db.DateTime)  # Срок действия токена
    download_count = db.Column(db.Integer, default=0)
    max_downloads = db.Column(db.Integer, default=5)  # Максимальное количество скачиваний
    
    # Метаданные
    metadata = db.Column(db.JSON)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    refunded_at = db.Column(db.DateTime)
    
    # Связи
    buyer = db.relationship('User', foreign_keys=[buyer_id], backref='purchases')
    seller = db.relationship('User', foreign_keys=[seller_id], backref='sales')
    payment = db.relationship('Payment', backref='purchase', uselist=False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.download_token:
            self.download_token = str(uuid.uuid4())
        if not self.download_expires_at:
            # Токен действует 1 год
            from datetime import timedelta
            self.download_expires_at = datetime.utcnow() + timedelta(days=365)
    
    def to_dict(self, include_relations=True):
        return {
            'id': self.id,
            'purchase_id': self.purchase_id,
            'buyer_id': self.buyer_id,
            'seller_id': self.seller_id,
            'item_id': self.item_id,
            'buyer': self.buyer.to_dict() if include_relations and self.buyer else None,
            'seller': self.seller.to_dict() if include_relations and self.seller else None,
            'item': self.item.to_dict(include_seller=False) if include_relations and self.item else None,
            'payment_id': self.payment_id,
            'amount': float(self.amount),
            'platform_commission': float(self.platform_commission),
            'seller_earnings': float(self.seller_earnings),
            'currency': self.currency,
            'status': self.status.value,
            'download_token': self.download_token,
            'download_expires_at': self.download_expires_at.isoformat() if self.download_expires_at else None,
            'download_count': self.download_count,
            'max_downloads': self.max_downloads,
            'can_download': self.can_download(),
            'metadata': self.metadata or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'refunded_at': self.refunded_at.isoformat() if self.refunded_at else None
        }
    
    def can_download(self):
        """Проверить, можно ли скачать файлы"""
        return (
            self.status == PurchaseStatus.COMPLETED and
            self.download_count < self.max_downloads and
            self.download_expires_at > datetime.utcnow()
        )
    
    def increment_download(self):
        """Увеличить счетчик скачиваний"""
        if self.can_download():
            self.download_count += 1
            db.session.commit()
            return True
        return False
    
    def complete_purchase(self):
        """Завершить покупку"""
        self.status = PurchaseStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        
        # Увеличиваем счетчик продаж у товара
        self.item.increment_sales()
        
        db.session.commit()
    
    def refund_purchase(self, refund_amount=None):
        """Вернуть покупку"""
        self.status = PurchaseStatus.REFUNDED
        self.refunded_at = datetime.utcnow()
        
        if refund_amount:
            if not self.metadata:
                self.metadata = {}
            self.metadata['refund_amount'] = float(refund_amount)
        
        # Уменьшаем счетчик продаж у товара
        if self.item.sales_count > 0:
            self.item.sales_count -= 1
        
        db.session.commit()
    
    def fail_purchase(self, reason=None):
        """Отметить покупку как неудачную"""
        self.status = PurchaseStatus.FAILED
        
        if reason:
            if not self.metadata:
                self.metadata = {}
            self.metadata['failure_reason'] = reason
        
        db.session.commit()
    
    @classmethod
    def create_purchase(cls, buyer_id, item, payment=None):
        """Создать новую покупку"""
        # Рассчитываем комиссии
        platform_commission = item.calculate_platform_commission()
        seller_earnings = item.calculate_seller_earnings()
        
        purchase = cls(
            buyer_id=buyer_id,
            seller_id=item.seller_id,
            item_id=item.id,
            payment_id=payment.id if payment else None,
            amount=item.price,
            platform_commission=platform_commission,
            seller_earnings=seller_earnings,
            currency=item.currency
        )
        
        db.session.add(purchase)
        db.session.commit()
        return purchase
    
    @classmethod
    def get_user_purchases(cls, user_id, limit=50):
        """Получить покупки пользователя"""
        return cls.query.filter_by(buyer_id=user_id).order_by(cls.created_at.desc()).limit(limit).all()
    
    @classmethod
    def get_user_sales(cls, user_id, limit=50):
        """Получить продажи пользователя"""
        return cls.query.filter_by(seller_id=user_id).order_by(cls.created_at.desc()).limit(limit).all()
    
    @classmethod
    def get_sales_stats(cls, seller_id, start_date=None, end_date=None):
        """Получить статистику продаж продавца"""
        query = cls.query.filter_by(seller_id=seller_id, status=PurchaseStatus.COMPLETED)
        
        if start_date:
            query = query.filter(cls.completed_at >= start_date)
        if end_date:
            query = query.filter(cls.completed_at <= end_date)
        
        sales = query.all()
        
        total_sales = len(sales)
        total_revenue = sum(float(sale.seller_earnings) for sale in sales)
        total_commission = sum(float(sale.platform_commission) for sale in sales)
        
        return {
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'total_commission': total_commission,
            'average_sale': total_revenue / total_sales if total_sales > 0 else 0
        }
    
    def __repr__(self):
        return f'<Purchase {self.purchase_id} - {self.amount} {self.currency} ({self.status.value})>'


class MarketplaceReview(db.Model):
    """Модель отзывов о товарах в marketplace"""
    __tablename__ = 'marketplace_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Связи
    item_id = db.Column(db.Integer, db.ForeignKey('marketplace_items.id'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    purchase_id = db.Column(db.Integer, db.ForeignKey('purchases.id'), nullable=False)
    
    # Отзыв
    rating = db.Column(db.Integer, nullable=False)  # 1-5 звезд
    title = db.Column(db.String(200))
    comment = db.Column(db.Text)
    
    # Метаданные
    is_verified = db.Column(db.Boolean, default=True)  # Проверенная покупка
    is_moderated = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    buyer = db.relationship('User', backref='marketplace_reviews')
    purchase = db.relationship('Purchase', backref='review', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'buyer_id': self.buyer_id,
            'buyer': self.buyer.to_dict() if self.buyer else None,
            'purchase_id': self.purchase_id,
            'rating': self.rating,
            'title': self.title,
            'comment': self.comment,
            'is_verified': self.is_verified,
            'is_moderated': self.is_moderated,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_item_reviews(cls, item_id, limit=50):
        """Получить отзывы о товаре"""
        return cls.query.filter_by(
            item_id=item_id,
            is_moderated=True
        ).order_by(cls.created_at.desc()).limit(limit).all()
    
    def __repr__(self):
        return f'<MarketplaceReview {self.item_id} - {self.rating} stars>'

