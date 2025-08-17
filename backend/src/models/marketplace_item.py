from src.database import db
from datetime import datetime
from enum import Enum
import uuid

class ItemType(Enum):
    PROJECT_TEMPLATE = "project_template"
    DESIGN_ASSET = "design_asset"
    REFERRAL_CAMPAIGN = "referral_campaign"
    ANALYTICS_REPORT = "analytics_report"
    CUSTOM_INTEGRATION = "custom_integration"

class ItemStatus(Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class MarketplaceItem(db.Model):
    """Модель товаров в marketplace"""
    __tablename__ = 'marketplace_items'
    
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.String(100), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Основная информация
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    short_description = db.Column(db.String(500))
    
    # Продавец
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Категория и тип
    item_type = db.Column(db.Enum(ItemType), nullable=False)
    category = db.Column(db.String(100))
    tags = db.Column(db.JSON)  # Массив тегов
    
    # Цена и продажи
    price = db.Column(db.Decimal(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='USD')
    commission_rate = db.Column(db.Decimal(5, 2), default=30.0)  # Комиссия платформы в %
    
    # Статистика
    sales_count = db.Column(db.Integer, default=0)
    views_count = db.Column(db.Integer, default=0)
    rating = db.Column(db.Decimal(3, 2), default=0.0)  # Средний рейтинг
    reviews_count = db.Column(db.Integer, default=0)
    
    # Статус и модерация
    status = db.Column(db.Enum(ItemStatus), nullable=False, default=ItemStatus.DRAFT)
    is_featured = db.Column(db.Boolean, default=False)
    is_bestseller = db.Column(db.Boolean, default=False)
    
    # Файлы и контент
    preview_images = db.Column(db.JSON)  # Массив URL превью изображений
    download_files = db.Column(db.JSON)  # Массив файлов для скачивания
    demo_url = db.Column(db.String(500))  # Ссылка на демо
    
    # Связанные данные
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))  # Если товар основан на проекте
    
    # Метаданные
    metadata = db.Column(db.JSON)  # Дополнительные данные специфичные для типа товара
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    
    # Связи
    seller = db.relationship('User', backref='marketplace_items')
    project = db.relationship('Project', backref='marketplace_items')
    purchases = db.relationship('Purchase', backref='item', lazy=True)
    reviews = db.relationship('MarketplaceReview', backref='item', lazy=True)
    
    def to_dict(self, include_seller=True):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'title': self.title,
            'description': self.description,
            'short_description': self.short_description,
            'seller_id': self.seller_id,
            'seller': self.seller.to_dict() if include_seller and self.seller else None,
            'item_type': self.item_type.value,
            'category': self.category,
            'tags': self.tags or [],
            'price': float(self.price),
            'currency': self.currency,
            'sales_count': self.sales_count,
            'views_count': self.views_count,
            'rating': float(self.rating),
            'reviews_count': self.reviews_count,
            'status': self.status.value,
            'is_featured': self.is_featured,
            'is_bestseller': self.is_bestseller,
            'preview_images': self.preview_images or [],
            'demo_url': self.demo_url,
            'project_id': self.project_id,
            'metadata': self.metadata or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None
        }
    
    def increment_views(self):
        """Увеличить счетчик просмотров"""
        self.views_count += 1
        db.session.commit()
    
    def increment_sales(self):
        """Увеличить счетчик продаж"""
        self.sales_count += 1
        db.session.commit()
    
    def calculate_seller_earnings(self):
        """Рассчитать доходы продавца с учетом комиссии"""
        commission = self.price * (self.commission_rate / 100)
        return self.price - commission
    
    def calculate_platform_commission(self):
        """Рассчитать комиссию платформы"""
        return self.price * (self.commission_rate / 100)
    
    def submit_for_review(self):
        """Отправить на модерацию"""
        self.status = ItemStatus.PENDING_REVIEW
        db.session.commit()
    
    def approve(self):
        """Одобрить товар"""
        self.status = ItemStatus.APPROVED
        self.published_at = datetime.utcnow()
        db.session.commit()
    
    def reject(self, reason=None):
        """Отклонить товар"""
        self.status = ItemStatus.REJECTED
        if reason:
            if not self.metadata:
                self.metadata = {}
            self.metadata['rejection_reason'] = reason
        db.session.commit()
    
    def suspend(self, reason=None):
        """Приостановить продажи"""
        self.status = ItemStatus.SUSPENDED
        if reason:
            if not self.metadata:
                self.metadata = {}
            self.metadata['suspension_reason'] = reason
        db.session.commit()
    
    def update_rating(self):
        """Обновить рейтинг на основе отзывов"""
        if self.reviews:
            total_rating = sum(review.rating for review in self.reviews)
            self.rating = total_rating / len(self.reviews)
            self.reviews_count = len(self.reviews)
        else:
            self.rating = 0.0
            self.reviews_count = 0
        db.session.commit()
    
    @classmethod
    def get_featured_items(cls, limit=10):
        """Получить рекомендуемые товары"""
        return cls.query.filter_by(
            status=ItemStatus.APPROVED,
            is_featured=True
        ).order_by(cls.sales_count.desc()).limit(limit).all()
    
    @classmethod
    def get_bestsellers(cls, limit=10):
        """Получить бестселлеры"""
        return cls.query.filter_by(
            status=ItemStatus.APPROVED
        ).order_by(cls.sales_count.desc()).limit(limit).all()
    
    @classmethod
    def search_items(cls, query=None, item_type=None, category=None, min_price=None, max_price=None, sort_by='created_at'):
        """Поиск товаров с фильтрами"""
        items_query = cls.query.filter_by(status=ItemStatus.APPROVED)
        
        if query:
            items_query = items_query.filter(
                db.or_(
                    cls.title.contains(query),
                    cls.description.contains(query),
                    cls.short_description.contains(query)
                )
            )
        
        if item_type:
            if isinstance(item_type, str):
                item_type = ItemType(item_type)
            items_query = items_query.filter_by(item_type=item_type)
        
        if category:
            items_query = items_query.filter_by(category=category)
        
        if min_price is not None:
            items_query = items_query.filter(cls.price >= min_price)
        
        if max_price is not None:
            items_query = items_query.filter(cls.price <= max_price)
        
        # Сортировка
        if sort_by == 'price_asc':
            items_query = items_query.order_by(cls.price.asc())
        elif sort_by == 'price_desc':
            items_query = items_query.order_by(cls.price.desc())
        elif sort_by == 'rating':
            items_query = items_query.order_by(cls.rating.desc())
        elif sort_by == 'sales':
            items_query = items_query.order_by(cls.sales_count.desc())
        else:  # created_at
            items_query = items_query.order_by(cls.created_at.desc())
        
        return items_query
    
    def __repr__(self):
        return f'<MarketplaceItem {self.title} - {self.price} {self.currency}>'

