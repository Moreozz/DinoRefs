from datetime import datetime
from src.database import db
import json

class ReferralStep(db.Model):
    __tablename__ = 'referral_steps'
    
    id = db.Column(db.Integer, primary_key=True)
    channel_id = db.Column(db.Integer, db.ForeignKey('referral_channels.id'), nullable=False)
    
    # Основная информация
    step_type = db.Column(db.String(50), nullable=False)  # registration, subscription, purchase, photo_upload, content_view, quiz_answer
    step_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Настройки шага
    step_order = db.Column(db.Integer, nullable=False, default=1)
    is_required = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Настройки валидации
    validation_config = db.Column(db.Text)  # JSON с настройками проверки
    
    # Настройки наград за шаг
    reward_points = db.Column(db.Integer, default=0)
    reward_description = db.Column(db.String(200))
    
    # Статистика
    total_attempts = db.Column(db.Integer, default=0)
    total_completions = db.Column(db.Integer, default=0)
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    tracking = db.relationship('ReferralTracking', backref='step', lazy=True)
    
    def get_validation_config(self):
        """Возвращает конфигурацию валидации как словарь"""
        if self.validation_config:
            try:
                return json.loads(self.validation_config)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_validation_config(self, config_dict):
        """Устанавливает конфигурацию валидации из словаря"""
        self.validation_config = json.dumps(config_dict, ensure_ascii=False)
    
    def get_step_icon(self):
        """Возвращает иконку для типа шага"""
        icons = {
            'registration': '📝',
            'subscription': '📧',
            'purchase': '💳',
            'photo_upload': '📸',
            'content_view': '👀',
            'quiz_answer': '❓',
            'social_share': '📤',
            'comment': '💬',
            'like': '❤️',
            'follow': '👥',
            'download': '⬇️',
            'survey': '📊',
            'referral': '🔗',
            'check_in': '📍',
            'review': '⭐'
        }
        return icons.get(self.step_type, '✅')
    
    def get_step_color(self):
        """Возвращает цвет для типа шага"""
        colors = {
            'registration': '#28a745',
            'subscription': '#17a2b8',
            'purchase': '#ffc107',
            'photo_upload': '#e83e8c',
            'content_view': '#6f42c1',
            'quiz_answer': '#fd7e14',
            'social_share': '#20c997',
            'comment': '#6c757d',
            'like': '#dc3545',
            'follow': '#007bff',
            'download': '#28a745',
            'survey': '#17a2b8',
            'referral': '#ffc107',
            'check_in': '#fd7e14',
            'review': '#e83e8c'
        }
        return colors.get(self.step_type, '#6c757d')
    
    def calculate_completion_rate(self):
        """Вычисляет процент завершения шага"""
        if self.total_attempts == 0:
            return 0
        return round((self.total_completions / self.total_attempts) * 100, 2)
    
    def get_validation_rules(self):
        """Возвращает правила валидации для типа шага"""
        rules = {
            'registration': {
                'required_fields': ['email', 'name'],
                'validation_method': 'email_confirmation',
                'timeout_minutes': 30
            },
            'subscription': {
                'required_fields': ['email', 'subscription_type'],
                'validation_method': 'email_verification',
                'timeout_minutes': 15
            },
            'purchase': {
                'required_fields': ['order_id', 'amount'],
                'validation_method': 'payment_confirmation',
                'timeout_minutes': 60
            },
            'photo_upload': {
                'required_fields': ['image_url'],
                'validation_method': 'image_verification',
                'max_file_size': '5MB',
                'allowed_formats': ['jpg', 'png', 'gif']
            },
            'content_view': {
                'required_fields': ['content_id', 'view_duration'],
                'validation_method': 'analytics_tracking',
                'min_view_duration': 30
            },
            'quiz_answer': {
                'required_fields': ['answers'],
                'validation_method': 'answer_verification',
                'min_correct_answers': 1
            },
            'social_share': {
                'required_fields': ['share_url', 'platform'],
                'validation_method': 'share_tracking',
                'timeout_minutes': 10
            },
            'comment': {
                'required_fields': ['comment_text', 'post_id'],
                'validation_method': 'comment_verification',
                'min_length': 10
            },
            'like': {
                'required_fields': ['post_id', 'platform'],
                'validation_method': 'like_verification',
                'timeout_minutes': 5
            },
            'follow': {
                'required_fields': ['account_handle', 'platform'],
                'validation_method': 'follow_verification',
                'timeout_minutes': 10
            }
        }
        return rules.get(self.step_type, {})
    
    def validate_step_data(self, data):
        """Проверяет данные шага согласно правилам валидации"""
        rules = self.get_validation_rules()
        config = self.get_validation_config()
        
        # Объединяем стандартные правила с пользовательской конфигурацией
        validation_rules = {**rules, **config}
        
        errors = []
        
        # Проверяем обязательные поля
        required_fields = validation_rules.get('required_fields', [])
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f"Поле '{field}' обязательно для заполнения")
        
        # Специфичные проверки для разных типов шагов
        if self.step_type == 'photo_upload' and 'image_url' in data:
            # Проверка формата изображения
            allowed_formats = validation_rules.get('allowed_formats', ['jpg', 'png'])
            file_ext = data['image_url'].split('.')[-1].lower()
            if file_ext not in allowed_formats:
                errors.append(f"Неподдерживаемый формат файла. Разрешены: {', '.join(allowed_formats)}")
        
        elif self.step_type == 'quiz_answer' and 'answers' in data:
            # Проверка ответов на викторину
            min_correct = validation_rules.get('min_correct_answers', 1)
            correct_count = sum(1 for answer in data['answers'] if answer.get('is_correct'))
            if correct_count < min_correct:
                errors.append(f"Необходимо правильно ответить минимум на {min_correct} вопросов")
        
        elif self.step_type == 'comment' and 'comment_text' in data:
            # Проверка длины комментария
            min_length = validation_rules.get('min_length', 10)
            if len(data['comment_text']) < min_length:
                errors.append(f"Комментарий должен содержать минимум {min_length} символов")
        
        return len(errors) == 0, errors
    
    def to_dict(self, include_validation=False):
        """Преобразует объект в словарь"""
        data = {
            'id': self.id,
            'channel_id': self.channel_id,
            'step_type': self.step_type,
            'step_name': self.step_name,
            'description': self.description,
            'step_order': self.step_order,
            'is_required': self.is_required,
            'is_active': self.is_active,
            'reward_points': self.reward_points,
            'reward_description': self.reward_description,
            'icon': self.get_step_icon(),
            'color': self.get_step_color(),
            'total_attempts': self.total_attempts,
            'total_completions': self.total_completions,
            'completion_rate': self.calculate_completion_rate(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_validation:
            data.update({
                'validation_config': self.get_validation_config(),
                'validation_rules': self.get_validation_rules()
            })
        
        return data
    
    def __repr__(self):
        return f'<ReferralStep {self.step_name} ({self.step_type})>'

