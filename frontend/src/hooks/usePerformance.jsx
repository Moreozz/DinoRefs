import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Хук для мониторинга производительности приложения
 */
export const usePerformance = () => {
  const [metrics, setMetrics] = useState({
    loadTime: null,
    firstPaint: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    firstInputDelay: null,
    cumulativeLayoutShift: null,
    timeToInteractive: null,
    memoryUsage: null,
    connectionType: null,
    isOnline: navigator.onLine
  });

  const [performanceEntries, setPerformanceEntries] = useState([]);
  const observerRef = useRef(null);
  const metricsRef = useRef(metrics);

  // Обновляем ref при изменении метрик
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Получение базовых метрик производительности
  const getBasicMetrics = useCallback(() => {
    if (!window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    const newMetrics = { ...metricsRef.current };

    // Время загрузки страницы
    if (navigation) {
      newMetrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      newMetrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
    }

    // Метрики рендеринга
    paint.forEach((entry) => {
      if (entry.name === 'first-paint') {
        newMetrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        newMetrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Информация о соединении
    if (navigator.connection) {
      newMetrics.connectionType = navigator.connection.effectiveType;
    }

    // Использование памяти (если доступно)
    if (performance.memory) {
      newMetrics.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }

    setMetrics(newMetrics);
  }, []);

  // Мониторинг Web Vitals
  const observeWebVitals = useCallback(() => {
    if (!window.PerformanceObserver) return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      setMetrics(prev => ({
        ...prev,
        largestContentfulPaint: lastEntry.startTime
      }));
    });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        setMetrics(prev => ({
          ...prev,
          firstInputDelay: entry.processingStart - entry.startTime
        }));
      });
    });

    // Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      const entries = entryList.getEntries();
      
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      setMetrics(prev => ({
        ...prev,
        cumulativeLayoutShift: clsValue
      }));
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      observerRef.current = {
        lcp: lcpObserver,
        fid: fidObserver,
        cls: clsObserver
      };
    } catch (error) {
      console.warn('Некоторые Performance Observer не поддерживаются:', error);
    }
  }, []);

  // Мониторинг ресурсов
  const observeResources = useCallback(() => {
    if (!window.PerformanceObserver) return;

    const resourceObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      setPerformanceEntries(prev => [...prev, ...entries.map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize || 0,
        startTime: entry.startTime,
        responseEnd: entry.responseEnd
      }))]);
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource Observer не поддерживается:', error);
    }

    return resourceObserver;
  }, []);

  // Измерение времени выполнения функции
  const measureFunction = useCallback((name, fn) => {
    return async (...args) => {
      const startTime = performance.now();
      
      try {
        const result = await fn(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Добавляем измерение в список
        setPerformanceEntries(prev => [...prev, {
          name: `function:${name}`,
          type: 'function',
          duration,
          startTime,
          responseEnd: endTime
        }]);

        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        setPerformanceEntries(prev => [...prev, {
          name: `function:${name}:error`,
          type: 'function',
          duration,
          startTime,
          responseEnd: endTime,
          error: error.message
        }]);

        throw error;
      }
    };
  }, []);

  // Создание пользовательской метрики
  const mark = useCallback((name) => {
    if (performance.mark) {
      performance.mark(name);
    }
  }, []);

  const measure = useCallback((name, startMark, endMark) => {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        
        const measurement = performance.getEntriesByName(name, 'measure')[0];
        if (measurement) {
          setPerformanceEntries(prev => [...prev, {
            name: measurement.name,
            type: 'measure',
            duration: measurement.duration,
            startTime: measurement.startTime,
            responseEnd: measurement.startTime + measurement.duration
          }]);
        }
      } catch (error) {
        console.warn('Ошибка создания измерения:', error);
      }
    }
  }, []);

  // Анализ производительности
  const analyzePerformance = useCallback(() => {
    const analysis = {
      overall: 'good', // good, needs-improvement, poor
      recommendations: [],
      scores: {}
    };

    // Анализ LCP
    if (metrics.largestContentfulPaint !== null) {
      if (metrics.largestContentfulPaint <= 2500) {
        analysis.scores.lcp = 'good';
      } else if (metrics.largestContentfulPaint <= 4000) {
        analysis.scores.lcp = 'needs-improvement';
        analysis.recommendations.push('Оптимизируйте загрузку основного контента');
      } else {
        analysis.scores.lcp = 'poor';
        analysis.recommendations.push('Критически медленная загрузка контента');
      }
    }

    // Анализ FID
    if (metrics.firstInputDelay !== null) {
      if (metrics.firstInputDelay <= 100) {
        analysis.scores.fid = 'good';
      } else if (metrics.firstInputDelay <= 300) {
        analysis.scores.fid = 'needs-improvement';
        analysis.recommendations.push('Уменьшите время обработки JavaScript');
      } else {
        analysis.scores.fid = 'poor';
        analysis.recommendations.push('Критически медленная реакция на пользовательский ввод');
      }
    }

    // Анализ CLS
    if (metrics.cumulativeLayoutShift !== null) {
      if (metrics.cumulativeLayoutShift <= 0.1) {
        analysis.scores.cls = 'good';
      } else if (metrics.cumulativeLayoutShift <= 0.25) {
        analysis.scores.cls = 'needs-improvement';
        analysis.recommendations.push('Стабилизируйте макет страницы');
      } else {
        analysis.scores.cls = 'poor';
        analysis.recommendations.push('Критически нестабильный макет');
      }
    }

    // Анализ времени загрузки
    if (metrics.loadTime !== null) {
      if (metrics.loadTime <= 3000) {
        analysis.scores.loadTime = 'good';
      } else if (metrics.loadTime <= 5000) {
        analysis.scores.loadTime = 'needs-improvement';
        analysis.recommendations.push('Ускорьте загрузку страницы');
      } else {
        analysis.scores.loadTime = 'poor';
        analysis.recommendations.push('Критически медленная загрузка');
      }
    }

    // Анализ использования памяти
    if (metrics.memoryUsage) {
      const memoryUsagePercent = (metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100;
      
      if (memoryUsagePercent <= 50) {
        analysis.scores.memory = 'good';
      } else if (memoryUsagePercent <= 80) {
        analysis.scores.memory = 'needs-improvement';
        analysis.recommendations.push('Оптимизируйте использование памяти');
      } else {
        analysis.scores.memory = 'poor';
        analysis.recommendations.push('Критически высокое использование памяти');
      }
    }

    // Общая оценка
    const scores = Object.values(analysis.scores);
    const poorCount = scores.filter(score => score === 'poor').length;
    const needsImprovementCount = scores.filter(score => score === 'needs-improvement').length;

    if (poorCount > 0) {
      analysis.overall = 'poor';
    } else if (needsImprovementCount > 1) {
      analysis.overall = 'needs-improvement';
    }

    return analysis;
  }, [metrics]);

  // Получение статистики ресурсов
  const getResourceStats = useCallback(() => {
    const stats = {
      totalResources: performanceEntries.length,
      totalSize: 0,
      totalDuration: 0,
      byType: {},
      slowestResources: []
    };

    performanceEntries.forEach(entry => {
      if (entry.type !== 'function' && entry.type !== 'measure') {
        stats.totalSize += entry.size || 0;
        stats.totalDuration += entry.duration || 0;

        if (!stats.byType[entry.type]) {
          stats.byType[entry.type] = {
            count: 0,
            totalSize: 0,
            totalDuration: 0
          };
        }

        stats.byType[entry.type].count++;
        stats.byType[entry.type].totalSize += entry.size || 0;
        stats.byType[entry.type].totalDuration += entry.duration || 0;
      }
    });

    // Самые медленные ресурсы
    stats.slowestResources = performanceEntries
      .filter(entry => entry.duration > 0)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return stats;
  }, [performanceEntries]);

  // Мониторинг состояния сети
  useEffect(() => {
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Инициализация мониторинга
  useEffect(() => {
    // Ждем полной загрузки страницы
    if (document.readyState === 'complete') {
      getBasicMetrics();
      observeWebVitals();
      observeResources();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          getBasicMetrics();
          observeWebVitals();
          observeResources();
        }, 0);
      });
    }

    return () => {
      // Отключаем наблюдатели при размонтировании
      if (observerRef.current) {
        Object.values(observerRef.current).forEach(observer => {
          if (observer && observer.disconnect) {
            observer.disconnect();
          }
        });
      }
    };
  }, [getBasicMetrics, observeWebVitals, observeResources]);

  return {
    // Метрики
    metrics,
    performanceEntries,
    
    // Методы измерения
    measureFunction,
    mark,
    measure,
    
    // Анализ
    analyzePerformance,
    getResourceStats,
    
    // Утилиты
    isSupported: !!window.performance,
    isObserverSupported: !!window.PerformanceObserver
  };
};

