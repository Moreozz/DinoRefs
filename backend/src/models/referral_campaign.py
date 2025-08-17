from datetime import datetime
from src.database import db
import uuid
import string
import random

class ReferralCampaign(db.Model):
    __tablename__ = 'referral_campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Основная информация
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    campaign_type = db.Column(db.String(50), nullable=False)  # invitation, promotion, contest, event, lead_generation
    
    # Настройки кампании
    is_active = db.Column(db.Boolean, default=True)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    
    # Уникальные идентификаторы
    campaign_code = db.Column(db.String(20), unique=True, nullable=False)
    public_slug = db.Column(db.String(100), unique=True)
    
    # Статистика
    total_clicks = db.Column(db.Integer, default=0)
    total_conversions = db.Column(db.Integer, default=0)
    total_rewards_given = db.Column(db.Integer, default=0)
    
    # Настройки наград
    reward_type = db.Column(db.String(50))  # points, discount, gift, access
    reward_value = db.Column(db.String(100))
    reward_description = db.Column(db.Text)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    channels = db.relationship('ReferralChannel', backref='campaign', lazy=True, cascade='all, delete-orphan')
    links = db.relationship('ReferralLink', backref='campaign', lazy=True, cascade='all, delete-orphan')
    tracking = db.relationship('ReferralTracking', backref='campaign', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.campaign_code:
            self.campaign_code = self.generate_campaign_code()
        if not self.public_slug and self.title:
            self.public_slug = self.generate_slug(self.title)
    
    def generate_campaign_code(self):
        """Генерирует уникальный код кампании"""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not ReferralCampaign.query.filter_by(campaign_code=code).first():
                return code
    
    def generate_slug(self, title):
        """Генерирует уникальный slug из названия"""
        import re
        # Транслитерация и очистка
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug[:50]  # Ограничиваем длину
        
        # Проверяем уникальность
        original_slug = slug
        counter = 1
        while ReferralCampaign.query.filter_by(public_slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        return slug
    
    def calculate_conversion_rate(self):
        """Вычисляет коэффициент конверсии"""
        if self.total_clicks == 0:
            return 0
        return round((self.total_conversions / self.total_clicks) * 100, 2)
    
    def get_active_channels(self):
        """Возвращает активные каналы кампании"""
        return [channel for channel in self.channels if channel.is_active]
    
    def get_total_steps(self):
        """Возвращает общее количество шагов во всех каналах"""
        return sum(len(channel.steps) for channel in self.channels)
    
    def to_dict(self, include_stats=True):
        """Преобразует объект в словарь"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'campaign_type': self.campaign_type,
            'is_active': self.is_active,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'campaign_code': self.campaign_code,
            'public_slug': self.public_slug,
            'reward_type': self.reward_type,
            'reward_value': self.reward_value,
            'reward_description': self.reward_description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data.update({
                'total_clicks': self.total_clicks,
                'total_conversions': self.total_conversions,
                'total_rewards_given': self.total_rewards_given,
                'conversion_rate': self.calculate_conversion_rate(),
                'channels_count': len(self.channels),
                'active_channels_count': len(self.get_active_channels()),
                'total_steps': self.get_total_steps()
            })
        
        return data
    
    def to_public_dict(self):
        """Публичная версия для отображения без приватных данных"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'campaign_type': self.campaign_type,
            'public_slug': self.public_slug,
            'reward_type': self.reward_type,
            'reward_description': self.reward_description,
            'is_active': self.is_active,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'channels_count': len(self.get_active_channels())
        }
    
    def __repr__(self):
        return f'<ReferralCampaign {self.title} ({self.campaign_code})>'

