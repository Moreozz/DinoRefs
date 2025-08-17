from flask import current_app
from src.database import db
from src.models.user_subscription import UserSubscription
from src.models.subscription_plan import SubscriptionPlan, PlanType
from src.models.project import Project
from src.models.referral_campaign import ReferralCampaign
from src.models.referral_tracking import ReferralTracking
from datetime import datetime, timedelta

class SubscriptionService:
    """Сервис для управления подписками и проверки лимитов"""
    
    @staticmethod
    def get_user_subscription(user_id):
        """Получить активную подписку пользователя"""
        subscription = UserSubscription.get_user_active_subscription(user_id)
        
        if not subscription:
            # Создаем бесплатную подписку если её нет
            subscription = UserSubscription.create_free_subscription(user_id)
        
        return subscription
    
    @staticmethod
    def can_create_project(user_id):
        """Проверить, может ли пользователь создать новый проект"""
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if not subscription:
            return False, "Подписка не найдена"
        
        # Для безлимитных планов
        if subscription.plan.max_active_projects == 0:
            return True, "Безлимитный план"
        
        # Подсчитываем активные проекты
        active_projects = Project.query.filter_by(
            user_id=user_id,
            is_deleted=False
        ).count()
        
        if active_projects >= subscription.plan.max_active_projects:
            return False, f"Достигнут лимит проектов ({subscription.plan.max_active_projects}). Обновите подписку для создания большего количества проектов."
        
        return True, "Можно создать проект"
    
    @staticmethod
    def can_use_referrals(user_id, referrals_count=1):
        """Проверить, может ли пользователь использовать рефералы"""
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if not subscription:
            return False, "Подписка не найдена"
        
        # Сбрасываем месячное использование если нужно
        subscription.reset_monthly_usage_if_needed()
        
        # Для безлимитных планов
        if subscription.plan.max_referrals_per_month == 0:
            return True, "Безлимитный план"
        
        # Проверяем лимит
        if subscription.referrals_used_this_month + referrals_count > subscription.plan.max_referrals_per_month:
            remaining = subscription.plan.max_referrals_per_month - subscription.referrals_used_this_month
            return False, f"Недостаточно рефералов. Осталось: {remaining} из {subscription.plan.max_referrals_per_month}. Обновите подписку для увеличения лимита."
        
        return True, "Можно использовать рефералы"
    
    @staticmethod
    def increment_referral_usage(user_id, count=1):
        """Увеличить счетчик использованных рефералов"""
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if subscription:
            subscription.referrals_used_this_month += count
            db.session.commit()
            
            # Проверяем, не приближается ли к лимиту
            if subscription.plan.max_referrals_per_month > 0:
                usage_percent = (subscription.referrals_used_this_month / subscription.plan.max_referrals_per_month) * 100
                
                # Уведомляем при 80% и 95% использования
                if usage_percent >= 95 and not subscription.notified_95_percent:
                    SubscriptionService._send_usage_warning(user_id, subscription, 95)
                    subscription.notified_95_percent = True
                    db.session.commit()
                elif usage_percent >= 80 and not subscription.notified_80_percent:
                    SubscriptionService._send_usage_warning(user_id, subscription, 80)
                    subscription.notified_80_percent = True
                    db.session.commit()
    
    @staticmethod
    def can_invite_team_members(user_id, additional_members=1):
        """Проверить, может ли пользователь пригласить участников команды"""
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if not subscription:
            return False, "Подписка не найдена"
        
        # Для безлимитных планов
        if subscription.plan.max_team_members == 0:
            return True, "Безлимитный план"
        
        # Подсчитываем текущих участников
        from src.models.project_member import ProjectMember
        current_members = db.session.query(ProjectMember.user_id).join(Project).filter(
            Project.user_id == user_id,
            ProjectMember.user_id != user_id  # Исключаем самого владельца
        ).distinct().count()
        
        if current_members + additional_members > subscription.plan.max_team_members:
            return False, f"Достигнут лимит участников команды ({subscription.plan.max_team_members}). Обновите подписку для приглашения большего количества участников."
        
        return True, "Можно пригласить участников"
    
    @staticmethod
    def has_feature(user_id, feature_name):
        """Проверить, доступна ли функция пользователю"""
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if not subscription:
            return False
        
        feature_map = {
            'advanced_analytics': subscription.plan.has_advanced_analytics,
            'api_access': subscription.plan.has_api_access,
            'white_label': subscription.plan.has_white_label,
            'priority_support': subscription.plan.has_priority_support,
            'custom_rewards': subscription.plan.has_custom_rewards,
            'marketplace_access': subscription.plan.has_marketplace_access
        }
        
        return feature_map.get(feature_name, False)
    
    @staticmethod
    def get_plan_upgrade_suggestions(user_id):
        """Получить рекомендации по обновлению плана"""
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if not subscription:
            return []
        
        current_plan_type = subscription.plan.plan_type
        suggestions = []
        
        # Анализируем использование и предлагаем обновления
        if current_plan_type == PlanType.FREE:
            # Проверяем активность пользователя
            projects_count = Project.query.filter_by(user_id=user_id, is_deleted=False).count()
            campaigns_count = ReferralCampaign.query.filter_by(user_id=user_id).count()
            
            if projects_count >= 1 or campaigns_count > 0:
                suggestions.append({
                    'plan_type': 'starter',
                    'reason': 'Увеличьте лимиты и получите доступ к расширенной аналитике',
                    'benefits': ['До 1000 рефералов в месяц', 'До 3 проектов', 'Кастомные награды']
                })
        
        elif current_plan_type == PlanType.STARTER:
            # Проверяем приближение к лимитам
            usage_percent = (subscription.referrals_used_this_month / subscription.plan.max_referrals_per_month) * 100 if subscription.plan.max_referrals_per_month > 0 else 0
            
            if usage_percent > 70:
                suggestions.append({
                    'plan_type': 'growth',
                    'reason': 'Вы активно используете рефералы. Обновитесь для увеличения лимитов',
                    'benefits': ['До 10000 рефералов в месяц', 'API доступ', 'White-label ссылки']
                })
        
        elif current_plan_type == PlanType.GROWTH:
            suggestions.append({
                'plan_type': 'enterprise',
                'reason': 'Получите безлимитные возможности и персональную поддержку',
                'benefits': ['Безлимитные рефералы', 'Персональный менеджер', 'Кастомная разработка']
            })
        
        return suggestions
    
    @staticmethod
    def get_usage_analytics(user_id):
        """Получить аналитику использования подписки"""
        subscription = SubscriptionService.get_user_subscription(user_id)
        
        if not subscription:
            return None
        
        # Подсчитываем использование за текущий месяц
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Рефералы за месяц
        referrals_this_month = ReferralTracking.query.filter(
            ReferralTracking.user_id == user_id,
            ReferralTracking.created_at >= start_of_month
        ).count()
        
        # Проекты
        total_projects = Project.query.filter_by(user_id=user_id, is_deleted=False).count()
        
        # Участники команды
        from src.models.project_member import ProjectMember
        team_members = db.session.query(ProjectMember.user_id).join(Project).filter(
            Project.user_id == user_id,
            ProjectMember.user_id != user_id
        ).distinct().count()
        
        return {
            'referrals': {
                'used': referrals_this_month,
                'limit': subscription.plan.max_referrals_per_month,
                'percentage': (referrals_this_month / subscription.plan.max_referrals_per_month * 100) if subscription.plan.max_referrals_per_month > 0 else 0
            },
            'projects': {
                'used': total_projects,
                'limit': subscription.plan.max_active_projects,
                'percentage': (total_projects / subscription.plan.max_active_projects * 100) if subscription.plan.max_active_projects > 0 else 0
            },
            'team_members': {
                'used': team_members,
                'limit': subscription.plan.max_team_members,
                'percentage': (team_members / subscription.plan.max_team_members * 100) if subscription.plan.max_team_members > 0 else 0
            },
            'features': {
                'advanced_analytics': subscription.plan.has_advanced_analytics,
                'api_access': subscription.plan.has_api_access,
                'white_label': subscription.plan.has_white_label,
                'priority_support': subscription.plan.has_priority_support,
                'custom_rewards': subscription.plan.has_custom_rewards,
                'marketplace_access': subscription.plan.has_marketplace_access
            }
        }
    
    @staticmethod
    def _send_usage_warning(user_id, subscription, percentage):
        """Отправить предупреждение о приближении к лимиту"""
        from src.services.notification_service import NotificationService
        
        remaining = subscription.plan.max_referrals_per_month - subscription.referrals_used_this_month
        
        NotificationService.send_notification(
            user_id=user_id,
            type='usage_warning',
            title=f'Использовано {percentage}% лимита рефералов',
            message=f'Вы использовали {subscription.referrals_used_this_month} из {subscription.plan.max_referrals_per_month} рефералов. Осталось: {remaining}',
            data={
                'subscription_id': subscription.id,
                'usage_percentage': percentage,
                'remaining_referrals': remaining,
                'plan_name': subscription.plan.name
            }
        )
    
    @staticmethod
    def check_and_enforce_limits():
        """Проверить и применить лимиты для всех пользователей (для cron задач)"""
        try:
            # Находим пользователей, превысивших лимиты
            exceeded_subscriptions = UserSubscription.query.filter(
                UserSubscription.referrals_used_this_month > UserSubscription.plan.max_referrals_per_month,
                UserSubscription.plan.max_referrals_per_month > 0
            ).all()
            
            for subscription in exceeded_subscriptions:
                # Деактивируем активные кампании
                active_campaigns = ReferralCampaign.query.filter_by(
                    user_id=subscription.user_id,
                    is_active=True
                ).all()
                
                for campaign in active_campaigns:
                    campaign.is_active = False
                
                # Отправляем уведомление
                from src.services.notification_service import NotificationService
                NotificationService.send_notification(
                    user_id=subscription.user_id,
                    type='limit_exceeded',
                    title='Превышен лимит рефералов',
                    message=f'Ваши реферальные кампании приостановлены из-за превышения лимита. Обновите подписку для продолжения.',
                    data={
                        'subscription_id': subscription.id,
                        'plan_name': subscription.plan.name,
                        'used_referrals': subscription.referrals_used_this_month,
                        'limit': subscription.plan.max_referrals_per_month
                    }
                )
            
            db.session.commit()
            current_app.logger.info(f"Processed {len(exceeded_subscriptions)} subscriptions with exceeded limits")
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error enforcing subscription limits: {str(e)}")
    
    @staticmethod
    def get_feature_comparison():
        """Получить сравнение функций планов для отображения на сайте"""
        return {
            'plans': [
                {
                    'name': 'Dino Egg',
                    'type': 'free',
                    'price_monthly': 0,
                    'price_yearly': 0,
                    'popular': False,
                    'features': {
                        'referrals_per_month': 100,
                        'active_projects': 1,
                        'team_members': 1,
                        'analytics': 'Базовая',
                        'rewards': '3 стандартных',
                        'api_access': False,
                        'white_label': False,
                        'priority_support': False,
                        'marketplace': False
                    }
                },
                {
                    'name': 'Baby Dino',
                    'type': 'starter',
                    'price_monthly': 29,
                    'price_yearly': 290,
                    'popular': True,
                    'features': {
                        'referrals_per_month': 1000,
                        'active_projects': 3,
                        'team_members': 3,
                        'analytics': 'Расширенная',
                        'rewards': 'Кастомные',
                        'api_access': False,
                        'white_label': False,
                        'priority_support': False,
                        'marketplace': True
                    }
                },
                {
                    'name': 'T-Rex',
                    'type': 'growth',
                    'price_monthly': 99,
                    'price_yearly': 990,
                    'popular': False,
                    'features': {
                        'referrals_per_month': 10000,
                        'active_projects': 10,
                        'team_members': 10,
                        'analytics': 'Продвинутая',
                        'rewards': 'Кастомные',
                        'api_access': True,
                        'white_label': True,
                        'priority_support': True,
                        'marketplace': True
                    }
                },
                {
                    'name': 'Dino King',
                    'type': 'enterprise',
                    'price_monthly': 1000,
                    'price_yearly': 10000,
                    'popular': False,
                    'features': {
                        'referrals_per_month': 'Безлимит',
                        'active_projects': 'Безлимит',
                        'team_members': 'Безлимит',
                        'analytics': 'Корпоративная',
                        'rewards': 'Кастомные',
                        'api_access': True,
                        'white_label': True,
                        'priority_support': True,
                        'marketplace': True,
                        'dedicated_manager': True,
                        'custom_development': True
                    }
                }
            ]
        }

