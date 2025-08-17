import { useState, useEffect, useCallback } from 'react';
import { 
  checkLimit, 
  canCreateProject, 
  canCreateCampaign, 
  canAddReferral,
  getPlanUsageStats,
  getLimitMessage
} from '../utils/planLimits';

// Хук для работы с лимитами тарифных планов
export const usePlanLimits = (planId = 'free') => {
  const [usage, setUsage] = useState({
    projects: 0,
    campaigns: 0,
    referrals: 0
  });

  const [loading, setLoading] = useState(true);

  // Загрузка текущего использования из API
  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Получаем статистику использования
      const response = await fetch('http://localhost:5002/api/user/usage-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsage({
          projects: data.projects || 0,
          campaigns: data.campaigns || 0,
          referrals: data.referrals || 0
        });
      } else {
        // Если API недоступен, используем тестовые данные
        setUsage({
          projects: 1, // Один тестовый проект
          campaigns: 1, // Одна тестовая кампания
          referrals: 25 // Тестовые рефералы
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики использования:', error);
      // Используем тестовые данные при ошибке
      setUsage({
        projects: 1,
        campaigns: 1,
        referrals: 25
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Проверка лимитов
  const checkProjectLimit = useCallback(() => {
    return checkLimit(planId, 'maxProjects', usage.projects);
  }, [planId, usage.projects]);

  const checkCampaignLimit = useCallback(() => {
    return checkLimit(planId, 'maxCampaigns', usage.campaigns);
  }, [planId, usage.campaigns]);

  const checkReferralLimit = useCallback(() => {
    return checkLimit(planId, 'maxReferrals', usage.referrals);
  }, [planId, usage.referrals]);

  // Проверка возможности создания
  const canCreate = {
    project: canCreateProject(planId, usage.projects),
    campaign: canCreateCampaign(planId, usage.campaigns),
    referral: canAddReferral(planId, usage.referrals)
  };

  // Получение сообщений о лимитах
  const getLimitMessages = useCallback(() => {
    return {
      projects: getLimitMessage(planId, 'maxProjects', usage.projects),
      campaigns: getLimitMessage(planId, 'maxCampaigns', usage.campaigns),
      referrals: getLimitMessage(planId, 'maxReferrals', usage.referrals)
    };
  }, [planId, usage]);

  // Получение статистики использования
  const usageStats = getPlanUsageStats(planId, usage);

  // Обновление счетчиков после создания
  const incrementUsage = useCallback((type) => {
    setUsage(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  }, []);

  const decrementUsage = useCallback((type) => {
    setUsage(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1)
    }));
  }, []);

  return {
    usage,
    usageStats,
    loading,
    canCreate,
    checkProjectLimit,
    checkCampaignLimit,
    checkReferralLimit,
    getLimitMessages,
    incrementUsage,
    decrementUsage,
    refreshUsage: fetchUsage
  };
};

// Хук для проверки доступности функций
export const usePlanFeatures = (planId = 'free') => {
  const features = {
    analytics: {
      basic: planId !== null,
      advanced: ['starter', 'growth', 'enterprise'].includes(planId),
      full: ['growth', 'enterprise'].includes(planId),
      enterprise: planId === 'enterprise'
    },
    apiAccess: ['growth', 'enterprise'].includes(planId),
    whiteLabel: ['growth', 'enterprise'].includes(planId),
    prioritySupport: ['starter', 'growth', 'enterprise'].includes(planId),
    customIntegrations: ['growth', 'enterprise'].includes(planId),
    exportData: ['starter', 'growth', 'enterprise'].includes(planId),
    onPremise: planId === 'enterprise',
    dedicatedInstance: planId === 'enterprise'
  };

  const hasFeature = useCallback((feature) => {
    return features[feature] || false;
  }, [features]);

  const getAnalyticsLevel = useCallback(() => {
    if (planId === 'enterprise') return 'enterprise';
    if (planId === 'growth') return 'full';
    if (planId === 'starter') return 'advanced';
    return 'basic';
  }, [planId]);

  return {
    features,
    hasFeature,
    getAnalyticsLevel
  };
};

// Хук для управления уведомлениями о лимитах
export const useLimitNotifications = (planId = 'free') => {
  const { usage, usageStats, canCreate } = usePlanLimits(planId);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const newNotifications = [];

    // Проверяем каждый лимит
    Object.entries(usageStats).forEach(([key, stats]) => {
      if (key === 'planName') return;

      if (stats.exceeded) {
        newNotifications.push({
          id: `${key}-exceeded`,
          type: 'error',
          limitType: key,
          message: `Лимит ${key} превышен`,
          exceeded: true,
          ...stats
        });
      } else if (stats.percentage >= 80) {
        newNotifications.push({
          id: `${key}-warning`,
          type: 'warning',
          limitType: key,
          message: `Приближение к лимиту ${key}`,
          exceeded: false,
          ...stats
        });
      }
    });

    setNotifications(newNotifications);
  }, [usageStats]);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    dismissNotification,
    hasExceededLimits: notifications.some(n => n.exceeded),
    hasWarnings: notifications.some(n => !n.exceeded)
  };
};

export default usePlanLimits;

