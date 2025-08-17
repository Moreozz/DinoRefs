import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, UserPlus, Activity, TrendingUp, Clock, 
  Target, Filter, Download, Calendar, Eye, Heart
} from 'lucide-react';

const UserAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserAnalytics();
  }, [timeRange, selectedSegment]);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/users?days=${timeRange}&segment=${selectedSegment}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки пользовательской аналитики');
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

  const calculateRetentionRate = (newUsers, activeUsers) => {
    if (!newUsers || newUsers === 0) return 0;
    return Math.round((activeUsers / newUsers) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка пользовательской аналитики...</p>
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
            onClick={fetchUserAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const { daily_registrations, user_activity, segments } = analyticsData;

  // Цвета для графиков
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Подготовка данных для графиков
  const registrationData = daily_registrations.map(day => ({
    date: formatDate(day.date),
    registrations: day.registrations
  }));

  // Сегменты пользователей
  const segmentData = [
    { name: 'Новые пользователи', value: segments.new_users, color: COLORS[0] },
    { name: 'Активные пользователи', value: segments.active_users, color: COLORS[1] },
    { name: 'Создатели контента', value: segments.creators, color: COLORS[2] }
  ];

  // Активность пользователей по уровням
  const activityLevels = user_activity.reduce((acc, user) => {
    if (user.events === 0) acc.inactive++;
    else if (user.events <= 10) acc.low++;
    else if (user.events <= 50) acc.medium++;
    else acc.high++;
    return acc;
  }, { inactive: 0, low: 0, medium: 0, high: 0 });

  const activityData = [
    { name: 'Неактивные', value: activityLevels.inactive, color: COLORS[3] },
    { name: 'Низкая активность', value: activityLevels.low, color: COLORS[4] },
    { name: 'Средняя активность', value: activityLevels.medium, color: COLORS[1] },
    { name: 'Высокая активность', value: activityLevels.high, color: COLORS[0] }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Пользовательская аналитика</h1>
              <p className="text-gray-600 mt-1">Анализ поведения и сегментация пользователей</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Селектор сегмента */}
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все пользователи</option>
                <option value="new">Новые пользователи</option>
                <option value="active">Активные пользователи</option>
                <option value="creators">Создатели контента</option>
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
                <p className="text-sm font-medium text-gray-600">Новые пользователи</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(segments.new_users)}
                </p>
                <p className="text-sm text-gray-500 mt-1">за {timeRange} дней</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Активные пользователи</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(segments.active_users)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {calculateRetentionRate(segments.new_users, segments.active_users)}% retention
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Создатели контента</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(segments.creators)}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  {segments.active_users > 0 ? 
                    Math.round((segments.creators / segments.active_users) * 100) : 0}% от активных
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Средняя активность</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {user_activity.length > 0 ? 
                    Math.round(user_activity.reduce((sum, u) => sum + u.events, 0) / user_activity.length) : 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">событий на пользователя</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Регистрации по дням */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Регистрации по дням</h3>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="h-4 w-4 mr-2 inline" />
              Экспорт
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={registrationData}>
              <defs>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
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
              <Area 
                type="monotone" 
                dataKey="registrations" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorRegistrations)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Сегментация и активность */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Сегменты пользователей */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Сегменты пользователей</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Уровни активности */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Уровни активности</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
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
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Топ активные пользователи */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Топ активные пользователи</h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Последние {timeRange} дней</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    События
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Последняя активность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {user_activity.slice(0, 10).map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-semibold text-blue-600">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.events}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_activity ? 
                        new Date(user.last_activity).toLocaleDateString('ru-RU') : 
                        'Никогда'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.events > 50 ? 'bg-green-100 text-green-800' :
                        user.events > 10 ? 'bg-yellow-100 text-yellow-800' :
                        user.events > 0 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.events > 50 ? 'Высокая активность' :
                         user.events > 10 ? 'Средняя активность' :
                         user.events > 0 ? 'Низкая активность' :
                         'Неактивен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights и рекомендации */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ключевые инсайты */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ключевые инсайты</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm font-medium text-blue-800">
                    Retention Rate: {calculateRetentionRate(segments.new_users, segments.active_users)}%
                  </p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {calculateRetentionRate(segments.new_users, segments.active_users) > 50 ? 
                    'Отличный показатель удержания пользователей' :
                    'Есть возможности для улучшения удержания'
                  }
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-green-800">
                    Создатели контента: {Math.round((segments.creators / segments.active_users) * 100)}%
                  </p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {(segments.creators / segments.active_users) > 0.1 ? 
                    'Высокий процент создателей контента' :
                    'Можно стимулировать создание контента'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Рекомендации */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Рекомендации</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-orange-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Улучшить онбординг</p>
                  <p className="text-sm text-gray-600">
                    Создать интерактивное введение для новых пользователей
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Стимулировать активность</p>
                  <p className="text-sm text-gray-600">
                    Внедрить систему достижений и уведомлений
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-green-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Развивать сообщество</p>
                  <p className="text-sm text-gray-600">
                    Создать инструменты для взаимодействия между пользователями
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;

