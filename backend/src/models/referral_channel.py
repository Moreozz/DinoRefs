from datetime import datetime
from src.database import db
import json

class ReferralChannel(db.Model):
    __tablename__ = 'referral_channels'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('referral_campaigns.id'), nullable=False)
    
    # Основная информация
    channel_type = db.Column(db.String(50), nullable=False)  # telegram, vk, instagram, youtube, website, offline
    channel_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Настройки канала
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=0)  # Приоритет отображения
    
    # Специфичные настройки для каждого типа канала
    channel_config = db.Column(db.Text)  # JSON с настройками
    
    # Статистика
    total_clicks = db.Column(db.Integer, default=0)
    total_conversions = db.Column(db.Integer, default=0)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    steps = db.relationship('ReferralStep', backref='channel', lazy=True, cascade='all, delete-orphan', order_by='ReferralStep.step_order')
    links = db.relationship('ReferralLink', backref='channel', lazy=True, cascade='all, delete-orphan')
    
    def get_config(self):
        """Возвращает конфигурацию канала как словарь"""
        if self.channel_config:
            try:
                return json.loads(self.channel_config)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_config(self, config_dict):
        """Устанавливает конфигурацию канала из словаря"""
        self.channel_config = json.dumps(config_dict, ensure_ascii=False)
    
    def get_channel_icon(self):
        """Возвращает иконку для типа канала"""
        icons = {
            'telegram': '📱',
            'vk': '🔵',
            'instagram': '📷',
            'youtube': '📺',
            'website': '🌐',
            'offline': '🏪',
            'email': '📧',
            'whatsapp': '💬',
            'facebook': '📘',
            'twitter': '🐦',
            'tiktok': '🎵',
            'linkedin': '💼'
        }
        return icons.get(self.channel_type, '📢')
    
    def get_channel_color(self):
        """Возвращает цвет для типа канала"""
        colors = {
            'telegram': '#0088cc',
            'vk': '#4c75a3',
            'instagram': '#e4405f',
            'youtube': '#ff0000',
            'website': '#28a745',
            'offline': '#6c757d',
            'email': '#17a2b8',
            'whatsapp': '#25d366',
            'facebook': '#1877f2',
            'twitter': '#1da1f2',
            'tiktok': '#000000',
            'linkedin': '#0077b5'
        }
        return colors.get(self.channel_type, '#6c757d')
    
    def calculate_conversion_rate(self):
        """Вычисляет коэффициент конверсии канала"""
        if self.total_clicks == 0:
            return 0
        return round((self.total_conversions / self.total_clicks) * 100, 2)
    
    def get_active_steps(self):
        """Возвращает активные шаги канала"""
        return [step for step in self.steps if step.is_active]
    
    def get_required_fields(self):
        """Возвращает обязательные поля для типа канала"""
        required_fields = {
            'telegram': ['chat_link', 'hashtags'],
            'vk': ['group_link', 'post_format'],
            'instagram': ['account_handle', 'hashtags', 'story_format'],
            'youtube': ['channel_link', 'video_description'],
            'website': ['target_url', 'utm_source', 'utm_medium'],
            'offline': ['location', 'qr_code_size'],
            'email': ['subject_template', 'email_template'],
            'whatsapp': ['message_template'],
            'facebook': ['page_link', 'post_format'],
            'twitter': ['tweet_template', 'hashtags'],
            'tiktok': ['account_handle', 'video_description'],
            'linkedin': ['company_page', 'post_format']
        }
        return required_fields.get(self.channel_type, [])
    
    def validate_config(self):
        """Проверяет корректность конфигурации канала"""
        config = self.get_config()
        required_fields = self.get_required_fields()
        
        missing_fields = []
        for field in required_fields:
            if field not in config or not config[field]:
                missing_fields.append(field)
        
        return len(missing_fields) == 0, missing_fields
    
    def to_dict(self, include_steps=False, include_stats=True):
        """Преобразует объект в словарь"""
        data = {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'channel_type': self.channel_type,
            'channel_name': self.channel_name,
            'description': self.description,
            'is_active': self.is_active,
            'priority': self.priority,
            'config': self.get_config(),
            'icon': self.get_channel_icon(),
            'color': self.get_channel_color(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_stats:
            data.update({
                'total_clicks': self.total_clicks,
                'total_conversions': self.total_conversions,
                'conversion_rate': self.calculate_conversion_rate(),
                'steps_count': len(self.steps),
                'active_steps_count': len(self.get_active_steps())
            })
        
        if include_steps:
            data['steps'] = [step.to_dict() for step in self.steps]
        
        # Добавляем информацию о валидации
        is_valid, missing_fields = self.validate_config()
        data.update({
            'is_valid': is_valid,
            'missing_fields': missing_fields,
            'required_fields': self.get_required_fields()
        })
        
        return data
    
    def __repr__(self):
        return f'<ReferralChannel {self.channel_name} ({self.channel_type})>'

