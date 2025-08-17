from datetime import datetime
from src.database import db
import json

class ReferralTracking(db.Model):
    __tablename__ = 'referral_tracking'
    
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('referral_campaigns.id'), nullable=False)
    channel_id = db.Column(db.Integer, db.ForeignKey('referral_channels.id'), nullable=True)
    link_id = db.Column(db.Integer, db.ForeignKey('referral_links.id'), nullable=True)
    step_id = db.Column(db.Integer, db.ForeignKey('referral_steps.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Если пользователь авторизован
    
    # Информация о событии
    event_type = db.Column(db.String(50), nullable=False)  # click, conversion, step_completion, reward_given
    event_data = db.Column(db.Text)  # JSON с дополнительными данными
    
    # Информация о клике/посещении
    click_hash = db.Column(db.String(64))  # Хеш для определения уникальности
    ip_address = db.Column(db.String(45))  # IPv4 или IPv6
    user_agent = db.Column(db.Text)
    referrer = db.Column(db.String(500))
    
    # Геолокация (опционально)
    country = db.Column(db.String(2))  # ISO код страны
    city = db.Column(db.String(100))
    
    # Устройство и браузер
    device_type = db.Column(db.String(20))  # desktop, mobile, tablet
    browser = db.Column(db.String(50))
    os = db.Column(db.String(50))
    
    # Флаги
    is_unique = db.Column(db.Boolean, default=True)
    is_conversion = db.Column(db.Boolean, default=False)
    is_bot = db.Column(db.Boolean, default=False)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_event_data(self):
        """Возвращает данные события как словарь"""
        if self.event_data:
            try:
                return json.loads(self.event_data)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_event_data(self, data_dict):
        """Устанавливает данные события из словаря"""
        self.event_data = json.dumps(data_dict, ensure_ascii=False)
    
    def parse_user_agent(self):
        """Парсит User-Agent для определения браузера, ОС и типа устройства"""
        if not self.user_agent:
            return
        
        user_agent = self.user_agent.lower()
        
        # Определяем браузер
        if 'chrome' in user_agent:
            self.browser = 'Chrome'
        elif 'firefox' in user_agent:
            self.browser = 'Firefox'
        elif 'safari' in user_agent and 'chrome' not in user_agent:
            self.browser = 'Safari'
        elif 'edge' in user_agent:
            self.browser = 'Edge'
        elif 'opera' in user_agent:
            self.browser = 'Opera'
        else:
            self.browser = 'Other'
        
        # Определяем ОС
        if 'windows' in user_agent:
            self.os = 'Windows'
        elif 'mac' in user_agent:
            self.os = 'macOS'
        elif 'linux' in user_agent:
            self.os = 'Linux'
        elif 'android' in user_agent:
            self.os = 'Android'
        elif 'ios' in user_agent or 'iphone' in user_agent or 'ipad' in user_agent:
            self.os = 'iOS'
        else:
            self.os = 'Other'
        
        # Определяем тип устройства
        if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
            self.device_type = 'mobile'
        elif 'tablet' in user_agent or 'ipad' in user_agent:
            self.device_type = 'tablet'
        else:
            self.device_type = 'desktop'
    
    def detect_bot(self):
        """Определяет, является ли запрос ботом"""
        if not self.user_agent:
            return False
        
        bot_indicators = [
            'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
            'googlebot', 'bingbot', 'yandexbot', 'facebookexternalhit',
            'twitterbot', 'linkedinbot', 'whatsapp', 'telegram'
        ]
        
        user_agent_lower = self.user_agent.lower()
        self.is_bot = any(indicator in user_agent_lower for indicator in bot_indicators)
        return self.is_bot
    
    def get_location_from_ip(self):
        """Определяет местоположение по IP адресу (заглушка)"""
        # В реальном приложении здесь будет интеграция с сервисом геолокации
        # Например, MaxMind GeoIP2 или ipapi.com
        
        # Заглушка для демонстрации
        if self.ip_address:
            # Простая проверка для российских IP (очень упрощенная)
            if self.ip_address.startswith('192.168.') or self.ip_address.startswith('127.'):
                self.country = 'RU'
                self.city = 'Moscow'
            else:
                self.country = 'US'
                self.city = 'New York'
    
    def process_tracking_data(self):
        """Обрабатывает данные отслеживания"""
        self.parse_user_agent()
        self.detect_bot()
        self.get_location_from_ip()
    
    def get_event_icon(self):
        """Возвращает иконку для типа события"""
        icons = {
            'click': '👆',
            'conversion': '✅',
            'step_completion': '🎯',
            'reward_given': '🎁',
            'registration': '📝',
            'purchase': '💳',
            'share': '📤',
            'view': '👀',
            'download': '⬇️',
            'error': '❌'
        }
        return icons.get(self.event_type, '📊')
    
    def get_device_icon(self):
        """Возвращает иконку для типа устройства"""
        icons = {
            'desktop': '🖥️',
            'mobile': '📱',
            'tablet': '📱',
            'other': '❓'
        }
        return icons.get(self.device_type, '❓')
    
    def to_dict(self, include_details=False):
        """Преобразует объект в словарь"""
        data = {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'channel_id': self.channel_id,
            'link_id': self.link_id,
            'step_id': self.step_id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'event_icon': self.get_event_icon(),
            'is_unique': self.is_unique,
            'is_conversion': self.is_conversion,
            'is_bot': self.is_bot,
            'device_type': self.device_type,
            'device_icon': self.get_device_icon(),
            'browser': self.browser,
            'os': self.os,
            'country': self.country,
            'city': self.city,
            'created_at': self.created_at.isoformat()
        }
        
        if include_details:
            data.update({
                'event_data': self.get_event_data(),
                'click_hash': self.click_hash,
                'ip_address': self.ip_address,
                'user_agent': self.user_agent,
                'referrer': self.referrer
            })
        
        return data
    
    @staticmethod
    def get_campaign_analytics(campaign_id, days=30):
        """Возвращает аналитику по кампании"""
        from datetime import timedelta
        from sqlalchemy import func
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Общая статистика
        total_events = ReferralTracking.query.filter(
            ReferralTracking.campaign_id == campaign_id,
            ReferralTracking.created_at >= start_date
        ).count()
        
        unique_events = ReferralTracking.query.filter(
            ReferralTracking.campaign_id == campaign_id,
            ReferralTracking.is_unique == True,
            ReferralTracking.created_at >= start_date
        ).count()
        
        conversions = ReferralTracking.query.filter(
            ReferralTracking.campaign_id == campaign_id,
            ReferralTracking.is_conversion == True,
            ReferralTracking.created_at >= start_date
        ).count()
        
        # Статистика по типам событий
        event_stats = db.session.query(
            ReferralTracking.event_type,
            func.count(ReferralTracking.id).label('count')
        ).filter(
            ReferralTracking.campaign_id == campaign_id,
            ReferralTracking.created_at >= start_date
        ).group_by(ReferralTracking.event_type).all()
        
        # Статистика по устройствам
        device_stats = db.session.query(
            ReferralTracking.device_type,
            func.count(ReferralTracking.id).label('count')
        ).filter(
            ReferralTracking.campaign_id == campaign_id,
            ReferralTracking.created_at >= start_date
        ).group_by(ReferralTracking.device_type).all()
        
        # Статистика по странам
        country_stats = db.session.query(
            ReferralTracking.country,
            func.count(ReferralTracking.id).label('count')
        ).filter(
            ReferralTracking.campaign_id == campaign_id,
            ReferralTracking.created_at >= start_date,
            ReferralTracking.country.isnot(None)
        ).group_by(ReferralTracking.country).all()
        
        return {
            'total_events': total_events,
            'unique_events': unique_events,
            'conversions': conversions,
            'conversion_rate': round((conversions / total_events * 100), 2) if total_events > 0 else 0,
            'unique_rate': round((unique_events / total_events * 100), 2) if total_events > 0 else 0,
            'event_types': [
                {'type': stat.event_type, 'count': stat.count}
                for stat in event_stats
            ],
            'devices': [
                {'type': stat.device_type, 'count': stat.count}
                for stat in device_stats
            ],
            'countries': [
                {'country': stat.country, 'count': stat.count}
                for stat in country_stats
            ]
        }
    
    def __repr__(self):
        return f'<ReferralTracking {self.event_type} for campaign {self.campaign_id}>'

