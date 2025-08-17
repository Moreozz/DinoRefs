import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, CheckCircle, Clock, Zap, DollarSign, Users } from 'lucide-react';

const PredictiveAnalytics = () => {
  const [userGrowthPrediction, setUserGrowthPrediction] = useState(null);
  const [revenuePrediction, setRevenuePrediction] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [predictionsSummary, setPredictionsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState('user_growth');

  useEffect(() => {
    fetchPredictiveData();
  }, []);

  const fetchPredictiveData = async () => {
    setLoading(true);
    try {
      // Загружаем все прогнозы параллельно
      const [userGrowth, revenue, personalizedRecs, insights, summary] = await Promise.all([
        fetch('http://localhost:5002/api/analytics/predictions/user-growth?days=30').then(r => r.json()),
        fetch('http://localhost:5002/api/analytics/predictions/revenue-trends?days=30').then(r => r.json()),
        fetch('http://localhost:5002/api/analytics/recommendations/personalized').then(r => r.json()),
        fetch('http://localhost:5002/api/analytics/insights/ai-analysis').then(r => r.json()),
        fetch('http://localhost:5002/api/analytics/predictions/summary').then(r => r.json())
      ]);

      setUserGrowthPrediction(userGrowth);
      setRevenuePrediction(revenue);
      setRecommendations(personalizedRecs);
      setAiInsights(insights);
      setPredictionsSummary(summary);
    } catch (error) {
      console.error('Ошибка загрузки прогнозов:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'Высокая';
    if (confidence >= 0.6) return 'Средняя';
    return 'Низкая';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'positive':
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderPredictionChart = () => {
    if (!userGrowthPrediction && !revenuePrediction) return null;

    const data = selectedPrediction === 'user_growth' 
      ? userGrowthPrediction?.daily_predictions || []
      : revenuePrediction?.daily_predictions || [];

    const dataKey = selectedPrediction === 'user_growth' ? 'total_users' : 'revenue';
    const color = selectedPrediction === 'user_growth' ? '#3B82F6' : '#10B981';

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedPrediction === 'user_growth' ? '📈 Прогноз роста пользователей' : '💰 Прогноз доходов'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Прогноз на 30 дней с доверительным интервалом
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedPrediction('user_growth')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedPrediction === 'user_growth'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Пользователи
            </button>
            <button
              onClick={() => setSelectedPrediction('revenue')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedPrediction === 'revenue'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Доходы
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip 
                formatter={(value, name) => [
                  selectedPrediction === 'user_growth' ? `${value} пользователей` : `${formatNumber(value)}₽`,
                  selectedPrediction === 'user_growth' ? 'Пользователи' : 'Доходы'
                ]}
                labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fill={color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Статистика прогноза */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {selectedPrediction === 'user_growth' 
                ? userGrowthPrediction?.predicted_total_users || 0
                : formatNumber(revenuePrediction?.predicted_revenue || 0)
              }
            </div>
            <div className="text-sm text-gray-600">Прогноз на 30 дней</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              +{selectedPrediction === 'user_growth' 
                ? userGrowthPrediction?.growth_rate?.toFixed(1) || 0
                : revenuePrediction?.revenue_growth?.toFixed(1) || 0
              }%
            </div>
            <div className="text-sm text-gray-600">Рост</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getConfidenceColor(
              selectedPrediction === 'user_growth' 
                ? userGrowthPrediction?.confidence || 0
                : revenuePrediction?.confidence || 0
            )}`}>
              {getConfidenceLabel(
                selectedPrediction === 'user_growth' 
                  ? userGrowthPrediction?.confidence || 0
                  : revenuePrediction?.confidence || 0
              )}
            </div>
            <div className="text-sm text-gray-600">Точность</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем прогнозы и AI-анализ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔮 Прогнозная аналитика</h1>
              <p className="text-gray-600 mt-1">AI-прогнозы, рекомендации и инсайты для роста бизнеса</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={fetchPredictiveData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Brain className="h-4 w-4 mr-2" />
                Обновить прогнозы
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Сводка прогнозов */}
        {predictionsSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Рост пользователей</h3>
                    <p className="text-sm text-gray-600">30 дней</p>
                  </div>
                </div>
                {getTrendIcon(predictionsSummary.predictions.user_growth.trend)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Текущие:</span>
                  <span className="font-medium">{predictionsSummary.predictions.user_growth.current}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Прогноз:</span>
                  <span className="font-medium">{predictionsSummary.predictions.user_growth.predicted_30d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Рост:</span>
                  <span className="font-medium text-green-600">+{predictionsSummary.predictions.user_growth.growth_rate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Доходы</h3>
                    <p className="text-sm text-gray-600">Месячные</p>
                  </div>
                </div>
                {getTrendIcon(predictionsSummary.predictions.revenue.trend)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Текущие:</span>
                  <span className="font-medium">{formatNumber(predictionsSummary.predictions.revenue.current_monthly)}₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Прогноз:</span>
                  <span className="font-medium">{formatNumber(predictionsSummary.predictions.revenue.predicted_monthly)}₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Рост:</span>
                  <span className="font-medium text-green-600">+{predictionsSummary.predictions.revenue.growth_rate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Конверсия</h3>
                    <p className="text-sm text-gray-600">Средняя</p>
                  </div>
                </div>
                {getTrendIcon(predictionsSummary.predictions.conversions.trend)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Текущая:</span>
                  <span className="font-medium">{predictionsSummary.predictions.conversions.current_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Прогноз:</span>
                  <span className="font-medium">{predictionsSummary.predictions.conversions.predicted_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Улучшение:</span>
                  <span className="font-medium text-green-600">+{predictionsSummary.predictions.conversions.improvement}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* График прогнозов */}
        {renderPredictionChart()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* AI-инсайты */}
          {aiInsights && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <Brain className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">AI-инсайты</h3>
              </div>
              
              <div className="space-y-4">
                {aiInsights.key_insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {insight.impact === 'high' ? 'Высокий' : 
                         insight.impact === 'medium' ? 'Средний' : 'Низкий'} импакт
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    <p className="text-sm text-blue-600 font-medium">{insight.recommendation}</p>
                    <div className="flex items-center mt-2">
                      <div className="text-xs text-gray-500">
                        Точность: {(insight.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Предупреждения */}
              {aiInsights.predictive_alerts && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                    Прогнозные алерты
                  </h4>
                  <div className="space-y-3">
                    {aiInsights.predictive_alerts.map((alert, index) => (
                      <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-gray-900 mb-1">{alert.message}</p>
                        <p className="text-xs text-gray-600">
                          Вероятность: {(alert.probability * 100).toFixed(0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Персональные рекомендации */}
          {recommendations && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <Zap className="h-6 w-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Рекомендации</h3>
              </div>
              
              <div className="space-y-4">
                {recommendations.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <div className="flex space-x-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                          rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.impact === 'high' ? 'Высокий' : 
                           rec.impact === 'medium' ? 'Средний' : 'Низкий'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.effort === 'high' ? 'bg-red-100 text-red-700' :
                          rec.effort === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.effort === 'high' ? 'Сложно' : 
                           rec.effort === 'medium' ? 'Средне' : 'Легко'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-sm text-green-600 font-medium">{rec.expected_improvement}</p>
                  </div>
                ))}
              </div>

              {/* Оценка доверия */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Общая точность рекомендаций:</span>
                  <span className={`font-medium ${getConfidenceColor(recommendations.confidence_score)}`}>
                    {getConfidenceLabel(recommendations.confidence_score)} ({(recommendations.confidence_score * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Риски и возможности */}
        {predictionsSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            
            {/* Риски */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Факторы риска</h3>
              </div>
              
              <div className="space-y-4">
                {predictionsSummary.risk_factors.map((risk, index) => (
                  <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{risk.description}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        risk.impact === 'high' ? 'bg-red-100 text-red-700' :
                        risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {risk.impact === 'high' ? 'Высокий' : 
                         risk.impact === 'medium' ? 'Средний' : 'Низкий'} риск
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Вероятность: {(risk.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Возможности */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Возможности</h3>
              </div>
              
              <div className="space-y-4">
                {predictionsSummary.opportunities.map((opportunity, index) => (
                  <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{opportunity.description}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        opportunity.impact === 'high' ? 'bg-green-100 text-green-700' :
                        opportunity.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {opportunity.impact === 'high' ? 'Высокий' : 
                         opportunity.impact === 'medium' ? 'Средний' : 'Низкий'} потенциал
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Вероятность: {(opportunity.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveAnalytics;

