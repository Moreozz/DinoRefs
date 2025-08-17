import React, { useState } from 'react';
import { 
  MessageCircle, 
  Instagram, 
  Youtube, 
  Globe, 
  Users, 
  Mail,
  Phone,
  MapPin,
  Newspaper,
  Radio,
  Tv,
  Megaphone,
  Check
} from 'lucide-react';

const ChannelSelector = ({ selectedChannels, onChannelSelect }) => {
  const [hoveredChannel, setHoveredChannel] = useState(null);

  const channels = [
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Каналы, чаты, боты',
      icon: MessageCircle,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      popular: true
    },
    {
      id: 'vk',
      name: 'ВКонтакте',
      description: 'Группы, сообщества, посты',
      icon: Users,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      textColor: 'text-indigo-600',
      bgLight: 'bg-indigo-50',
      popular: true
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Stories, посты, IGTV',
      icon: Instagram,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
      textColor: 'text-pink-600',
      bgLight: 'bg-pink-50',
      popular: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Видео, Shorts, каналы',
      icon: Youtube,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50',
      popular: true
    },
    {
      id: 'website',
      name: 'Сайт',
      description: 'Блог, лендинг, баннеры',
      icon: Globe,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Рассылки, подписи',
      icon: Mail,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      textColor: 'text-yellow-600',
      bgLight: 'bg-yellow-50'
    },
    {
      id: 'sms',
      name: 'SMS',
      description: 'Текстовые сообщения',
      icon: Phone,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50'
    },
    {
      id: 'offline',
      name: 'Офлайн',
      description: 'QR-коды, флаеры, визитки',
      icon: MapPin,
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      textColor: 'text-gray-600',
      bgLight: 'bg-gray-50'
    },
    {
      id: 'press',
      name: 'Пресса',
      description: 'СМИ, новости, статьи',
      icon: Newspaper,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      textColor: 'text-orange-600',
      bgLight: 'bg-orange-50'
    },
    {
      id: 'radio',
      name: 'Радио',
      description: 'Радиостанции, подкасты',
      icon: Radio,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600',
      textColor: 'text-teal-600',
      bgLight: 'bg-teal-50'
    },
    {
      id: 'tv',
      name: 'ТВ',
      description: 'Телевидение, реклама',
      icon: Tv,
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-600',
      textColor: 'text-cyan-600',
      bgLight: 'bg-cyan-50'
    },
    {
      id: 'other',
      name: 'Другое',
      description: 'Прочие каналы',
      icon: Megaphone,
      color: 'bg-slate-500',
      hoverColor: 'hover:bg-slate-600',
      textColor: 'text-slate-600',
      bgLight: 'bg-slate-50'
    }
  ];

  const handleChannelToggle = (channel) => {
    const isSelected = selectedChannels.some(c => c.id === channel.id);
    
    if (isSelected) {
      onChannelSelect(selectedChannels.filter(c => c.id !== channel.id));
    } else {
      onChannelSelect([...selectedChannels, channel]);
    }
  };

  const isChannelSelected = (channelId) => {
    return selectedChannels.some(c => c.id === channelId);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Выберите каналы распространения
        </h3>
        <p className="text-gray-600">
          Выберите один или несколько каналов для продвижения вашей кампании
        </p>
      </div>

      {/* Популярные каналы */}
      <div>
        <div className="flex items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Популярные каналы</h4>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Рекомендуем
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {channels.filter(channel => channel.popular).map((channel) => {
            const Icon = channel.icon;
            const isSelected = isChannelSelected(channel.id);
            const isHovered = hoveredChannel === channel.id;
            
            return (
              <div
                key={channel.id}
                onClick={() => handleChannelToggle(channel)}
                onMouseEnter={() => setHoveredChannel(channel.id)}
                onMouseLeave={() => setHoveredChannel(null)}
                className={`
                  relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform
                  ${isSelected 
                    ? `${channel.bgLight} border-2 ${channel.textColor.replace('text-', 'border-')} scale-105` 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:scale-105'
                  }
                  ${isHovered ? 'shadow-lg' : 'shadow-sm'}
                `}
              >
                {/* Чекбокс */}
                {isSelected && (
                  <div className={`
                    absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center
                    ${channel.color} text-white shadow-lg
                  `}>
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                {/* Иконка */}
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors
                  ${isSelected ? channel.color : 'bg-gray-100'}
                `}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                
                {/* Название */}
                <h5 className={`font-semibold mb-1 ${isSelected ? channel.textColor : 'text-gray-900'}`}>
                  {channel.name}
                </h5>
                
                {/* Описание */}
                <p className="text-sm text-gray-500">
                  {channel.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Остальные каналы */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Другие каналы</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {channels.filter(channel => !channel.popular).map((channel) => {
            const Icon = channel.icon;
            const isSelected = isChannelSelected(channel.id);
            const isHovered = hoveredChannel === channel.id;
            
            return (
              <div
                key={channel.id}
                onClick={() => handleChannelToggle(channel)}
                onMouseEnter={() => setHoveredChannel(channel.id)}
                onMouseLeave={() => setHoveredChannel(null)}
                className={`
                  relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform
                  ${isSelected 
                    ? `${channel.bgLight} border-2 ${channel.textColor.replace('text-', 'border-')} scale-105` 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:scale-105'
                  }
                  ${isHovered ? 'shadow-lg' : 'shadow-sm'}
                `}
              >
                {/* Чекбокс */}
                {isSelected && (
                  <div className={`
                    absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center
                    ${channel.color} text-white shadow-lg
                  `}>
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                {/* Иконка */}
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors
                  ${isSelected ? channel.color : 'bg-gray-100'}
                `}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                
                {/* Название */}
                <h5 className={`font-semibold mb-1 ${isSelected ? channel.textColor : 'text-gray-900'}`}>
                  {channel.name}
                </h5>
                
                {/* Описание */}
                <p className="text-sm text-gray-500">
                  {channel.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Выбранные каналы */}
      {selectedChannels.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">
            Выбранные каналы ({selectedChannels.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.id}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-white font-medium
                    ${channel.color}
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {channel.name}
                </div>
              );
            })}
          </div>
          <p className="text-blue-700 text-sm mt-3">
            На следующем шаге вы сможете настроить параметры для каждого канала
          </p>
        </div>
      )}

      {/* Подсказка */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold text-sm">💡</span>
            </div>
          </div>
          <div className="ml-3">
            <h5 className="text-yellow-800 font-medium">Совет</h5>
            <p className="text-yellow-700 text-sm mt-1">
              Выбирайте каналы, где активна ваша целевая аудитория. 
              Лучше сосредоточиться на 2-3 каналах и качественно их настроить, 
              чем распыляться на множество платформ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelSelector;

