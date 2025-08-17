import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Eye, Users, Clock, TrendingUp, ArrowLeft, Calendar,
  Globe, Monitor, Share2, Heart, MessageCircle, Download
} from 'lucide-react';

const ProjectAnalytics = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectAnalytics();
  }, [projectId, timeRange]);

  const fetchProjectAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/project/${projectId}?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки аналитики проекта');
      }

      const data = await response.json();
      setAnalyticsData(data);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аналитики проекта...</p>
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
            onClick={fetchProjectAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const { project, metrics, daily_views, referrers, countries } = analyticsData;

  // Цвета для графиков
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Подготовка данных для графиков
  const viewsData = daily_views.map(day => ({
    date: formatDate(day.date),
    views: day.views,
    unique_users: day.unique_users
  }));

  const referrerData = referrers.slice(0, 5).map((ref, index) => ({
    name: ref.url ? new URL(ref.url).hostname : 'Прямой переход',
    value: ref.count,
    color: COLORS[index % COLORS.length]
  }));

  const countryData = countries.slice(0, 8).map((country, index) => ({
    name: country.country || 'Неизвестно',
    count: country.count,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/analytics')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Аналитика проекта</h1>
                <p className="text-gray-600 mt-1">{project.name}</p>
              </div>
            </div>
            
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Информация о проекте */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h2>
              <p className="text-gray-600 mb-4">
                Создан {new Date(project.created_at).toLocaleDateString('ru-RU')}
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Отслеживается {timeRange} дней
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="h-4 w-4 mr-2 inline" />
                Экспорт
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Share2 className="h-4 w-4 mr-2 inline" />
                Поделиться
              </button>
            </div>
          </div>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего просмотров</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(metrics.total_views)}
                </p>
                <p className="text-sm text-gray-500 mt-1">за {timeRange} дней</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Уникальные зрители</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(metrics.unique_viewers)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {metrics.total_views > 0 ? 
                    Math.round((metrics.unique_viewers / metrics.total_views) * 100) : 0}% от общих
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Среднее время</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.round(metrics.avg_session_duration || 0)}с
                </p>
                <p className="text-sm text-gray-500 mt-1">на странице</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Вовлеченность</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics.total_views > 0 ? 
                    Math.round((metrics.unique_viewers / metrics.total_views) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">показатель</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* График просмотров по дням */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Просмотры по дням</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Всего просмотров"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="unique_users" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Уникальные пользователи"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Источники трафика и география */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Источники трафика */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Источники трафика</h3>
            {referrerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={referrerData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {referrerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Нет данных о источниках трафика</p>
                </div>
              </div>
            )}
          </div>

          {/* География пользователей */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">География пользователей</h3>
            {countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Нет данных о географии</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Детальная статистика */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Детальная статистика</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Топ источники */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Топ источники переходов</h4>
              <div className="space-y-3">
                {referrers.slice(0, 5).map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {referrer.url ? new URL(referrer.url).hostname : 'Прямой переход'}
                        </p>
                        <p className="text-xs text-gray-600">{referrer.count} переходов</p>
                      </div>
                    </div>
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Топ страны */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Топ страны</h4>
              <div className="space-y-3">
                {countries.slice(0, 5).map((country, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {country.country || 'Неизвестно'}
                        </p>
                        <p className="text-xs text-gray-600">{country.count} пользователей</p>
                      </div>
                    </div>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;

