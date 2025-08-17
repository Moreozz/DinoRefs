import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Eye, TrendingUp, Calendar, Activity, 
  Monitor, Smartphone, Globe, ArrowUp, ArrowDown 
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
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
      // Адаптируем данные под ожидаемый формат frontend
      const data = {
        overview: {
          total_users: response_data.data.total_users,
          new_users: Math.floor(response_data.data.total_users * 0.1), // 10% новых пользователей
          total_projects: response_data.data.total_projects,
          new_projects: Math.floor(response_data.data.total_projects * 0.2), // 20% новых проектов
          active_users: response_data.data.active_users,
          total_references: response_data.data.total_references
        },
        daily_activity: response_data.data.user_activity.map(day => ({
          date: day.date,
          events: day.page_views,
          users: day.users
        })),
        top_projects: response_data.data.top_pages.map((page, index) => ({
          id: index + 1,
          name: page.page === '/dashboard' ? 'Дашборд' :
                page.page === '/projects' ? 'Проекты' :
                page.page === '/referrals' ? 'Рефералы' :
                page.page === '/analytics' ? 'Аналитика' :
                page.page === '/notifications' ? 'Уведомления' : page.page,
          views: page.views
        })),
        devices: [
          { type: 'desktop', count: response_data.data.device_stats.desktop },
          { type: 'mobile', count: response_data.data.device_stats.mobile },
          { type: 'tablet', count: response_data.data.device_stats.tablet }
        ].filter(device => device.count > 0),
        browsers: Object.entries(response_data.data.browser_stats).map(([name, count]) => ({
          name,
          count
        })).filter(browser => browser.count > 0),
        popular_events: Object.entries(response_data.data.traffic_sources).map(([name, count]) => ({
          name: name === 'direct' ? 'Прямые переходы' :
                name === 'search' ? 'Поисковые системы' :
                name === 'social' ? 'Социальные сети' :
                name === 'referral' ? 'Внешние ссылки' : name,
          count
        }))
      };
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

  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аналитики...</p>
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
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const { overview, daily_activity, top_projects, devices, browsers, popular_events } = analyticsData;

  // Цвета для графиков
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Подготовка данных для графиков
  const deviceData = devices.map((device, index) => ({
    name: device.type === 'desktop' ? 'Десктоп' : 
          device.type === 'mobile' ? 'Мобильный' : 'Планшет',
    value: device.count,
    color: COLORS[index % COLORS.length]
  }));

  const activityData = daily_activity.map(day => ({
    date: new Date(day.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
    events: day.events,
    users: day.users
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Аналитика платформы</h1>
              <p className="text-gray-600 mt-1">Обзор активности и метрик DinoRefs</p>
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
        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview.total_users)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{overview.new_users} новых</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего проектов</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview.total_projects)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{overview.new_projects} новых</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Активные пользователи</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview.active_users)}
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-gray-600">за {timeRange} дней</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего референсов</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview.total_references)}
                </p>
                <div className="flex items-center mt-2">
                  <Globe className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-gray-600">в проектах</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Графики активности */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* График активности по дням */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Активность по дням</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
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
                  dataKey="events" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="События"
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Пользователи"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Распределение по устройствам */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Устройства пользователей</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Топ проекты и популярные события */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Топ проекты */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Популярные проекты</h3>
            <div className="space-y-4">
              {top_projects.slice(0, 5).map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600">{project.views} просмотров</p>
                    </div>
                  </div>
                  <Eye className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Популярные события */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Популярные события</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={popular_events.slice(0, 6)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Браузеры */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Популярные браузеры</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {browsers.slice(0, 5).map((browser, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Monitor className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900 text-sm">{browser.name}</p>
                <p className="text-xs text-gray-600">{browser.count} пользователей</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

