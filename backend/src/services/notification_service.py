from src.models.notification import Notification, NotificationPreference, NotificationDelivery, NotificationType, NotificationChannel
from src.models.user import User
from src.services.email_service import email_service
from src.database import db
from datetime import datetime, timedelta
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationService:
    """Сервис для управления уведомлениями"""
    
    def __init__(self):
        self.email_service = email_service
    
    def create_notification(self, user_id, notification_type, title, message, data=None, action_url=None, priority=2, expires_at=None):
        """Создать уведомление"""
        try:
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                data=data,
                action_url=action_url,
                priority=priority,
                expires_at=expires_at
            )
            
            db.session.add(notification)
            db.session.commit()
            
            logger.info(f"Создано уведомление {notification.id} для пользователя {user_id}")
            
            # Отправляем уведомление по всем активным каналам
            self.send_notification(notification)
            
            return notification
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Ошибка создания уведомления: {str(e)}")
            raise e
    
    def send_notification(self, notification):
        """Отправить уведомление по всем активным каналам"""
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
            
            # Получаем данные пользователя
            user = User.query.get(notification.user_id)
            if not user:
                logger.error(f"Пользователь {notification.user_id} не найден")
                return
            
            # Отправляем по каждому каналу, если он включен
            for channel in NotificationChannel:
                if preferences.is_enabled(notification.type, channel):
                    self._send_to_channel(notification, user, channel)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления {notification.id}: {str(e)}")
    
    def _send_to_channel(self, notification, user, channel):
        """Отправить уведомление по конкретному каналу"""
        try:
            # Создаем запись о доставке
            delivery = NotificationDelivery(
                notification_id=notification.id,
                channel=channel,
                status='pending'
            )
            db.session.add(delivery)
            db.session.commit()
            
            success = False
            
            if channel == NotificationChannel.EMAIL:
                success = self._send_email_notification(notification, user, delivery)
            elif channel == NotificationChannel.IN_APP:
                success = self._send_in_app_notification(notification, user, delivery)
            elif channel == NotificationChannel.PUSH:
                success = self._send_push_notification(notification, user, delivery)
            
            # Обновляем статус доставки
            if success:
                delivery.status = 'sent'
                delivery.sent_at = datetime.utcnow()
            else:
                delivery.status = 'failed'
                delivery.error_message = 'Ошибка отправки'
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Ошибка отправки по каналу {channel.value}: {str(e)}")
            if 'delivery' in locals():
                delivery.status = 'failed'
                delivery.error_message = str(e)
                db.session.commit()
    
    def _send_email_notification(self, notification, user, delivery):
        """Отправить email уведомление"""
        try:
            delivery.recipient = user.email
            
            # Выбираем подходящий метод отправки в зависимости от типа уведомления
            if notification.type == NotificationType.PROJECT_INVITATION:
                data = notification.get_data()
                return self.email_service.send_project_invitation_email(
                    user.email,
                    user.name,
                    data.get('project_name', ''),
                    data.get('inviter_name', ''),
                    notification.action_url or ''
                )
            
            elif notification.type == NotificationType.PROJECT_SHARED:
                data = notification.get_data()
                return self.email_service.send_project_shared_email(
                    user.email,
                    user.name,
                    data.get('project_name', ''),
                    data.get('sharer_name', ''),
                    notification.action_url or ''
                )
            
            elif notification.type == NotificationType.PROJECT_LIKED:
                data = notification.get_data()
                return self.email_service.send_project_liked_email(
                    user.email,
                    user.name,
                    data.get('project_name', ''),
                    data.get('liker_name', ''),
                    notification.action_url or ''
                )
            
            elif notification.type == NotificationType.PROJECT_COMMENTED:
                data = notification.get_data()
                return self.email_service.send_project_commented_email(
                    user.email,
                    user.name,
                    data.get('project_name', ''),
                    data.get('commenter_name', ''),
                    data.get('comment_text', ''),
                    notification.action_url or ''
                )
            
            elif notification.type == NotificationType.REFERRAL_REWARD:
                data = notification.get_data()
                return self.email_service.send_referral_reward_email(
                    user.email,
                    user.name,
                    data.get('reward_amount', 0),
                    data.get('reward_type', ''),
                    data.get('campaign_name', '')
                )
            
            elif notification.type == NotificationType.SYSTEM_ANNOUNCEMENT:
                return self.email_service.send_system_announcement_email(
                    user.email,
                    user.name,
                    notification.title,
                    notification.message,
                    notification.action_url
                )
            
            elif notification.type == NotificationType.ACCOUNT_SECURITY:
                data = notification.get_data()
                return self.email_service.send_account_security_email(
                    user.email,
                    user.name,
                    notification.title,
                    notification.message,
                    data.get('action_required', False)
                )
            
            else:
                logger.warning(f"Неизвестный тип уведомления для email: {notification.type}")
                return False
                
        except Exception as e:
            logger.error(f"Ошибка отправки email уведомления: {str(e)}")
            return False
    
    def _send_in_app_notification(self, notification, user, delivery):
        """Отправить внутреннее уведомление (уже создано в БД)"""
        try:
            # Внутренние уведомления уже сохранены в БД при создании
            delivery.status = 'delivered'
            delivery.delivered_at = datetime.utcnow()
            return True
            
        except Exception as e:
            logger.error(f"Ошибка внутреннего уведомления: {str(e)}")
            return False
    
    def _send_push_notification(self, notification, user, delivery):
        """Отправить push уведомление"""
        try:
            # TODO: Реализовать отправку push уведомлений
            # Здесь будет интеграция с Firebase Cloud Messaging или другим сервисом
            logger.info(f"Push уведомление для пользователя {user.id}: {notification.title}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка push уведомления: {str(e)}")
            return False
    
    # Удобные методы для создания конкретных типов уведомлений
    
    def notify_project_invitation(self, user_id, project_name, inviter_name, invitation_link):
        """Уведомление о приглашении в проект"""
        return self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.PROJECT_INVITATION,
            title=f"Приглашение в проект {project_name}",
            message=f"{inviter_name} пригласил вас присоединиться к проекту \"{project_name}\"",
            data={
                'project_name': project_name,
                'inviter_name': inviter_name
            },
            action_url=invitation_link,
            priority=3
        )
    
    def notify_project_shared(self, user_id, project_name, sharer_name, project_link):
        """Уведомление о том, что проект поделился"""
        return self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.PROJECT_SHARED,
            title=f"С вами поделились проектом {project_name}",
            message=f"{sharer_name} поделился с вами проектом \"{project_name}\"",
            data={
                'project_name': project_name,
                'sharer_name': sharer_name
            },
            action_url=project_link,
            priority=2
        )
    
    def notify_project_liked(self, user_id, project_name, liker_name, project_link):
        """Уведомление о лайке проекта"""
        return self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.PROJECT_LIKED,
            title=f"Ваш проект {project_name} понравился!",
            message=f"{liker_name} поставил лайк вашему проекту \"{project_name}\"",
            data={
                'project_name': project_name,
                'liker_name': liker_name
            },
            action_url=project_link,
            priority=1
        )
    
    def notify_project_commented(self, user_id, project_name, commenter_name, comment_text, project_link):
        """Уведомление о комментарии к проекту"""
        return self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.PROJECT_COMMENTED,
            title=f"Новый комментарий к проекту {project_name}",
            message=f"{commenter_name} оставил комментарий к вашему проекту \"{project_name}\"",
            data={
                'project_name': project_name,
                'commenter_name': commenter_name,
                'comment_text': comment_text
            },
            action_url=project_link,
            priority=2
        )
    
    def notify_referral_reward(self, user_id, reward_amount, reward_type, campaign_name):
        """Уведомление о получении награды за реферала"""
        return self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.REFERRAL_REWARD,
            title="Вы получили награду за реферала!",
            message=f"Поздравляем! Вы получили {reward_amount} {reward_type} за успешное привлечение реферала",
            data={
                'reward_amount': reward_amount,
                'reward_type': reward_type,
                'campaign_name': campaign_name
            },
            priority=3
        )
    
    def notify_system_announcement(self, user_id, title, message, action_url=None):
        """Системное объявление"""
        return self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
            title=title,
            message=message,
            action_url=action_url,
            priority=2
        )
    
    def notify_account_security(self, user_id, security_event, event_details, action_required=False):
        """Уведомление о безопасности аккаунта"""
        return self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.ACCOUNT_SECURITY,
            title="Уведомление о безопасности аккаунта",
            message=f"{security_event}: {event_details}",
            data={
                'security_event': security_event,
                'event_details': event_details,
                'action_required': action_required
            },
            priority=3 if action_required else 2
        )
    
    def cleanup_expired_notifications(self):
        """Очистить истекшие уведомления"""
        try:
            expired_count = Notification.query.filter(
                Notification.expires_at < datetime.utcnow()
            ).delete()
            
            db.session.commit()
            
            logger.info(f"Удалено {expired_count} истекших уведомлений")
            return expired_count
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Ошибка очистки истекших уведомлений: {str(e)}")
            return 0

# Глобальный экземпляр сервиса
notification_service = NotificationService()

