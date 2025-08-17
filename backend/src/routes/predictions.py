from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from src.services.ml_service import ml_service
from src.services.analytics_service import AnalyticsService
from src.models.user import User
from src.models.project import Project
from src.models.analytics_event import AnalyticsEvent
from src.database import get_db
import logging

logger = logging.getLogger(__name__)

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/train-growth-model', methods=['POST'])
@jwt_required()
def train_growth_model():
    """Обучение модели прогнозирования роста"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        metric = data.get('metric', 'users')
        days_back = data.get('days_back', 90)
        
        # Получение исторических данных
        db = get_db()
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days_back)
        
        if metric == 'users':
            # Данные по регистрациям пользователей
            historical_data = []
            current_date = start_date
            
            while current_date <= end_date:
                users_count = db.query(User).filter(
                    User.created_at >= datetime.combine(current_date, datetime.min.time()),
                    User.created_at < datetime.combine(current_date, datetime.min.time()) + timedelta(days=1)
                ).count()
                
                historical_data.append({
                    'date': current_date.isoformat(),
                    'users': users_count
                })
                current_date += timedelta(days=1)
        
        elif metric == 'projects':
            # Данные по созданию проектов
            historical_data = []
            current_date = start_date
            
            while current_date <= end_date:
                projects_count = db.query(Project).filter(
                    Project.created_at >= datetime.combine(current_date, datetime.min.time()),
                    Project.created_at < datetime.combine(current_date, datetime.min.time()) + timedelta(days=1)
                ).count()
                
                historical_data.append({
                    'date': current_date.isoformat(),
                    'projects': projects_count
                })
                current_date += timedelta(days=1)
        
        elif metric == 'activity':
            # Данные по активности (события)
            historical_data = []
            current_date = start_date
            
            while current_date <= end_date:
                events_count = db.query(AnalyticsEvent).filter(
                    AnalyticsEvent.created_at >= datetime.combine(current_date, datetime.min.time()),
                    AnalyticsEvent.created_at < datetime.combine(current_date, datetime.min.time()) + timedelta(days=1)
                ).count()
                
                historical_data.append({
                    'date': current_date.isoformat(),
                    'activity': events_count
                })
                current_date += timedelta(days=1)
        
        else:
            return jsonify({'error': 'Неподдерживаемая метрика'}), 400
        
        # Обучение модели
        model_metrics = ml_service.train_growth_prediction_model(historical_data, metric)
        
        logger.info(f"Growth model trained for {metric} by user {current_user_id}")
        
        return jsonify({
            'message': f'Модель прогнозирования {metric} успешно обучена',
            'metrics': model_metrics,
            'data_points': len(historical_data)
        })
        
    except Exception as e:
        logger.error(f"Error training growth model: {str(e)}")
        return jsonify({'error': 'Ошибка обучения модели'}), 500

@predictions_bp.route('/predict-growth', methods=['GET'])
@jwt_required()
def predict_growth():
    """Получение прогноза роста"""
    try:
        metric = request.args.get('metric', 'users')
        days_ahead = int(request.args.get('days_ahead', 30))
        
        model_key = f'growth_{metric}'
        
        # Получение прогноза
        predictions = ml_service.predict_future_growth(model_key, days_ahead)
        
        # Получение текущих значений для сравнения
        db = get_db()
        current_date = datetime.utcnow().date()
        
        if metric == 'users':
            current_value = db.query(User).count()
        elif metric == 'projects':
            current_value = db.query(Project).count()
        elif metric == 'activity':
            current_value = db.query(AnalyticsEvent).filter(
                AnalyticsEvent.created_at >= datetime.combine(current_date, datetime.min.time())
            ).count()
        else:
            current_value = 0
        
        return jsonify({
            'metric': metric,
            'current_value': current_value,
            'predictions': predictions,
            'forecast_period': f'{days_ahead} дней'
        })
        
    except Exception as e:
        logger.error(f"Error predicting growth: {str(e)}")
        return jsonify({'error': 'Ошибка получения прогноза'}), 500

@predictions_bp.route('/user-segments', methods=['GET'])
@jwt_required()
def get_user_segments():
    """Получение сегментации пользователей"""
    try:
        db = get_db()
        
        # Получение данных пользователей с метриками активности
        users_data = []
        users = db.query(User).all()
        
        for user in users:
            # Расчет метрик активности
            total_events = db.query(AnalyticsEvent).filter(
                AnalyticsEvent.user_id == user.id
            ).count()
            
            projects_created = db.query(Project).filter(
                Project.owner_id == user.id
            ).count()
            
            # Дни с момента регистрации
            days_since_registration = (datetime.utcnow() - user.created_at).days
            
            # Последняя активность
            last_event = db.query(AnalyticsEvent).filter(
                AnalyticsEvent.user_id == user.id
            ).order_by(AnalyticsEvent.created_at.desc()).first()
            
            days_since_last_activity = 0
            if last_event:
                days_since_last_activity = (datetime.utcnow() - last_event.created_at).days
            
            # Активные дни (упрощенный расчет)
            days_active = min(total_events // 5, days_since_registration)  # Примерный расчет
            
            users_data.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'total_events': total_events,
                'projects_created': projects_created,
                'days_since_registration': days_since_registration,
                'days_since_last_activity': days_since_last_activity,
                'days_active': days_active,
                'social_interactions': 0  # Placeholder
            })
        
        # Сегментация пользователей
        segments_result = ml_service.calculate_user_segments(users_data)
        
        return jsonify({
            'segments': segments_result['segments'],
            'summary': segments_result['summary'],
            'total_users': len(users_data)
        })
        
    except Exception as e:
        logger.error(f"Error getting user segments: {str(e)}")
        return jsonify({'error': 'Ошибка получения сегментации'}), 500

@predictions_bp.route('/recommendations/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_recommendations(user_id):
    """Получение рекомендаций для пользователя"""
    try:
        db = get_db()
        
        # Получение данных пользователя
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Анализ поведения пользователя
        user_events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id
        ).all()
        
        # Определение предпочтений (упрощенная логика)
        preferred_categories = []
        project_views = {}
        
        for event in user_events:
            if event.event_name == 'project_view' and event.project_id:
                project = db.query(Project).filter(Project.id == event.project_id).first()
                if project:
                    category = getattr(project, 'category', 'general')
                    project_views[category] = project_views.get(category, 0) + 1
        
        # Топ-3 категории
        preferred_categories = sorted(project_views.keys(), 
                                    key=lambda x: project_views[x], 
                                    reverse=True)[:3]
        
        user_behavior = {
            'preferred_categories': preferred_categories,
            'total_views': len([e for e in user_events if e.event_name == 'project_view']),
            'avg_session_duration': 120  # Placeholder
        }
        
        # Получение доступных проектов
        available_projects = []
        projects = db.query(Project).filter(Project.is_public == True).all()
        
        for project in projects:
            # Подсчет просмотров, лайков и комментариев
            views = db.query(AnalyticsEvent).filter(
                AnalyticsEvent.project_id == project.id,
                AnalyticsEvent.event_name == 'project_view'
            ).count()
            
            available_projects.append({
                'id': project.id,
                'name': project.name,
                'category': getattr(project, 'category', 'general'),
                'created_at': project.created_at.isoformat(),
                'views': views,
                'likes': 0,  # Placeholder
                'comments': 0  # Placeholder
            })
        
        # Генерация рекомендаций
        recommendations = ml_service.generate_content_recommendations(
            user_id, user_behavior, available_projects
        )
        
        return jsonify({
            'user_id': user_id,
            'user_behavior': user_behavior,
            'recommendations': recommendations
        })
        
    except Exception as e:
        logger.error(f"Error getting user recommendations: {str(e)}")
        return jsonify({'error': 'Ошибка получения рекомендаций'}), 500

@predictions_bp.route('/churn-analysis/<int:user_id>', methods=['GET'])
@jwt_required()
def analyze_user_churn(user_id):
    """Анализ риска оттока пользователя"""
    try:
        db = get_db()
        
        # Получение данных пользователя
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        # Расчет метрик активности
        total_events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id
        ).count()
        
        # Последняя активность
        last_event = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id
        ).order_by(AnalyticsEvent.created_at.desc()).first()
        
        days_since_last_activity = 0
        if last_event:
            days_since_last_activity = (datetime.utcnow() - last_event.created_at).days
        
        # Активность за последние 30 дней
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id,
            AnalyticsEvent.created_at >= thirty_days_ago
        ).count()
        
        # Активность за предыдущие 30 дней
        sixty_days_ago = datetime.utcnow() - timedelta(days=60)
        previous_events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id,
            AnalyticsEvent.created_at >= sixty_days_ago,
            AnalyticsEvent.created_at < thirty_days_ago
        ).count()
        
        # Расчет снижения активности
        activity_decline = 0
        if previous_events > 0:
            activity_decline = ((previous_events - recent_events) / previous_events) * 100
        
        # Проекты созданные пользователем
        projects_created = db.query(Project).filter(
            Project.owner_id == user_id
        ).count()
        
        user_data = {
            'days_since_last_activity': days_since_last_activity,
            'activity_decline_percentage': max(0, activity_decline),
            'avg_session_duration': 120,  # Placeholder
            'projects_created': projects_created,
            'social_interactions': 0  # Placeholder
        }
        
        # Анализ риска оттока
        churn_analysis = ml_service.calculate_churn_probability(user_data)
        
        return jsonify({
            'user_id': user_id,
            'user_name': user.name,
            'analysis': churn_analysis,
            'metrics': user_data
        })
        
    except Exception as e:
        logger.error(f"Error analyzing user churn: {str(e)}")
        return jsonify({'error': 'Ошибка анализа риска оттока'}), 500

@predictions_bp.route('/model-performance', methods=['GET'])
@jwt_required()
def get_model_performance():
    """Получение метрик производительности моделей"""
    try:
        models = ['growth_users', 'growth_projects', 'growth_activity']
        performance_data = {}
        
        for model_key in models:
            performance_data[model_key] = ml_service.get_model_performance(model_key)
        
        return jsonify({
            'models': performance_data,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting model performance: {str(e)}")
        return jsonify({'error': 'Ошибка получения метрик моделей'}), 500

@predictions_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_predictive_insights():
    """Получение прогнозных инсайтов"""
    try:
        db = get_db()
        
        # Общие метрики
        total_users = db.query(User).count()
        total_projects = db.query(Project).count()
        
        # Активность за последние 7 дней
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_activity = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.created_at >= week_ago
        ).count()
        
        # Новые пользователи за неделю
        new_users = db.query(User).filter(
            User.created_at >= week_ago
        ).count()
        
        # Генерация инсайтов
        insights = []
        
        if new_users > 0:
            growth_rate = (new_users / max(total_users - new_users, 1)) * 100
            insights.append({
                'type': 'growth',
                'title': 'Рост пользователей',
                'description': f'За последнюю неделю зарегистрировалось {new_users} новых пользователей',
                'metric': f'+{growth_rate:.1f}%',
                'trend': 'positive' if growth_rate > 5 else 'neutral'
            })
        
        if recent_activity > 0:
            activity_per_user = recent_activity / max(total_users, 1)
            insights.append({
                'type': 'engagement',
                'title': 'Активность пользователей',
                'description': f'В среднем {activity_per_user:.1f} действий на пользователя за неделю',
                'metric': f'{recent_activity} событий',
                'trend': 'positive' if activity_per_user > 5 else 'neutral'
            })
        
        # Прогноз на следующую неделю (упрощенный)
        predicted_users = new_users * 1.1  # Простой прогноз роста на 10%
        insights.append({
            'type': 'prediction',
            'title': 'Прогноз роста',
            'description': f'Ожидается регистрация ~{int(predicted_users)} новых пользователей на следующей неделе',
            'metric': f'+{int(predicted_users)}',
            'trend': 'positive'
        })
        
        return jsonify({
            'insights': insights,
            'summary': {
                'total_users': total_users,
                'total_projects': total_projects,
                'weekly_activity': recent_activity,
                'new_users_week': new_users
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting predictive insights: {str(e)}")
        return jsonify({'error': 'Ошибка получения инсайтов'}), 500

