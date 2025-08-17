import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Gift,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Layout from './Layout';
import { useAuth } from '../hooks/useAuth';

const ReferralAnalytics = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  const [chartType, setChartType] = useState('line'); // line, bar, pie

  useEffect(() => {
    fetchCampaignData();
    fetchAnalytics();
  }, [campaignId, timeRange]);

  const fetchCampaignData = async () => {
    try {
      const data = await apiRequest(`/referrals/campaigns/${campaignId}`);
      setCampaign(data.campaign);
    } catch (error) {
      console.error('Ошибка загрузки кампании:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/referrals/campaigns/${campaignId}/analytics?period=${timeRange}`);
      setAnalytics(data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await apiRequest(`/referrals/campaigns/${campaignId}/export?period=${timeRange}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv'
        }
      });
      
      // Создаем и скачиваем CSV файл
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign_${campaignId}_analytics_${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '7d': return 'Последние 7 дней';
      case '30d': return 'Последние 30 дней';
      case '90d': return 'Последние 90 дней';
      case 'all': return 'Весь период';
      default: return 'Последние 7 дней';
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!campaign || !analytics) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Кампания не найдена</h2>
          <button
            onClick={() => navigate('/referrals')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Вернуться к кампаниям
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/referrals')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Аналитика кампании
              </h1>
              <p className="text-gray-600">{campaign.title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Фильтр периода */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Последние 7 дней</option>
              <option value="30d">Последние 30 дней</option>
              <option value="90d">Последние 90 дней</option>
              <option value="all">Весь период</option>
            </select>
            
            {/* Экспорт данных */}
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Экспорт</span>
            </button>
          </div>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего переходов</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.total_clicks}</p>
              </div>
              <MousePointer className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+{analytics.clicks_growth}%</span>
              <span className="text-gray-500 ml-1">за период</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Конверсии</p>
                <p className="text-2xl font-bold text-green-600">{analytics.total_conversions}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+{analytics.conversions_growth}%</span>
              <span className="text-gray-500 ml-1">за период</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Конверсия</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.conversion_rate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-500">
                {analytics.conversion_rate > analytics.avg_conversion_rate ? 'Выше' : 'Ниже'} среднего
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Награды выданы</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.total_rewards}</p>
              </div>
              <Gift className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-500">
                {analytics.reward_cost} руб. общая стоимость
              </span>
            </div>
          </div>
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* График переходов по времени */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Переходы по дням</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`p-2 rounded ${chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <LineChart className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <RechartsLineChart data={analytics.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => formatDate(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} name="Переходы" />
                  <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} name="Конверсии" />
                </RechartsLineChart>
              ) : (
                <RechartsBarChart data={analytics.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => formatDate(value)} />
                  <Legend />
                  <Bar dataKey="clicks" fill="#3B82F6" name="Переходы" />
                  <Bar dataKey="conversions" fill="#10B981" name="Конверсии" />
                </RechartsBarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Распределение по каналам */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение по каналам</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analytics.channel_stats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="clicks"
                >
                  {analytics.channel_stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Детальная статистика по каналам */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Статистика по каналам</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Канал
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Переходы
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Конверсии
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Конверсия %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Награды
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.channel_stats.map((channel, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-sm font-medium text-gray-900">{channel.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {channel.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {channel.conversions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {channel.conversion_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {channel.rewards}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`${channel.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {channel.roi > 0 ? '+' : ''}{channel.roi}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Топ рефереров */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Топ рефереров</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.top_referrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{referrer.name}</p>
                      <p className="text-sm text-gray-500">{referrer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{referrer.referrals} рефералов</p>
                    <p className="text-sm text-gray-500">{referrer.rewards} наград</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReferralAnalytics;

