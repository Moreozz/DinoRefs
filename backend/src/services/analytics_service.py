from datetime import datetime, timedelta
from sqlalchemy import func, desc, and_, or_
from sqlalchemy.orm import sessionmaker
from src.database import get_db
from src.models.analytics_event import AnalyticsEvent, AnalyticsMetric, UserSession
from src.models.user import User
from src.models.project import Project
from src.models.reference import Reference
import json
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Сервис для сбора и обработки аналитических данных"""
    
    @staticmethod
    def calculate_daily_metrics(date=None):
        """Расчет ежедневных метрик"""
        if date is None:
            date = datetime.utcnow().date()
        
        db = get_db()
        
        try:
            # Период для расчета (один день)
            start_date = datetime.combine(date, datetime.min.time())
            end_date = start_date + timedelta(days=1)
            
            # Общие метрики
            total_events = db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            ).scalar()
            
            unique_users = db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date,
                AnalyticsEvent.user_id.isnot(None)
            ).scalar()
            
            page_views = db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date,
                AnalyticsEvent.event_name == 'page_view'
            ).scalar()
            
            project_views = db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date,
                AnalyticsEvent.event_name == 'project_view'
            ).scalar()
            
            # Новые пользователи
            new_users = db.query(func.count(User.id)).filter(
                User.created_at >= start_date,
                User.created_at < end_date
            ).scalar()
            
            # Новые проекты
            new_projects = db.query(func.count(Project.id)).filter(
                Project.created_at >= start_date,
                Project.created_at < end_date
            ).scalar()
            
            # Сохранение метрик
            metrics_to_save = [
                ('total_events', total_events),
                ('unique_users', unique_users),
                ('page_views', page_views),
                ('project_views', project_views),
                ('new_users', new_users),
                ('new_projects', new_projects)
            ]
            
            for metric_name, value in metrics_to_save:
                # Проверяем, существует ли уже метрика за этот день
                existing_metric = db.query(AnalyticsMetric).filter(
                    AnalyticsMetric.metric_name == metric_name,
                    AnalyticsMetric.metric_type == 'daily',
                    AnalyticsMetric.date == start_date
                ).first()
                
                if existing_metric:
                    existing_metric.value = value
                    existing_metric.updated_at = datetime.utcnow()
                else:
                    metric = AnalyticsMetric(
                        metric_name=metric_name,
                        metric_type='daily',
                        value=value,
                        date=start_date,
                        period_start=start_date,
                        period_end=end_date
                    )
                    db.add(metric)
            
            db.commit()
            logger.info(f"Daily metrics calculated for {date}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error calculating daily metrics: {str(e)}")
            raise
    
    @staticmethod
    def calculate_project_metrics(project_id, date=None):
        """Расчет метрик для конкретного проекта"""
        if date is None:
            date = datetime.utcnow().date()
        
        db = get_db()
        
        try:
            # Период для расчета (один день)
            start_date = datetime.combine(date, datetime.min.time())
            end_date = start_date + timedelta(days=1)
            
            # Метрики проекта
            project_views = db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.project_id == project_id,
                AnalyticsEvent.event_name == 'project_view',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            ).scalar()
            
            unique_viewers = db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
                AnalyticsEvent.project_id == project_id,
                AnalyticsEvent.event_name == 'project_view',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date,
                AnalyticsEvent.user_id.isnot(None)
            ).scalar()
            
            # Время на странице (среднее)
            session_durations = db.query(UserSession.duration).join(
                AnalyticsEvent, UserSession.session_id == AnalyticsEvent.session_id
            ).filter(
                AnalyticsEvent.project_id == project_id,
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date,
                UserSession.duration.isnot(None)
            ).all()
            
            avg_session_duration = 0
            if session_durations:
                avg_session_duration = sum(d.duration for d in session_durations) / len(session_durations)
            
            # Сохранение метрик проекта
            metrics_to_save = [
                ('project_views', project_views),
                ('unique_viewers', unique_viewers),
                ('avg_session_duration', avg_session_duration)
            ]
            
            for metric_name, value in metrics_to_save:
                existing_metric = db.query(AnalyticsMetric).filter(
                    AnalyticsMetric.metric_name == metric_name,
                    AnalyticsMetric.metric_type == 'daily',
                    AnalyticsMetric.project_id == project_id,
                    AnalyticsMetric.date == start_date
                ).first()
                
                if existing_metric:
                    existing_metric.value = value
                    existing_metric.updated_at = datetime.utcnow()
                else:
                    metric = AnalyticsMetric(
                        metric_name=metric_name,
                        metric_type='daily',
                        project_id=project_id,
                        value=value,
                        date=start_date,
                        period_start=start_date,
                        period_end=end_date
                    )
                    db.add(metric)
            
            db.commit()
            logger.info(f"Project metrics calculated for project {project_id} on {date}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error calculating project metrics: {str(e)}")
            raise
    
    @staticmethod
    def calculate_user_metrics(user_id, date=None):
        """Расчет метрик для конкретного пользователя"""
        if date is None:
            date = datetime.utcnow().date()
        
        db = get_db()
        
        try:
            # Период для расчета (один день)
            start_date = datetime.combine(date, datetime.min.time())
            end_date = start_date + timedelta(days=1)
            
            # Метрики пользователя
            total_events = db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.user_id == user_id,
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            ).scalar()
            
            sessions_count = db.query(func.count(func.distinct(AnalyticsEvent.session_id))).filter(
                AnalyticsEvent.user_id == user_id,
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            ).scalar()
            
            projects_viewed = db.query(func.count(func.distinct(AnalyticsEvent.project_id))).filter(
                AnalyticsEvent.user_id == user_id,
                AnalyticsEvent.event_name == 'project_view',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date,
                AnalyticsEvent.project_id.isnot(None)
            ).scalar()
            
            # Сохранение метрик пользователя
            metrics_to_save = [
                ('user_events', total_events),
                ('user_sessions', sessions_count),
                ('user_projects_viewed', projects_viewed)
            ]
            
            for metric_name, value in metrics_to_save:
                existing_metric = db.query(AnalyticsMetric).filter(
                    AnalyticsMetric.metric_name == metric_name,
                    AnalyticsMetric.metric_type == 'daily',
                    AnalyticsMetric.user_id == user_id,
                    AnalyticsMetric.date == start_date
                ).first()
                
                if existing_metric:
                    existing_metric.value = value
                    existing_metric.updated_at = datetime.utcnow()
                else:
                    metric = AnalyticsMetric(
                        metric_name=metric_name,
                        metric_type='daily',
                        user_id=user_id,
                        value=value,
                        date=start_date,
                        period_start=start_date,
                        period_end=end_date
                    )
                    db.add(metric)
            
            db.commit()
            logger.info(f"User metrics calculated for user {user_id} on {date}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error calculating user metrics: {str(e)}")
            raise
    
    @staticmethod
    def update_session_duration(session_id):
        """Обновление длительности сессии"""
        db = get_db()
        
        try:
            session = db.query(UserSession).filter_by(session_id=session_id).first()
            if session and not session.end_time:
                # Получаем последнее событие в сессии
                last_event = db.query(AnalyticsEvent).filter_by(
                    session_id=session_id
                ).order_by(desc(AnalyticsEvent.created_at)).first()
                
                if last_event:
                    session.end_time = last_event.created_at
                    session.duration = int((session.end_time - session.start_time).total_seconds())
                    session.updated_at = datetime.utcnow()
                    
                    db.commit()
                    logger.info(f"Session duration updated for session {session_id}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating session duration: {str(e)}")
            raise
    
    @staticmethod
    def get_trending_projects(days=7, limit=10):
        """Получение трендовых проектов"""
        db = get_db()
        
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            trending = db.query(
                Project.id,
                Project.name,
                Project.description,
                func.count(AnalyticsEvent.id).label('views'),
                func.count(func.distinct(AnalyticsEvent.user_id)).label('unique_viewers')
            ).join(
                AnalyticsEvent, Project.id == AnalyticsEvent.project_id
            ).filter(
                AnalyticsEvent.event_name == 'project_view',
                AnalyticsEvent.created_at >= start_date
            ).group_by(
                Project.id, Project.name, Project.description
            ).order_by(desc('views')).limit(limit).all()
            
            return [
                {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'views': p.views,
                    'unique_viewers': p.unique_viewers
                } for p in trending
            ]
            
        except Exception as e:
            logger.error(f"Error getting trending projects: {str(e)}")
            return []
    
    @staticmethod
    def get_user_engagement_score(user_id, days=30):
        """Расчет показателя вовлеченности пользователя"""
        db = get_db()
        
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Различные типы активности
            events_count = db.query(func.count(AnalyticsEvent.id)).filter(
                AnalyticsEvent.user_id == user_id,
                AnalyticsEvent.created_at >= start_date
            ).scalar()
            
            sessions_count = db.query(func.count(func.distinct(AnalyticsEvent.session_id))).filter(
                AnalyticsEvent.user_id == user_id,
                AnalyticsEvent.created_at >= start_date
            ).scalar()
            
            projects_created = db.query(func.count(Project.id)).filter(
                Project.user_id == user_id,
                Project.created_at >= start_date
            ).scalar()
            
            # Расчет показателя вовлеченности (0-100)
            engagement_score = min(100, (
                events_count * 0.1 +
                sessions_count * 2 +
                projects_created * 10
            ))
            
            return round(engagement_score, 2)
            
        except Exception as e:
            logger.error(f"Error calculating engagement score: {str(e)}")
            return 0

