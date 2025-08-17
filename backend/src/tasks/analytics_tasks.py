from datetime import datetime, timedelta
from ..services.analytics_service import AnalyticsService
from ..models.user import User
from ..models.project import Project
from ..database import get_db
import logging
import schedule
import time
import threading

logger = logging.getLogger(__name__)

class AnalyticsTasks:
    """Класс для выполнения аналитических задач по расписанию"""
    
    def __init__(self):
        self.running = False
        self.thread = None
    
    def start_scheduler(self):
        """Запуск планировщика задач"""
        if self.running:
            return
        
        self.running = True
        
        # Настройка расписания
        schedule.every().day.at("01:00").do(self.calculate_daily_metrics)
        schedule.every().day.at("02:00").do(self.calculate_all_project_metrics)
        schedule.every().day.at("03:00").do(self.calculate_all_user_metrics)
        schedule.every().hour.do(self.update_session_durations)
        
        # Запуск в отдельном потоке
        self.thread = threading.Thread(target=self._run_scheduler)
        self.thread.daemon = True
        self.thread.start()
        
        logger.info("Analytics scheduler started")
    
    def stop_scheduler(self):
        """Остановка планировщика задач"""
        self.running = False
        schedule.clear()
        logger.info("Analytics scheduler stopped")
    
    def _run_scheduler(self):
        """Основной цикл планировщика"""
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Проверка каждую минуту
    
    def calculate_daily_metrics(self):
        """Расчет ежедневных метрик за вчерашний день"""
        try:
            yesterday = (datetime.utcnow() - timedelta(days=1)).date()
            AnalyticsService.calculate_daily_metrics(yesterday)
            logger.info(f"Daily metrics calculated for {yesterday}")
        except Exception as e:
            logger.error(f"Error in daily metrics calculation: {str(e)}")
    
    def calculate_all_project_metrics(self):
        """Расчет метрик для всех проектов"""
        try:
            db = get_db()
            yesterday = (datetime.utcnow() - timedelta(days=1)).date()
            
            # Получаем все проекты, которые имели активность вчера
            active_projects = db.query(Project.id).join(
                AnalyticsEvent, Project.id == AnalyticsEvent.project_id
            ).filter(
                AnalyticsEvent.created_at >= datetime.combine(yesterday, datetime.min.time()),
                AnalyticsEvent.created_at < datetime.combine(yesterday, datetime.min.time()) + timedelta(days=1)
            ).distinct().all()
            
            for project in active_projects:
                AnalyticsService.calculate_project_metrics(project.id, yesterday)
            
            logger.info(f"Project metrics calculated for {len(active_projects)} projects")
            
        except Exception as e:
            logger.error(f"Error in project metrics calculation: {str(e)}")
    
    def calculate_all_user_metrics(self):
        """Расчет метрик для всех активных пользователей"""
        try:
            db = get_db()
            yesterday = (datetime.utcnow() - timedelta(days=1)).date()
            
            # Получаем всех пользователей, которые были активны вчера
            active_users = db.query(User.id).join(
                AnalyticsEvent, User.id == AnalyticsEvent.user_id
            ).filter(
                AnalyticsEvent.created_at >= datetime.combine(yesterday, datetime.min.time()),
                AnalyticsEvent.created_at < datetime.combine(yesterday, datetime.min.time()) + timedelta(days=1)
            ).distinct().all()
            
            for user in active_users:
                AnalyticsService.calculate_user_metrics(user.id, yesterday)
            
            logger.info(f"User metrics calculated for {len(active_users)} users")
            
        except Exception as e:
            logger.error(f"Error in user metrics calculation: {str(e)}")
    
    def update_session_durations(self):
        """Обновление длительности сессий"""
        try:
            db = get_db()
            
            # Получаем сессии без установленной длительности, которые старше 1 часа
            cutoff_time = datetime.utcnow() - timedelta(hours=1)
            
            inactive_sessions = db.query(UserSession.session_id).filter(
                UserSession.end_time.is_(None),
                UserSession.updated_at < cutoff_time
            ).all()
            
            for session in inactive_sessions:
                AnalyticsService.update_session_duration(session.session_id)
            
            logger.info(f"Updated duration for {len(inactive_sessions)} sessions")
            
        except Exception as e:
            logger.error(f"Error updating session durations: {str(e)}")
    
    def run_manual_calculation(self, date=None):
        """Ручной запуск расчета метрик за определенную дату"""
        if date is None:
            date = (datetime.utcnow() - timedelta(days=1)).date()
        
        try:
            logger.info(f"Starting manual metrics calculation for {date}")
            
            # Расчет общих метрик
            AnalyticsService.calculate_daily_metrics(date)
            
            # Расчет метрик проектов
            db = get_db()
            start_date = datetime.combine(date, datetime.min.time())
            end_date = start_date + timedelta(days=1)
            
            active_projects = db.query(Project.id).join(
                AnalyticsEvent, Project.id == AnalyticsEvent.project_id
            ).filter(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            ).distinct().all()
            
            for project in active_projects:
                AnalyticsService.calculate_project_metrics(project.id, date)
            
            # Расчет метрик пользователей
            active_users = db.query(User.id).join(
                AnalyticsEvent, User.id == AnalyticsEvent.user_id
            ).filter(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            ).distinct().all()
            
            for user in active_users:
                AnalyticsService.calculate_user_metrics(user.id, date)
            
            logger.info(f"Manual metrics calculation completed for {date}")
            
        except Exception as e:
            logger.error(f"Error in manual metrics calculation: {str(e)}")
            raise

# Глобальный экземпляр планировщика
analytics_scheduler = AnalyticsTasks()

def start_analytics_scheduler():
    """Функция для запуска планировщика аналитики"""
    analytics_scheduler.start_scheduler()

def stop_analytics_scheduler():
    """Функция для остановки планировщика аналитики"""
    analytics_scheduler.stop_scheduler()

def run_manual_analytics(date=None):
    """Функция для ручного запуска расчета аналитики"""
    analytics_scheduler.run_manual_calculation(date)

