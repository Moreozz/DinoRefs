import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import logging

logger = logging.getLogger(__name__)

class MLService:
    """Сервис машинного обучения для прогнозной аналитики"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
    
    def prepare_time_series_data(self, data: List[Dict], target_column: str, 
                                date_column: str = 'date') -> tuple:
        """Подготовка данных временных рядов для обучения"""
        try:
            df = pd.DataFrame(data)
            df[date_column] = pd.to_datetime(df[date_column])
            df = df.sort_values(date_column)
            
            # Создание признаков на основе времени
            df['day_of_week'] = df[date_column].dt.dayofweek
            df['day_of_month'] = df[date_column].dt.day
            df['month'] = df[date_column].dt.month
            df['quarter'] = df[date_column].dt.quarter
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            
            # Создание лаговых признаков
            for lag in [1, 3, 7, 14]:
                df[f'{target_column}_lag_{lag}'] = df[target_column].shift(lag)
            
            # Скользящие средние
            for window in [3, 7, 14]:
                df[f'{target_column}_ma_{window}'] = df[target_column].rolling(window=window).mean()
            
            # Удаление строк с NaN значениями
            df = df.dropna()
            
            # Разделение на признаки и целевую переменную
            feature_columns = [col for col in df.columns 
                             if col not in [date_column, target_column]]
            
            X = df[feature_columns].values
            y = df[target_column].values
            dates = df[date_column].values
            
            return X, y, dates, feature_columns
            
        except Exception as e:
            logger.error(f"Error preparing time series data: {str(e)}")
            raise
    
    def train_growth_prediction_model(self, historical_data: List[Dict], 
                                    target_metric: str = 'users') -> Dict[str, Any]:
        """Обучение модели прогнозирования роста"""
        try:
            X, y, dates, feature_columns = self.prepare_time_series_data(
                historical_data, target_metric
            )
            
            if len(X) < 10:
                raise ValueError("Недостаточно данных для обучения модели")
            
            # Разделение на обучающую и тестовую выборки
            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            # Нормализация данных
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Обучение нескольких моделей
            models = {
                'linear': LinearRegression(),
                'random_forest': RandomForestRegressor(n_estimators=100, random_state=42)
            }
            
            best_model = None
            best_score = float('inf')
            best_model_name = None
            
            for name, model in models.items():
                model.fit(X_train_scaled, y_train)
                predictions = model.predict(X_test_scaled)
                mse = mean_squared_error(y_test, predictions)
                
                if mse < best_score:
                    best_score = mse
                    best_model = model
                    best_model_name = name
            
            # Сохранение лучшей модели
            model_key = f'growth_{target_metric}'
            self.models[model_key] = best_model
            self.scalers[model_key] = scaler
            
            # Важность признаков для Random Forest
            if best_model_name == 'random_forest':
                self.feature_importance[model_key] = dict(
                    zip(feature_columns, best_model.feature_importances_)
                )
            
            # Метрики качества
            train_predictions = best_model.predict(X_train_scaled)
            test_predictions = best_model.predict(X_test_scaled)
            
            metrics = {
                'model_type': best_model_name,
                'train_mae': mean_absolute_error(y_train, train_predictions),
                'test_mae': mean_absolute_error(y_test, test_predictions),
                'train_mse': mean_squared_error(y_train, train_predictions),
                'test_mse': mean_squared_error(y_test, test_predictions),
                'feature_importance': self.feature_importance.get(model_key, {})
            }
            
            logger.info(f"Growth prediction model trained for {target_metric}: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error training growth prediction model: {str(e)}")
            raise
    
    def predict_future_growth(self, model_key: str, days_ahead: int = 30) -> List[Dict]:
        """Прогнозирование будущего роста"""
        try:
            if model_key not in self.models:
                raise ValueError(f"Model {model_key} not found")
            
            model = self.models[model_key]
            scaler = self.scalers[model_key]
            
            # Создание будущих дат
            start_date = datetime.now()
            future_dates = [start_date + timedelta(days=i) for i in range(1, days_ahead + 1)]
            
            predictions = []
            
            for date in future_dates:
                # Создание признаков для будущей даты
                features = [
                    date.weekday(),  # day_of_week
                    date.day,        # day_of_month
                    date.month,      # month
                    (date.month - 1) // 3 + 1,  # quarter
                    1 if date.weekday() >= 5 else 0,  # is_weekend
                ]
                
                # Добавление нулевых значений для лаговых признаков и скользящих средних
                # В реальной реализации здесь должны быть актуальные значения
                features.extend([0] * 10)  # Placeholder для лаговых признаков
                
                # Нормализация и предсказание
                features_scaled = scaler.transform([features])
                prediction = model.predict(features_scaled)[0]
                
                predictions.append({
                    'date': date.isoformat(),
                    'predicted_value': max(0, prediction),  # Не может быть отрицательным
                    'confidence': 0.8  # Placeholder для доверительного интервала
                })
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error predicting future growth: {str(e)}")
            raise
    
    def calculate_user_segments(self, user_data: List[Dict]) -> Dict[str, List[Dict]]:
        """Сегментация пользователей на основе поведения"""
        try:
            df = pd.DataFrame(user_data)
            
            if df.empty:
                return {'segments': [], 'summary': {}}
            
            # Расчет метрик активности
            df['activity_score'] = (
                df.get('total_events', 0) * 0.4 +
                df.get('projects_created', 0) * 0.3 +
                df.get('days_active', 0) * 0.2 +
                df.get('social_interactions', 0) * 0.1
            )
            
            # Определение сегментов
            segments = {
                'champions': df[
                    (df['activity_score'] >= df['activity_score'].quantile(0.8)) &
                    (df.get('days_active', 0) >= 14)
                ],
                'loyal_users': df[
                    (df['activity_score'] >= df['activity_score'].quantile(0.6)) &
                    (df['activity_score'] < df['activity_score'].quantile(0.8))
                ],
                'potential_loyalists': df[
                    (df['activity_score'] >= df['activity_score'].quantile(0.4)) &
                    (df.get('days_active', 0) >= 7)
                ],
                'new_users': df[
                    df.get('days_since_registration', 0) <= 7
                ],
                'at_risk': df[
                    (df.get('days_since_last_activity', 0) >= 14) &
                    (df.get('days_since_last_activity', 0) < 30)
                ],
                'hibernating': df[
                    df.get('days_since_last_activity', 0) >= 30
                ]
            }
            
            # Подготовка результата
            result = {'segments': {}, 'summary': {}}
            
            for segment_name, segment_df in segments.items():
                result['segments'][segment_name] = segment_df.to_dict('records')
                result['summary'][segment_name] = {
                    'count': len(segment_df),
                    'avg_activity_score': segment_df['activity_score'].mean() if not segment_df.empty else 0,
                    'percentage': (len(segment_df) / len(df)) * 100 if len(df) > 0 else 0
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating user segments: {str(e)}")
            raise
    
    def generate_content_recommendations(self, user_id: int, user_behavior: Dict,
                                       available_projects: List[Dict]) -> List[Dict]:
        """Генерация рекомендаций контента для пользователя"""
        try:
            if not available_projects:
                return []
            
            df_projects = pd.DataFrame(available_projects)
            
            # Расчет скора релевантности для каждого проекта
            recommendations = []
            
            for _, project in df_projects.iterrows():
                score = 0
                
                # Популярность проекта
                popularity_score = project.get('views', 0) * 0.3
                
                # Свежесть проекта
                created_date = pd.to_datetime(project.get('created_at', datetime.now()))
                days_old = (datetime.now() - created_date).days
                freshness_score = max(0, 100 - days_old) * 0.2
                
                # Соответствие интересам пользователя
                user_categories = user_behavior.get('preferred_categories', [])
                project_category = project.get('category', '')
                category_match = 1 if project_category in user_categories else 0.5
                category_score = category_match * 0.3
                
                # Социальные сигналы
                social_score = (
                    project.get('likes', 0) * 0.1 +
                    project.get('comments', 0) * 0.2
                ) * 0.2
                
                total_score = popularity_score + freshness_score + category_score + social_score
                
                recommendations.append({
                    'project_id': project['id'],
                    'project_name': project['name'],
                    'score': total_score,
                    'reason': self._get_recommendation_reason(
                        popularity_score, freshness_score, category_score, social_score
                    )
                })
            
            # Сортировка по скору и возврат топ-10
            recommendations.sort(key=lambda x: x['score'], reverse=True)
            return recommendations[:10]
            
        except Exception as e:
            logger.error(f"Error generating content recommendations: {str(e)}")
            raise
    
    def _get_recommendation_reason(self, popularity: float, freshness: float,
                                 category: float, social: float) -> str:
        """Определение причины рекомендации"""
        scores = {
            'популярность': popularity,
            'новизна': freshness,
            'соответствие интересам': category,
            'социальная активность': social
        }
        
        max_reason = max(scores, key=scores.get)
        return f"Рекомендовано на основе: {max_reason}"
    
    def calculate_churn_probability(self, user_data: Dict) -> Dict[str, Any]:
        """Расчет вероятности оттока пользователя"""
        try:
            # Факторы риска оттока
            risk_factors = {
                'days_since_last_activity': user_data.get('days_since_last_activity', 0),
                'activity_decline': user_data.get('activity_decline_percentage', 0),
                'low_engagement': 1 if user_data.get('avg_session_duration', 0) < 60 else 0,
                'no_content_creation': 1 if user_data.get('projects_created', 0) == 0 else 0,
                'no_social_interaction': 1 if user_data.get('social_interactions', 0) == 0 else 0
            }
            
            # Простая модель расчета вероятности оттока
            churn_score = (
                min(risk_factors['days_since_last_activity'] / 30, 1) * 0.4 +
                min(risk_factors['activity_decline'] / 100, 1) * 0.3 +
                risk_factors['low_engagement'] * 0.1 +
                risk_factors['no_content_creation'] * 0.1 +
                risk_factors['no_social_interaction'] * 0.1
            )
            
            churn_probability = min(churn_score, 1.0)
            
            # Определение уровня риска
            if churn_probability >= 0.7:
                risk_level = 'высокий'
                recommendations = [
                    'Отправить персонализированное предложение',
                    'Предложить помощь в создании проекта',
                    'Пригласить в активное сообщество'
                ]
            elif churn_probability >= 0.4:
                risk_level = 'средний'
                recommendations = [
                    'Отправить уведомление о новых функциях',
                    'Предложить интересный контент',
                    'Напомнить о незавершенных проектах'
                ]
            else:
                risk_level = 'низкий'
                recommendations = [
                    'Продолжить обычное взаимодействие',
                    'Предложить расширенные функции'
                ]
            
            return {
                'churn_probability': churn_probability,
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Error calculating churn probability: {str(e)}")
            raise
    
    def get_model_performance(self, model_key: str) -> Dict[str, Any]:
        """Получение метрик производительности модели"""
        try:
            if model_key not in self.models:
                return {'error': 'Model not found'}
            
            return {
                'model_exists': True,
                'feature_importance': self.feature_importance.get(model_key, {}),
                'last_trained': datetime.now().isoformat(),
                'status': 'active'
            }
            
        except Exception as e:
            logger.error(f"Error getting model performance: {str(e)}")
            return {'error': str(e)}

# Глобальный экземпляр сервиса
ml_service = MLService()

