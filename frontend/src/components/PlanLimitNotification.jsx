import React from 'react';
import { AlertTriangle, Crown, Zap, ArrowUp } from 'lucide-react';
import { getPlanLimits, getRecommendedUpgrade } from '../utils/planLimits';

const PlanLimitNotification = ({ 
  planId, 
  limitType, 
  currentValue, 
  exceeded, 
  onUpgrade,
  className = '' 
}) => {
  const limits = getPlanLimits(planId);
  const recommendedPlan = getRecommendedUpgrade(planId);
  
  if (!exceeded) return null;

  const limitNames = {
    maxProjects: 'проектов',
    maxCampaigns: 'кампаний',
    maxReferrals: 'рефералов'
  };

  const limitName = limitNames[limitType] || 'элементов';
  const maxValue = limits[limitType];

  const getUpgradeIcon = () => {
    switch (recommendedPlan) {
      case 'starter':
        return '🦕';
      case 'growth':
        return '🦖';
      case 'enterprise':
        return '👑';
      default:
        return '⭐';
    }
  };

  const getUpgradePlanName = () => {
    const upgradeLimits = getPlanLimits(recommendedPlan);
    return upgradeLimits.name;
  };

  return (
    <div className={`bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-orange-800 mb-1">
            Лимит {limitName} превышен
          </h3>
          
          <p className="text-sm text-orange-700 mb-3">
            Вы достигли лимита {limitName} для плана <strong>{limits.name}</strong> 
            ({currentValue} из {maxValue === Infinity ? '∞' : maxValue}).
            {recommendedPlan && ' Обновите план для продолжения работы.'}
          </p>

          {recommendedPlan && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <span>{getUpgradeIcon()}</span>
                <span>Рекомендуем план <strong>{getUpgradePlanName()}</strong></span>
              </div>
              
              <button
                onClick={onUpgrade}
                className="inline-flex items-center px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors"
              >
                <ArrowUp className="w-4 h-4 mr-1" />
                Обновить план
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент предупреждения о приближении к лимиту
export const PlanLimitWarning = ({ 
  planId, 
  limitType, 
  currentValue, 
  percentage,
  onUpgrade,
  className = '' 
}) => {
  const limits = getPlanLimits(planId);
  const maxValue = limits[limitType];
  
  // Показываем предупреждение при 80% использования
  if (percentage < 80 || maxValue === Infinity) return null;

  const limitNames = {
    maxProjects: 'проектов',
    maxCampaigns: 'кампаний',
    maxReferrals: 'рефералов'
  };

  const limitName = limitNames[limitType] || 'элементов';
  const remaining = maxValue - currentValue;

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Zap className="w-5 h-5 text-yellow-500" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            <strong>Внимание!</strong> У вас осталось {remaining} {limitName} 
            из {maxValue} в плане {limits.name}.
          </p>
        </div>
        
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
          >
            Обновить план
          </button>
        )}
      </div>
    </div>
  );
};

// Компонент отображения статистики использования плана
export const PlanUsageStats = ({ planId, usage, onUpgrade, className = '' }) => {
  const limits = getPlanLimits(planId);
  
  const stats = [
    {
      label: 'Проекты',
      current: usage.projects || 0,
      max: limits.maxProjects,
      type: 'maxProjects'
    },
    {
      label: 'Кампании',
      current: usage.campaigns || 0,
      max: limits.maxCampaigns,
      type: 'maxCampaigns'
    },
    {
      label: 'Рефералы',
      current: usage.referrals || 0,
      max: limits.maxReferrals,
      type: 'maxReferrals'
    }
  ];

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Использование плана {limits.name}
        </h3>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Обновить план
          </button>
        )}
      </div>

      <div className="space-y-4">
        {stats.map((stat) => {
          const percentage = stat.max === Infinity ? 0 : (stat.current / stat.max) * 100;
          const isUnlimited = stat.max === Infinity;
          
          return (
            <div key={stat.type}>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{stat.label}</span>
                <span>
                  {stat.current} / {isUnlimited ? '∞' : stat.max}
                </span>
              </div>
              
              {!isUnlimited && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              )}
              
              {isUnlimited && (
                <div className="flex items-center text-sm text-green-600">
                  <Crown className="w-4 h-4 mr-1" />
                  <span>Неограниченно</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanLimitNotification;

