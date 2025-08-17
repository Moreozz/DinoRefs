import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationToast = ({ 
  id,
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose,
  actionButton = null
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Автоматическое закрытие
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose(id);
    }, 300);
  };

  // Получить стили для типа уведомления
  const getToastStyles = () => {
    const baseStyles = "flex items-start p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
    }
  };

  // Получить иконку для типа
  const getIcon = () => {
    const iconProps = { size: 20, className: "flex-shrink-0 mt-0.5" };
    
    switch (type) {
      case 'success':
        return <Check {...iconProps} className="flex-shrink-0 mt-0.5 text-green-600" />;
      case 'error':
        return <AlertCircle {...iconProps} className="flex-shrink-0 mt-0.5 text-red-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="flex-shrink-0 mt-0.5 text-yellow-600" />;
      case 'info':
      default:
        return <Info {...iconProps} className="flex-shrink-0 mt-0.5 text-blue-600" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`${getToastStyles()} ${
        isExiting 
          ? 'opacity-0 translate-x-full' 
          : 'opacity-100 translate-x-0'
      }`}
    >
      {/* Иконка */}
      <div className="mr-3">
        {getIcon()}
      </div>

      {/* Содержимое */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium mb-1">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-sm opacity-90">
            {message}
          </p>
        )}
        
        {/* Кнопка действия */}
        {actionButton && (
          <div className="mt-3">
            {actionButton}
          </div>
        )}
      </div>

      {/* Кнопка закрытия */}
      <button
        onClick={handleClose}
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Контейнер для управления множественными toast уведомлениями
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  // Добавить новое уведомление
  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  // Удалить уведомление
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Очистить все уведомления
  const clearToasts = () => {
    setToasts([]);
  };

  // Глобальные методы для использования в других компонентах
  useEffect(() => {
    window.showToast = addToast;
    window.clearToasts = clearToasts;
    
    return () => {
      delete window.showToast;
      delete window.clearToasts;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

// Утилитарные функции для показа уведомлений
export const showSuccessToast = (title, message, options = {}) => {
  if (window.showToast) {
    return window.showToast({
      type: 'success',
      title,
      message,
      ...options
    });
  }
};

export const showErrorToast = (title, message, options = {}) => {
  if (window.showToast) {
    return window.showToast({
      type: 'error',
      title,
      message,
      duration: 7000, // Ошибки показываем дольше
      ...options
    });
  }
};

export const showWarningToast = (title, message, options = {}) => {
  if (window.showToast) {
    return window.showToast({
      type: 'warning',
      title,
      message,
      ...options
    });
  }
};

export const showInfoToast = (title, message, options = {}) => {
  if (window.showToast) {
    return window.showToast({
      type: 'info',
      title,
      message,
      ...options
    });
  }
};

export { NotificationToast, ToastContainer };
export default NotificationToast;

