from src.database import db
from datetime import datetime
from enum import Enum
import json

class NotificationType(Enum):
    """Типы уведомлений"""
    PROJECT_INVITATION = "project_invitation"  # Приглашение в проект
    PROJECT_SHARED = "project_shared"  # Проект поделился
    PROJECT_LIKED = "project_liked"  # Лайк проекта
    PROJECT_COMMENTED = "project_commented"  # Комментарий к проекту
    REFERRAL_REWARD = "referral_reward"  # Награда за реферала
    REFERRAL_CONVERSION = "referral_conversion"  # Конверсия реферала
    SYSTEM_ANNOUNCEMENT = "system_announcement"  # Системное объявление
    ACCOUNT_SECURITY = "account_security"  # Безопасность аккаунта

class NotificationChannel(Enum):
    """Каналы доставки уведомлений"""
    IN_APP = "in_app"  # Внутренние уведомления
    EMAIL = "email"  # Email уведомления
    PUSH = "push"  # Push уведомления в браузере
    SMS = "sms"  # SMS уведомления (для будущего)

class Notification(db.Model):
    """Модель уведомления"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Получатель уведомления
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Тип уведомления
    type = db.Column(db.Enum(NotificationType), nullable=False)
    
    # Заголовок и содержание
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    # Дополнительные данные (JSON)
    data = db.Column(db.Text)  # JSON строка с дополнительными данными
    
    # Ссылка для перехода
    action_url = db.Column(db.String(500))
    
    # Статус уведомления
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    read_at = db.Column(db.DateTime)
    
    # Приоритет (1 - низкий, 2 - средний, 3 - высокий)
    priority = db.Column(db.Integer, default=2, nullable=False)
    
    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime)  # Дата истечения (для временных уведомлений)
    
    # Связи
    user = db.relationship('User', backref='notifications')
    
    def __init__(self, user_id, type, title, message, data=None, action_url=None, priority=2, expires_at=None):
        self.user_id = user_id
        self.type = type
        self.title = title
        self.message = message
        self.data = json.dumps(data) if data else None
        self.action_url = action_url
        self.priority = priority
        self.expires_at = expires_at
    
    def get_data(self):
        """Получить дополнительные данные как словарь"""
        return json.loads(self.data) if self.data else {}
    
    def set_data(self, data):
        """Установить дополнительные данные"""
        self.data = json.dumps(data) if data else None
    
    def mark_as_read(self):
        """Отметить как прочитанное"""
        self.is_read = True
        self.read_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Преобразовать в словарь для JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type.value,
            'title': self.title,
            'message': self.message,
            'data': self.get_data(),
            'action_url': self.action_url,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'priority': self.priority,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }

class NotificationPreference(db.Model):
    """Настройки уведомлений пользователя"""
    __tablename__ = 'notification_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Пользователь
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Настройки для каждого типа уведомлений
    project_invitation_email = db.Column(db.Boolean, default=True)
    project_invitation_push = db.Column(db.Boolean, default=True)
    project_invitation_in_app = db.Column(db.Boolean, default=True)
    
    project_shared_email = db.Column(db.Boolean, default=True)
    project_shared_push = db.Column(db.Boolean, default=False)
    project_shared_in_app = db.Column(db.Boolean, default=True)
    
    project_liked_email = db.Column(db.Boolean, default=False)
    project_liked_push = db.Column(db.Boolean, default=True)
    project_liked_in_app = db.Column(db.Boolean, default=True)
    
    project_commented_email = db.Column(db.Boolean, default=True)
    project_commented_push = db.Column(db.Boolean, default=True)
    project_commented_in_app = db.Column(db.Boolean, default=True)
    
    referral_reward_email = db.Column(db.Boolean, default=True)
    referral_reward_push = db.Column(db.Boolean, default=True)
    referral_reward_in_app = db.Column(db.Boolean, default=True)
    
    referral_conversion_email = db.Column(db.Boolean, default=True)
    referral_conversion_push = db.Column(db.Boolean, default=False)
    referral_conversion_in_app = db.Column(db.Boolean, default=True)
    
    system_announcement_email = db.Column(db.Boolean, default=True)
    system_announcement_push = db.Column(db.Boolean, default=True)
    system_announcement_in_app = db.Column(db.Boolean, default=True)
    
    account_security_email = db.Column(db.Boolean, default=True)
    account_security_push = db.Column(db.Boolean, default=True)
    account_security_in_app = db.Column(db.Boolean, default=True)
    
    # Общие настройки
    email_frequency = db.Column(db.String(20), default='immediate')  # immediate, daily, weekly
    quiet_hours_start = db.Column(db.Time)  # Начало тихих часов
    quiet_hours_end = db.Column(db.Time)  # Конец тихих часов
    timezone = db.Column(db.String(50), default='UTC')
    
    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    user = db.relationship('User', backref='notification_preferences')
    
    def is_enabled(self, notification_type, channel):
        """Проверить, включен ли канал для типа уведомления"""
        field_name = f"{notification_type.value}_{channel.value}"
        return getattr(self, field_name, False)
    
    def set_preference(self, notification_type, channel, enabled):
        """Установить настройку для типа уведомления и канала"""
        field_name = f"{notification_type.value}_{channel.value}"
        if hasattr(self, field_name):
            setattr(self, field_name, enabled)
            self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        """Преобразовать в словарь для JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'preferences': {
                'project_invitation': {
                    'email': self.project_invitation_email,
                    'push': self.project_invitation_push,
                    'in_app': self.project_invitation_in_app
                },
                'project_shared': {
                    'email': self.project_shared_email,
                    'push': self.project_shared_push,
                    'in_app': self.project_shared_in_app
                },
                'project_liked': {
                    'email': self.project_liked_email,
                    'push': self.project_liked_push,
                    'in_app': self.project_liked_in_app
                },
                'project_commented': {
                    'email': self.project_commented_email,
                    'push': self.project_commented_push,
                    'in_app': self.project_commented_in_app
                },
                'referral_reward': {
                    'email': self.referral_reward_email,
                    'push': self.referral_reward_push,
                    'in_app': self.referral_reward_in_app
                },
                'referral_conversion': {
                    'email': self.referral_conversion_email,
                    'push': self.referral_conversion_push,
                    'in_app': self.referral_conversion_in_app
                },
                'system_announcement': {
                    'email': self.system_announcement_email,
                    'push': self.system_announcement_push,
                    'in_app': self.system_announcement_in_app
                },
                'account_security': {
                    'email': self.account_security_email,
                    'push': self.account_security_push,
                    'in_app': self.account_security_in_app
                }
            },
            'settings': {
                'email_frequency': self.email_frequency,
                'quiet_hours_start': self.quiet_hours_start.strftime('%H:%M') if self.quiet_hours_start else None,
                'quiet_hours_end': self.quiet_hours_end.strftime('%H:%M') if self.quiet_hours_end else None,
                'timezone': self.timezone
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class NotificationDelivery(db.Model):
    """Журнал доставки уведомлений"""
    __tablename__ = 'notification_deliveries'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Связь с уведомлением
    notification_id = db.Column(db.Integer, db.ForeignKey('notifications.id'), nullable=False)
    
    # Канал доставки
    channel = db.Column(db.Enum(NotificationChannel), nullable=False)
    
    # Статус доставки
    status = db.Column(db.String(20), default='pending')  # pending, sent, delivered, failed
    
    # Детали доставки
    recipient = db.Column(db.String(200))  # Email адрес, push token, etc.
    provider_id = db.Column(db.String(100))  # ID от провайдера (SendGrid, FCM, etc.)
    error_message = db.Column(db.Text)  # Сообщение об ошибке
    
    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    
    # Связи
    notification = db.relationship('Notification', backref='deliveries')
    
    def to_dict(self):
        """Преобразовать в словарь для JSON"""
        return {
            'id': self.id,
            'notification_id': self.notification_id,
            'channel': self.channel.value,
            'status': self.status,
            'recipient': self.recipient,
            'provider_id': self.provider_id,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat(),
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None
        }

