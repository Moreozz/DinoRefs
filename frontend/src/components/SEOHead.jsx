import React, { useEffect } from 'react';

const SEOHead = ({ 
  title = "DinoRefs - Платформа управления референсами и реферальными программами",
  description = "Профессиональная платформа для создания, отслеживания и монетизации реферальных кампаний. Расширенная аналитика, AI-прогнозы, интеграция с российскими платежными системами.",
  keywords = "референсы, реферальная программа, реферальный маркетинг, партнерская программа, аналитика рефералов, монетизация, DinoRefs, CRM, маркетинг автоматизация",
  image = "/images/dinorefs-og-image.jpg",
  url = "https://dinorefs.ru",
  type = "website",
  author = "DinoRefs Team",
  robots = "index, follow",
  canonical = null,
  structuredData = null
}) => {
  const fullTitle = title.includes('DinoRefs') ? title : `${title} | DinoRefs`;
  const fullUrl = url.startsWith('http') ? url : `https://dinorefs.ru${url}`;
  const fullImage = image.startsWith('http') ? image : `https://dinorefs.ru${image}`;

  // Базовые структурированные данные для организации
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "DinoRefs",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": description,
    "url": "https://dinorefs.ru",
    "author": {
      "@type": "Organization",
      "name": "DinoRefs",
      "url": "https://dinorefs.ru"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "RUB",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    }
  };

  useEffect(() => {
    // Обновляем title страницы
    document.title = fullTitle;
    
    // Функция для обновления или создания meta тега
    const updateMetaTag = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Обновляем основные meta теги
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('robots', robots);
    
    // Open Graph теги
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImage, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'DinoRefs', true);
    updateMetaTag('og:locale', 'ru_RU', true);
    
    // Twitter Card теги
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', fullImage);
    updateMetaTag('twitter:site', '@dinorefs');
    updateMetaTag('twitter:creator', '@dinorefs');
    
    // Дополнительные meta теги
    updateMetaTag('theme-color', '#10b981');
    updateMetaTag('msapplication-TileColor', '#10b981');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('apple-mobile-web-app-title', 'DinoRefs');
    
    // Языковые теги
    const contentLanguage = document.querySelector('meta[http-equiv="content-language"]');
    if (!contentLanguage) {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'content-language');
      meta.setAttribute('content', 'ru');
      document.head.appendChild(meta);
    }
    
    // Canonical URL
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
    }
    
    // Структурированные данные JSON-LD
    const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    if (structuredDataScript) {
      structuredDataScript.textContent = JSON.stringify(structuredData || defaultStructuredData);
    } else {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData || defaultStructuredData);
      document.head.appendChild(script);
    }
    
  }, [title, description, keywords, image, url, type, author, robots, canonical, structuredData]);

  return null; // Компонент не рендерит ничего визуального
};

// Предустановленные конфигурации для разных страниц
export const SEOConfigs = {
  home: {
    title: "DinoRefs - Платформа управления референсами №1 в России",
    description: "Создавайте, отслеживайте и монетизируйте реферальные программы с DinoRefs. AI-аналитика, российские платежные системы, белые решения для бизнеса. Попробуйте бесплатно!",
    keywords: "реферальная программа, партнерский маркетинг, CRM система, аналитика продаж, автоматизация маркетинга, российская платформа",
    url: "/",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "DinoRefs",
      "url": "https://dinorefs.ru",
      "description": "Профессиональная платформа для управления реферальными программами",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://dinorefs.ru/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  },
  
  pricing: {
    title: "Тарифы DinoRefs - Выберите подходящий план",
    description: "Гибкие тарифные планы DinoRefs: от бесплатного до корпоративного. Скидки до 40% при годовой оплате. Российские платежные системы, техподдержка 24/7.",
    keywords: "тарифы DinoRefs, цены реферальная программа, стоимость CRM, планы подписки, скидки годовая оплата",
    url: "/pricing",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "DinoRefs",
      "description": "Платформа управления реферальными программами",
      "offers": [
        {
          "@type": "Offer",
          "name": "Dino Egg",
          "price": "0",
          "priceCurrency": "RUB",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer", 
          "name": "Baby Dino",
          "price": "2000",
          "priceCurrency": "RUB",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "T-Rex", 
          "price": "8500",
          "priceCurrency": "RUB",
          "availability": "https://schema.org/InStock"
        }
      ]
    }
  },
  
  analytics: {
    title: "Аналитика DinoRefs - AI-прогнозы и детальная статистика",
    description: "Расширенная аналитика реферальных программ с AI-прогнозированием. Интерактивные графики, экспорт в PDF/Excel, когортный анализ, прогнозы доходов.",
    keywords: "аналитика рефералов, AI прогнозы, статистика продаж, когортный анализ, экспорт отчетов, бизнес аналитика",
    url: "/analytics"
  },
  
  dashboard: {
    title: "Дашборд DinoRefs - Управление реферальными программами",
    description: "Центр управления вашими реферальными кампаниями. Мониторинг KPI, управление проектами, уведомления, быстрый доступ ко всем функциям.",
    keywords: "дашборд CRM, управление проектами, KPI мониторинг, центр управления, реферальные кампании",
    url: "/dashboard"
  },
  
  projects: {
    title: "Проекты DinoRefs - Создание и управление кампаниями",
    description: "Создавайте и управляйте реферальными проектами. Настройка параметров, генерация ссылок, отслеживание конверсий, командная работа.",
    keywords: "создание проектов, управление кампаниями, реферальные ссылки, настройка параметров, командная работа",
    url: "/projects"
  },
  
  privacy: {
    title: "Политика конфиденциальности DinoRefs - Защита персональных данных",
    description: "Политика конфиденциальности DinoRefs. Соответствие 152-ФЗ, GDPR. Прозрачная обработка персональных данных, права пользователей, контакты DPO.",
    keywords: "политика конфиденциальности, 152-ФЗ, GDPR, защита данных, персональные данные, права пользователей",
    url: "/privacy",
    robots: "index, follow"
  },
  
  terms: {
    title: "Пользовательское соглашение DinoRefs - Условия использования",
    description: "Пользовательское соглашение DinoRefs. Условия использования платформы, права и обязанности, тарифные планы, ответственность сторон.",
    keywords: "пользовательское соглашение, условия использования, права обязанности, тарифы, ответственность",
    url: "/terms",
    robots: "index, follow"
  }
};

export default SEOHead;

