import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Calendar, Filter, Download, TrendingUp, Users, DollarSign,
  Eye, Target, Zap, Clock, ArrowUp, ArrowDown, BarChart3
} from 'lucide-react';
import ExportReportsModal from './ExportReportsModal';

const InteractiveAnalyticsCharts = () => {
  const [selectedChart, setSelectedChart] = useState('revenue_trends');
  const [dateRange, setDateRange] = useState('30');
  const [selectedProjects, setSelectedProjects] = useState(['all']);
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'users', 'conversions']);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Типы графиков
  const chartTypes = [
    { id: 'revenue_trends', name: 'Тренды доходов', icon: DollarSign },
    { id: 'user_growth', name: 'Рост пользователей', icon: Users },
    { id: 'conversion_funnel', name: 'Воронка конверсий', icon: Target },
    { id: 'engagement_metrics', name: 'Метрики вовлеченности', icon: Zap },
    { id: 'project_performance', name: 'Эффективность проектов', icon: BarChart3 },
    { id: 'cohort_analysis', name: 'Когортный анализ', icon: TrendingUp }
  ];

  // Доступные метрики
  const availableMetrics = [
    { id: 'revenue', name: 'Доходы', color: '#10B981' },
    { id: 'users', name: 'Пользователи', color: '#3B82F6' },
    { id: 'conversions', name: 'Конверсии', color: '#F59E0B' },
    { id: 'sessions', name: 'Сессии', color: '#8B5CF6' },
    { id: 'pageviews', name: 'Просмотры', color: '#EF4444' },
    { id: 'retention', name: 'Удержание', color: '#06B6D4' }
  ];

  // Проекты для фильтрации
  const availableProjects = [
    { id: 'all', name: 'Все проекты' },
    { id: 'project_1', name: 'Проект для тестирования редактирования' },
    { id: 'project_2', name: 'Тестовый проект после исправлений' }
  ];

  useEffect(() => {
    generateChartData();
  }, [selectedChart, dateRange, selectedProjects, selectedMetrics, comparisonMode]);

  const generateChartData = () => {
    setLoading(true);
    
    // Симуляция загрузки данных
    setTimeout(() => {
      const data = generateDataForChart(selectedChart);
      setChartData(data);
      setLoading(false);
    }, 500);
  };

  const generateDataForChart = (chartType) => {
    const days = parseInt(dateRange);
    const baseData = [];
    
    // Генерируем данные за выбранный период
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayData = {
        date: date.toISOString().split('T')[0],
        dateFormatted: date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 15000) + 5000,
        users: Math.floor(Math.random() * 50) + 20,
        conversions: Math.floor(Math.random() * 8) + 2,
        sessions: Math.floor(Math.random() * 200) + 100,
        pageviews: Math.floor(Math.random() * 500) + 200,
        retention: Math.random() * 30 + 60
      };
      
      baseData.push(dayData);
    }

    switch (chartType) {
      case 'revenue_trends':
        return {
          type: 'area',
          data: baseData,
          title: 'Тренды доходов по дням',
          description: 'Динамика доходов и связанных метрик'
        };
        
      case 'user_growth':
        return {
          type: 'line',
          data: baseData.map((item, index) => ({
            ...item,
            cumulative_users: baseData.slice(0, index + 1).reduce((sum, d) => sum + d.users, 0),
            new_users: item.users,
            returning_users: Math.floor(item.users * 0.7)
          })),
          title: 'Рост пользовательской базы',
          description: 'Новые и возвращающиеся пользователи'
        };
        
      case 'conversion_funnel':
        return {
          type: 'funnel',
          data: [
            { stage: 'Посетители', value: 1000, percentage: 100 },
            { stage: 'Регистрации', value: 250, percentage: 25 },
            { stage: 'Активация', value: 180, percentage: 18 },
            { stage: 'Первая покупка', value: 45, percentage: 4.5 },
            { stage: 'Повторная покупка', value: 28, percentage: 2.8 }
          ],
          title: 'Воронка конверсий',
          description: 'Путь пользователя от посещения до покупки'
        };
        
      case 'engagement_metrics':
        return {
          type: 'radar',
          data: [
            {
              metric: 'Время на сайте',
              current: 85,
              previous: 78,
              target: 90
            },
            {
              metric: 'Глубина просмотра',
              current: 72,
              previous: 68,
              target: 80
            },
            {
              metric: 'Частота возвратов',
              current: 65,
              previous: 60,
              target: 75
            },
            {
              metric: 'Социальные действия',
              current: 58,
              previous: 52,
              target: 70
            },
            {
              metric: 'Завершение целей',
              current: 78,
              previous: 75,
              target: 85
            }
          ],
          title: 'Метрики вовлеченности',
          description: 'Сравнение текущих показателей с целевыми'
        };
        
      case 'project_performance':
        return {
          type: 'scatter',
          data: [
            { project: 'Проект A', users: 120, revenue: 15600, conversion: 12.5 },
            { project: 'Проект B', users: 89, revenue: 11200, conversion: 8.7 },
            { project: 'Проект C', users: 156, revenue: 22400, conversion: 15.2 },
            { project: 'Проект D', users: 67, revenue: 8900, conversion: 6.3 },
            { project: 'Проект E', users: 203, revenue: 28700, conversion: 18.9 }
          ],
          title: 'Эффективность проектов',
          description: 'Соотношение пользователей, доходов и конверсии'
        };
        
      case 'cohort_analysis':
        return {
          type: 'heatmap',
          data: generateCohortData(),
          title: 'Когортный анализ удержания',
          description: 'Удержание пользователей по когортам'
        };
        
      default:
        return { type: 'area', data: baseData, title: 'Базовая аналитика' };
    }
  };

  const generateCohortData = () => {
    const cohorts = [];
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
    
    months.forEach((month, monthIndex) => {
      const cohortData = { cohort: month };
      for (let week = 0; week < 12; week++) {
        const retention = Math.max(0, 100 - (week * 8) - Math.random() * 20);
        cohortData[`week_${week}`] = Math.round(retention);
      }
      cohorts.push(cohortData);
    });
    
    return cohorts;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!chartData) return null;

    const { type, data, title } = chartData;

    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dateFormatted" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {selectedMetrics.map((metric) => {
                const metricInfo = availableMetrics.find(m => m.id === metric);
                return (
                  <Area
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stackId="1"
                    stroke={metricInfo?.color}
                    fill={metricInfo?.color}
                    fillOpacity={0.6}
                    name={metricInfo?.name}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dateFormatted" stroke="#6b7280" />
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
                dataKey="cumulative_users" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Всего пользователей"
              />
              <Line 
                type="monotone" 
                dataKey="new_users" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Новые пользователи"
              />
              <Line 
                type="monotone" 
                dataKey="returning_users" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Возвращающиеся"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'funnel':
        return (
          <div className="space-y-4">
            {data.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{stage.stage}</span>
                  <span className="text-sm text-gray-600">{stage.value} ({stage.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
                    style={{ width: `${stage.percentage}%` }}
                  >
                    {stage.percentage}%
                  </div>
                </div>
                {index < data.length - 1 && (
                  <div className="flex justify-center mt-2">
                    <ArrowDown className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar 
                name="Текущий период" 
                dataKey="current" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar 
                name="Предыдущий период" 
                dataKey="previous" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar 
                name="Цель" 
                dataKey="target" 
                stroke="#F59E0B" 
                fill="none" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="users" 
                name="Пользователи" 
                stroke="#6b7280"
              />
              <YAxis 
                dataKey="revenue" 
                name="Доходы" 
                stroke="#6b7280"
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? `${value}₽` : value,
                  name === 'revenue' ? 'Доходы' : 'Пользователи'
                ]}
              />
              <Scatter 
                name="Проекты" 
                dataKey="revenue" 
                fill="#3B82F6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'heatmap':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">Когорта</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="px-2 py-2 text-center font-medium text-gray-900 text-sm">
                      {i}н
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((cohort, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 font-medium text-gray-900">{cohort.cohort}</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const value = cohort[`week_${i}`];
                      const intensity = value / 100;
                      return (
                        <td 
                          key={i} 
                          className="px-2 py-2 text-center text-sm"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                            color: intensity > 0.5 ? 'white' : 'black'
                          }}
                        >
                          {value}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <div>Тип графика не поддерживается</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Интерактивные графики</h1>
              <p className="text-gray-600 mt-1">Детальный анализ с фильтрами и сравнениями</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Экспорт графика
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Панель фильтров */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Фильтры и настройки</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Тип графика */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип анализа</label>
              <select 
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {chartTypes.map(chart => (
                  <option key={chart.id} value={chart.id}>{chart.name}</option>
                ))}
              </select>
            </div>
            
            {/* Период */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Временной период</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">7 дней</option>
                <option value="30">30 дней</option>
                <option value="90">90 дней</option>
                <option value="365">1 год</option>
              </select>
            </div>
            
            {/* Проекты */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Проекты</label>
              <select 
                value={selectedProjects[0]}
                onChange={(e) => setSelectedProjects([e.target.value])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {availableProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            {/* Режим сравнения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сравнение</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">С предыдущим периодом</span>
              </div>
            </div>
          </div>
          
          {/* Выбор метрик */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Отображаемые метрики</label>
            <div className="flex flex-wrap gap-3">
              {availableMetrics.map(metric => (
                <label key={metric.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMetrics([...selectedMetrics, metric.id]);
                      } else {
                        setSelectedMetrics(selectedMetrics.filter(m => m !== metric.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span 
                    className="ml-2 text-sm font-medium"
                    style={{ color: metric.color }}
                  >
                    {metric.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* График */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {chartData?.title || 'График'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {chartData?.description || 'Интерактивный анализ данных'}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Период: {dateRange} дней</span>
              {comparisonMode && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Сравнение включено
                </span>
              )}
            </div>
          </div>
          
          {renderChart()}
        </div>
      </div>

      {/* Модальное окно экспорта */}
      <ExportReportsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportType={selectedChart}
        dateRange={dateRange}
        selectedMetrics={selectedMetrics}
      />
    </div>
  );
};

export default InteractiveAnalyticsCharts;

