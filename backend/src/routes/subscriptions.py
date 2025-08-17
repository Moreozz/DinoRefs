from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.database import db
from src.models.subscription_plan import SubscriptionPlan, PlanType
from src.models.user_subscription import UserSubscription, SubscriptionStatus
from src.models.user import User

subscriptions_bp = Blueprint('subscriptions', __name__)

@subscriptions_bp.route('/api/subscription-plans', methods=['GET'])
def get_subscription_plans():
    """Получить все активные тарифные планы"""
    try:
        plans = SubscriptionPlan.get_active_plans()
        
        # Конвертируем цены в рубли для отображения
        plans_data = []
        for plan in plans:
            plan_dict = plan.to_dict()
            # Примерный курс USD к RUB
            plan_dict['price_monthly_rub'] = float(plan.price_monthly) * 75
            plan_dict['price_yearly_rub'] = float(plan.price_yearly) * 75
            plans_data.append(plan_dict)
        
        return jsonify({
            'plans': plans_data
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения планов: {str(e)}'}), 500

@subscriptions_bp.route('/api/subscription-plans/<plan_type>', methods=['GET'])
def get_subscription_plan(plan_type):
    """Получить конкретный тарифный план"""
    try:
        plan = SubscriptionPlan.get_plan_by_type(plan_type)
        
        if not plan:
            return jsonify({'error': 'План не найден'}), 404
        
        plan_dict = plan.to_dict()
        plan_dict['price_monthly_rub'] = float(plan.price_monthly) * 75
        plan_dict['price_yearly_rub'] = float(plan.price_yearly) * 75
        
        return jsonify({
            'plan': plan_dict
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения плана: {str(e)}'}), 500

@subscriptions_bp.route('/api/user/subscription', methods=['GET'])
@jwt_required()
def get_user_subscription():
    """Получить текущую подписку пользователя"""
    current_user_id = get_jwt_identity()
    
    try:
        subscription = UserSubscription.get_user_active_subscription(current_user_id)
        
        if not subscription:
            # Создаем бесплатную подписку если её нет
            subscription = UserSubscription.create_free_subscription(current_user_id)
        
        return jsonify({
            'subscription': subscription.to_dict() if subscription else None
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения подписки: {str(e)}'}), 500

@subscriptions_bp.route('/api/user/subscription/usage', methods=['GET'])
@jwt_required()
def get_subscription_usage():
    """Получить информацию об использовании подписки"""
    current_user_id = get_jwt_identity()
    
    try:
        subscription = UserSubscription.get_user_active_subscription(current_user_id)
        
        if not subscription:
            return jsonify({'error': 'Активная подписка не найдена'}), 404
        
        # Сбрасываем месячное использование если нужно
        subscription.reset_monthly_usage_if_needed()
        
        # Получаем статистику использования
        from src.models.project import Project
        from src.models.referral_campaign import ReferralCampaign
        
        user_projects_count = Project.query.filter_by(user_id=current_user_id).count()
        user_campaigns_count = ReferralCampaign.query.filter_by(user_id=current_user_id).count()
        
        usage_data = {
            'referrals_used': subscription.referrals_used_this_month,
            'referrals_limit': subscription.plan.max_referrals_per_month,
            'referrals_remaining': max(0, subscription.plan.max_referrals_per_month - subscription.referrals_used_this_month) if subscription.plan.max_referrals_per_month > 0 else -1,
            'projects_count': user_projects_count,
            'projects_limit': subscription.plan.max_active_projects,
            'campaigns_count': user_campaigns_count,
            'can_create_project': user_projects_count < subscription.plan.max_active_projects,
            'can_use_referrals': subscription.can_use_referrals(),
            'subscription': subscription.to_dict()
        }
        
        return jsonify(usage_data)
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения использования: {str(e)}'}), 500

@subscriptions_bp.route('/api/user/subscription/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Отменить подписку пользователя"""
    current_user_id = get_jwt_identity()
    
    try:
        subscription = UserSubscription.get_user_active_subscription(current_user_id)
        
        if not subscription:
            return jsonify({'error': 'Активная подписка не найдена'}), 404
        
        if subscription.plan.plan_type == PlanType.FREE:
            return jsonify({'error': 'Нельзя отменить бесплатную подписку'}), 400
        
        subscription.cancel_subscription()
        
        # Отправляем уведомление
        from src.services.notification_service import NotificationService
        NotificationService.send_notification(
            user_id=current_user_id,
            type='subscription_canceled',
            title='Подписка отменена',
            message=f'Ваша подписка "{subscription.plan.name}" была отменена. Она будет действовать до {subscription.expires_at.strftime("%d.%m.%Y")}',
            data={
                'subscription_id': subscription.id,
                'plan_name': subscription.plan.name,
                'expires_at': subscription.expires_at.isoformat()
            }
        )
        
        return jsonify({
            'message': 'Подписка отменена',
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка отмены подписки: {str(e)}'}), 500

@subscriptions_bp.route('/api/user/subscription/reactivate', methods=['POST'])
@jwt_required()
def reactivate_subscription():
    """Возобновить отмененную подписку"""
    current_user_id = get_jwt_identity()
    
    try:
        subscription = UserSubscription.query.filter_by(
            user_id=current_user_id,
            status=SubscriptionStatus.CANCELED
        ).first()
        
        if not subscription:
            return jsonify({'error': 'Отмененная подписка не найдена'}), 404
        
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.auto_renew = True
        subscription.canceled_at = None
        db.session.commit()
        
        return jsonify({
            'message': 'Подписка возобновлена',
            'subscription': subscription.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка возобновления подписки: {str(e)}'}), 500

@subscriptions_bp.route('/api/user/subscription/history', methods=['GET'])
@jwt_required()
def get_subscription_history():
    """Получить историю подписок пользователя"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    try:
        subscriptions = UserSubscription.query.filter_by(
            user_id=current_user_id
        ).order_by(UserSubscription.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'subscriptions': [sub.to_dict() for sub in subscriptions.items],
            'total': subscriptions.total,
            'pages': subscriptions.pages,
            'current_page': page,
            'has_next': subscriptions.has_next,
            'has_prev': subscriptions.has_prev
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения истории: {str(e)}'}), 500

@subscriptions_bp.route('/api/admin/subscriptions', methods=['GET'])
@jwt_required()
def get_all_subscriptions():
    """Получить все подписки (для админов)"""
    current_user_id = get_jwt_identity()
    
    # Здесь должна быть проверка прав администратора
    # if not is_admin(current_user_id):
    #     return jsonify({'error': 'Недостаточно прав'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    status = request.args.get('status')
    plan_type = request.args.get('plan_type')
    
    try:
        query = UserSubscription.query
        
        if status:
            query = query.filter_by(status=SubscriptionStatus(status))
        
        if plan_type:
            plan = SubscriptionPlan.get_plan_by_type(plan_type)
            if plan:
                query = query.filter_by(plan_id=plan.id)
        
        subscriptions = query.order_by(UserSubscription.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'subscriptions': [sub.to_dict() for sub in subscriptions.items],
            'total': subscriptions.total,
            'pages': subscriptions.pages,
            'current_page': page,
            'has_next': subscriptions.has_next,
            'has_prev': subscriptions.has_prev
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения подписок: {str(e)}'}), 500

@subscriptions_bp.route('/api/admin/subscription-stats', methods=['GET'])
@jwt_required()
def get_subscription_stats():
    """Получить статистику подписок (для админов)"""
    current_user_id = get_jwt_identity()
    
    # Здесь должна быть проверка прав администратора
    # if not is_admin(current_user_id):
    #     return jsonify({'error': 'Недостаточно прав'}), 403
    
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        # Общая статистика
        total_subscriptions = UserSubscription.query.count()
        active_subscriptions = UserSubscription.query.filter_by(status=SubscriptionStatus.ACTIVE).count()
        
        # Статистика по планам
        plan_stats = db.session.query(
            SubscriptionPlan.name,
            SubscriptionPlan.plan_type,
            func.count(UserSubscription.id).label('count')
        ).join(UserSubscription).filter(
            UserSubscription.status == SubscriptionStatus.ACTIVE
        ).group_by(SubscriptionPlan.id).all()
        
        # Статистика за последние 30 дней
        start_date = datetime.utcnow() - timedelta(days=30)
        new_subscriptions = UserSubscription.query.filter(
            UserSubscription.created_at >= start_date
        ).count()
        
        # Статистика отмен
        canceled_subscriptions = UserSubscription.query.filter_by(
            status=SubscriptionStatus.CANCELED
        ).count()
        
        return jsonify({
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'canceled_subscriptions': canceled_subscriptions,
            'new_subscriptions_30d': new_subscriptions,
            'plan_distribution': [
                {
                    'plan_name': stat.name,
                    'plan_type': stat.plan_type.value,
                    'count': stat.count
                }
                for stat in plan_stats
            ]
        })
        
    except Exception as e:
        return jsonify({'error': f'Ошибка получения статистики: {str(e)}'}), 500

# Инициализация планов по умолчанию
@subscriptions_bp.route('/api/admin/init-default-plans', methods=['POST'])
@jwt_required()
def init_default_plans():
    """Создать планы по умолчанию (только для разработки)"""
    current_user_id = get_jwt_identity()
    
    try:
        # Проверяем, есть ли уже планы
        existing_plans = SubscriptionPlan.query.count()
        if existing_plans > 0:
            return jsonify({'message': 'Планы уже существуют'}), 200
        
        # Создаем планы согласно спецификации
        plans = [
            {
                'name': 'Dino Egg',
                'plan_type': PlanType.FREE,
                'price_monthly': 0,
                'price_yearly': 0,
                'max_referrals_per_month': 100,
                'max_active_projects': 1,
                'max_team_members': 1,
                'description': 'Бесплатный план для начинающих',
                'features': ['До 100 рефералов в месяц', '1 активный проект', 'Базовая аналитика', '3 стандартных награды']
            },
            {
                'name': 'Baby Dino',
                'plan_type': PlanType.STARTER,
                'price_monthly': 29,
                'price_yearly': 290,
                'max_referrals_per_month': 1000,
                'max_active_projects': 3,
                'max_team_members': 3,
                'has_custom_rewards': True,
                'is_popular': True,
                'description': 'Для средних каналов и магазинов',
                'features': ['До 1000 рефералов в месяц', 'До 3 проектов', 'Расширенная аналитика', 'Кастомные награды']
            },
            {
                'name': 'T-Rex',
                'plan_type': PlanType.GROWTH,
                'price_monthly': 99,
                'price_yearly': 990,
                'max_referrals_per_month': 10000,
                'max_active_projects': 10,
                'max_team_members': 10,
                'has_advanced_analytics': True,
                'has_api_access': True,
                'has_white_label': True,
                'has_priority_support': True,
                'has_custom_rewards': True,
                'has_marketplace_access': True,
                'description': 'Для крупных сообществ и бизнеса',
                'features': ['До 10000 рефералов в месяц', 'До 10 проектов', 'API доступ', 'White-label ссылки', 'Приоритетная поддержка']
            },
            {
                'name': 'Dino King',
                'plan_type': PlanType.ENTERPRISE,
                'price_monthly': 1000,
                'price_yearly': 10000,
                'max_referrals_per_month': 0,  # Unlimited
                'max_active_projects': 0,  # Unlimited
                'max_team_members': 0,  # Unlimited
                'has_advanced_analytics': True,
                'has_api_access': True,
                'has_white_label': True,
                'has_priority_support': True,
                'has_custom_rewards': True,
                'has_marketplace_access': True,
                'description': 'Корпоративное решение',
                'features': ['Безлимитные рефералы', 'Безлимитные проекты', 'Полный white-label', 'Персональный менеджер', 'Кастомная разработка']
            }
        ]
        
        for plan_data in plans:
            plan = SubscriptionPlan(**plan_data)
            db.session.add(plan)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Планы по умолчанию созданы',
            'count': len(plans)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка создания планов: {str(e)}'}), 500

