import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Copy, 
  QrCode, 
  ExternalLink, 
  Share2, 
  Download,
  Eye,
  Users,
  Target,
  Gift,
  Calendar,
  Hash,
  Link,
  Smartphone,
  Globe,
  BarChart3,
  Zap,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';

const CampaignSummary = ({ campaignData, channelConfigs, onSave, onEdit }) => {
  const [generatedLinks, setGeneratedLinks] = useState({});
  const [qrCodes, setQrCodes] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);

  // Генерация превью ссылок и QR-кодов
  useEffect(() => {
    generatePreviewLinks();
  }, [campaignData, channelConfigs]);

  const generatePreviewLinks = () => {
    const links = {};
    const qrs = {};
    
    Object.keys(channelConfigs).forEach(channelId => {
      const config = channelConfigs[channelId];
      const baseUrl = 'https://dinorefs.com/r/';
      const shortCode = generateShortCode();
      
      // Генерация ссылки с UTM параметрами
      const utmParams = new URLSearchParams({
        utm_source: config.utm_source || channelId,
        utm_medium: config.utm_medium || 'referral',
        utm_campaign: config.utm_campaign || campaignData.title.toLowerCase().replace(/\s+/g, '-'),
        utm_content: channelId
      });
      
      links[channelId] = {
        short: `${baseUrl}${shortCode}`,
        full: `${baseUrl}${shortCode}?${utmParams.toString()}`,
        qr: `${baseUrl}qr/${shortCode}`,
        shortCode
      };
      
      // Генерация QR-кода (в реальном приложении это будет API вызов)
      qrs[channelId] = `data:image/svg+xml;base64,${btoa(generateQRSVG(links[channelId].full))}`;
    });
    
    setGeneratedLinks(links);
    setQrCodes(qrs);
  };

  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateQRSVG = (url) => {
    // Простая заглушка для QR-кода
    return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <rect x="10" y="10" width="80" height="80" fill="black"/>
      <rect x="20" y="20" width="60" height="60" fill="white"/>
      <text x="50" y="55" text-anchor="middle" font-size="8" fill="black">QR</text>
    </svg>`;
  };

  const copyToClipboard = async (text, linkId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const downloadQR = (channelId, channelName) => {
    const qrData = qrCodes[channelId];
    if (qrData) {
      const link = document.createElement('a');
      link.href = qrData;
      link.download = `qr-${channelName}-${campaignData.title}.svg`;
      link.click();
    }
  };

  const getTotalSteps = () => {
    return Object.values(channelConfigs).reduce((total, config) => {
      return total + (config.steps?.length || 0);
    }, 0);
  };

  const getTotalRewards = () => {
    return Object.values(channelConfigs).reduce((total, config) => {
      return total + (config.steps?.reduce((stepTotal, step) => {
        return stepTotal + (step.reward_points || 0);
      }, 0) || 0);
    }, 0);
  };

  const getChannelInfo = (channelId) => {
    // Получение информации о канале из ChannelSelector
    const channelMap = {
      telegram: { name: 'Telegram', icon: '📱', color: 'bg-blue-500' },
      vk: { name: 'ВКонтакте', icon: '🔵', color: 'bg-blue-600' },
      instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
      youtube: { name: 'YouTube', icon: '📺', color: 'bg-red-500' },
      website: { name: 'Сайт', icon: '🌐', color: 'bg-gray-500' },
      offline: { name: 'Офлайн', icon: '🏪', color: 'bg-purple-500' }
    };
    
    return channelMap[channelId] || { name: channelId, icon: '📱', color: 'bg-gray-500' };
  };

  const CampaignTreeVisualization = () => {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          Схема реферальной кампании
        </h4>
        
        <div className="space-y-4">
          {/* Корневая кампания */}
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg">
              <Award className="w-5 h-5 mr-2" />
              <span className="font-semibold">{campaignData.title}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{campaignData.description}</p>
          </div>

          {/* Ветки каналов */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
              {Object.keys(channelConfigs).map(channelId => {
                const config = channelConfigs[channelId];
                const channelInfo = getChannelInfo(channelId);
                
                return (
                  <div key={channelId} className="relative">
                    {/* Линия соединения */}
                    <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 transform -translate-x-1/2 -translate-y-8"></div>
                    
                    {/* Канал */}
                    <div className={`${channelInfo.color} text-white rounded-lg p-4 shadow-md`}>
                      <div className="flex items-center justify-center mb-3">
                        <span className="text-2xl mr-2">{channelInfo.icon}</span>
                        <span className="font-medium">{channelInfo.name}</span>
                      </div>
                      
                      {/* Шаги канала */}
                      <div className="space-y-2">
                        {config.steps?.map((step, index) => (
                          <div key={step.id} className="bg-white bg-opacity-20 rounded px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {index + 1}. {getStepTypeName(step.type)}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Gift className="w-3 h-3" />
                                <span className="text-xs">{step.reward_points}</span>
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center text-white text-opacity-70 text-sm">
                            Нет шагов
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStepTypeName = (type) => {
    const stepNames = {
      registration: 'Регистрация',
      email_confirmation: 'Email',
      phone_confirmation: 'Телефон',
      purchase_confirmation: 'Покупка',
      photo_upload: 'Фото',
      content_view: 'Просмотр',
      quiz_completion: 'Тест',
      social_share: 'Репост',
      subscription: 'Подписка',
      form_submission: 'Форма'
    };
    return stepNames[type] || type;
  };

  const LinkCard = ({ channelId, channelName, links }) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getChannelInfo(channelId).icon}</span>
            <h4 className="font-medium text-gray-900">{channelName}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => downloadQR(channelId, channelName)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Скачать QR-код"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Короткая ссылка */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Короткая ссылка
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={links.short}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => copyToClipboard(links.short, `${channelId}-short`)}
                className={`p-2 rounded-md transition-colors ${
                  copiedLink === `${channelId}-short`
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {copiedLink === `${channelId}-short` ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Полная ссылка с UTM */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Полная ссылка с UTM
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={links.full}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => copyToClipboard(links.full, `${channelId}-full`)}
                className={`p-2 rounded-md transition-colors ${
                  copiedLink === `${channelId}-full`
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {copiedLink === `${channelId}-full` ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* QR-код */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                QR-код
              </label>
              <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
                <img 
                  src={qrCodes[channelId]} 
                  alt="QR Code" 
                  className="w-12 h-12"
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Код: {links.shortCode}</div>
              <div className="flex space-x-1">
                <button
                  onClick={() => copyToClipboard(links.qr, `${channelId}-qr`)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  Копировать QR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, title, value, description, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200"
    };

    return (
      <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs opacity-75">{description}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Подтверждение кампании
        </h3>
        <p className="text-gray-600">
          Проверьте настройки и получите ссылки для распространения
        </p>
      </div>

      {/* Статистика кампании */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          title="Каналов"
          value={Object.keys(channelConfigs).length}
          description="Настроено каналов"
          color="blue"
        />
        <StatCard
          icon={Target}
          title="Шагов"
          value={getTotalSteps()}
          description="Всего шагов"
          color="green"
        />
        <StatCard
          icon={Gift}
          title="Баллов"
          value={getTotalRewards()}
          description="Максимум наград"
          color="purple"
        />
        <StatCard
          icon={Calendar}
          title="Тип"
          value={campaignData.campaign_type}
          description="Тип кампании"
          color="orange"
        />
      </div>

      {/* Визуализация древа */}
      <CampaignTreeVisualization />

      {/* Детали кампании */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Детали кампании</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Основная информация</h5>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Название:</span> {campaignData.title}</div>
              <div><span className="text-gray-600">Описание:</span> {campaignData.description}</div>
              <div><span className="text-gray-600">Тип:</span> {campaignData.campaign_type}</div>
              <div><span className="text-gray-600">Дата окончания:</span> {campaignData.end_date || 'Не указана'}</div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Система наград</h5>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Тип награды:</span> {campaignData.reward_type}</div>
              <div><span className="text-gray-600">Значение:</span> {campaignData.reward_value}</div>
              <div><span className="text-gray-600">Описание:</span> {campaignData.reward_description}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Реферальные ссылки */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Link className="w-5 h-5 mr-2 text-blue-600" />
          Реферальные ссылки
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(channelConfigs).map(channelId => {
            const channelInfo = getChannelInfo(channelId);
            const links = generatedLinks[channelId];
            
            return links ? (
              <LinkCard
                key={channelId}
                channelId={channelId}
                channelName={channelInfo.name}
                links={links}
              />
            ) : null;
          })}
        </div>
      </div>

      {/* Превью для соцсетей */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Share2 className="w-5 h-5 mr-2 text-green-600" />
          Превью для социальных сетей
        </h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🦕</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">DinoRefs</div>
              <div className="text-sm text-gray-500">dinorefs.com</div>
            </div>
          </div>
          <div className="mb-3">
            <div className="font-medium text-gray-900 mb-1">{campaignData.title}</div>
            <div className="text-sm text-gray-600">{campaignData.description}</div>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>Просмотры</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Конверсия</span>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Редактировать
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => onSave(false)}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
          >
            Сохранить как черновик
          </button>
          <button
            onClick={() => onSave(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Запустить кампанию</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignSummary;

