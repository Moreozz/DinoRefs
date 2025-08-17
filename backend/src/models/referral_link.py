from datetime import datetime
from src.database import db
import uuid
import string
import random
import hashlib

class ReferralLink(db.Model):
    __tablename__ = 'referral_links'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('referral_campaigns.id'), nullable=False)
    channel_id = db.Column(db.Integer, db.ForeignKey('referral_channels.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Основная информация
    link_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Уникальные идентификаторы
    short_code = db.Column(db.String(20), unique=True, nullable=False)
    full_url = db.Column(db.String(500), nullable=False)
    qr_code_url = db.Column(db.String(500))
    
    # UTM параметры
    utm_source = db.Column(db.String(100))
    utm_medium = db.Column(db.String(100))
    utm_campaign = db.Column(db.String(100))
    utm_term = db.Column(db.String(100))
    utm_content = db.Column(db.String(100))
    
    # Настройки ссылки
    is_active = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime)
    max_clicks = db.Column(db.Integer)
    
    # Статистика
    total_clicks = db.Column(db.Integer, default=0)
    unique_clicks = db.Column(db.Integer, default=0)
    total_conversions = db.Column(db.Integer, default=0)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_clicked_at = db.Column(db.DateTime)
    
    # Связи
    tracking = db.relationship('ReferralTracking', backref='link', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.short_code:
            self.short_code = self.generate_short_code()
        if not self.full_url:
            self.full_url = self.build_full_url()
    
    def generate_short_code(self):
        """Генерирует уникальный короткий код"""
        while True:
            code = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
            if not ReferralLink.query.filter_by(short_code=code).first():
                return code
    
    def build_full_url(self):
        """Строит полную URL с UTM параметрами"""
        if not hasattr(self, 'campaign') or not self.campaign:
            return ""
        
        base_url = f"/r/{self.short_code}"
        
        # Добавляем UTM параметры
        utm_params = []
        if self.utm_source:
            utm_params.append(f"utm_source={self.utm_source}")
        if self.utm_medium:
            utm_params.append(f"utm_medium={self.utm_medium}")
        if self.utm_campaign:
            utm_params.append(f"utm_campaign={self.utm_campaign}")
        if self.utm_term:
            utm_params.append(f"utm_term={self.utm_term}")
        if self.utm_content:
            utm_params.append(f"utm_content={self.utm_content}")
        
        if utm_params:
            base_url += "?" + "&".join(utm_params)
        
        return base_url
    
    def generate_qr_code_url(self, base_domain="https://dinorefs.com"):
        """Генерирует URL для QR-кода"""
        full_link = f"{base_domain}{self.full_url}"
        # В реальном приложении здесь будет интеграция с сервисом генерации QR-кодов
        qr_service_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={full_link}"
        return qr_service_url
    
    def is_expired(self):
        """Проверяет, истекла ли ссылка"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def is_limit_reached(self):
        """Проверяет, достигнут ли лимит кликов"""
        if not self.max_clicks:
            return False
        return self.total_clicks >= self.max_clicks
    
    def can_be_clicked(self):
        """Проверяет, можно ли кликнуть по ссылке"""
        return self.is_active and not self.is_expired() and not self.is_limit_reached()
    
    def calculate_conversion_rate(self):
        """Вычисляет коэффициент конверсии"""
        if self.total_clicks == 0:
            return 0
        return round((self.total_conversions / self.total_clicks) * 100, 2)
    
    def calculate_unique_rate(self):
        """Вычисляет процент уникальных кликов"""
        if self.total_clicks == 0:
            return 0
        return round((self.unique_clicks / self.total_clicks) * 100, 2)
    
    def get_click_hash(self, ip_address, user_agent):
        """Генерирует хеш для определения уникальности клика"""
        data = f"{self.id}:{ip_address}:{user_agent}"
        return hashlib.md5(data.encode()).hexdigest()
    
    def register_click(self, ip_address, user_agent, referrer=None):
        """Регистрирует клик по ссылке"""
        if not self.can_be_clicked():
            return False, "Ссылка недоступна"
        
        # Проверяем уникальность клика
        click_hash = self.get_click_hash(ip_address, user_agent)
        existing_tracking = ReferralTracking.query.filter_by(
            link_id=self.id,
            click_hash=click_hash
        ).first()
        
        is_unique = existing_tracking is None
        
        # Обновляем статистику
        self.total_clicks += 1
        if is_unique:
            self.unique_clicks += 1
        
        self.last_clicked_at = datetime.utcnow()
        
        # Создаем запись отслеживания
        from .referral_tracking import ReferralTracking
        tracking = ReferralTracking(
            campaign_id=self.campaign_id,
            channel_id=self.channel_id,
            link_id=self.id,
            click_hash=click_hash,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer,
            is_unique=is_unique
        )
        
        db.session.add(tracking)
        db.session.commit()
        
        return True, "Клик зарегистрирован"
    
    def get_analytics_data(self, days=30):
        """Возвращает аналитические данные за период"""
        from datetime import timedelta
        from sqlalchemy import func
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Группируем клики по дням
        daily_clicks = db.session.query(
            func.date(ReferralTracking.created_at).label('date'),
            func.count(ReferralTracking.id).label('clicks'),
            func.count(ReferralTracking.id).filter(ReferralTracking.is_unique == True).label('unique_clicks')
        ).filter(
            ReferralTracking.link_id == self.id,
            ReferralTracking.created_at >= start_date
        ).group_by(func.date(ReferralTracking.created_at)).all()
        
        return {
            'daily_clicks': [
                {
                    'date': click.date.isoformat(),
                    'clicks': click.clicks,
                    'unique_clicks': click.unique_clicks
                }
                for click in daily_clicks
            ],
            'total_period_clicks': sum(click.clicks for click in daily_clicks),
            'total_period_unique': sum(click.unique_clicks for click in daily_clicks)
        }
    
    def to_dict(self, include_analytics=False):
        """Преобразует объект в словарь"""
        data = {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'channel_id': self.channel_id,
            'user_id': self.user_id,
            'link_name': self.link_name,
            'description': self.description,
            'short_code': self.short_code,
            'full_url': self.full_url,
            'qr_code_url': self.qr_code_url or self.generate_qr_code_url(),
            'utm_source': self.utm_source,
            'utm_medium': self.utm_medium,
            'utm_campaign': self.utm_campaign,
            'utm_term': self.utm_term,
            'utm_content': self.utm_content,
            'is_active': self.is_active,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'max_clicks': self.max_clicks,
            'total_clicks': self.total_clicks,
            'unique_clicks': self.unique_clicks,
            'total_conversions': self.total_conversions,
            'conversion_rate': self.calculate_conversion_rate(),
            'unique_rate': self.calculate_unique_rate(),
            'is_expired': self.is_expired(),
            'is_limit_reached': self.is_limit_reached(),
            'can_be_clicked': self.can_be_clicked(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_clicked_at': self.last_clicked_at.isoformat() if self.last_clicked_at else None
        }
        
        if include_analytics:
            data['analytics'] = self.get_analytics_data()
        
        return data
    
    def __repr__(self):
        return f'<ReferralLink {self.link_name} ({self.short_code})>'

