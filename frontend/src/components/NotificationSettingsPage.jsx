import React, { useState, useEffect } from 'react';
import { Settings, Bell, Mail, Smartphone, Monitor, Save, RefreshCw, Clock, Globe } from 'lucide-react';
import Layout from './Layout';
import PushNotificationManager from './PushNotificationManager';
import { showSuccessToast, showErrorToast } from './NotificationToast';

const NotificationSettingsPage = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Типы уведомлений с описаниями
  const notificationTypes = [
    {
      key: 'project_invitation',
      title: 'Приглашения в проекты',
      description: 'Уведомления о приглашениях присоединиться к проектам',
      icon: '👥'
    },
    {
      key: 'project_shared',
      title: 'Поделенные проекты',
      description: 'Когда кто-то делится с вами проектом',
      icon: '📤'
    },
    {
      key: 'project_liked',
      title: 'Лайки проектов',
      description: 'Когда кто-то ставит лайк вашему проекту',
      icon: '👍'
    },
    {
      key: 'project_commented',
      title: 'Комментарии к проектам',
      description: 'Новые комментарии к вашим проектам',
      icon: '💬'
    },
    {
      key: 'referral_reward',
      title: 'Награды за рефералов',
      description: 'Уведомления о получении наград за привлечение рефералов',
      icon: '🎉'
    },
    {
      key: 'referral_conversion',
      title: 'Конверсии рефералов',
      description: 'Информация о конверсиях в ваших реферальных кампаниях',
      icon: '📈'
    },
    {
      key: 'system_announcement',
      title: 'Системные объявления',
      description: 'Важные объявления и обновления платформы',
      icon: '📢'
    },
    {
      key: 'account_security',
      title: 'Безопасность аккаунта',
      description: 'Уведомления о событиях безопасности вашего аккаунта',
      icon: '🔒'
    }
  ];

  // Каналы уведомлений
  const channels = [
    {
      key: 'in_app',
      title: 'В приложении',
      description: 'Уведомления внутри платформы',
      icon: <Monitor size={20} />
    },
    {
      key: 'email',
      title: 'Email',
      description: 'Уведомления на электронную почту',
      icon: <Mail size={20} />
    },
    {
      key: 'push',
      title: 'Push-уведомления',
      description: 'Уведомления в браузере',
      icon: <Smartphone size={20} />
    }
  ];

  // Частота email уведомлений
  const emailFrequencies = [
    { value: 'immediate', label: 'Немедленно' },
    { value: 'daily', label: 'Ежедневно' },
    { value: 'weekly', label: 'Еженедельно' }
  ];

  // Часовые пояса (основные)
  const timezones = [
    { value: 'UTC', label: 'UTC (Всемирное время)' },
    { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
    { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
    { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
    { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
    { value: 'Europe/Minsk', label: 'Минск (UTC+3)' }
  ];

  // Загрузка настроек
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        showErrorToast('Ошибка', 'Не удалось загрузить настройки');
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      showErrorToast('Ошибка', 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  // Сохранение настроек
  const savePreferences = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        setHasChanges(false);
        showSuccessToast('Сохранено', 'Настройки уведомлений обновлены');
      } else {
        showErrorToast('Ошибка', 'Не удалось сохранить настройки');
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      showErrorToast('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  // Обновление настройки для типа уведомления и канала
  const updatePreference = (notificationType, channel, enabled) => {
    setPreferences(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [notificationType]: {
          ...prev.preferences[notificationType],
          [channel]: enabled
        }
      }
    }));
    setHasChanges(true);
  };

  // Обновление общих настроек
  const updateSetting = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // Включить/выключить все уведомления для типа
  const toggleAllForType = (notificationType, enabled) => {
    channels.forEach(channel => {
      updatePreference(notificationType, channel.key, enabled);
    });
  };

  // Включить/выключить все уведомления для канала
  const toggleAllForChannel = (channelKey, enabled) => {
    notificationTypes.forEach(type => {
      updatePreference(type.key, channelKey, enabled);
    });
  };

  // Загрузка при монтировании
  useEffect(() => {
    loadPreferences();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!preferences) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Settings className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Не удалось загрузить настройки
            </h2>
            <button
              onClick={loadPreferences}
              className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Попробовать снова</span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="text-blue-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Настройки уведомлений</h1>
              <p className="text-gray-600">
                Управляйте тем, как и когда вы получаете уведомления
              </p>
            </div>
          </div>
          
          {hasChanges && (
            <button
              onClick={savePreferences}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              <span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Push-уведомления */}
          <PushNotificationManager />

          {/* Настройки по типам уведомлений */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Типы уведомлений
              </h2>
              <p className="text-gray-600">
                Выберите, какие уведомления вы хотите получать и через какие каналы
              </p>
            </div>

            {/* Заголовки колонок */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <span className="text-sm font-medium text-gray-700">Тип уведомления</span>
                </div>
                {channels.map(channel => (
                  <div key={channel.key} className="col-span-2 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {channel.icon}
                      <span className="text-sm font-medium text-gray-700">{channel.title}</span>
                    </div>
                    <button
                      onClick={() => {
                        const allEnabled = notificationTypes.every(type => 
                          preferences.preferences[type.key]?.[channel.key]
                        );
                        toggleAllForChannel(channel.key, !allEnabled);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      Все
                    </button>
                  </div>
                ))}
                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium text-gray-700">Все</span>
                </div>
              </div>
            </div>

            {/* Строки с настройками */}
            <div className="divide-y divide-gray-200">
              {notificationTypes.map(type => (
                <div key={type.key} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{type.icon}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{type.title}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {channels.map(channel => (
                      <div key={channel.key} className="col-span-2 text-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={preferences.preferences[type.key]?.[channel.key] || false}
                            onChange={(e) => updatePreference(type.key, channel.key, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    ))}
                    
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => {
                          const allEnabled = channels.every(channel => 
                            preferences.preferences[type.key]?.[channel.key]
                          );
                          toggleAllForType(type.key, !allEnabled);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {channels.every(channel => preferences.preferences[type.key]?.[channel.key]) ? 'Выкл' : 'Вкл'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Общие настройки */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Общие настройки
              </h2>
              <p className="text-gray-600">
                Настройте частоту и время доставки уведомлений
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Частота email уведомлений */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Частота email уведомлений
                </label>
                <select
                  value={preferences.settings?.email_frequency || 'immediate'}
                  onChange={(e) => updateSetting('email_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {emailFrequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Как часто группировать email уведомления
                </p>
              </div>

              {/* Тихие часы */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline mr-2" size={16} />
                    Тихие часы (начало)
                  </label>
                  <input
                    type="time"
                    value={preferences.settings?.quiet_hours_start || ''}
                    onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тихие часы (конец)
                  </label>
                  <input
                    type="time"
                    value={preferences.settings?.quiet_hours_end || ''}
                    onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                В это время push-уведомления будут отключены
              </p>

              {/* Часовой пояс */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="inline mr-2" size={16} />
                  Часовой пояс
                </label>
                <select
                  value={preferences.settings?.timezone || 'UTC'}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Используется для расчета тихих часов и планирования уведомлений
                </p>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-between">
            <button
              onClick={loadPreferences}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Сбросить изменения</span>
            </button>

            <button
              onClick={savePreferences}
              disabled={!hasChanges || saving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              <span>{saving ? 'Сохранение...' : 'Сохранить настройки'}</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationSettingsPage;

