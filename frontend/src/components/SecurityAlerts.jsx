import React from 'react';
import { X, Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react';

/**
 * Компонент для отображения уведомлений о безопасности
 */
const SecurityAlerts = ({ alerts, onRemoveAlert }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <Shield className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertStyles = (type) => {
    const baseStyles = "border-l-4 p-4 mb-3 rounded-r-lg shadow-md transition-all duration-300";
    
    switch (type) {
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={getAlertStyles(alert.type)}
          role="alert"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm">
                    {alert.title}
                  </h4>
                  <span className="text-xs opacity-75">
                    {formatTime(alert.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm leading-relaxed">
                  {alert.message}
                </p>
                
                {/* Дополнительные действия для определенных типов уведомлений */}
                {alert.type === 'warning' && alert.title.includes('браузера') && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <p className="text-xs">
                      💡 <strong>Рекомендация:</strong> Используйте современный браузер с включенными cookies и JavaScript
                    </p>
                  </div>
                )}
                
                {alert.type === 'error' && alert.message.includes('CSRF') && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <p className="text-xs">
                      🔄 <strong>Действие:</strong> Обновите страницу и попробуйте снова
                    </p>
                  </div>
                )}
                
                {alert.type === 'error' && alert.message.includes('XSS') && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <p className="text-xs">
                      ⚠️ <strong>Внимание:</strong> Проверьте введенные данные на наличие специальных символов
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onRemoveAlert(alert.id)}
              className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors duration-200"
              aria-label="Закрыть уведомление"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Прогресс-бар для автоматического закрытия */}
          <div className="mt-3 h-1 bg-black bg-opacity-10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current opacity-50 animate-pulse"
              style={{
                animation: 'shrink 10s linear forwards'
              }}
            />
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SecurityAlerts;

