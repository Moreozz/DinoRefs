from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case
from src.database import db
from src.models.referral_campaign import ReferralCampaign
from src.models.referral_channel import ReferralChannel
from src.models.referral_step import ReferralStep
from src.models.referral_link import ReferralLink
from src.models.referral_tracking import ReferralTracking
from src.models.user import User
from datetime import datetime, timedelta
import json

referrals_bp = Blueprint('referrals', __name__)

# ==================== КАМПАНИИ ====================

@referrals_bp.route('/campaigns', methods=['GET'])
@jwt_required()
def get_campaigns():
    """Получить список кампаний пользователя"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        campaigns = ReferralCampaign.query.filter_by(user_id=user_id).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'campaigns': [campaign.to_dict() for campaign in campaigns.items],
            'total': campaigns.total,
            'pages': campaigns.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/campaigns', methods=['POST'])
@jwt_required()
def create_campaign():
    """Создать новую кампанию"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Проверяем лимиты подписки
        from src.services.subscription_service import SubscriptionService
        can_use, message = SubscriptionService.can_use_referrals(user_id)
        
        if not can_use:
            return jsonify({'error': message, 'upgrade_required': True}), 403
        
        # Валидация обязательных полей
        required_fields = ['title', 'campaign_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Поле {field} обязательно'}), 400
        
        campaign = ReferralCampaign(
            user_id=user_id,
            title=data['title'],
            description=data.get('description'),
            campaign_type=data['campaign_type'],
            end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
            reward_type=data.get('reward_type'),
            reward_value=data.get('reward_value'),
            reward_description=data.get('reward_description')
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify({
            'message': 'Кампания создана успешно',
            'campaign': campaign.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/campaigns/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_campaign(campaign_id):
    """Получить детали кампании"""
    try:
        user_id = get_jwt_identity()
        campaign = ReferralCampaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            return jsonify({'error': 'Кампания не найдена'}), 404
        
        # Включаем каналы и их шаги
        campaign_data = campaign.to_dict()
        campaign_data['channels'] = [
            channel.to_dict(include_steps=True) for channel in campaign.channels
        ]
        
        return jsonify({'campaign': campaign_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    """Обновить кампанию"""
    try:
        user_id = get_jwt_identity()
        campaign = ReferralCampaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            return jsonify({'error': 'Кампания не найдена'}), 404
        
        data = request.get_json()
        
        # Обновляем поля
        if 'title' in data:
            campaign.title = data['title']
        if 'description' in data:
            campaign.description = data['description']
        if 'is_active' in data:
            campaign.is_active = data['is_active']
        if 'end_date' in data:
            campaign.end_date = datetime.fromisoformat(data['end_date']) if data['end_date'] else None
        if 'reward_type' in data:
            campaign.reward_type = data['reward_type']
        if 'reward_value' in data:
            campaign.reward_value = data['reward_value']
        if 'reward_description' in data:
            campaign.reward_description = data['reward_description']
        
        campaign.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Кампания обновлена успешно',
            'campaign': campaign.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/campaigns/<int:campaign_id>', methods=['DELETE'])
@jwt_required()
def delete_campaign(campaign_id):
    """Удалить кампанию"""
    try:
        user_id = get_jwt_identity()
        campaign = ReferralCampaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            return jsonify({'error': 'Кампания не найдена'}), 404
        
        db.session.delete(campaign)
        db.session.commit()
        
        return jsonify({'message': 'Кампания удалена успешно'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== КАНАЛЫ ====================

@referrals_bp.route('/campaigns/<int:campaign_id>/channels', methods=['POST'])
@jwt_required()
def create_channel(campaign_id):
    """Создать канал для кампании"""
    try:
        user_id = get_jwt_identity()
        campaign = ReferralCampaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            return jsonify({'error': 'Кампания не найдена'}), 404
        
        data = request.get_json()
        
        # Валидация обязательных полей
        required_fields = ['channel_type', 'channel_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Поле {field} обязательно'}), 400
        
        channel = ReferralChannel(
            campaign_id=campaign_id,
            channel_type=data['channel_type'],
            channel_name=data['channel_name'],
            description=data.get('description'),
            priority=data.get('priority', 0)
        )
        
        # Устанавливаем конфигурацию канала
        if 'config' in data:
            channel.set_config(data['config'])
        
        db.session.add(channel)
        db.session.commit()
        
        return jsonify({
            'message': 'Канал создан успешно',
            'channel': channel.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/channels/<int:channel_id>', methods=['PUT'])
@jwt_required()
def update_channel(channel_id):
    """Обновить канал"""
    try:
        user_id = get_jwt_identity()
        channel = ReferralChannel.query.join(ReferralCampaign).filter(
            ReferralChannel.id == channel_id,
            ReferralCampaign.user_id == user_id
        ).first()
        
        if not channel:
            return jsonify({'error': 'Канал не найден'}), 404
        
        data = request.get_json()
        
        # Обновляем поля
        if 'channel_name' in data:
            channel.channel_name = data['channel_name']
        if 'description' in data:
            channel.description = data['description']
        if 'is_active' in data:
            channel.is_active = data['is_active']
        if 'priority' in data:
            channel.priority = data['priority']
        if 'config' in data:
            channel.set_config(data['config'])
        
        channel.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Канал обновлен успешно',
            'channel': channel.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/channels/<int:channel_id>', methods=['DELETE'])
@jwt_required()
def delete_channel(channel_id):
    """Удалить канал"""
    try:
        user_id = get_jwt_identity()
        channel = ReferralChannel.query.join(ReferralCampaign).filter(
            ReferralChannel.id == channel_id,
            ReferralCampaign.user_id == user_id
        ).first()
        
        if not channel:
            return jsonify({'error': 'Канал не найден'}), 404
        
        db.session.delete(channel)
        db.session.commit()
        
        return jsonify({'message': 'Канал удален успешно'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ШАГИ ====================

@referrals_bp.route('/channels/<int:channel_id>/steps', methods=['POST'])
@jwt_required()
def create_step(channel_id):
    """Создать шаг для канала"""
    try:
        user_id = get_jwt_identity()
        channel = ReferralChannel.query.join(ReferralCampaign).filter(
            ReferralChannel.id == channel_id,
            ReferralCampaign.user_id == user_id
        ).first()
        
        if not channel:
            return jsonify({'error': 'Канал не найден'}), 404
        
        data = request.get_json()
        
        # Валидация обязательных полей
        required_fields = ['step_type', 'step_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Поле {field} обязательно'}), 400
        
        step = ReferralStep(
            channel_id=channel_id,
            step_type=data['step_type'],
            step_name=data['step_name'],
            description=data.get('description'),
            step_order=data.get('step_order', 1),
            is_required=data.get('is_required', True),
            reward_points=data.get('reward_points', 0),
            reward_description=data.get('reward_description')
        )
        
        # Устанавливаем конфигурацию валидации
        if 'validation_config' in data:
            step.set_validation_config(data['validation_config'])
        
        db.session.add(step)
        db.session.commit()
        
        return jsonify({
            'message': 'Шаг создан успешно',
            'step': step.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/steps/<int:step_id>', methods=['PUT'])
@jwt_required()
def update_step(step_id):
    """Обновить шаг"""
    try:
        user_id = get_jwt_identity()
        step = ReferralStep.query.join(ReferralChannel).join(ReferralCampaign).filter(
            ReferralStep.id == step_id,
            ReferralCampaign.user_id == user_id
        ).first()
        
        if not step:
            return jsonify({'error': 'Шаг не найден'}), 404
        
        data = request.get_json()
        
        # Обновляем поля
        if 'step_name' in data:
            step.step_name = data['step_name']
        if 'description' in data:
            step.description = data['description']
        if 'step_order' in data:
            step.step_order = data['step_order']
        if 'is_required' in data:
            step.is_required = data['is_required']
        if 'is_active' in data:
            step.is_active = data['is_active']
        if 'reward_points' in data:
            step.reward_points = data['reward_points']
        if 'reward_description' in data:
            step.reward_description = data['reward_description']
        if 'validation_config' in data:
            step.set_validation_config(data['validation_config'])
        
        step.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Шаг обновлен успешно',
            'step': step.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/steps/<int:step_id>', methods=['DELETE'])
@jwt_required()
def delete_step(step_id):
    """Удалить шаг"""
    try:
        user_id = get_jwt_identity()
        step = ReferralStep.query.join(ReferralChannel).join(ReferralCampaign).filter(
            ReferralStep.id == step_id,
            ReferralCampaign.user_id == user_id
        ).first()
        
        if not step:
            return jsonify({'error': 'Шаг не найден'}), 404
        
        db.session.delete(step)
        db.session.commit()
        
        return jsonify({'message': 'Шаг удален успешно'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ССЫЛКИ ====================

@referrals_bp.route('/campaigns/<int:campaign_id>/links', methods=['POST'])
@jwt_required()
def create_link(campaign_id):
    """Создать реферальную ссылку"""
    try:
        user_id = get_jwt_identity()
        campaign = ReferralCampaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            return jsonify({'error': 'Кампания не найдена'}), 404
        
        data = request.get_json()
        
        # Валидация обязательных полей
        if 'link_name' not in data:
            return jsonify({'error': 'Поле link_name обязательно'}), 400
        
        link = ReferralLink(
            campaign_id=campaign_id,
            channel_id=data.get('channel_id'),
            user_id=user_id,
            link_name=data['link_name'],
            description=data.get('description'),
            utm_source=data.get('utm_source'),
            utm_medium=data.get('utm_medium'),
            utm_campaign=data.get('utm_campaign'),
            utm_term=data.get('utm_term'),
            utm_content=data.get('utm_content'),
            expires_at=datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None,
            max_clicks=data.get('max_clicks')
        )
        
        db.session.add(link)
        db.session.commit()
        
        return jsonify({
            'message': 'Ссылка создана успешно',
            'link': link.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/links/<int:link_id>', methods=['GET'])
@jwt_required()
def get_link(link_id):
    """Получить детали ссылки"""
    try:
        user_id = get_jwt_identity()
        link = ReferralLink.query.filter_by(id=link_id, user_id=user_id).first()
        
        if not link:
            return jsonify({'error': 'Ссылка не найдена'}), 404
        
        return jsonify({'link': link.to_dict(include_analytics=True)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/links/<int:link_id>', methods=['PUT'])
@jwt_required()
def update_link(link_id):
    """Обновить ссылку"""
    try:
        user_id = get_jwt_identity()
        link = ReferralLink.query.filter_by(id=link_id, user_id=user_id).first()
        
        if not link:
            return jsonify({'error': 'Ссылка не найдена'}), 404
        
        data = request.get_json()
        
        # Обновляем поля
        if 'link_name' in data:
            link.link_name = data['link_name']
        if 'description' in data:
            link.description = data['description']
        if 'is_active' in data:
            link.is_active = data['is_active']
        if 'expires_at' in data:
            link.expires_at = datetime.fromisoformat(data['expires_at']) if data['expires_at'] else None
        if 'max_clicks' in data:
            link.max_clicks = data['max_clicks']
        
        # UTM параметры
        utm_fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
        for field in utm_fields:
            if field in data:
                setattr(link, field, data[field])
        
        # Пересобираем URL с новыми UTM параметрами
        link.full_url = link.build_full_url()
        link.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ссылка обновлена успешно',
            'link': link.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ПУБЛИЧНЫЕ МАРШРУТЫ ====================

@referrals_bp.route('/r/<short_code>', methods=['GET'])
def redirect_referral_link(short_code):
    """Редирект по короткой ссылке"""
    try:
        link = ReferralLink.query.filter_by(short_code=short_code).first()
        
        if not link:
            return jsonify({'error': 'Ссылка не найдена'}), 404
        
        # Получаем информацию о клике
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')
        referrer = request.headers.get('Referer', '')
        
        # Регистрируем клик
        success, message = link.register_click(ip_address, user_agent, referrer)
        
        if not success:
            return jsonify({'error': message}), 400
        
        # В реальном приложении здесь будет редирект на целевую страницу
        # Пока возвращаем информацию о кампании
        return jsonify({
            'message': 'Клик зарегистрирован',
            'campaign': link.campaign.to_public_dict(),
            'redirect_url': f'/campaigns/{link.campaign.public_slug}'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/campaigns/<slug>/public', methods=['GET'])
def get_public_campaign(slug):
    """Получить публичную информацию о кампании"""
    try:
        campaign = ReferralCampaign.query.filter_by(public_slug=slug, is_active=True).first()
        
        if not campaign:
            return jsonify({'error': 'Кампания не найдена'}), 404
        
        # Возвращаем только публичную информацию
        campaign_data = campaign.to_public_dict()
        campaign_data['channels'] = [
            {
                'channel_type': channel.channel_type,
                'channel_name': channel.channel_name,
                'description': channel.description,
                'icon': channel.get_channel_icon(),
                'color': channel.get_channel_color(),
                'steps_count': len(channel.get_active_steps())
            }
            for channel in campaign.get_active_channels()
        ]
        
        return jsonify({'campaign': campaign_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== АНАЛИТИКА ====================

@referrals_bp.route('/campaigns/<int:campaign_id>/analytics', methods=['GET'])
@jwt_required()
def get_campaign_analytics(campaign_id):
    """Получить аналитику кампании"""
    try:
        user_id = get_jwt_identity()
        campaign = ReferralCampaign.query.filter_by(id=campaign_id, user_id=user_id).first()
        
        if not campaign:
            return jsonify({'error': 'Кампания не найдена'}), 404
        
        days = request.args.get('days', 30, type=int)
        analytics = ReferralTracking.get_campaign_analytics(campaign_id, days)
        
        return jsonify({
            'campaign_id': campaign_id,
            'period_days': days,
            'analytics': analytics
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@referrals_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_referral_dashboard():
    """Получить дашборд системы рефералов"""
    try:
        user_id = get_jwt_identity()
        
        # Общая статистика пользователя
        total_campaigns = ReferralCampaign.query.filter_by(user_id=user_id).count()
        active_campaigns = ReferralCampaign.query.filter_by(user_id=user_id, is_active=True).count()
        
        # Статистика за последние 30 дней
        start_date = datetime.utcnow() - timedelta(days=30)
        
        total_clicks = db.session.query(db.func.sum(ReferralCampaign.total_clicks)).filter(
            ReferralCampaign.user_id == user_id
        ).scalar() or 0
        
        total_conversions = db.session.query(db.func.sum(ReferralCampaign.total_conversions)).filter(
            ReferralCampaign.user_id == user_id
        ).scalar() or 0
        
        # Топ кампании
        top_campaigns = ReferralCampaign.query.filter_by(user_id=user_id).order_by(
            ReferralCampaign.total_clicks.desc()
        ).limit(5).all()
        
        return jsonify({
            'summary': {
                'total_campaigns': total_campaigns,
                'active_campaigns': active_campaigns,
                'total_clicks': total_clicks,
                'total_conversions': total_conversions,
                'conversion_rate': round((total_conversions / total_clicks * 100), 2) if total_clicks > 0 else 0
            },
            'top_campaigns': [
                {
                    'id': campaign.id,
                    'title': campaign.title,
                    'campaign_type': campaign.campaign_type,
                    'total_clicks': campaign.total_clicks,
                    'total_conversions': campaign.total_conversions,
                    'conversion_rate': campaign.calculate_conversion_rate()
                }
                for campaign in top_campaigns
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
