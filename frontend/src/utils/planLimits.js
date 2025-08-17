// Конфигурация лимитов для каждого тарифного плана
export const PLAN_LIMITS = {
  free: {
    name: 'Dino Egg',
    maxReferrals: 100,
    maxProjects: 1,
    maxCampaigns: 1,
    analytics: 'basic',
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: false,
    customIntegrations: false,
    exportData: false,
    features: [
      'До 100 рефералов в месяц',
      '1 активный проект',
      'Базовая аналитика',
      'Стандартные награды (3 бейджа)',
      'Поддержка сообщества'
    ]
  },
  starter: {
    name: 'Baby Dino',
    maxReferrals: 1000,
    maxProjects: 3,
    maxCampaigns: 5,
    analytics: 'advanced',
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: true,
    customIntegrations: false,
    exportData: true,
    features: [
      'До 1,000 рефералов в месяц',
      'До 3 параллельных проектов',
      'Расширенная аналитика',
      'Детальные отчеты и сегментация',
      'Полный набор стандартных бейджей',
      'Кастомные награды',
      'Приоритетная поддержка'
    ]
  },
  growth: {
    name: 'T-Rex',
    maxReferrals: 10000,
    maxProjects: 10,
    maxCampaigns: 20,
    analytics: 'full',
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true,
    customIntegrations: true,
    exportData: true,
    features: [
      'До 10,000 рефералов в месяц',
      'До 10 проектов',
      'Полная аналитика + прогнозы',
      'API доступ для интеграций',
      'White-label ссылки',
      'Приоритетная поддержка (SLA)',
      'Кастомные интеграции',
      'Экспорт данных'
    ]
  },
  enterprise: {
    name: 'Dino King',
    maxReferrals: Infinity,
    maxProjects: Infinity,
    maxCampaigns: Infinity,
    analytics: 'enterprise',
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true,
    customIntegrations: true,
    exportData: true,
    onPremise: true,
    dedicatedInstance: true,
    features: [
      'Неограниченные рефералы',
      'Полная white-label платформа',
      'Собственный домен и дизайн',
      'Персональный менеджер',
      'Расширенные SLA гарантии',
      'Кастомная разработка',
      'On-premise установка',
      'Отдельный облачный инстанс',
      'Интеграция с CRM/ERP'
    ]
  }
};

// Получить лимиты для конкретного плана
export const getPlanLimits = (planId) => {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.free;
};

// Проверить, превышен ли лимит
export const checkLimit = (planId, limitType, currentValue) => {
  const limits = getPlanLimits(planId);
  const maxValue = limits[limitType];
  
  if (maxValue === Infinity) {
    return { exceeded: false, remaining: Infinity };
  }
  
  const exceeded = currentValue >= maxValue;
  const remaining = Math.max(0, maxValue - currentValue);
  
  return {
    exceeded,
    remaining,
    maxValue,
    currentValue,
    percentage: (currentValue / maxValue) * 100
  };
};

// Проверить доступность функции для плана
export const hasFeature = (planId, feature) => {
  const limits = getPlanLimits(planId);
  return limits[feature] === true;
};

// Получить уровень аналитики для плана
export const getAnalyticsLevel = (planId) => {
  const limits = getPlanLimits(planId);
  return limits.analytics;
};

// Проверить, может ли пользователь создать новый проект
export const canCreateProject = (planId, currentProjectsCount) => {
  const result = checkLimit(planId, 'maxProjects', currentProjectsCount);
  return !result.exceeded;
};

// Проверить, может ли пользователь создать новую кампанию
export const canCreateCampaign = (planId, currentCampaignsCount) => {
  const result = checkLimit(planId, 'maxCampaigns', currentCampaignsCount);
  return !result.exceeded;
};

// Проверить, может ли пользователь добавить новый реферал
export const canAddReferral = (planId, currentReferralsCount) => {
  const result = checkLimit(planId, 'maxReferrals', currentReferralsCount);
  return !result.exceeded;
};

// Получить сообщение о превышении лимита
export const getLimitMessage = (planId, limitType, currentValue) => {
  const result = checkLimit(planId, limitType, currentValue);
  const limits = getPlanLimits(planId);
  
  if (!result.exceeded) {
    return null;
  }
  
  const messages = {
    maxProjects: `Вы достигли лимита проектов для плана ${limits.name} (${result.maxValue}). Обновите план для создания большего количества проектов.`,
    maxCampaigns: `Вы достигли лимита кампаний для плана ${limits.name} (${result.maxValue}). Обновите план для создания большего количества кампаний.`,
    maxReferrals: `Вы достигли лимита рефералов для плана ${limits.name} (${result.maxValue} в месяц). Обновите план для увеличения лимита.`
  };
  
  return messages[limitType] || `Лимит превышен для плана ${limits.name}`;
};

// Получить рекомендуемый план для обновления
export const getRecommendedUpgrade = (currentPlan) => {
  const planOrder = ['free', 'starter', 'growth', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  
  if (currentIndex < planOrder.length - 1) {
    return planOrder[currentIndex + 1];
  }
  
  return null;
};

// Получить статистику использования плана
export const getPlanUsageStats = (planId, usage) => {
  const limits = getPlanLimits(planId);
  
  return {
    projects: checkLimit(planId, 'maxProjects', usage.projects || 0),
    campaigns: checkLimit(planId, 'maxCampaigns', usage.campaigns || 0),
    referrals: checkLimit(planId, 'maxReferrals', usage.referrals || 0),
    planName: limits.name
  };
};

