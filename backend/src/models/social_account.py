from datetime import datetime
from src.database import db

class SocialAccount(db.Model):
    __tablename__ = 'social_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    provider = db.Column(db.String(50), nullable=False)  # google, vk, telegram, github
    provider_id = db.Column(db.String(100), nullable=False)  # ID пользователя у провайдера
    provider_email = db.Column(db.String(120))  # Email от провайдера
    provider_name = db.Column(db.String(200))  # Имя от провайдера
    provider_avatar = db.Column(db.String(500))  # URL аватара
    access_token = db.Column(db.Text)  # OAuth access token (зашифрован)
    refresh_token = db.Column(db.Text)  # OAuth refresh token (зашифрован)
    token_expires_at = db.Column(db.DateTime)  # Время истечения токена
    is_primary = db.Column(db.Boolean, default=False)  # Основной способ входа
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Уникальность по провайдеру и ID
    __table_args__ = (
        db.UniqueConstraint('provider', 'provider_id', name='unique_provider_account'),
    )
    
    def __repr__(self):
        return f'<SocialAccount {self.provider}:{self.provider_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'provider': self.provider,
            'provider_id': self.provider_id,
            'provider_email': self.provider_email,
            'provider_name': self.provider_name,
            'provider_avatar': self.provider_avatar,
            'is_primary': self.is_primary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_dict_safe(self):
        """Безопасная версия без токенов"""
        return {
            'id': self.id,
            'provider': self.provider,
            'provider_name': self.provider_name,
            'provider_avatar': self.provider_avatar,
            'is_primary': self.is_primary,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

