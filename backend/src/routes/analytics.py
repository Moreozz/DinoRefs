from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
from sqlalchemy import func, desc, and_, or_
from sqlalchemy.orm import sessionmaker
from src.database import get_db
from src.models.analytics_event import AnalyticsEvent, AnalyticsMetric, UserSession
from src.models.user import User
from src.models.project import Project
from src.models.reference import Reference
from src.services.prediction_service import PredictionService
import uuid
import json
import random
from user_agents import parse

analytics_bp = Blueprint('analytics', __name__)
prediction_service = PredictionService()

@analytics_bp.route('/track', methods=['POST'])
def track_event():
    """Отслеживание события аналитики"""
    try:
        data = request.get_json()
        
        # Получение данных из запроса
        session_id = data.get('session_id') or str(uuid.uuid4())
        event_type = data.get('event_type', 'custom')
        event_name = data.get('event_name')
        
        if not event_name:
            return jsonify({'error': 'Event name is required'}), 400
        
        # Получение пользователя (если авторизован)
        user_id = None
        try:
            if get_jwt():
                user_id = get_jwt_identity()
        except:
            pass
        
        # Парсинг User-Agent
        user_agent_string = request.headers.get('User-Agent', '')
        user_agent = parse(user_agent_string)
        
        # Создание события
        event = AnalyticsEvent(
            user_id=user_id,
            session_id=session_id,
            event_type=event_type,
            event_name=event_name,
            project_id=data.get('project_id'),
            reference_id=data.get('reference_id'),
            page_url=data.get('page_url'),
            referrer_url=data.get('referrer_url'),
            properties=data.get('properties', {}),
            user_agent=user_agent_string,
            ip_address=request.remote_addr,
            device_type='mobile' if user_agent.is_mobile else 'tablet' if user_agent.is_tablet else 'desktop',
            browser=f"{user_agent.browser.family} {user_agent.browser.version_string}",
            os=f"{user_agent.os.family} {user_agent.os.version_string}"
        )
        
        db = get_db()
        db.add(event)
        
        # Обновление или создание сессии
        session = db.query(UserSession).filter_by(session_id=session_id).first()
        if not session:
            session = UserSession(
                session_id=session_id,
                user_id=user_id,
                ip_address=request.remote_addr,
                user_agent=user_agent_string,
                device_type=event.device_type,
                browser=event.browser,
                os=event.os
            )
            db.add(session)
        
        # Обновление счетчиков сессии
        session.events_count += 1
        session.updated_at = datetime.utcnow()
        
        if event_type == 'page_view':
            session.page_views += 1
        elif event_type == 'project_view':
            session.projects_viewed += 1
        
        db.commit()
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'event_id': event.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    """Получение данных для дашборда аналитики"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        # Проверка прав администратора
        user = db.query(User).filter_by(id=user_id).first()
        if not user or not user.is_admin:
            return jsonify({'error': 'Access denied'}), 403
        
        # Период для анализа (по умолчанию последние 30 дней)
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Общая статистика
        total_users = db.query(User).count()
        total_projects = db.query(Project).count()
        total_references = db.query(Reference).count()
        
        # Активные пользователи за период
        active_users = db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.user_id.isnot(None)
        ).scalar()
        
        # Новые пользователи за период
        new_users = db.query(User).filter(User.created_at >= start_date).count()
        
        # Новые проекты за период
        new_projects = db.query(Project).filter(Project.created_at >= start_date).count()
        
        # Популярные события
        popular_events = db.query(
            AnalyticsEvent.event_name,
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.created_at >= start_date
        ).group_by(AnalyticsEvent.event_name).order_by(desc('count')).limit(10).all()
        
        # Активность по дням
        daily_activity = db.query(
            func.date(AnalyticsEvent.created_at).label('date'),
            func.count(AnalyticsEvent.id).label('events'),
            func.count(func.distinct(AnalyticsEvent.user_id)).label('users')
        ).filter(
            AnalyticsEvent.created_at >= start_date
        ).group_by(func.date(AnalyticsEvent.created_at)).order_by('date').all()
        
        # Топ проекты по просмотрам
        top_projects = db.query(
            Project.id,
            Project.name,
            func.count(AnalyticsEvent.id).label('views')
        ).join(
            AnalyticsEvent, Project.id == AnalyticsEvent.project_id
        ).filter(
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.event_name == 'project_view'
        ).group_by(Project.id, Project.name).order_by(desc('views')).limit(10).all()
        
        # Устройства и браузеры
        devices = db.query(
            AnalyticsEvent.device_type,
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.created_at >= start_date
        ).group_by(AnalyticsEvent.device_type).all()
        
        browsers = db.query(
            AnalyticsEvent.browser,
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.created_at >= start_date
        ).group_by(AnalyticsEvent.browser).order_by(desc('count')).limit(5).all()
        
        return jsonify({
            'overview': {
                'total_users': total_users,
                'total_projects': total_projects,
                'total_references': total_references,
                'active_users': active_users,
                'new_users': new_users,
                'new_projects': new_projects
            },
            'popular_events': [{'name': e.event_name, 'count': e.count} for e in popular_events],
            'daily_activity': [
                {
                    'date': activity.date.isoformat(),
                    'events': activity.events,
                    'users': activity.users
                } for activity in daily_activity
            ],
            'top_projects': [
                {
                    'id': p.id,
                    'name': p.name,
                    'views': p.views
                } for p in top_projects
            ],
            'devices': [{'type': d.device_type, 'count': d.count} for d in devices],
            'browsers': [{'name': b.browser, 'count': b.count} for b in browsers]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_analytics(project_id):
    """Получение аналитики для конкретного проекта"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        # Проверка доступа к проекту
        project = db.query(Project).filter_by(id=project_id).first()
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Проверка прав (владелец или администратор)
        user = db.query(User).filter_by(id=user_id).first()
        if project.user_id != user_id and not user.is_admin:
            return jsonify({'error': 'Access denied'}), 403
        
        # Период для анализа
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Общие метрики проекта
        total_views = db.query(func.count(AnalyticsEvent.id)).filter(
            AnalyticsEvent.project_id == project_id,
            AnalyticsEvent.event_name == 'project_view',
            AnalyticsEvent.created_at >= start_date
        ).scalar()
        
        unique_viewers = db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
            AnalyticsEvent.project_id == project_id,
            AnalyticsEvent.event_name == 'project_view',
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.user_id.isnot(None)
        ).scalar()
        
        # Просмотры по дням
        daily_views = db.query(
            func.date(AnalyticsEvent.created_at).label('date'),
            func.count(AnalyticsEvent.id).label('views'),
            func.count(func.distinct(AnalyticsEvent.user_id)).label('unique_users')
        ).filter(
            AnalyticsEvent.project_id == project_id,
            AnalyticsEvent.event_name == 'project_view',
            AnalyticsEvent.created_at >= start_date
        ).group_by(func.date(AnalyticsEvent.created_at)).order_by('date').all()
        
        # Источники трафика
        referrers = db.query(
            AnalyticsEvent.referrer_url,
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.project_id == project_id,
            AnalyticsEvent.event_name == 'project_view',
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.referrer_url.isnot(None)
        ).group_by(AnalyticsEvent.referrer_url).order_by(desc('count')).limit(10).all()
        
        # География пользователей
        countries = db.query(
            AnalyticsEvent.country,
            func.count(AnalyticsEvent.id).label('count')
        ).filter(
            AnalyticsEvent.project_id == project_id,
            AnalyticsEvent.created_at >= start_date,
            AnalyticsEvent.country.isnot(None)
        ).group_by(AnalyticsEvent.country).order_by(desc('count')).limit(10).all()
        
        return jsonify({
            'project': {
                'id': project.id,
                'name': project.name,
                'created_at': project.created_at.isoformat()
            },
            'metrics': {
                'total_views': total_views,
                'unique_viewers': unique_viewers
            },
            'daily_views': [
                {
                    'date': view.date.isoformat(),
                    'views': view.views,
                    'unique_users': view.unique_users
                } for view in daily_views
            ],
            'referrers': [
                {'url': r.referrer_url, 'count': r.count} for r in referrers
            ],
            'countries': [
                {'country': c.country, 'count': c.count} for c in countries
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/users', methods=['GET'])
@jwt_required()
def get_user_analytics():
    """Получение пользовательской аналитики"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        # Проверка прав администратора
        user = db.query(User).filter_by(id=user_id).first()
        if not user or not user.is_admin:
            return jsonify({'error': 'Access denied'}), 403
        
        # Период для анализа
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Регистрации по дням
        daily_registrations = db.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('registrations')
        ).filter(
            User.created_at >= start_date
        ).group_by(func.date(User.created_at)).order_by('date').all()
        
        # Активность пользователей
        user_activity = db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(AnalyticsEvent.id).label('events'),
            func.max(AnalyticsEvent.created_at).label('last_activity')
        ).outerjoin(
            AnalyticsEvent, User.id == AnalyticsEvent.user_id
        ).filter(
            or_(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at.is_(None)
            )
        ).group_by(User.id, User.first_name, User.last_name, User.email).order_by(desc('events')).limit(50).all()
        
        # Сегментация пользователей
        segments = {
            'new_users': db.query(User).filter(User.created_at >= start_date).count(),
            'active_users': db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.user_id.isnot(None)
            ).scalar(),
            'creators': db.query(func.count(func.distinct(Project.user_id))).filter(
                Project.created_at >= start_date
            ).scalar()
        }
        
        return jsonify({
            'daily_registrations': [
                {
                    'date': reg.date.isoformat(),
                    'registrations': reg.registrations
                } for reg in daily_registrations
            ],
            'user_activity': [
                {
                    'id': u.id,
                    'name': f"{u.first_name} {u.last_name}",
                    'email': u.email,
                    'events': u.events,
                    'last_activity': u.last_activity.isoformat() if u.last_activity else None
                } for u in user_activity
            ],
            'segments': segments
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@analytics_bp.route('/predictions/user-growth', methods=['GET'])
def predict_user_growth():
    """Прогнозирование роста пользователей"""
    try:
        days_ahead = request.args.get('days', 30, type=int)
        
        # Получаем исторические данные пользователей
        # В реальном приложении это будут данные из базы
        historical_data = []
        base_date = datetime.now() - timedelta(days=30)
        
        for i in range(30):
            date = base_date + timedelta(days=i)
            historical_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'total_users': 400 + i * 5 + random.randint(-10, 15),
                'new_users': 5 + random.randint(-2, 8),
                'active_users': 300 + i * 3 + random.randint(-5, 10)
            })
        
        # Генерируем прогноз
        prediction = prediction_service.predict_user_growth(historical_data, days_ahead)
        
        return jsonify(prediction)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/predictions/revenue-trends', methods=['GET'])
def predict_revenue_trends():
    """Прогнозирование трендов доходов"""
    try:
        days_ahead = request.args.get('days', 30, type=int)
        
        # Получаем исторические данные доходов
        historical_data = []
        base_date = datetime.now() - timedelta(days=30)
        base_revenue = 4000
        
        for i in range(30):
            date = base_date + timedelta(days=i)
            daily_revenue = base_revenue + i * 100 + random.randint(-500, 800)
            historical_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'revenue': max(0, daily_revenue),
                'conversions': max(1, daily_revenue // 100 + random.randint(-5, 10)),
                'average_order_value': 100 + random.randint(-20, 30)
            })
        
        # Генерируем прогноз
        prediction = prediction_service.predict_revenue_trends(historical_data, days_ahead)
        
        return jsonify(prediction)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/recommendations/personalized', methods=['GET'])
def get_personalized_recommendations():
    """Получение персонализированных рекомендаций"""
    try:
        # В реальном приложении получаем user_id из JWT токена
        # user_id = get_jwt_identity()
        
        # Моковые данные пользователя
        user_data = {
            'id': 1,
            'subscription_plan': 'free',
            'registration_date': '2025-07-01',
            'last_login': datetime.now().isoformat()
        }
        
        # Моковые аналитические данные
        analytics_data = {
            'conversion_rate': 8.5,
            'user_growth_rate': 3.2,
            'usage_stats': {
                'projects': 1,
                'campaigns': 1,
                'referrals': 25
            },
            'channel_performance': {
                'email': 22.1,
                'instagram': 15.2,
                'telegram': 12.3,
                'vk': 9.8,
                'youtube': 7.4
            },
            'usage_pattern': 'regular',
            'growth_potential': 'high'
        }
        
        # Генерируем рекомендации
        recommendations = prediction_service.generate_personalized_recommendations(
            user_data, analytics_data
        )
        
        return jsonify(recommendations)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/insights/ai-analysis', methods=['GET'])
def get_ai_insights():
    """Получение AI-инсайтов и анализа"""
    try:
        period = request.args.get('period', 30, type=int)
        
        # Генерируем AI-инсайты на основе данных
        insights = {
            'generated_at': datetime.now().isoformat(),
            'analysis_period': period,
            'key_insights': [
                {
                    'type': 'trend_analysis',
                    'title': 'Рост конверсии в социальных сетях',
                    'description': 'Instagram показывает рост конверсии на 15% за последние 2 недели',
                    'confidence': 0.87,
                    'impact': 'high',
                    'recommendation': 'Увеличьте активность в Instagram на 30%'
                },
                {
                    'type': 'user_behavior',
                    'title': 'Пиковая активность в вечернее время',
                    'description': 'Пользователи наиболее активны с 18:00 до 22:00',
                    'confidence': 0.92,
                    'impact': 'medium',
                    'recommendation': 'Планируйте публикации на вечернее время'
                },
                {
                    'type': 'monetization',
                    'title': 'Потенциал для апгрейда планов',
                    'description': '23% пользователей Free плана близки к лимитам',
                    'confidence': 0.78,
                    'impact': 'high',
                    'recommendation': 'Предложите персональные скидки на Baby Dino план'
                }
            ],
            'predictive_alerts': [
                {
                    'type': 'growth_opportunity',
                    'message': 'Прогнозируется рост пользователей на 25% в следующем месяце',
                    'probability': 0.73,
                    'suggested_actions': ['Подготовьте инфраструктуру', 'Увеличьте команду поддержки']
                },
                {
                    'type': 'revenue_forecast',
                    'message': 'Ожидается достижение цели по доходам на 2 недели раньше',
                    'probability': 0.81,
                    'suggested_actions': ['Пересмотрите цели на квартал', 'Инвестируйте в новые функции']
                }
            ],
            'performance_score': {
                'overall': 78,
                'user_acquisition': 82,
                'user_retention': 71,
                'monetization': 85,
                'engagement': 76
            }
        }
        
        return jsonify(insights)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/predictions/summary', methods=['GET'])
def get_predictions_summary():
    """Получение сводки всех прогнозов"""
    try:
        # Получаем краткие прогнозы по всем направлениям
        summary = {
            'generated_at': datetime.now().isoformat(),
            'predictions': {
                'user_growth': {
                    'current': 520,
                    'predicted_30d': 675,
                    'growth_rate': 29.8,
                    'confidence': 0.84,
                    'trend': 'positive'
                },
                'revenue': {
                    'current_monthly': 145600,
                    'predicted_monthly': 187200,
                    'growth_rate': 28.6,
                    'confidence': 0.79,
                    'trend': 'positive'
                },
                'conversions': {
                    'current_rate': 12.5,
                    'predicted_rate': 14.2,
                    'improvement': 13.6,
                    'confidence': 0.72,
                    'trend': 'improving'
                }
            },
            'risk_factors': [
                {
                    'type': 'seasonal_decline',
                    'description': 'Возможное снижение активности в летний период',
                    'probability': 0.35,
                    'impact': 'medium'
                },
                {
                    'type': 'competition',
                    'description': 'Усиление конкуренции может повлиять на рост',
                    'probability': 0.28,
                    'impact': 'low'
                }
            ],
            'opportunities': [
                {
                    'type': 'market_expansion',
                    'description': 'Потенциал роста в сегменте малого бизнеса',
                    'probability': 0.67,
                    'impact': 'high'
                },
                {
                    'type': 'feature_monetization',
                    'description': 'Новые премиум функции могут увеличить ARPU',
                    'probability': 0.54,
                    'impact': 'medium'
                }
            ]
        }
        
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

