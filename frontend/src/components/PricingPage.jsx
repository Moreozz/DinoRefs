import React, { useState } from 'react';
import { Check, Crown, Zap, Star, Rocket } from 'lucide-react';
import PaymentModal from './PaymentModal';
import SEOHead, { SEOConfigs } from './SEOHead';
import { DinoTierDisplay } from './DinoMascot';

const PricingPage = () => {
  const [currentPlan, setCurrentPlan] = useState('free'); // Текущий план пользователя
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isYearly, setIsYearly] = useState(false); // Переключатель месячные/годовые планы

  const plans = [
    {
      id: 'free',
      name: 'Dino Egg',
      subtitle: 'Бесплатный',
      price: 0,
      period: 'навсегда',
      icon: '🥚',
      color: 'from-gray-400 to-gray-600',
      borderColor: 'border-gray-300',
      buttonColor: 'bg-gray-500 hover:bg-gray-600',
      features: [
        'До 100 рефералов в месяц',
        '1 активный проект',
        'Базовая аналитика',
        'Стандартные награды (3 бейджа)',
        'Поддержка сообщества'
      ],
      limitations: [
        'Ограниченная аналитика',
        'Без API доступа',
        'Без white-label'
      ]
    },
    {
      id: 'starter',
      name: 'Baby Dino',
      subtitle: 'Стартовый',
      price: 2000,
      yearlyPrice: 19200, // 20% скидка (2000 * 12 * 0.8)
      period: 'в месяц',
      yearlyPeriod: 'в год',
      discount: 20,
      icon: '🦕',
      color: 'from-green-400 to-green-600',
      borderColor: 'border-green-400',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      popular: true,
      features: [
        'До 1,000 рефералов в месяц',
        'До 3 параллельных проектов',
        'Расширенная аналитика',
        'Детальные отчеты и сегментация',
        'Полный набор стандартных бейджей',
        'Кастомные награды',
        'Приоритетная поддержка'
      ],
      limitations: [
        'Без API доступа',
        'Без white-label'
      ]
    },
    {
      id: 'growth',
      name: 'T-Rex',
      subtitle: 'Средний',
      price: 8500,
      yearlyPrice: 71400, // 30% скидка (8500 * 12 * 0.7)
      period: 'в месяц',
      yearlyPeriod: 'в год',
      discount: 30,
      icon: '🦖',
      color: 'from-purple-400 to-purple-600',
      borderColor: 'border-purple-400',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      features: [
        'До 10,000 рефералов в месяц',
        'До 10 проектов',
        'Полная аналитика + прогнозы',
        'API доступ для интеграций',
        'White-label ссылки',
        'Приоритетная поддержка (SLA)',
        'Кастомные интеграции',
        'Экспорт данных'
      ],
      limitations: []
    },
    {
      id: 'enterprise',
      name: 'Dino King',
      subtitle: 'Enterprise',
      price: 'Только годовые тарифы',
      yearlyPrice: 'От 100,000₽/год',
      period: 'индивидуальный запрос',
      yearlyPeriod: 'скидка до 40%',
      discount: 40,
      icon: '👑',
      color: 'from-yellow-400 to-orange-500',
      borderColor: 'border-yellow-400',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
      features: [
        'Неограниченные рефералы',
        'Полная white-label платформа',
        'Собственный домен и дизайн',
        'Персональный менеджер',
        'Расширенные SLA гарантии',
        'Кастомная разработка',
        'On-premise установка',
        'Отдельный облачный инстанс',
        'Интеграция с CRM/ERP',
        'Только годовые контракты'
      ],
      limitations: []
    }
  ];

  const handleSelectPlan = (planId) => {
    if (planId === currentPlan) return;
    
    const plan = plans.find(p => p.id === planId);
    
    if (planId === 'free') {
      // Переход на бесплатный план
      setCurrentPlan(planId);
      alert('Вы перешли на бесплатный план Dino Egg');
    } else if (planId === 'enterprise') {
      // Связаться с отделом продаж
      alert('Для корпоративного плана свяжитесь с нашим отделом продаж: sales@dinorefs.com');
    } else {
      // Открываем модальное окно оплаты
      setSelectedPlan(plan);
      setPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = (paymentId) => {
    alert(`Платеж ${paymentId} успешно завершен! Подписка активирована.`);
    setCurrentPlan(selectedPlan.id);
    setPaymentModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <SEOHead {...SEOConfigs.pricing} />
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Тарифные планы DinoRefs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Выберите план, который подходит для вашего бизнеса. От стартапов до корпораций — 
            у нас есть решение для каждого этапа роста.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold">
              🎉 Первый месяц со скидкой 50% для новых пользователей!
            </div>
          </div>
          
          {/* Переключатель месячные/годовые планы */}
          <div className="mt-8 flex justify-center">
            <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    !isYearly 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  Месячная оплата
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 relative ${
                    isYearly 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  Годовая оплата
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    до -40%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Карточки планов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl border-2 ${plan.borderColor} 
                         transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                         ${plan.popular ? 'ring-4 ring-green-200' : ''}`}
            >
              {/* Популярный план */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⭐ ПОПУЛЯРНЫЙ
                  </div>
                </div>
              )}

              {/* Текущий план */}
              {currentPlan === plan.id && (
                <div className="absolute -top-4 right-4">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ✅ ТЕКУЩИЙ
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Иконка и название */}
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <DinoTierDisplay tier={plan.id} animated={true} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.subtitle}</p>
                </div>

                {/* Цена */}
                <div className="text-center mb-8">
                  {isYearly && plan.yearlyPrice && typeof plan.price === 'number' ? (
                    <div>
                      {/* Годовая цена */}
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {typeof plan.yearlyPrice === 'number' ? `${plan.yearlyPrice.toLocaleString()}₽` : plan.yearlyPrice}
                      </div>
                      <div className="text-gray-600">{plan.yearlyPeriod}</div>
                      {/* Показываем экономию */}
                      {typeof plan.yearlyPrice === 'number' && (
                        <div className="mt-2">
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Экономия {plan.discount}% ({((plan.price * 12) - plan.yearlyPrice).toLocaleString()}₽)
                          </span>
                        </div>
                      )}
                      {/* Зачеркнутая месячная цена */}
                      {typeof plan.price === 'number' && (
                        <div className="mt-2 text-gray-400 line-through text-lg">
                          {(plan.price * 12).toLocaleString()}₽/год
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Месячная цена */}
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {typeof plan.price === 'number' ? `${plan.price.toLocaleString()}₽` : plan.price}
                      </div>
                      <div className="text-gray-600">{plan.period}</div>
                      {/* Показываем потенциальную экономию при годовой оплате */}
                      {!isYearly && plan.yearlyPrice && typeof plan.price === 'number' && (
                        <div className="mt-2">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            При годовой оплате: -{plan.discount}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Функции */}
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    Включено:
                  </h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Кнопка выбора */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={currentPlan === plan.id}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300
                             ${currentPlan === plan.id 
                               ? 'bg-gray-400 cursor-not-allowed' 
                               : plan.buttonColor + ' transform hover:scale-105 shadow-lg hover:shadow-xl'
                             }`}
                >
                  {currentPlan === plan.id ? 'Текущий план' : 
                   plan.id === 'enterprise' ? 'Связаться с нами' : 'Выбрать план'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Дополнительная информация */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Часто задаваемые вопросы
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Можно ли изменить план в любое время?
                </h4>
                <p className="text-gray-600 text-sm">
                  Да, вы можете повысить или понизить тарифный план в любое время. 
                  При повышении доплачиваете разницу, при понижении — получаете кредит на следующий период.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Какие способы оплаты поддерживаются?
                </h4>
                <p className="text-gray-600 text-sm">
                  Мы принимаем оплату через ЮMoney, банковские карты, СБП и банковские переводы. 
                  Для корпоративных клиентов доступна оплата по счету.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Есть ли пробный период?
                </h4>
                <p className="text-gray-600 text-sm">
                  Да! Все новые пользователи получают 14-дневный бесплатный доступ к плану Starter 
                  для тестирования всех возможностей платформы.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Что включает техническая поддержка?
                </h4>
                <p className="text-gray-600 text-sm">
                  Поддержка включает помощь с настройкой, интеграциями и решением технических вопросов. 
                  Время ответа зависит от тарифного плана: от 24 часов до 1 часа для Enterprise.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Контакты для Enterprise */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-8 max-w-2xl mx-auto">
            <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Нужно корпоративное решение?
            </h3>
            <p className="text-gray-700 mb-6">
              Свяжитесь с нашим отделом продаж для обсуждения индивидуальных условий, 
              кастомной разработки и специальных скидок для крупных проектов.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:sales@dinorefs.com"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                📧 sales@dinorefs.com
              </a>
              <a 
                href="tel:+78001234567"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                📞 8 (800) 123-45-67
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно оплаты */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default PricingPage;

