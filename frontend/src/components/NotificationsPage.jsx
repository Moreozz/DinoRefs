import React, { useState, useEffect } from 'react';
import { Bell, Filter, Search, Check, CheckCheck, Trash2, RefreshCw, Settings } from 'lucide-react';
import Layout from './Layout';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_count: 0, unread_count: 0 });
  const [filters, setFilters] = useState({
    unread_only: false,
    type: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });

  // Типы уведомлений для фильтра
  const notificationTypes = [
    { value: '', label: 'Все типы' },
    { value: 'project_invitation', label: 'Приглашения в проекты' },
    { value: 'project_shared', label: 'Поделенные проекты' },
    { value: 'project_liked', label: 'Лайки проектов' },
    { value: 'project_commented', label: 'Комментарии' },
    { value: 'referral_reward', label: 'Награды за рефералов' },
    { value: 'referral_conversion', label: 'Конверсии рефералов' },
    { value: 'system_announcement', label: 'Системные объявления' },
    { value: 'account_security', label: 'Безопасность аккаунта' }
  ];

  // Загрузка уведомлений
  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString(),
        ...(filters.unread_only && { unread_only: 'true' }),
        ...(filters.type && { type: filters.type })
      });
      
      const response = await fetch(`/api/notifications/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination || {});
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики
  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notifications/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  // Отметить уведомление как прочитанное
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/notifications/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        loadStats(); // Обновляем статистику
      }
    } catch (error) {
      console.error('Ошибка отметки как прочитанное:', error);
    }
  };

  // Отметить все как прочитанные
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notifications/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        loadStats(); // Обновляем статистику
      }
    } catch (error) {
      console.error('Ошибка отметки всех как прочитанные:', error);
    }
  };

  // Удалить уведомление
  const deleteNotification = async (notificationId) => {
    if (!confirm('Вы уверены, что хотите удалить это уведомление?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/notifications/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        loadStats(); // Обновляем статистику
      }
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  };

  // Обработка изменения фильтров
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Применение фильтров
  useEffect(() => {
    loadNotifications(1);
  }, [filters]);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadNotifications();
    loadStats();
  }, []);

  // Форматирование времени
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Получить иконку для типа уведомления
  const getNotificationIcon = (type) => {
    const iconMap = {
      'project_invitation': '👥',
      'project_shared': '📤',
      'project_liked': '👍',
      'project_commented': '💬',
      'referral_reward': '🎉',
      'referral_conversion': '📈',
      'system_announcement': '📢',
      'account_security': '🔒'
    };
    return iconMap[type] || '📋';
  };

  // Получить цвет приоритета
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3: return 'border-l-red-500';
      case 2: return 'border-l-blue-500';
      case 1: return 'border-l-gray-500';
      default: return 'border-l-gray-500';
    }
  };

  // Фильтрация уведомлений по поиску
  const filteredNotifications = notifications.filter(notification => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      notification.title.toLowerCase().includes(searchLower) ||
      notification.message.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="text-blue-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
              <p className="text-gray-600">
                Всего: {stats.total_count}, непрочитанных: {stats.unread_count}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadNotifications(pagination.page)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              <span>Обновить</span>
            </button>
            <a
              href="/notifications/settings"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings size={16} />
              <span>Настройки</span>
            </a>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Filter size={20} className="text-gray-500" />
            <span className="font-medium text-gray-700">Фильтры:</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Поиск */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по уведомлениям..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Тип уведомления */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Только непрочитанные */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.unread_only}
                onChange={(e) => handleFilterChange('unread_only', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Только непрочитанные</span>
            </label>
          </div>

          {/* Действия */}
          {stats.unread_count > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCheck size={16} />
                <span>Отметить все как прочитанные</span>
              </button>
            </div>
          )}
        </div>

        {/* Список уведомлений */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Загрузка уведомлений...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уведомлений</h3>
              <p className="text-gray-500">
                {filters.unread_only || filters.type || filters.search
                  ? 'Попробуйте изменить фильтры'
                  : 'У вас пока нет уведомлений'
                }
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`border-l-4 p-6 ${
                    index !== filteredNotifications.length - 1 ? 'border-b border-gray-100' : ''
                  } ${
                    !notification.is_read ? 'bg-blue-50 border-l-blue-500' : `bg-white ${getPriorityColor(notification.priority)}`
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <span>Перейти</span>
                          <span>→</span>
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Check size={14} />
                          <span>Прочитано</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Пагинация */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Показано {((pagination.page - 1) * pagination.per_page) + 1}-{Math.min(pagination.page * pagination.per_page, pagination.total)} из {pagination.total}
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadNotifications(pagination.page - 1)}
                disabled={!pagination.has_prev}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              
              <span className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                {pagination.page}
              </span>
              
              <button
                onClick={() => loadNotifications(pagination.page + 1)}
                disabled={!pagination.has_next}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Далее
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;

