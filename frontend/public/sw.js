// Service Worker для DinoRefs PWA с полной функциональностью
// Версия кэша - изменяйте при обновлении ресурсов
const CACHE_VERSION = 'dinorefs-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Ресурсы для кэширования при установке
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// Стратегии кэширования
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Конфигурация кэширования для разных типов запросов
const CACHE_CONFIG = {
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    maxEntries: 100
  },
  api: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 минут
    maxEntries: 50
  },
  images: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: DYNAMIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    maxEntries: 200
  },
  documents: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1 день
    maxEntries: 30
  }
};

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Кэширование статических ресурсов');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Статические ресурсы закэшированы');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Ошибка кэширования:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('[SW] Удаление старого кэша:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (url.origin !== location.origin && !url.pathname.startsWith('/api')) {
    return;
  }
  
  const cacheConfig = getCacheConfig(request);
  
  if (!cacheConfig) {
    return;
  }
  
  event.respondWith(
    handleRequest(request, cacheConfig)
  );
});

// Определение конфигурации кэширования для запроса
function getCacheConfig(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  if (pathname.startsWith('/api/')) {
    return CACHE_CONFIG.api;
  }
  
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname)) {
    return CACHE_CONFIG.images;
  }
  
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      /\.(js|css|woff|woff2|ttf|eot)$/i.test(pathname)) {
    return CACHE_CONFIG.static;
  }
  
  if (request.destination === 'document' || 
      request.headers.get('accept')?.includes('text/html')) {
    return CACHE_CONFIG.documents;
  }
  
  return null;
}

// Обработка запроса согласно стратегии кэширования
async function handleRequest(request, config) {
  const { strategy, cacheName, maxAge } = config;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, maxAge);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, maxAge);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, maxAge);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
    default:
      return fetch(request);
  }
}

// Стратегия: Кэш в первую очередь
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Сетевая ошибка, возвращаем кэш:', error);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Стратегия: Сеть в первую очередь
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Сетевая ошибка, пытаемся найти в кэше:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Стратегия: Устаревший контент при обновлении
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.warn('[SW] Ошибка обновления кэша:', error);
  });
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return fetchPromise;
}

// Проверка истечения срока кэша
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  
  return (now.getTime() - responseDate.getTime()) > maxAge;
}

// === PUSH УВЕДОМЛЕНИЯ ===

// Обработка push-событий
self.addEventListener('push', (event) => {
  console.log('Получено push-событие:', event);
  
  let notificationData = {
    title: 'DinoRefs',
    body: 'У вас новое уведомление',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'dinorefs-push'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Ошибка парсинга push-данных:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data || {},
      actions: notificationData.actions || [],
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false
    })
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('Клик по уведомлению:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  const action = event.action;

  notification.close();

  let targetUrl = '/';
  
  if (action) {
    switch (action) {
      case 'accept':
      case 'view':
        if (data.url) targetUrl = data.url;
        break;
      case 'reply':
        if (data.url) targetUrl = data.url + '#comments';
        break;
      case 'check':
        targetUrl = '/profile/security';
        break;
      default:
        if (data.url) targetUrl = data.url;
    }
  } else {
    switch (data.type) {
      case 'project_invitation':
      case 'project_shared':
      case 'project_liked':
      case 'project_commented':
        if (data.url) targetUrl = data.url;
        break;
      case 'referral_reward':
        targetUrl = '/referrals';
        break;
      case 'referral_conversion':
        targetUrl = '/referrals/analytics';
        break;
      case 'account_security':
        targetUrl = '/profile/security';
        break;
      default:
        if (data.url) targetUrl = data.url;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );

  event.waitUntil(
    clients.matchAll().then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'notification-click',
          notification: { data: data, action: action }
        });
      });
    })
  );
});

// Обработка закрытия уведомлений
self.addEventListener('notificationclose', (event) => {
  console.log('Уведомление закрыто:', event);
  
  const data = event.notification.data || {};
  
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'notification-close',
          notification: { data: data }
        });
      });
    })
  );
});

// Обработка фоновой синхронизации
self.addEventListener('sync', (event) => {
  console.log('Фоновая синхронизация:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      fetch('/api/notifications/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch((error) => {
        console.error('Ошибка фоновой синхронизации:', error);
      })
    );
  }
});

// Обработка сообщений от основного приложения
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;
      
    case 'show-notification':
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        tag: data.tag || 'dinorefs-notification',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
      });
      break;
      
    case 'clear-notifications':
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => {
          if (!data.tag || notification.tag === data.tag) {
            notification.close();
          }
        });
      });
      break;
      
    default:
      console.log('Неизвестный тип сообщения:', type);
  }
});

// Очистка всех кэшей
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Получение размера кэша
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

// Утилитарные функции для уведомлений
function isNotificationSupported() {
  return 'Notification' in self;
}

async function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

function showTestNotification() {
  if (getNotificationPermission() === 'granted') {
    self.registration.showNotification('DinoRefs Test', {
      body: 'Тестовое уведомление работает!',
      icon: '/favicon.ico',
      tag: 'test-notification'
    });
  }
}

self.notificationUtils = {
  isNotificationSupported,
  getNotificationPermission,
  showTestNotification
};

console.log('[SW] Service Worker загружен и готов к работе');

