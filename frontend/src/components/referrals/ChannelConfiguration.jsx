import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  Link,
  Hash,
  MessageSquare,
  FileText,
  Camera,
  ShoppingCart,
  UserPlus,
  Mail,
  Phone,
  Play,
  HelpCircle,
  Gift,
  Calendar,
  Target
} from 'lucide-react';

const ChannelConfiguration = ({ selectedChannels, campaignType, onConfigChange }) => {
  const [channelConfigs, setChannelConfigs] = useState({});
  const [activeChannel, setActiveChannel] = useState(null);

  // Типы шагов подтверждения
  const stepTypes = [
    {
      id: 'registration',
      title: 'Регистрация на ресурсе',
      description: 'Пользователь должен зарегистрироваться',
      icon: UserPlus,
      color: 'bg-blue-500',
      fields: ['url', 'description']
    },
    {
      id: 'email_confirmation',
      title: 'Подтверждение email',
      description: 'Подтверждение подписки по email',
      icon: Mail,
      color: 'bg-green-500',
      fields: ['email_template', 'description']
    },
    {
      id: 'phone_confirmation',
      title: 'Подтверждение телефона',
      description: 'SMS подтверждение номера телефона',
      icon: Phone,
      color: 'bg-purple-500',
      fields: ['sms_template', 'description']
    },
    {
      id: 'purchase_confirmation',
      title: 'Подтверждение покупки',
      description: 'Прикрепление чека или подтверждение заказа',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      fields: ['min_amount', 'description']
    },
    {
      id: 'photo_upload',
      title: 'Загрузка фото',
      description: 'Прикрепление фотографии или скриншота',
      icon: Camera,
      color: 'bg-pink-500',
      fields: ['photo_requirements', 'description']
    },
    {
      id: 'content_view',
      title: 'Просмотр контента',
      description: 'Просмотр видео или чтение статьи',
      icon: Play,
      color: 'bg-red-500',
      fields: ['content_url', 'min_duration', 'description']
    },
    {
      id: 'quiz_completion',
      title: 'Прохождение теста',
      description: 'Ответы на вопросы или викторина',
      icon: HelpCircle,
      color: 'bg-indigo-500',
      fields: ['quiz_questions', 'passing_score', 'description']
    },
    {
      id: 'social_share',
      title: 'Репост в соцсетях',
      description: 'Поделиться постом в социальных сетях',
      icon: MessageSquare,
      color: 'bg-cyan-500',
      fields: ['post_template', 'hashtags', 'description']
    },
    {
      id: 'subscription',
      title: 'Подписка на канал',
      description: 'Подписка на канал или группу',
      icon: UserPlus,
      color: 'bg-yellow-500',
      fields: ['channel_url', 'description']
    },
    {
      id: 'form_submission',
      title: 'Заполнение формы',
      description: 'Заполнение анкеты или опроса',
      icon: FileText,
      color: 'bg-gray-500',
      fields: ['form_fields', 'description']
    }
  ];

  // Рекомендуемые шаги для разных типов кампаний
  const recommendedSteps = {
    invitation: ['registration', 'email_confirmation'],
    promotion: ['social_share', 'subscription', 'content_view'],
    contest: ['photo_upload', 'social_share', 'form_submission'],
    event: ['registration', 'email_confirmation', 'calendar_add'],
    lead_generation: ['form_submission', 'email_confirmation', 'phone_confirmation']
  };

  useEffect(() => {
    // Инициализация конфигураций для выбранных каналов
    const initialConfigs = {};
    selectedChannels.forEach(channel => {
      if (!channelConfigs[channel.id]) {
        initialConfigs[channel.id] = {
          steps: getRecommendedStepsForCampaign(),
          utm_source: channel.id,
          utm_medium: 'referral',
          utm_campaign: '',
          custom_fields: {}
        };
      }
    });
    
    if (Object.keys(initialConfigs).length > 0) {
      setChannelConfigs(prev => ({ ...prev, ...initialConfigs }));
    }
  }, [selectedChannels, campaignType]);

  const getRecommendedStepsForCampaign = () => {
    const recommended = recommendedSteps[campaignType] || ['registration'];
    return recommended.map((stepId, index) => ({
      id: `step_${Date.now()}_${index}`,
      type: stepId,
      order: index + 1,
      required: index === 0,
      reward_points: index === 0 ? 10 : 5,
      config: {}
    }));
  };

  const addStep = (channelId) => {
    const config = channelConfigs[channelId];
    const newStep = {
      id: `step_${Date.now()}`,
      type: 'registration',
      order: config.steps.length + 1,
      required: false,
      reward_points: 5,
      config: {}
    };

    setChannelConfigs(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        steps: [...prev[channelId].steps, newStep]
      }
    }));
  };

  const removeStep = (channelId, stepId) => {
    setChannelConfigs(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        steps: prev[channelId].steps.filter(step => step.id !== stepId)
      }
    }));
  };

  const updateStep = (channelId, stepId, updates) => {
    setChannelConfigs(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        steps: prev[channelId].steps.map(step =>
          step.id === stepId ? { ...step, ...updates } : step
        )
      }
    }));
  };

  const moveStep = (channelId, stepId, direction) => {
    const config = channelConfigs[channelId];
    const stepIndex = config.steps.findIndex(step => step.id === stepId);
    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    
    if (newIndex >= 0 && newIndex < config.steps.length) {
      const newSteps = [...config.steps];
      [newSteps[stepIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[stepIndex]];
      
      // Обновляем порядок
      newSteps.forEach((step, index) => {
        step.order = index + 1;
      });

      setChannelConfigs(prev => ({
        ...prev,
        [channelId]: {
          ...prev[channelId],
          steps: newSteps
        }
      }));
    }
  };

  useEffect(() => {
    onConfigChange(channelConfigs);
  }, [channelConfigs, onConfigChange]);

  const getStepTypeInfo = (typeId) => {
    return stepTypes.find(type => type.id === typeId) || stepTypes[0];
  };

  const StepCard = ({ channelId, step, index }) => {
    const stepType = getStepTypeInfo(step.type);
    const IconComponent = stepType.icon;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              <div className={`w-8 h-8 ${stepType.color} rounded-lg flex items-center justify-center`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{stepType.title}</h4>
              <p className="text-sm text-gray-500">{stepType.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => moveStep(channelId, step.id, 'up')}
              disabled={index === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ↑
            </button>
            <button
              onClick={() => moveStep(channelId, step.id, 'down')}
              disabled={index === channelConfigs[channelId].steps.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ↓
            </button>
            <button
              onClick={() => removeStep(channelId, step.id)}
              className="p-1 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип шага
            </label>
            <select
              value={step.type}
              onChange={(e) => updateStep(channelId, step.id, { type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stepTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Награда (баллы)
            </label>
            <input
              type="number"
              value={step.reward_points}
              onChange={(e) => updateStep(channelId, step.id, { reward_points: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание для пользователя
            </label>
            <textarea
              value={step.config.description || ''}
              onChange={(e) => updateStep(channelId, step.id, { 
                config: { ...step.config, description: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Опишите, что должен сделать пользователь..."
            />
          </div>

          <div className="md:col-span-2 flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={step.required}
                onChange={(e) => updateStep(channelId, step.id, { required: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Обязательный шаг</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const ChannelConfigCard = ({ channel }) => {
    const config = channelConfigs[channel.id] || { steps: [] };

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${channel.color} rounded-lg flex items-center justify-center`}>
              <channel.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
              <p className="text-sm text-gray-500">{config.steps.length} шагов настроено</p>
            </div>
          </div>
          <button
            onClick={() => setActiveChannel(activeChannel === channel.id ? null : channel.id)}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" />
            <span>Настроить</span>
          </button>
        </div>

        {activeChannel === channel.id && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UTM Source
                </label>
                <input
                  type="text"
                  value={config.utm_source || channel.id}
                  onChange={(e) => setChannelConfigs(prev => ({
                    ...prev,
                    [channel.id]: { ...prev[channel.id], utm_source: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UTM Campaign
                </label>
                <input
                  type="text"
                  value={config.utm_campaign || ''}
                  onChange={(e) => setChannelConfigs(prev => ({
                    ...prev,
                    [channel.id]: { ...prev[channel.id], utm_campaign: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Название кампании"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-900">Шаги выполнения</h4>
                <button
                  onClick={() => addStep(channel.id)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить шаг</span>
                </button>
              </div>

              {config.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Нет настроенных шагов</p>
                  <p className="text-sm">Добавьте первый шаг для начала</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {config.steps.map((step, index) => (
                    <StepCard
                      key={step.id}
                      channelId={channel.id}
                      step={step}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Настройка шагов подтверждения
        </h3>
        <p className="text-gray-600">
          Настройте шаги, которые должны выполнить пользователи для каждого канала
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Советы по настройке</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Первый шаг должен быть простым для выполнения</li>
              <li>• Используйте прогрессивную систему наград</li>
              <li>• Добавляйте описания для каждого шага</li>
              <li>• Не делайте слишком много обязательных шагов</li>
            </ul>
          </div>
        </div>
      </div>

      {selectedChannels.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Каналы не выбраны</h3>
          <p>Вернитесь к первому шагу и выберите каналы распространения</p>
        </div>
      ) : (
        <div>
          {selectedChannels.map(channel => (
            <ChannelConfigCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelConfiguration;

