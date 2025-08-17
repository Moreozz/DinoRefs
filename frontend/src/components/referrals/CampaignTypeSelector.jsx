import React, { useState } from 'react';
import { 
  UserPlus, 
  TrendingUp, 
  Trophy, 
  Calendar, 
  Target,
  Gift,
  Star,
  Zap,
  Check,
  Info
} from 'lucide-react';

const CampaignTypeSelector = ({ selectedType, campaignData, onTypeSelect, onDataChange }) => {
  const [hoveredType, setHoveredType] = useState(null);

  const campaignTypes = [
    {
      id: 'invitation',
      name: 'Приглашение человека',
      description: 'Привлечение новых пользователей в сервис',
      icon: UserPlus,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      examples: ['Регистрация', 'Подтверждение email', 'Первый вход'],
      defaultReward: { type: 'points', value: 100, description: 'Баллы за приглашение' },
      popular: true
    },
    {
      id: 'promotion',
      name: 'Популяризация продукта',
      description: 'Продвижение товара или услуги',
      icon: TrendingUp,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-500',
      examples: ['Репост', 'Лайк', 'Комментарий', 'Подписка'],
      defaultReward: { type: 'discount', value: 10, description: 'Скидка 10%' },
      popular: true
    },
    {
      id: 'contest',
      name: 'Участие в конкурсе',
      description: 'Конкурсы и розыгрыши призов',
      icon: Trophy,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
      examples: ['Подписка', 'Репост', 'Отметка друзей', 'Фото с товаром'],
      defaultReward: { type: 'prize', value: 1, description: 'Участие в розыгрыше' },
      popular: true
    },
    {
      id: 'event',
      name: 'Мероприятие/вебинар',
      description: 'Привлечение участников на события',
      icon: Calendar,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-500',
      examples: ['Регистрация', 'Подтверждение участия', 'Приглашение друзей'],
      defaultReward: { type: 'access', value: 1, description: 'Доступ к мероприятию' }
    },
    {
      id: 'lead_generation',
      name: 'Лидогенерация',
      description: 'Сбор контактов потенциальных клиентов',
      icon: Target,
      color: 'bg-red-500',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-500',
      examples: ['Заполнение формы', 'Подписка на рассылку', 'Скачивание материала'],
      defaultReward: { type: 'bonus', value: 500, description: 'Бонус за лид' }
    }
  ];

  const rewardTypes = [
    { id: 'points', name: 'Баллы', icon: Star, description: 'Начисление баллов' },
    { id: 'discount', name: 'Скидка', icon: Gift, description: 'Процентная скидка' },
    { id: 'bonus', name: 'Бонус', icon: Zap, description: 'Денежный бонус' },
    { id: 'prize', name: 'Приз', icon: Trophy, description: 'Физический приз' },
    { id: 'access', name: 'Доступ', icon: Target, description: 'Доступ к контенту' }
  ];

  const handleTypeSelect = (type) => {
    const defaultReward = type.defaultReward;
    onTypeSelect(type.id, {
      reward_type: defaultReward.type,
      reward_value: defaultReward.value,
      reward_description: defaultReward.description
    });
  };

  const handleInputChange = (field, value) => {
    onDataChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedTypeData = campaignTypes.find(type => type.id === selectedType);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Определите цель кампании
        </h3>
        <p className="text-gray-600">
          Выберите тип кампании и настройте основные параметры
        </p>
      </div>

      {/* Выбор типа кампании */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Тип кампании</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            const isHovered = hoveredType === type.id;
            
            return (
              <div
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                onMouseEnter={() => setHoveredType(type.id)}
                onMouseLeave={() => setHoveredType(null)}
                className={`
                  relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform
                  ${isSelected 
                    ? `${type.bgLight} ${type.borderColor} scale-105` 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:scale-105'
                  }
                  ${isHovered ? 'shadow-lg' : 'shadow-sm'}
                `}
              >
                {/* Популярный тег */}
                {type.popular && (
                  <div className="absolute -top-2 -left-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                    Популярный
                  </div>
                )}

                {/* Чекбокс */}
                {isSelected && (
                  <div className={`
                    absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center
                    ${type.color} text-white shadow-lg
                  `}>
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                {/* Иконка */}
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors
                  ${isSelected ? type.color : 'bg-gray-100'}
                `}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                
                {/* Название */}
                <h5 className={`font-semibold mb-2 ${isSelected ? type.textColor : 'text-gray-900'}`}>
                  {type.name}
                </h5>
                
                {/* Описание */}
                <p className="text-sm text-gray-500 mb-3">
                  {type.description}
                </p>

                {/* Примеры шагов */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Типичные шаги:
                  </p>
                  {type.examples.slice(0, 3).map((example, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Настройки кампании */}
      {selectedType && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-6">
          <h4 className="text-lg font-semibold text-gray-900">Настройки кампании</h4>
          
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название кампании *
              </label>
              <input
                type="text"
                value={campaignData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Введите название кампании"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  campaignData.title && campaignData.title.trim().length < 3 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                }`}
              />
              {campaignData.title && campaignData.title.trim().length < 3 && (
                <p className="text-sm text-red-500 mt-1">
                  Название должно содержать минимум 3 символа
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                value={campaignData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание кампании
            </label>
            <textarea
              value={campaignData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Опишите цели и условия кампании"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Настройка наград */}
          <div>
            <h5 className="text-md font-semibold text-gray-900 mb-4">Система наград</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип награды
                </label>
                <select
                  value={campaignData.reward_type}
                  onChange={(e) => handleInputChange('reward_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {rewardTypes.map((reward) => (
                    <option key={reward.id} value={reward.id}>
                      {reward.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер награды
                </label>
                <input
                  type="number"
                  value={campaignData.reward_value}
                  onChange={(e) => handleInputChange('reward_value', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание награды
                </label>
                <input
                  type="text"
                  value={campaignData.reward_description}
                  onChange={(e) => handleInputChange('reward_description', e.target.value)}
                  placeholder="Описание награды"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Информация о выбранном типе */}
          {selectedTypeData && (
            <div className={`${selectedTypeData.bgLight} border ${selectedTypeData.borderColor} rounded-lg p-4`}>
              <div className="flex items-start">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center mr-3
                  ${selectedTypeData.color}
                `}>
                  <selectedTypeData.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h6 className={`font-semibold ${selectedTypeData.textColor}`}>
                    {selectedTypeData.name}
                  </h6>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTypeData.description}
                  </p>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Рекомендуемые шаги:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTypeData.examples.map((example, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white text-xs text-gray-600 rounded-md border"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Подсказка */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h5 className="text-blue-800 font-medium">Совет по выбору типа кампании</h5>
            <p className="text-blue-700 text-sm mt-1">
              Выбирайте тип кампании исходя из ваших бизнес-целей. 
              Для привлечения новых пользователей используйте "Приглашение человека", 
              для увеличения узнаваемости бренда - "Популяризация продукта".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignTypeSelector;

