import { useState, useEffect, useCallback } from 'react';

/**
 * Хук для работы с системой безопасности DinoRefs
 * Управляет CSRF токенами, валидацией форм и уведомлениями о безопасности
 */
export const useSecurity = () => {
  const [csrfToken, setCsrfToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);

  // Получение CSRF токена с сервера
  const fetchCsrfToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/csrf-token');
      
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrf_token);
        
        // Сохраняем токен в localStorage с временной меткой
        localStorage.setItem('csrf_token', data.csrf_token);
        localStorage.setItem('csrf_token_expires', Date.now() + (data.expires_in * 1000));
      } else {
        throw new Error('Не удалось получить CSRF токен');
      }
    } catch (error) {
      console.error('Ошибка получения CSRF токена:', error);
      addSecurityAlert('warning', 'Проблема с безопасностью', 'Не удалось получить токен безопасности');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Проверка актуальности CSRF токена
  const isTokenValid = useCallback(() => {
    const token = localStorage.getItem('csrf_token');
    const expires = localStorage.getItem('csrf_token_expires');
    
    if (!token || !expires) return false;
    
    return Date.now() < parseInt(expires);
  }, []);

  // Получение актуального CSRF токена
  const getCsrfToken = useCallback(async () => {
    if (csrfToken && isTokenValid()) {
      return csrfToken;
    }
    
    // Пытаемся получить из localStorage
    const storedToken = localStorage.getItem('csrf_token');
    if (storedToken && isTokenValid()) {
      setCsrfToken(storedToken);
      return storedToken;
    }
    
    // Получаем новый токен
    await fetchCsrfToken();
    return localStorage.getItem('csrf_token');
  }, [csrfToken, isTokenValid, fetchCsrfToken]);

  // Создание защищенного запроса с CSRF токеном
  const createSecureRequest = useCallback(async (url, options = {}) => {
    const token = await getCsrfToken();
    
    const secureOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'X-CSRF-Token': token
      }
    };

    return fetch(url, secureOptions);
  }, [getCsrfToken]);

  // Валидация пользовательского ввода
  const validateInput = useCallback((input, type = 'text') => {
    const validationRules = {
      email: {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: 'Введите корректный email адрес'
      },
      phone: {
        pattern: /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/,
        message: 'Введите корректный номер телефона'
      },
      password: {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
        message: 'Пароль должен содержать минимум 8 символов, включая заглавную букву, строчную букву и цифру'
      },
      text: {
        pattern: /^[^<>\"'&]*$/,
        message: 'Текст содержит недопустимые символы'
      }
    };

    // Проверка на XSS
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          message: 'Обнаружена попытка XSS атаки'
        };
      }
    }

    // Проверка по типу
    const rule = validationRules[type];
    if (rule && !rule.pattern.test(input)) {
      return {
        isValid: false,
        message: rule.message
      };
    }

    // Проверка длины
    if (input.length > 1000) {
      return {
        isValid: false,
        message: 'Текст слишком длинный (максимум 1000 символов)'
      };
    }

    return {
      isValid: true,
      message: 'Валидация пройдена'
    };
  }, []);

  // Очистка пользовательского ввода
  const sanitizeInput = useCallback((input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>\"'&]/g, '') // Удаляем опасные символы
      .trim() // Убираем пробелы
      .slice(0, 1000); // Ограничиваем длину
  }, []);

  // Добавление уведомления о безопасности
  const addSecurityAlert = useCallback((type, title, message) => {
    const alert = {
      id: Date.now(),
      type, // 'info', 'warning', 'error', 'success'
      title,
      message,
      timestamp: new Date().toISOString()
    };

    setSecurityAlerts(prev => [...prev, alert]);

    // Автоматическое удаление через 10 секунд
    setTimeout(() => {
      setSecurityAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 10000);
  }, []);

  // Удаление уведомления
  const removeSecurityAlert = useCallback((alertId) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Проверка безопасности браузера
  const checkBrowserSecurity = useCallback(() => {
    const checks = {
      https: window.location.protocol === 'https:',
      localStorage: typeof Storage !== 'undefined',
      cookies: navigator.cookieEnabled,
      javascript: true // Если код выполняется, значит JS включен
    };

    const issues = [];
    
    if (!checks.https && window.location.hostname !== 'localhost') {
      issues.push('Соединение не защищено HTTPS');
    }
    
    if (!checks.localStorage) {
      issues.push('LocalStorage недоступен');
    }
    
    if (!checks.cookies) {
      issues.push('Cookies отключены');
    }

    if (issues.length > 0) {
      addSecurityAlert('warning', 'Проблемы безопасности браузера', issues.join(', '));
    }

    return {
      isSecure: issues.length === 0,
      issues,
      checks
    };
  }, [addSecurityAlert]);

  // Инициализация при монтировании
  useEffect(() => {
    // Получаем CSRF токен при загрузке
    if (!isTokenValid()) {
      fetchCsrfToken();
    } else {
      setCsrfToken(localStorage.getItem('csrf_token'));
    }

    // Проверяем безопасность браузера
    checkBrowserSecurity();

    // Добавляем обработчик для обновления токена перед отправкой форм
    const handleBeforeUnload = () => {
      if (!isTokenValid()) {
        fetchCsrfToken();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fetchCsrfToken, isTokenValid, checkBrowserSecurity]);

  return {
    // Состояние
    csrfToken,
    isLoading,
    securityAlerts,
    
    // Методы для CSRF
    getCsrfToken,
    createSecureRequest,
    
    // Методы валидации
    validateInput,
    sanitizeInput,
    
    // Методы уведомлений
    addSecurityAlert,
    removeSecurityAlert,
    
    // Методы проверки
    checkBrowserSecurity,
    isTokenValid
  };
};

