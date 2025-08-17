import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Хук для кэширования API запросов с TTL и автоматической инвалидацией
 */
export const useCache = (defaultTTL = 5 * 60 * 1000) => { // 5 минут по умолчанию
  const [cache, setCache] = useState(new Map());
  const [loading, setLoading] = useState(new Set());
  const timeoutsRef = useRef(new Map());

  // Генерация ключа кэша
  const generateCacheKey = useCallback((url, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}?${JSON.stringify(sortedParams)}`;
  }, []);

  // Проверка актуальности кэша
  const isCacheValid = useCallback((cacheEntry) => {
    if (!cacheEntry) return false;
    return Date.now() < cacheEntry.expiresAt;
  }, []);

  // Установка таймера для автоматического удаления
  const setExpirationTimer = useCallback((key, ttl) => {
    // Очищаем предыдущий таймер, если есть
    if (timeoutsRef.current.has(key)) {
      clearTimeout(timeoutsRef.current.get(key));
    }

    // Устанавливаем новый таймер
    const timeoutId = setTimeout(() => {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      timeoutsRef.current.delete(key);
    }, ttl);

    timeoutsRef.current.set(key, timeoutId);
  }, []);

  // Получение данных из кэша или выполнение запроса
  const fetchWithCache = useCallback(async (
    url, 
    options = {}, 
    cacheOptions = {}
  ) => {
    const {
      ttl = defaultTTL,
      forceRefresh = false,
      params = {},
      onSuccess,
      onError
    } = cacheOptions;

    const cacheKey = generateCacheKey(url, params);

    // Проверяем кэш, если не принудительное обновление
    if (!forceRefresh) {
      const cachedEntry = cache.get(cacheKey);
      if (cachedEntry && isCacheValid(cachedEntry)) {
        return cachedEntry.data;
      }
    }

    // Проверяем, не выполняется ли уже запрос
    if (loading.has(cacheKey)) {
      // Ждем завершения текущего запроса
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!loading.has(cacheKey)) {
            clearInterval(checkInterval);
            const cachedEntry = cache.get(cacheKey);
            if (cachedEntry && isCacheValid(cachedEntry)) {
              resolve(cachedEntry.data);
            } else {
              reject(new Error('Запрос завершился неудачно'));
            }
          }
        }, 100);
      });
    }

    try {
      // Отмечаем начало загрузки
      setLoading(prev => new Set([...prev, cacheKey]));

      // Выполняем запрос
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Сохраняем в кэш
      const cacheEntry = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttl,
        url,
        params
      };

      setCache(prev => new Map([...prev, [cacheKey, cacheEntry]]));
      setExpirationTimer(cacheKey, ttl);

      // Вызываем callback успеха
      if (onSuccess) {
        onSuccess(data);
      }

      return data;

    } catch (error) {
      console.error(`Ошибка запроса ${url}:`, error);
      
      // Вызываем callback ошибки
      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      // Убираем из состояния загрузки
      setLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(cacheKey);
        return newLoading;
      });
    }
  }, [cache, loading, defaultTTL, generateCacheKey, isCacheValid, setExpirationTimer]);

  // Инвалидация кэша по ключу или паттерну
  const invalidateCache = useCallback((keyOrPattern) => {
    if (typeof keyOrPattern === 'string') {
      // Точное совпадение
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(keyOrPattern);
        return newCache;
      });
      
      // Очищаем таймер
      if (timeoutsRef.current.has(keyOrPattern)) {
        clearTimeout(timeoutsRef.current.get(keyOrPattern));
        timeoutsRef.current.delete(keyOrPattern);
      }
    } else if (keyOrPattern instanceof RegExp) {
      // Паттерн
      setCache(prev => {
        const newCache = new Map();
        for (const [key, value] of prev) {
          if (!keyOrPattern.test(key)) {
            newCache.set(key, value);
          } else {
            // Очищаем таймер для удаляемых ключей
            if (timeoutsRef.current.has(key)) {
              clearTimeout(timeoutsRef.current.get(key));
              timeoutsRef.current.delete(key);
            }
          }
        }
        return newCache;
      });
    }
  }, []);

  // Очистка всего кэша
  const clearCache = useCallback(() => {
    setCache(new Map());
    
    // Очищаем все таймеры
    for (const timeoutId of timeoutsRef.current.values()) {
      clearTimeout(timeoutId);
    }
    timeoutsRef.current.clear();
  }, []);

  // Получение статистики кэша
  const getCacheStats = useCallback(() => {
    const entries = Array.from(cache.entries());
    const now = Date.now();
    
    const stats = {
      totalEntries: entries.length,
      validEntries: 0,
      expiredEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null
    };

    entries.forEach(([key, entry]) => {
      const isValid = isCacheValid(entry);
      
      if (isValid) {
        stats.validEntries++;
      } else {
        stats.expiredEntries++;
      }

      // Приблизительный размер в байтах
      stats.totalSize += JSON.stringify(entry).length;

      // Самая старая и новая записи
      if (!stats.oldestEntry || entry.cachedAt < stats.oldestEntry.cachedAt) {
        stats.oldestEntry = entry;
      }
      
      if (!stats.newestEntry || entry.cachedAt > stats.newestEntry.cachedAt) {
        stats.newestEntry = entry;
      }
    });

    return stats;
  }, [cache, isCacheValid]);

  // Предзагрузка данных
  const preload = useCallback(async (urls, options = {}) => {
    const promises = urls.map(url => 
      fetchWithCache(url, options, { ...options, ttl: options.ttl || defaultTTL })
    );
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Некоторые предзагрузки завершились с ошибкой:', error);
    }
  }, [fetchWithCache, defaultTTL]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем все таймеры при размонтировании
      for (const timeoutId of timeoutsRef.current.values()) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Автоматическая очистка устаревших записей каждые 5 минут
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map();
        for (const [key, entry] of prev) {
          if (isCacheValid(entry)) {
            newCache.set(key, entry);
          } else {
            // Очищаем таймер для устаревших записей
            if (timeoutsRef.current.has(key)) {
              clearTimeout(timeoutsRef.current.get(key));
              timeoutsRef.current.delete(key);
            }
          }
        }
        return newCache;
      });
    }, 5 * 60 * 1000); // 5 минут

    return () => clearInterval(cleanupInterval);
  }, [isCacheValid]);

  return {
    // Основные методы
    fetchWithCache,
    invalidateCache,
    clearCache,
    preload,
    
    // Утилиты
    getCacheStats,
    generateCacheKey,
    
    // Состояние
    isLoading: (url, params = {}) => loading.has(generateCacheKey(url, params)),
    cacheSize: cache.size
  };
};

