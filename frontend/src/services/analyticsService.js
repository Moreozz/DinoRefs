class AnalyticsService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = this.generateUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  setupEventListeners() {
    // Отслеживание онлайн/оффлайн статуса
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Отслеживание переходов между страницами
    window.addEventListener('beforeunload', () => {
      this.flushQueue();
    });

    // Отслеживание видимости страницы
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.track('page_hidden', {
          page_url: window.location.href,
          timestamp: Date.now()
        });
      } else {
        this.track('page_visible', {
          page_url: window.location.href,
          timestamp: Date.now()
        });
      }
    });
  }

  async track(eventName, properties = {}, options = {}) {
    const event = {
      session_id: this.sessionId,
      event_type: options.eventType || 'custom',
      event_name: eventName,
      project_id: properties.project_id || null,
      reference_id: properties.reference_id || null,
      page_url: window.location.href,
      referrer_url: document.referrer || null,
      properties: {
        ...properties,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    };

    if (this.isOnline) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        console.warn('Failed to send analytics event:', error);
        this.queue.push(event);
      }
    } else {
      this.queue.push(event);
    }
  }

  async sendEvent(event) {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async flushQueue() {
    if (this.queue.length === 0 || !this.isOnline) {
      return;
    }

    const eventsToSend = [...this.queue];
    this.queue = [];

    for (const event of eventsToSend) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        console.warn('Failed to send queued event:', error);
        // Возвращаем событие в очередь если не удалось отправить
        this.queue.push(event);
      }
    }
  }

  // Специальные методы для часто используемых событий
  trackPageView(additionalProperties = {}) {
    this.track('page_view', {
      ...additionalProperties,
      page_title: document.title,
      page_path: window.location.pathname
    }, { eventType: 'page_view' });
  }

  trackProjectView(projectId, projectName, additionalProperties = {}) {
    this.track('project_view', {
      project_id: projectId,
      project_name: projectName,
      ...additionalProperties
    }, { eventType: 'project_view' });
  }

  trackReferenceView(referenceId, projectId, additionalProperties = {}) {
    this.track('reference_view', {
      reference_id: referenceId,
      project_id: projectId,
      ...additionalProperties
    }, { eventType: 'reference_view' });
  }

  trackUserAction(action, target, additionalProperties = {}) {
    this.track('user_action', {
      action: action,
      target: target,
      ...additionalProperties
    }, { eventType: 'interaction' });
  }

  trackSearch(query, resultsCount, additionalProperties = {}) {
    this.track('search', {
      search_query: query,
      results_count: resultsCount,
      ...additionalProperties
    }, { eventType: 'search' });
  }

  trackError(errorType, errorMessage, additionalProperties = {}) {
    this.track('error', {
      error_type: errorType,
      error_message: errorMessage,
      ...additionalProperties
    }, { eventType: 'error' });
  }

  trackConversion(conversionType, value, additionalProperties = {}) {
    this.track('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      ...additionalProperties
    }, { eventType: 'conversion' });
  }

  // Методы для работы с пользовательскими свойствами
  setUserProperties(properties) {
    this.userProperties = {
      ...this.userProperties,
      ...properties
    };
  }

  // Методы для A/B тестирования
  trackExperiment(experimentName, variant, additionalProperties = {}) {
    this.track('experiment', {
      experiment_name: experimentName,
      experiment_variant: variant,
      ...additionalProperties
    }, { eventType: 'experiment' });
  }

  // Методы для отслеживания производительности
  trackPerformance(metricName, value, additionalProperties = {}) {
    this.track('performance', {
      metric_name: metricName,
      metric_value: value,
      ...additionalProperties
    }, { eventType: 'performance' });
  }

  // Автоматическое отслеживание производительности страницы
  trackPagePerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.loadEventStart);
        this.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        this.trackPerformance('first_paint', navigation.responseEnd - navigation.requestStart);
      }
    }
  }

  // Отслеживание кликов по элементам
  setupClickTracking(selector = '[data-analytics]') {
    document.addEventListener('click', (event) => {
      const element = event.target.closest(selector);
      if (element) {
        const action = element.dataset.analytics || 'click';
        const target = element.dataset.analyticsTarget || element.tagName.toLowerCase();
        const category = element.dataset.analyticsCategory || 'ui';
        
        this.trackUserAction(action, target, {
          category: category,
          element_text: element.textContent?.trim(),
          element_id: element.id,
          element_class: element.className
        });
      }
    });
  }

  // Отслеживание скроллинга
  setupScrollTracking() {
    let maxScroll = 0;
    let scrollTimer = null;

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (maxScroll >= 25 && maxScroll < 50) {
          this.track('scroll_25', { scroll_depth: maxScroll });
        } else if (maxScroll >= 50 && maxScroll < 75) {
          this.track('scroll_50', { scroll_depth: maxScroll });
        } else if (maxScroll >= 75 && maxScroll < 100) {
          this.track('scroll_75', { scroll_depth: maxScroll });
        } else if (maxScroll >= 100) {
          this.track('scroll_100', { scroll_depth: maxScroll });
        }
      }, 1000);
    });
  }

  // Инициализация всех автоматических трекеров
  init() {
    this.trackPageView();
    this.trackPagePerformance();
    this.setupClickTracking();
    this.setupScrollTracking();
  }
}

// Создаем глобальный экземпляр
const analytics = new AnalyticsService();

// Автоматическая инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
  analytics.init();
}

export default analytics;

