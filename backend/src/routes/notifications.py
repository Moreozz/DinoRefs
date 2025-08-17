from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, and_, or_
from src.database import db
from src.models.notification import Notification, NotificationPreference, NotificationDelivery, NotificationType, NotificationChannel
from src.models.user import User
from datetime import datetime, timedelta
import json

notifications_bp = Blueprint('notifications', __name__)

# ==================== УВЕДОМЛЕНИЯ ====================

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Получить список уведомлений пользователя"""
    try:
        user_id = get_jwt_identity()
        
        # Параметры запроса
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        notification_type = request.args.get('type')
        
        # Базовый запрос
        query = Notification.query.filter_by(user_id=user_id)
        
        # Фильтры
        if unread_only:
            query = query.filter_by(is_read=False)
        
        if notification_type:
            try:
                type_enum = NotificationType(notification_type)
                query = query.filter_by(type=type_enum)
            except ValueError:
                return jsonify({'error': 'Неверный тип уведомления'}), 400
        
        # Исключаем истекшие уведомления
        query = query.filter(
            or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.utcnow()
            )
        )
        
        # Сортировка по дате создания (новые первыми)
        query = query.order_by(desc(Notification.created_at))
        
        # Пагинация
        notifications = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': notifications.total,
                'pages': notifications.pages,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/<int:notification_id>', methods=['GET'])
@jwt_required()
def get_notification(notification_id):
    """Получить конкретное уведомление"""
    try:
        user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Уведомление не найдено'}), 404
        
        return jsonify({'notification': notification.to_dict()})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Отметить уведомление как прочитанное"""
    try:
        user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Уведомление не найдено'}), 404
        
        notification.mark_as_read()
        
        return jsonify({
            'message': 'Уведомление отмечено как прочитанное',
            'notification': notification.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Отметить все уведомления как прочитанные"""
    try:
        user_id = get_jwt_identity()
        
        # Обновляем все непрочитанные уведомления
        updated_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Отмечено как прочитанные {updated_count} уведомлений',
            'updated_count': updated_count
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Удалить уведомление"""
    try:
        user_id = get_jwt_identity()
        
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Уведомление не найдено'}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Уведомление удалено'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/notifications/stats', methods=['GET'])
@jwt_required()
def get_notification_stats():
    """Получить статистику уведомлений"""
    try:
        user_id = get_jwt_identity()
        
        # Общее количество уведомлений
        total_count = Notification.query.filter_by(user_id=user_id).count()
        
        # Количество непрочитанных
        unread_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).filter(
            or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.utcnow()
            )
        ).count()
        
        # Статистика по типам (за последние 30 дней)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        type_stats = {}
        for notification_type in NotificationType:
            count = Notification.query.filter_by(
                user_id=user_id,
                type=notification_type
            ).filter(
                Notification.created_at >= thirty_days_ago
            ).count()
            type_stats[notification_type.value] = count
        
        return jsonify({
            'total_count': total_count,
            'unread_count': unread_count,
            'type_stats': type_stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== НАСТРОЙКИ УВЕДОМЛЕНИЙ ====================

@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Получить настройки уведомлений пользователя"""
    try:
        user_id = get_jwt_identity()
        
        preferences = NotificationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            # Создаем настройки по умолчанию
            preferences = NotificationPreference(user_id=user_id)
            db.session.add(preferences)
            db.session.commit()
        
        return jsonify({'preferences': preferences.to_dict()})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_notification_preferences():
    """Обновить настройки уведомлений"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        preferences = NotificationPreference.query.filter_by(user_id=user_id).first()
        
        if not preferences:
            preferences = NotificationPreference(user_id=user_id)
            db.session.add(preferences)
        
        # Обновляем настройки для каждого типа уведомлений
        if 'preferences' in data:
            for notification_type, channels in data['preferences'].items():
                for channel, enabled in channels.items():
                    try:
                        type_enum = NotificationType(notification_type)
                        channel_enum = NotificationChannel(channel)
                        preferences.set_preference(type_enum, channel_enum, enabled)
                    except ValueError:
                        continue  # Пропускаем неверные типы/каналы
        
        # Обновляем общие настройки
        if 'settings' in data:
            settings = data['settings']
            
            if 'email_frequency' in settings:
                preferences.email_frequency = settings['email_frequency']
            
            if 'quiet_hours_start' in settings and settings['quiet_hours_start']:
                try:
                    preferences.quiet_hours_start = datetime.strptime(
                        settings['quiet_hours_start'], '%H:%M'
                    ).time()
                except ValueError:
                    pass
            
            if 'quiet_hours_end' in settings and settings['quiet_hours_end']:
                try:
                    preferences.quiet_hours_end = datetime.strptime(
                        settings['quiet_hours_end'], '%H:%M'
                    ).time()
                except ValueError:
                    pass
            
            if 'timezone' in settings:
                preferences.timezone = settings['timezone']
        
        preferences.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Настройки уведомлений обновлены',
            'preferences': preferences.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== СОЗДАНИЕ УВЕДОМЛЕНИЙ ====================

@notifications_bp.route('/notifications', methods=['POST'])
@jwt_required()
def create_notification():
    """Создать новое уведомление (для администраторов)"""
    try:
        # Проверяем права администратора
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_admin:
            return jsonify({'error': 'Недостаточно прав'}), 403
        
        data = request.get_json()
        
        # Валидация обязательных полей
        required_fields = ['user_id', 'type', 'title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Поле {field} обязательно'}), 400
        
        # Проверяем существование пользователя
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Проверяем тип уведомления
        try:
            notification_type = NotificationType(data['type'])
        except ValueError:
            return jsonify({'error': 'Неверный тип уведомления'}), 400
        
        # Создаем уведомление
        notification = Notification(
            user_id=data['user_id'],
            type=notification_type,
            title=data['title'],
            message=data['message'],
            data=data.get('data'),
            action_url=data.get('action_url'),
            priority=data.get('priority', 2),
            expires_at=datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Уведомление создано',
            'notification': notification.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ЖУРНАЛ ДОСТАВКИ ====================

@notifications_bp.route('/notifications/<int:notification_id>/deliveries', methods=['GET'])
@jwt_required()
def get_notification_deliveries(notification_id):
    """Получить журнал доставки уведомления"""
    try:
        user_id = get_jwt_identity()
        
        # Проверяем, что уведомление принадлежит пользователю
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Уведомление не найдено'}), 404
        
        deliveries = NotificationDelivery.query.filter_by(
            notification_id=notification_id
        ).all()
        
        return jsonify({
            'deliveries': [delivery.to_dict() for delivery in deliveries]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== УТИЛИТЫ ====================

def create_notification_for_user(user_id, notification_type, title, message, data=None, action_url=None, priority=2):
    """Утилита для создания уведомления"""
    try:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            data=data,
            action_url=action_url,
            priority=priority
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return notification
        
    except Exception as e:
        db.session.rollback()
        raise e

def send_notification_to_channels(notification, channels=None):
    """Отправить уведомление по указанным каналам"""
    try:
        # Получаем настройки пользователя
        preferences = NotificationPreference.query.filter_by(
            user_id=notification.user_id
        ).first()
        
        if not preferences:
            # Создаем настройки по умолчанию
            preferences = NotificationPreference(user_id=notification.user_id)
            db.session.add(preferences)
            db.session.commit()
        
        # Определяем каналы для отправки
        if channels is None:
            channels = []
            for channel in NotificationChannel:
                if preferences.is_enabled(notification.type, channel):
                    channels.append(channel)
        
        # Создаем записи о доставке
        for channel in channels:
            delivery = NotificationDelivery(
                notification_id=notification.id,
                channel=channel,
                status='pending'
            )
            db.session.add(delivery)
        
        db.session.commit()
        
        # Здесь будет логика отправки через различные провайдеры
        # (Email, Push, SMS и т.д.)
        
        return True
        
    except Exception as e:
        db.session.rollback()
        raise e

