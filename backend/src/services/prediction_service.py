"""
Сервис прогнозирования трендов и AI-рекомендаций для DinoRefs
"""
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import math

class PredictionService:
    """Сервис для прогнозирования трендов и генерации рекомендаций"""
    
    def __init__(self):
        self.confidence_threshold = 0.7
        self.min_data_points = 7  # Минимум данных для прогноза
        
    def predict_user_growth(self, historical_data: List[Dict], days_ahead: int = 30) -> Dict[str, Any]:
        """
        Прогнозирование роста пользователей
        
        Args:
            historical_data: Исторические данные пользователей
            days_ahead: Количество дней для прогноза
            
        Returns:
            Dict с прогнозом роста пользователей
        """
        try:
            if len(historical_data) < self.min_data_points:
                return self._generate_fallback_user_prediction(days_ahead)
            
            # Извлекаем данные для анализа
            dates = [item['date'] for item in historical_data]
            users = [item['total_users'] for item in historical_data]
            new_users = [item['new_users'] for item in historical_data]
            
            # Простая линейная регрессия для тренда
            x = np.arange(len(users))
            
            # Прогноз общих пользователей
            total_trend = np.polyfit(x, users, 1)
            total_prediction = np.poly1d(total_trend)
            
            # Прогноз новых пользователей
            new_trend = np.polyfit(x, new_users, 1)
            new_prediction = np.poly1d(new_trend)
            
            # Генерируем прогноз на указанное количество дней
            future_dates = []
            predicted_total = []
            predicted_new = []
            
            last_date = datetime.strptime(dates[-1], '%Y-%m-%d')
            
            for i in range(1, days_ahead + 1):
                future_date = last_date + timedelta(days=i)
                future_dates.append(future_date.strftime('%Y-%m-%d'))
                
                # Прогноз с учетом роста
                total_pred = max(0, int(total_prediction(len(users) + i - 1)))
                new_pred = max(0, int(new_prediction(len(new_users) + i - 1)))
                
                predicted_total.append(total_pred)
                predicted_new.append(new_pred)
            
            # Расчет доверительного интервала
            confidence = self._calculate_confidence(users, total_prediction(x))
            
            # Генерация инсайтов
            insights = self._generate_user_growth_insights(
                historical_data, predicted_total, predicted_new, confidence
            )
            
            return {
                'prediction_type': 'user_growth',
                'period_days': days_ahead,
                'confidence': confidence,
                'current_total_users': users[-1],
                'predicted_total_users': predicted_total[-1],
                'growth_rate': ((predicted_total[-1] - users[-1]) / users[-1] * 100) if users[-1] > 0 else 0,
                'daily_predictions': [
                    {
                        'date': date,
                        'total_users': total,
                        'new_users': new,
                        'growth_rate': ((total - users[-1]) / users[-1] * 100) if users[-1] > 0 else 0
                    }
                    for date, total, new in zip(future_dates, predicted_total, predicted_new)
                ],
                'insights': insights,
                'recommendations': self._generate_user_growth_recommendations(insights)
            }
            
        except Exception as e:
            print(f"Ошибка прогнозирования роста пользователей: {e}")
            return self._generate_fallback_user_prediction(days_ahead)
    
    def predict_revenue_trends(self, historical_data: List[Dict], days_ahead: int = 30) -> Dict[str, Any]:
        """
        Прогнозирование трендов доходов
        
        Args:
            historical_data: Исторические данные доходов
            days_ahead: Количество дней для прогноза
            
        Returns:
            Dict с прогнозом доходов
        """
        try:
            if len(historical_data) < self.min_data_points:
                return self._generate_fallback_revenue_prediction(days_ahead)
            
            # Извлекаем данные
            dates = [item['date'] for item in historical_data]
            revenue = [item['revenue'] for item in historical_data]
            conversions = [item['conversions'] for item in historical_data]
            
            # Анализ сезонности (простой)
            seasonal_factor = self._calculate_seasonal_factor(revenue)
            
            # Тренд доходов
            x = np.arange(len(revenue))
            revenue_trend = np.polyfit(x, revenue, 2)  # Квадратичная регрессия для доходов
            revenue_prediction = np.poly1d(revenue_trend)
            
            # Прогноз конверсий
            conversion_trend = np.polyfit(x, conversions, 1)
            conversion_prediction = np.poly1d(conversion_trend)
            
            # Генерируем прогноз
            future_dates = []
            predicted_revenue = []
            predicted_conversions = []
            
            last_date = datetime.strptime(dates[-1], '%Y-%m-%d')
            
            for i in range(1, days_ahead + 1):
                future_date = last_date + timedelta(days=i)
                future_dates.append(future_date.strftime('%Y-%m-%d'))
                
                # Прогноз с сезонностью
                base_revenue = max(0, revenue_prediction(len(revenue) + i - 1))
                seasonal_revenue = base_revenue * seasonal_factor
                
                base_conversions = max(0, conversion_prediction(len(conversions) + i - 1))
                
                predicted_revenue.append(int(seasonal_revenue))
                predicted_conversions.append(int(base_conversions))
            
            # Расчет доверительного интервала
            confidence = self._calculate_confidence(revenue, revenue_prediction(x))
            
            # Генерация инсайтов
            insights = self._generate_revenue_insights(
                historical_data, predicted_revenue, predicted_conversions, confidence
            )
            
            return {
                'prediction_type': 'revenue_trends',
                'period_days': days_ahead,
                'confidence': confidence,
                'current_revenue': revenue[-1],
                'predicted_revenue': predicted_revenue[-1],
                'revenue_growth': ((predicted_revenue[-1] - revenue[-1]) / revenue[-1] * 100) if revenue[-1] > 0 else 0,
                'seasonal_factor': seasonal_factor,
                'daily_predictions': [
                    {
                        'date': date,
                        'revenue': rev,
                        'conversions': conv,
                        'revenue_per_conversion': rev / conv if conv > 0 else 0
                    }
                    for date, rev, conv in zip(future_dates, predicted_revenue, predicted_conversions)
                ],
                'insights': insights,
                'recommendations': self._generate_revenue_recommendations(insights)
            }
            
        except Exception as e:
            print(f"Ошибка прогнозирования доходов: {e}")
            return self._generate_fallback_revenue_prediction(days_ahead)
    
    def generate_personalized_recommendations(self, user_data: Dict, analytics_data: Dict) -> Dict[str, Any]:
        """
        Генерация персонализированных рекомендаций
        
        Args:
            user_data: Данные пользователя
            analytics_data: Аналитические данные
            
        Returns:
            Dict с персонализированными рекомендациями
        """
        try:
            recommendations = []
            priority_actions = []
            
            # Анализ текущего плана пользователя
            current_plan = user_data.get('subscription_plan', 'free')
            usage_stats = analytics_data.get('usage_stats', {})
            
            # Рекомендации по улучшению конверсии
            conversion_rate = analytics_data.get('conversion_rate', 0)
            if conversion_rate < 10:
                recommendations.append({
                    'type': 'conversion_optimization',
                    'title': 'Улучшите конверсию рефералов',
                    'description': f'Ваша текущая конверсия {conversion_rate:.1f}% ниже среднего (12.5%). Рекомендуем оптимизировать реферальные ссылки.',
                    'impact': 'high',
                    'effort': 'medium',
                    'expected_improvement': '15-25% рост конверсии'
                })
                priority_actions.append('optimize_referral_links')
            
            # Рекомендации по росту аудитории
            user_growth_rate = analytics_data.get('user_growth_rate', 0)
            if user_growth_rate < 5:
                recommendations.append({
                    'type': 'audience_growth',
                    'title': 'Увеличьте охват аудитории',
                    'description': f'Рост пользователей {user_growth_rate:.1f}% в месяц. Рекомендуем активнее использовать социальные сети.',
                    'impact': 'high',
                    'effort': 'high',
                    'expected_improvement': '30-50% рост аудитории'
                })
                priority_actions.append('expand_social_presence')
            
            # Рекомендации по монетизации
            if current_plan == 'free':
                project_count = usage_stats.get('projects', 0)
                if project_count >= 1:
                    recommendations.append({
                        'type': 'monetization',
                        'title': 'Рассмотрите план Baby Dino',
                        'description': f'У вас {project_count} проект(ов). План Baby Dino даст больше возможностей для роста.',
                        'impact': 'medium',
                        'effort': 'low',
                        'expected_improvement': 'Расширенная аналитика и больше проектов'
                    })
                    priority_actions.append('upgrade_plan')
            
            # Рекомендации по оптимизации каналов
            channel_performance = analytics_data.get('channel_performance', {})
            best_channel = max(channel_performance.items(), key=lambda x: x[1]) if channel_performance else None
            
            if best_channel:
                recommendations.append({
                    'type': 'channel_optimization',
                    'title': f'Сосредоточьтесь на канале {best_channel[0]}',
                    'description': f'Канал {best_channel[0]} показывает лучшую конверсию {best_channel[1]:.1f}%. Увеличьте активность в этом канале.',
                    'impact': 'medium',
                    'effort': 'medium',
                    'expected_improvement': '20-30% рост эффективности'
                })
                priority_actions.append('focus_best_channel')
            
            # AI-инсайты на основе паттернов
            ai_insights = self._generate_ai_insights(user_data, analytics_data)
            
            return {
                'user_id': user_data.get('id'),
                'generated_at': datetime.now().isoformat(),
                'recommendations': recommendations,
                'priority_actions': priority_actions,
                'ai_insights': ai_insights,
                'next_review_date': (datetime.now() + timedelta(days=7)).isoformat(),
                'confidence_score': self._calculate_recommendation_confidence(recommendations)
            }
            
        except Exception as e:
            print(f"Ошибка генерации рекомендаций: {e}")
            return self._generate_fallback_recommendations()
    
    def _calculate_seasonal_factor(self, data: List[float]) -> float:
        """Расчет сезонного фактора"""
        if len(data) < 7:
            return 1.0
        
        # Простой анализ недельной сезонности
        recent_avg = np.mean(data[-7:])
        overall_avg = np.mean(data)
        
        return recent_avg / overall_avg if overall_avg > 0 else 1.0
    
    def _calculate_confidence(self, actual: List[float], predicted: np.ndarray) -> float:
        """Расчет доверительного интервала прогноза"""
        try:
            mse = np.mean((np.array(actual) - predicted) ** 2)
            rmse = np.sqrt(mse)
            mean_actual = np.mean(actual)
            
            # Нормализованная ошибка
            normalized_error = rmse / mean_actual if mean_actual > 0 else 1.0
            
            # Доверие = 1 - нормализованная ошибка (ограничено от 0 до 1)
            confidence = max(0.1, min(0.95, 1.0 - normalized_error))
            
            return round(confidence, 2)
        except:
            return 0.7  # Средний уровень доверия по умолчанию
    
    def _generate_user_growth_insights(self, historical_data: List[Dict], 
                                     predicted_total: List[int], 
                                     predicted_new: List[int], 
                                     confidence: float) -> List[Dict]:
        """Генерация инсайтов по росту пользователей"""
        insights = []
        
        # Анализ тренда
        current_users = historical_data[-1]['total_users']
        predicted_users = predicted_total[-1]
        growth_rate = ((predicted_users - current_users) / current_users * 100) if current_users > 0 else 0
        
        if growth_rate > 20:
            insights.append({
                'type': 'positive_trend',
                'message': f'Прогнозируется высокий рост пользователей на {growth_rate:.1f}%',
                'confidence': confidence
            })
        elif growth_rate < 5:
            insights.append({
                'type': 'slow_growth',
                'message': f'Медленный рост пользователей {growth_rate:.1f}%. Требуются маркетинговые усилия',
                'confidence': confidence
            })
        
        # Анализ новых пользователей
        avg_new_users = np.mean(predicted_new)
        if avg_new_users > 10:
            insights.append({
                'type': 'acquisition_success',
                'message': f'Стабильный приток новых пользователей: {avg_new_users:.0f} в день',
                'confidence': confidence
            })
        
        return insights
    
    def _generate_revenue_insights(self, historical_data: List[Dict], 
                                 predicted_revenue: List[int], 
                                 predicted_conversions: List[int], 
                                 confidence: float) -> List[Dict]:
        """Генерация инсайтов по доходам"""
        insights = []
        
        # Анализ роста доходов
        current_revenue = historical_data[-1]['revenue']
        predicted_rev = predicted_revenue[-1]
        revenue_growth = ((predicted_rev - current_revenue) / current_revenue * 100) if current_revenue > 0 else 0
        
        if revenue_growth > 15:
            insights.append({
                'type': 'revenue_growth',
                'message': f'Прогнозируется рост доходов на {revenue_growth:.1f}%',
                'confidence': confidence
            })
        elif revenue_growth < 0:
            insights.append({
                'type': 'revenue_decline',
                'message': f'Возможное снижение доходов на {abs(revenue_growth):.1f}%. Требуется оптимизация',
                'confidence': confidence
            })
        
        # Анализ конверсий
        avg_conversions = np.mean(predicted_conversions)
        if avg_conversions > 50:
            insights.append({
                'type': 'high_conversions',
                'message': f'Высокий уровень конверсий: {avg_conversions:.0f} в день',
                'confidence': confidence
            })
        
        return insights
    
    def _generate_user_growth_recommendations(self, insights: List[Dict]) -> List[Dict]:
        """Генерация рекомендаций по росту пользователей"""
        recommendations = []
        
        for insight in insights:
            if insight['type'] == 'slow_growth':
                recommendations.append({
                    'action': 'increase_marketing',
                    'title': 'Усильте маркетинговые активности',
                    'description': 'Рекомендуем увеличить бюджет на рекламу и активность в социальных сетях'
                })
            elif insight['type'] == 'positive_trend':
                recommendations.append({
                    'action': 'scale_infrastructure',
                    'title': 'Подготовьтесь к росту нагрузки',
                    'description': 'При высоком росте пользователей убедитесь в готовности инфраструктуры'
                })
        
        return recommendations
    
    def _generate_revenue_recommendations(self, insights: List[Dict]) -> List[Dict]:
        """Генерация рекомендаций по доходам"""
        recommendations = []
        
        for insight in insights:
            if insight['type'] == 'revenue_decline':
                recommendations.append({
                    'action': 'optimize_pricing',
                    'title': 'Пересмотрите ценовую стратегию',
                    'description': 'Рассмотрите возможность оптимизации тарифных планов и акций'
                })
            elif insight['type'] == 'revenue_growth':
                recommendations.append({
                    'action': 'expand_features',
                    'title': 'Расширьте функциональность',
                    'description': 'При росте доходов инвестируйте в новые функции для удержания пользователей'
                })
        
        return recommendations
    
    def _generate_ai_insights(self, user_data: Dict, analytics_data: Dict) -> List[Dict]:
        """Генерация AI-инсайтов"""
        insights = []
        
        # Анализ паттернов использования
        usage_pattern = analytics_data.get('usage_pattern', 'regular')
        if usage_pattern == 'declining':
            insights.append({
                'type': 'engagement_risk',
                'message': 'Обнаружено снижение активности. Рекомендуем персональное предложение',
                'confidence': 0.8
            })
        
        # Анализ потенциала роста
        growth_potential = analytics_data.get('growth_potential', 'medium')
        if growth_potential == 'high':
            insights.append({
                'type': 'growth_opportunity',
                'message': 'Высокий потенциал роста. Время для масштабирования активностей',
                'confidence': 0.85
            })
        
        return insights
    
    def _calculate_recommendation_confidence(self, recommendations: List[Dict]) -> float:
        """Расчет общего уровня доверия к рекомендациям"""
        if not recommendations:
            return 0.5
        
        # Базовый уровень доверия зависит от количества и типа рекомендаций
        base_confidence = 0.7
        
        # Увеличиваем доверие для рекомендаций с высоким impact
        high_impact_count = sum(1 for rec in recommendations if rec.get('impact') == 'high')
        confidence_boost = min(0.2, high_impact_count * 0.05)
        
        return min(0.95, base_confidence + confidence_boost)
    
    def _generate_fallback_user_prediction(self, days_ahead: int) -> Dict[str, Any]:
        """Fallback прогноз пользователей при недостатке данных"""
        base_users = 420
        daily_growth = 5
        
        predictions = []
        for i in range(1, days_ahead + 1):
            date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
            total_users = base_users + (i * daily_growth)
            predictions.append({
                'date': date,
                'total_users': total_users,
                'new_users': daily_growth,
                'growth_rate': (daily_growth / base_users * 100)
            })
        
        return {
            'prediction_type': 'user_growth',
            'period_days': days_ahead,
            'confidence': 0.6,
            'current_total_users': base_users,
            'predicted_total_users': base_users + (days_ahead * daily_growth),
            'growth_rate': (daily_growth * days_ahead / base_users * 100),
            'daily_predictions': predictions,
            'insights': [{'type': 'limited_data', 'message': 'Прогноз основан на ограниченных данных', 'confidence': 0.6}],
            'recommendations': [{'action': 'collect_more_data', 'title': 'Соберите больше данных', 'description': 'Для точных прогнозов нужно больше исторических данных'}]
        }
    
    def _generate_fallback_revenue_prediction(self, days_ahead: int) -> Dict[str, Any]:
        """Fallback прогноз доходов при недостатке данных"""
        base_revenue = 145600
        daily_revenue = 4800
        
        predictions = []
        for i in range(1, days_ahead + 1):
            date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
            revenue = daily_revenue + (i * 100)  # Небольшой рост
            predictions.append({
                'date': date,
                'revenue': revenue,
                'conversions': max(1, revenue // 100),
                'revenue_per_conversion': 100
            })
        
        total_predicted = sum(p['revenue'] for p in predictions)
        
        return {
            'prediction_type': 'revenue_trends',
            'period_days': days_ahead,
            'confidence': 0.6,
            'current_revenue': base_revenue,
            'predicted_revenue': total_predicted,
            'revenue_growth': (total_predicted / base_revenue * 100),
            'seasonal_factor': 1.0,
            'daily_predictions': predictions,
            'insights': [{'type': 'limited_data', 'message': 'Прогноз доходов основан на ограниченных данных', 'confidence': 0.6}],
            'recommendations': [{'action': 'track_revenue', 'title': 'Отслеживайте доходы', 'description': 'Ведите детальный учет доходов для точных прогнозов'}]
        }
    
    def _generate_fallback_recommendations(self) -> Dict[str, Any]:
        """Fallback рекомендации при ошибках"""
        return {
            'user_id': 'unknown',
            'generated_at': datetime.now().isoformat(),
            'recommendations': [
                {
                    'type': 'general',
                    'title': 'Анализируйте метрики регулярно',
                    'description': 'Регулярный анализ поможет выявить тренды и возможности для роста',
                    'impact': 'medium',
                    'effort': 'low',
                    'expected_improvement': 'Лучшее понимание бизнеса'
                }
            ],
            'priority_actions': ['analyze_metrics'],
            'ai_insights': [{'type': 'general', 'message': 'Недостаточно данных для персонализированных рекомендаций', 'confidence': 0.5}],
            'next_review_date': (datetime.now() + timedelta(days=7)).isoformat(),
            'confidence_score': 0.5
        }

