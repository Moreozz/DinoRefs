import React, { useState, useEffect } from 'react';
import LazyImage from './LazyImage';
import { Sparkles, Heart, Star, Zap } from 'lucide-react';

/**
 * Компонент маскота динозавра для DinoRefs
 */
const DinoMascot = ({
  variant = 'business', // business, friendly, mascot, icon
  size = 'medium', // small, medium, large, xl
  animation = 'none', // none, bounce, pulse, wiggle, float
  showEffects = false,
  message = '',
  className = '',
  onClick,
  ...props
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // Конфигурация вариантов динозавров
  const dinoVariants = {
    business: {
      src: '/images/dinosaurs/business-dino.jpg',
      alt: 'Деловой динозавр DinoRefs',
      description: 'Профессиональный помощник по реферальным программам'
    },
    friendly: {
      src: '/images/dinosaurs/friendly-dino.jpg',
      alt: 'Дружелюбный динозавр DinoRefs',
      description: 'Ваш надежный спутник в мире рефералов'
    },
    mascot: {
      src: '/images/dinosaurs/mascot-dino.jpg',
      alt: 'Маскот динозавр DinoRefs',
      description: 'Веселый маскот платформы DinoRefs'
    },
    icon: {
      src: '/images/dinosaurs/dino-icons.jpg',
      alt: 'Иконки динозавров DinoRefs',
      description: 'Набор иконок с динозаврами'
    }
  };

  // Размеры
  const sizes = {
    small: 'w-12 h-12',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  // Анимации
  const animations = {
    none: '',
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    wiggle: 'animate-wiggle',
    float: 'animate-float'
  };

  // Эффекты
  const effects = [
    { icon: Sparkles, color: 'text-yellow-400', delay: 0 },
    { icon: Heart, color: 'text-red-400', delay: 200 },
    { icon: Star, color: 'text-blue-400', delay: 400 },
    { icon: Zap, color: 'text-green-400', delay: 600 }
  ];

  const currentDino = dinoVariants[variant] || dinoVariants.business;

  // Обработка клика
  const handleClick = () => {
    if (onClick) {
      onClick();
    }

    // Запускаем анимацию
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);

    // Показываем сообщение, если есть
    if (message) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  // Автоматическое появление сообщения
  useEffect(() => {
    if (message && !showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message, showMessage]);

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      {/* Основное изображение динозавра */}
      <div
        className={`
          relative cursor-pointer transition-all duration-300 transform
          ${sizes[size]}
          ${animations[animation]}
          ${isAnimating ? 'scale-110' : 'hover:scale-105'}
          ${onClick ? 'hover:brightness-110' : ''}
        `}
        onClick={handleClick}
      >
        <LazyImage
          src={currentDino.src}
          alt={currentDino.alt}
          className="w-full h-full object-contain rounded-lg"
          showLoader={true}
          showErrorIcon={true}
        />

        {/* Эффекты при наведении */}
        {showEffects && (
          <div className="absolute inset-0 pointer-events-none">
            {effects.map((Effect, index) => (
              <Effect.icon
                key={index}
                className={`
                  absolute w-4 h-4 ${Effect.color}
                  animate-ping opacity-0 hover:opacity-100
                  transition-opacity duration-300
                `}
                style={{
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 80}%`,
                  animationDelay: `${Effect.delay}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Индикатор интерактивности */}
        {onClick && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </div>

      {/* Сообщение от динозавра */}
      {message && showMessage && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="relative bg-white border-2 border-green-200 rounded-lg px-3 py-2 shadow-lg max-w-xs">
            <p className="text-sm text-gray-700 text-center">{message}</p>
            
            {/* Хвостик сообщения */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-l-8 border-r-8 border-t-8 border-transparent border-t-green-200" />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-px">
                <div className="border-l-6 border-r-6 border-t-6 border-transparent border-t-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Описание для accessibility */}
      <span className="sr-only">{currentDino.description}</span>
    </div>
  );
};

/**
 * Компонент группы динозавров для разных тарифных планов
 */
export const DinoTierDisplay = ({ tier = 'free', animated = true }) => {
  const tierConfigs = {
    free: {
      dino: 'friendly',
      size: 'medium',
      animation: 'pulse',
      message: '🥚 Добро пожаловать в DinoRefs! Начните с бесплатного плана.',
      effects: false
    },
    starter: {
      dino: 'business',
      size: 'large',
      animation: 'bounce',
      message: '🦕 Отличный выбор! План Starter поможет вам расти.',
      effects: true
    },
    growth: {
      dino: 'mascot',
      size: 'large',
      animation: 'wiggle',
      message: '🦖 Мощный план Growth для серьезного бизнеса!',
      effects: true
    },
    enterprise: {
      dino: 'business',
      size: 'xl',
      animation: 'float',
      message: '👑 Добро пожаловать в элитный клуб Enterprise!',
      effects: true
    }
  };

  const config = tierConfigs[tier] || tierConfigs.free;

  return (
    <DinoMascot
      variant={config.dino}
      size={config.size}
      animation={animated ? config.animation : 'none'}
      message={config.message}
      showEffects={config.effects}
      className="mx-auto"
    />
  );
};

/**
 * Компонент динозавра-помощника с контекстными подсказками
 */
export const DinoHelper = ({ 
  context = 'general', 
  tips = [],
  position = 'bottom-right' 
}) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [showTips, setShowTips] = useState(false);

  const contextMessages = {
    general: 'Привет! Я ваш помощник DinoRefs. Нужна помощь?',
    dashboard: 'Здесь вы можете отслеживать все ваши реферальные кампании!',
    projects: 'Создавайте и управляйте проектами для организации рефералов.',
    analytics: 'Анализируйте эффективность ваших реферальных программ.',
    pricing: 'Выберите план, который подходит для ваших целей!',
    profile: 'Настройте свой профиль и предпочтения.'
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50'
  };

  // Циклическое переключение подсказок
  useEffect(() => {
    if (tips.length > 1 && showTips) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [tips.length, showTips]);

  const handleDinoClick = () => {
    if (tips.length > 0) {
      setShowTips(!showTips);
    }
  };

  const currentMessage = showTips && tips.length > 0 
    ? tips[currentTip] 
    : contextMessages[context];

  return (
    <div className={positionClasses[position]}>
      <DinoMascot
        variant="friendly"
        size="medium"
        animation="float"
        message={currentMessage}
        showEffects={true}
        onClick={handleDinoClick}
        className="drop-shadow-lg"
      />
      
      {/* Индикатор подсказок */}
      {tips.length > 0 && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {tips.length}
        </div>
      )}
    </div>
  );
};

// Добавляем кастомные анимации в CSS
const customAnimations = `
  @keyframes wiggle {
    0%, 7% { transform: rotateZ(0); }
    15% { transform: rotateZ(-15deg); }
    20% { transform: rotateZ(10deg); }
    25% { transform: rotateZ(-10deg); }
    30% { transform: rotateZ(6deg); }
    35% { transform: rotateZ(-4deg); }
    40%, 100% { transform: rotateZ(0); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .animate-wiggle {
    animation: wiggle 2s ease-in-out infinite;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

// Инжектируем стили
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customAnimations;
  document.head.appendChild(styleSheet);
}

export default DinoMascot;

