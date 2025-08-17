import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Info } from 'lucide-react';
import ChannelSelector from './referrals/ChannelSelector';
import CampaignTypeSelector from './referrals/CampaignTypeSelector';
import ChannelConfiguration from './referrals/ChannelConfiguration';
import CampaignSummary from './referrals/CampaignSummary';

const ReferralCampaignWizard = ({ isOpen, onClose, onSave, initialData = null, isEditing = false }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    title: '',
    description: '',
    campaign_type: '',
    selected_channels: [],
    channel_configs: {},
    end_date: '',
    reward_type: 'points',
    reward_value: 0,
    reward_description: ''
  });

  // Инициализация данных при редактировании
  useEffect(() => {
    if (isEditing && initialData) {
      setCampaignData({
        title: initialData.title || '',
        description: initialData.description || '',
        campaign_type: initialData.campaign_type || '',
        selected_channels: initialData.channels?.map(ch => ch.channel_type) || [],
        channel_configs: initialData.channels?.reduce((acc, ch) => {
          acc[ch.channel_type] = {
            utm_source: ch.utm_source || '',
            utm_campaign: ch.utm_campaign || '',
            steps: ch.steps || []
          };
          return acc;
        }, {}) || {},
        end_date: initialData.end_date || '',
        reward_type: initialData.reward_type || 'points',
        reward_value: initialData.reward_value || 0,
        reward_description: initialData.reward_description || ''
      });
    } else if (!isEditing) {
      // Сброс данных при создании новой кампании
      setCampaignData({
        title: '',
        description: '',
        campaign_type: '',
        selected_channels: [],
        channel_configs: {},
        end_date: '',
        reward_type: 'points',
        reward_value: 0,
        reward_description: ''
      });
    }
  }, [isEditing, initialData, isOpen]);

  const steps = [
    { id: 1, title: 'Выбор каналов', description: 'Выберите каналы распространения' },
    { id: 2, title: 'Цель кампании', description: 'Определите тип и цель кампании' },
    { id: 3, title: 'Настройка каналов', description: 'Настройте параметры каждого канала' },
    { id: 4, title: 'Подтверждение', description: 'Проверьте и сохраните кампанию' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChannelSelect = (channels) => {
    setCampaignData(prev => ({
      ...prev,
      selected_channels: channels
    }));
  };

  const handleCampaignTypeSelect = (type, config) => {
    setCampaignData(prev => ({
      ...prev,
      campaign_type: type,
      ...config
    }));
  };

  const handleChannelConfig = (channelId, config) => {
    setCampaignData(prev => ({
      ...prev,
      channel_configs: {
        ...prev.channel_configs,
        [channelId]: config
      }
    }));
  };

  const handleSave = async (isActive = true) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const finalData = {
        title: campaignData.title,
        description: campaignData.description,
        campaign_type: campaignData.campaign_type,
        end_date: campaignData.end_date,
        reward_type: campaignData.reward_type,
        reward_value: campaignData.reward_value,
        reward_description: campaignData.reward_description,
        is_active: isActive
      };

      const response = await fetch('http://localhost:5002/api/referrals/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания кампании');
      }

      const result = await response.json();
      console.log('Кампания создана:', result);
      
      // Вызываем callback для обновления списка кампаний
      if (onSave) {
        await onSave(result.campaign);
      }
      
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения кампании:', error);
      alert('Ошибка создания кампании: ' + error.message);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Шаг 1: Должен быть выбран хотя бы один канал
        return campaignData.selected_channels.length > 0;
      case 2:
        // Шаг 2: Должны быть выбраны тип кампании и заполнено название
        return campaignData.campaign_type && 
               campaignData.title && 
               campaignData.title.trim().length >= 3;
      case 3:
        // Шаг 3: Упрощенная валидация - просто проверяем что каналы выбраны
        return campaignData.selected_channels.length > 0;
      case 4:
        // Шаг 4: Все данные должны быть заполнены
        return campaignData.title && 
               campaignData.campaign_type && 
               campaignData.selected_channels.length > 0 &&
               campaignData.description;
      default:
        return false;
    }
  };

  const getValidationMessage = () => {
    switch (currentStep) {
      case 1:
        if (campaignData.selected_channels.length === 0) {
          return "Выберите хотя бы один канал распространения";
        }
        break;
      case 2:
        if (!campaignData.campaign_type) {
          return "Выберите тип кампании";
        }
        if (!campaignData.title || campaignData.title.trim().length < 3) {
          return "Введите название кампании (минимум 3 символа)";
        }
        break;
      case 3:
        if (campaignData.selected_channels.length === 0) {
          return "Выберите каналы распространения";
        }
        break;
      case 4:
        if (!campaignData.description) {
          return "Добавьте описание кампании";
        }
        break;
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Редактирование кампании' : 'Создание реферальной кампании'}
            </h2>
            <p className="text-gray-600 mt-1">
              {steps[currentStep - 1].description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Прогресс */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                  }
                `}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(80vh - 300px)' }}>
          {currentStep === 1 && (
            <ChannelSelector
              selectedChannels={campaignData.selected_channels}
              onChannelSelect={handleChannelSelect}
            />
          )}

          {currentStep === 2 && (
            <CampaignTypeSelector
              selectedType={campaignData.campaign_type}
              campaignData={campaignData}
              onTypeSelect={handleCampaignTypeSelect}
              onDataChange={setCampaignData}
            />
          )}

          {currentStep === 3 && (
            <ChannelConfiguration
              selectedChannels={campaignData.selected_channels}
              campaignType={campaignData.campaign_type}
              onConfigChange={(configs) => setCampaignData(prev => ({
                ...prev,
                channel_configs: configs
              }))}
            />
          )}

          {currentStep === 4 && (
            <CampaignSummary
              campaignData={campaignData}
              channelConfigs={campaignData.channel_configs}
              onSave={(isActive) => handleSave(isActive)}
              onEdit={() => setCurrentStep(1)}
            />
          )}
        </div>
        {/* Кнопки навигации */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`
              flex items-center px-4 py-2 rounded-lg font-medium transition-all
              ${currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </button>

          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Info className="w-4 h-4 mr-1" />
              Шаг {currentStep} из {steps.length}
            </div>
            {!canProceed() && getValidationMessage() && (
              <div className="text-sm text-red-500 text-center">
                {getValidationMessage()}
              </div>
            )}
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`
                flex items-center px-6 py-2 rounded-lg font-medium transition-all
                ${canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Далее
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4 mr-2" />
              Создать кампанию
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralCampaignWizard;

