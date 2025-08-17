import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, Check, X, AlertCircle } from 'lucide-react';
import pushNotificationService from '../services/pushNotificationService';
import { showSuccessToast, showErrorToast, showWarningToast } from './NotificationToast';

const PushNotificationManager = ({ className = '' }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Проверка поддержки и текущего статуса
  useEffect(() => {
    const checkSupport = () => {
      const supported = pushNotificationService.isNotificationSupported();
      const currentPermission = pushNotificationService.getPermissionStatus();
      
      setIsSupported(supported);
      setPermission(currentPermission);
      setIsEnabled(currentPermission === 'granted');
    };

    checkSupport();
    
    // Обновляем статус при изменении видимости страницы
    document.addEventListener('visibilitychange', checkSupport);
    
    return () => {
      document.removeEventListener('visibilitychange', checkSupport);
    };
  }, []);

  // Включить push-уведомления
  const enableNotifications = async () => {
    if (!isSupported) {
      showErrorToast(
        'Не поддерживается',
        'Ваш браузер не поддерживает push-уведомления'
      );
      return;
    }

    setLoading(true);
    
    try {
      const newPermission = await pushNotificationService.requestPermission();
      
      if (newPermission === 'granted') {
        setPermission('granted');
        setIsEnabled(true);
        
        showSuccessToast(
          'Уведомления включены!',
          'Теперь вы будете получать push-уведомления'
        );
        
        // Показываем тестовое уведомление
        setTimeout(() => {
          pushNotificationService.showNotification(
            'DinoRefs уведомления включены!',
            {
              body: 'Вы будете получать уведомления о новых событиях',
              icon: '/favicon.ico',
              tag: 'welcome-notification'
            }
          );
        }, 1000);
        
      } else {
        showWarningToast(
          'Разрешение отклонено',
          'Вы отклонили разрешение на уведомления'
        );
      }
    } catch (error) {
      console.error('Ошибка включения уведомлений:', error);
      showErrorToast(
        'Ошибка',
        'Не удалось включить push-уведомления'
      );
    } finally {
      setLoading(false);
    }
  };

  // Отключить push-уведомления (показать инструкцию)
  const disableNotifications = () => {
    showWarningToast(
      'Отключение уведомлений',
      'Чтобы отключить уведомления, используйте настройки браузера',
      {
        duration: 8000,
        actionButton: (
          <button
            onClick={() => window.open('/notifications/settings', '_blank')}
            className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
          >
            Настройки уведомлений
          </button>
        )
      }
    );
  };

  // Показать тестовое уведомление
  const showTestNotification = () => {
    if (permission !== 'granted') {
      showWarningToast(
        'Нет разрешения',
        'Сначала включите push-уведомления'
      );
      return;
    }

    pushNotificationService.showNotification(
      'Тестовое уведомление',
      {
        body: 'Это тестовое уведомление от DinoRefs',
        icon: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false
      }
    );

    showSuccessToast(
      'Тестовое уведомление отправлено',
      'Проверьте область уведомлений'
    );
  };

  // Получить статус и иконку
  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        icon: <BellOff className="text-gray-400" size={20} />,
        text: 'Не поддерживается',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100'
      };
    }

    switch (permission) {
      case 'granted':
        return {
          icon: <Bell className="text-green-600" size={20} />,
          text: 'Включены',
          color: 'text-green-700',
          bgColor: 'bg-green-100'
        };
      case 'denied':
        return {
          icon: <BellOff className="text-red-600" size={20} />,
          text: 'Отклонены',
          color: 'text-red-700',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: <Bell className="text-yellow-600" size={20} />,
          text: 'Не настроены',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {statusInfo.icon}
          <div>
            <h3 className="font-medium text-gray-900">Push-уведомления</h3>
            <p className={`text-sm ${statusInfo.color}`}>
              Статус: {statusInfo.text}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
          {statusInfo.text}
        </div>
      </div>

      {/* Описание */}
      <p className="text-sm text-gray-600 mb-4">
        Получайте мгновенные уведомления о новых приглашениях в проекты, 
        лайках, комментариях и других важных событиях прямо в браузере.
      </p>

      {/* Кнопки управления */}
      <div className="flex items-center space-x-3">
        {!isSupported ? (
          <div className="flex items-center space-x-2 text-gray-500">
            <AlertCircle size={16} />
            <span className="text-sm">Браузер не поддерживает уведомления</span>
          </div>
        ) : permission === 'granted' ? (
          <>
            <button
              onClick={showTestNotification}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Bell size={16} />
              <span>Тест</span>
            </button>
            
            <button
              onClick={disableNotifications}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings size={16} />
              <span>Настройки</span>
            </button>
          </>
        ) : permission === 'denied' ? (
          <div className="flex items-center space-x-2 text-red-600">
            <X size={16} />
            <span className="text-sm">
              Разрешение отклонено. Включите в настройках браузера.
            </span>
          </div>
        ) : (
          <button
            onClick={enableNotifications}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Check size={16} />
            )}
            <span>{loading ? 'Включение...' : 'Включить уведомления'}</span>
          </button>
        )}
      </div>

      {/* Дополнительная информация */}
      {permission === 'default' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Bell className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Преимущества push-уведомлений:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Мгновенные уведомления о новых событиях</li>
                <li>Работают даже когда сайт закрыт</li>
                <li>Можно настроить типы уведомлений</li>
                <li>Легко отключить в любой момент</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Как включить уведомления:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Нажмите на иконку замка в адресной строке</li>
                <li>Найдите настройку "Уведомления"</li>
                <li>Выберите "Разрешить"</li>
                <li>Обновите страницу</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PushNotificationManager;

