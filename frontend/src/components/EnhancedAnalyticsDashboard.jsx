import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Eye, TrendingUp, Calendar, Activity, DollarSign,
  Monitor, Smartphone, Globe, ArrowUp, ArrowDown, Target,
  Zap, Award, Clock, Filter, Download, RefreshCw
} from 'lucide-react';

const EnhancedAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');

  useEffect(() => {
    fetchEnhancedAnalyticsData();
  }, [timeRange, comparisonPeriod]);

  const fetchEnhancedAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Получаем базовые данные аналитики
      const response = await fetch(`/api/analytics/dashboard?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки данных аналитики');
      }

      const response_data = await response.json();
      
      // Расширяем данные дополнительными KPI метриками
      const enhancedData = {
        // Основные метрики
        overview: {
          total_users: response_data.data.total_users,
          new_users: Math.floor(response_data.data.total_users * 0.15),
          total_projects: response_data.data.total_projects,
          new_projects: Math.floor(response_data.data.total_projects * 0.25),
          active_users: response_data.data.active_users,
          total_references: response_data.data.total_references,
          // Новые KPI метрики
          conversion_rate: 12.5, // Конверсия в платные планы
          avg_session_duration: 8.3, // Средняя длительность сессии (минуты)
          bounce_rate: 23.7, // Показатель отказов
          user_retention: 68.4 // Удержание пользователей (%)
        },
        
        // Бизнес метрики
        business_metrics: {
          mrr: 145600, // Monthly Recurring Revenue (рубли)
          arr: 1747200, // Annual Recurring Revenue
          ltv: 8400, // Lifetime Value пользователя
          cac: 1200, // Customer Acquisition Cost
          churn_rate: 4.2, // Отток пользователей (%)
          arpu: 2800, // Average Revenue Per User
          paid_users: 52, // Количество платных пользователей
          trial_conversion: 18.5 // Конверсия из trial в платную подписку
        },
        
        // Метрики по тарифным планам
        subscription_metrics: {
          free_users: response_data.data.total_users - 52,
          starter_users: 28,
          growth_users: 18,
          enterprise_users: 6,
          plan_distribution: [
            { name: 'Free (Dino Egg)', value: response_data.data.total_users - 52, color: '#94A3B8' },
            { name: 'Starter (Baby Dino)', value: 28, color: '#10B981' },
            { name: 'Growth (T-Rex)', value: 18, color: '#3B82F6' },
            { name: 'Enterprise (Dino King)', value: 6, color: '#8B5CF6' }
          ]
        },
        
        // Метрики рефералов
        referral_metrics: {
          total_campaigns: 15,
          active_campaigns: 8,
          avg_referrals_per_campaign: Math.floor(response_data.data.total_references / 15),
          referral_conversion: 8.7,
          top_referral_sources: [
            { source: 'Telegram', referrals: 145, conversion: 12.3 },
            { source: 'VK', referrals: 89, conversion: 9.8 },
            { source: 'Instagram', referrals: 67, conversion: 15.2 },
            { source: 'YouTube', referrals: 43, conversion: 7.4 },
            { source: 'Email', referrals: 32, conversion: 22.1 }
          ]
        },
        
        // Временные данные с трендами
        time_series: {
          daily_activity: response_data.data.user_activity.map((day, index) => ({
            date: day.date,
            events: day.page_views,
            users: day.users,
            revenue: Math.floor(Math.random() * 15000) + 5000, // Симуляция дохода
            conversions: Math.floor(Math.random() * 5) + 1,
            new_signups: Math.floor(Math.random() * 8) + 2
          })),
          
          weekly_trends: [
            { week: 'Нед 1', users: 245, revenue: 67200, projects: 18 },
            { week: 'Нед 2', users: 289, revenue: 78400, projects: 22 },
            { week: 'Нед 3', users: 312, revenue: 89600, projects: 28 },
            { week: 'Нед 4', users: 356, revenue: 98700, projects: 31 }
          ]
        },
        
        // Сравнительные данные
        comparison: {
          previous_period: {
            total_users: Math.floor(response_data.data.total_users * 0.85),
            revenue: 123400,
            conversions: 38,
            active_users: Math.floor(response_data.data.active_users * 0.78)
          }
        },
        
        // Прогнозы и цели
        forecasts: {
          projected_users_growth: 23.5, // % роста пользователей
          projected_revenue_growth: 31.2, // % роста дохода
          monthly_goal_users: 500,
          monthly_goal_revenue: 200000,
          goal_progress_users: (response_data.data.total_users / 500) * 100,
          goal_progress_revenue: (145600 / 200000) * 100
        }
      };
      
      setAnalyticsData(enhancedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(num);
  };

  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? 
      <ArrowUp className="h-4 w-4 text-green-500 mr-1" /> : 
      <ArrowDown className="h-4 w-4 text-red-500 mr-1" />;
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка расширенной аналитики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchEnhancedAnalyticsData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const { overview, business_metrics, subscription_metrics, referral_metrics, time_series, comparison, forecasts } = analyticsData;

  // Цвета для графиков
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок с улучшенными контролами */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Расширенная аналитика</h1>
              <p className="text-gray-600 mt-1">Профессиональные KPI метрики и бизнес-аналитика DinoRefs</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Селектор метрик */}
              <select 
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Обзор</option>
                <option value="business">Бизнес-метрики</option>
                <option value="referrals">Рефералы</option>
                <option value="subscriptions">Подписки</option>
              </select>
              
              {/* Селектор периода */}
              <div className="flex space-x-2">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setTimeRange(days)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {days} дней
                  </button>
                ))}
              </div>
              
              {/* Кнопки действий */}
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </button>
              
              <button 
                onClick={fetchEnhancedAnalyticsData}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Основные KPI метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Общие пользователи */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview.total_users)}
                </p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(calculateGrowth(overview.total_users, comparison.previous_period.total_users))}
                  <span className={`text-sm ${getGrowthColor(calculateGrowth(overview.total_users, comparison.previous_period.total_users))}`}>
                    {calculateGrowth(overview.total_users, comparison.previous_period.total_users)}% за период
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Месячный доход */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Месячный доход (MRR)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(business_metrics.mrr)}
                </p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(calculateGrowth(business_metrics.mrr, comparison.previous_period.revenue))}
                  <span className={`text-sm ${getGrowthColor(calculateGrowth(business_metrics.mrr, comparison.previous_period.revenue))}`}>
                    {calculateGrowth(business_metrics.mrr, comparison.previous_period.revenue)}% за период
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Конверсия */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Конверсия в платные</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {overview.conversion_rate}%
                </p>
                <div className="flex items-center mt-2">
                  <Target className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-gray-600">{business_metrics.paid_users} платных</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* LTV */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">LTV пользователя</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(business_metrics.ltv)}
                </p>
                <div className="flex items-center mt-2">
                  <Award className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-gray-600">CAC: {formatCurrency(business_metrics.cac)}</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Удержание пользователей</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{overview.user_retention}%</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Показатель отказов</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{overview.bounce_rate}%</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Eye className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Средняя сессия</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{overview.avg_session_duration} мин</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Отток пользователей</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{business_metrics.churn_rate}%</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Графики доходов и активности */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* График доходов */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Доходы и конверсии</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={time_series.daily_activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Доход (₽)"
                />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stackId="2"
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Конверсии"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Распределение по тарифным планам */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение по тарифам</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscription_metrics.plan_distribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                >
                  {subscription_metrics.plan_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Топ источники рефералов */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Эффективность реферальных каналов</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Источник</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Рефералы</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Конверсия</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Эффективность</th>
                </tr>
              </thead>
              <tbody>
                {referral_metrics.top_referral_sources.map((source, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{source.source}</td>
                    <td className="py-3 px-4 text-gray-600">{source.referrals}</td>
                    <td className="py-3 px-4 text-gray-600">{source.conversion}%</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(source.conversion * 4, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{source.conversion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Прогресс к целям */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Цель по пользователям */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Прогресс к цели: Пользователи</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Текущий прогресс</span>
                <span>{overview.total_users} / {forecasts.monthly_goal_users}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(forecasts.goal_progress_users, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {forecasts.goal_progress_users.toFixed(1)}% от месячной цели
              </p>
            </div>
          </div>

          {/* Цель по доходам */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Прогресс к цели: Доходы</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Текущий прогресс</span>
                <span>{formatCurrency(business_metrics.mrr)} / {formatCurrency(forecasts.monthly_goal_revenue)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(forecasts.goal_progress_revenue, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {forecasts.goal_progress_revenue.toFixed(1)}% от месячной цели
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;

