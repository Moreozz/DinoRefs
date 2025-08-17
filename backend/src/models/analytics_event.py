from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from src.database import db

class AnalyticsEvent(db.Model):
    """Модель для хранения событий аналитики"""
    __tablename__ = 'analytics_events'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Может быть анонимным
    session_id = Column(String(255), nullable=False)  # Идентификатор сессии
    event_type = Column(String(100), nullable=False)  # Тип события
    event_name = Column(String(255), nullable=False)  # Название события
    
    # Контекст события
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)
    reference_id = Column(Integer, ForeignKey('references.id'), nullable=True)
    page_url = Column(String(500), nullable=True)
    referrer_url = Column(String(500), nullable=True)
    
    # Данные события
    properties = Column(JSON, nullable=True)  # Дополнительные свойства события
    
    # Технические данные
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    device_type = Column(String(50), nullable=True)  # desktop, mobile, tablet
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    user = relationship("User", back_populates="analytics_events")
    project = relationship("Project", back_populates="analytics_events")
    reference = relationship("Reference", back_populates="analytics_events")

class AnalyticsMetric(db.Model):
    """Модель для агрегированных метрик"""
    __tablename__ = 'analytics_metrics'
    
    id = Column(Integer, primary_key=True)
    metric_name = Column(String(255), nullable=False)  # Название метрики
    metric_type = Column(String(100), nullable=False)  # daily, weekly, monthly, total
    
    # Контекст метрики
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)
    
    # Значения метрики
    value = Column(Float, nullable=False)
    count = Column(Integer, default=0)
    
    # Период
    date = Column(DateTime, nullable=False)  # Дата для которой рассчитана метрика
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    
    # Дополнительные данные
    extra_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    user = relationship("User", back_populates="analytics_metrics")
    project = relationship("Project", back_populates="analytics_metrics")

class UserSession(db.Model):
    """Модель для пользовательских сессий"""
    __tablename__ = 'user_sessions'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(255), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Данные сессии
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # Длительность в секундах
    
    # Технические данные
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    
    # Геолокация
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Активность в сессии
    page_views = Column(Integer, default=0)
    events_count = Column(Integer, default=0)
    projects_viewed = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    user = relationship("User", back_populates="sessions")
    events = relationship("AnalyticsEvent", foreign_keys=[session_id], 
                         primaryjoin="UserSession.session_id == AnalyticsEvent.session_id")

