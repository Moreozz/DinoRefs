import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, Egg } from 'lucide-react';

const SubscriptionPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Ошибка загрузки планов:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Ошибка загрузки подписки:', error);
    }
  };

  const handleSubscribe = (plan) => {
    if (plan.plan_type === 'free') {
      return; // Бесплатный план уже активен
    }
    
    // Переходим на страницу оплаты
    navigate('/subscription/checkout', { 
      state: { 
        plan: plan,
        billingCycle: billingCycle
      }
    });
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'free': return <Egg className="w-8 h-8" />;
      case 'starter': return <Star className="w-8 h-8" />;
      case 'growth': return <Zap className="w-8 h-8" />;
      case 'enterprise': return <Crown className="w-8 h-8" />;
      default: return <Egg className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'free': return 'from-gray-400 to-gray-600';
      case 'starter': return 'from-blue-400 to-blue-600';
      case 'growth': return 'from-purple-400 to-purple-600';
      case 'enterprise': return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Бесплатно';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const isCurrentPlan = (plan) => {
    return currentSubscription && currentSubscription.plan.plan_type === plan.plan_type;
  };

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center\">
        <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600\"></div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-7xl mx-auto\">
        {/* Заголовок */}
        <div className=\"text-center mb-12\">
          <h1 className=\"text-4xl font-bold text-gray-900 mb-4\">
            Выберите свой план
          </h1>
          <p className=\"text-xl text-gray-600 mb-8\">
            Масштабируйте свои реферальные кампании с DinoRefs
          </p>
          
          {/* Переключатель периода оплаты */}
          <div className=\"flex items-center justify-center mb-8\">
            <div className=\"bg-gray-100 p-1 rounded-lg flex\">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Ежемесячно
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Ежегодно
                <span className=\"ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full\">
                  -17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Планы */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8\">
          {plans.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.price_yearly_rub : plan.price_monthly_rub;
            const originalPrice = billingCycle === 'yearly' ? plan.price_monthly_rub * 12 : null;
            const isPopular = plan.is_popular;
            const isCurrent = isCurrentPlan(plan);
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                  isPopular ? 'ring-2 ring-purple-500 ring-opacity-50' : ''
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* Популярный план */}
                {isPopular && (
                  <div className=\"absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-medium\">
                    Популярный выбор
                  </div>
                )}
                
                {/* Текущий план */}
                {isCurrent && (
                  <div className=\"absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-medium\">
                    Текущий план
                  </div>
                )}

                <div className={`p-8 ${isPopular || isCurrent ? 'pt-12' : ''}`}>
                  {/* Иконка и название */}
                  <div className=\"text-center mb-6\">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getPlanColor(plan.plan_type)} text-white mb-4`}>
                      {getPlanIcon(plan.plan_type)}
                    </div>
                    <h3 className=\"text-2xl font-bold text-gray-900\">{plan.name}</h3>
                    <p className=\"text-gray-600 mt-2\">{plan.description}</p>
                  </div>

                  {/* Цена */}
                  <div className=\"text-center mb-6\">
                    <div className=\"flex items-baseline justify-center\">
                      <span className=\"text-4xl font-bold text-gray-900\">
                        {formatPrice(price)}
                      </span>
                      {price > 0 && (
                        <span className=\"text-gray-500 ml-1\">
                          /{billingCycle === 'yearly' ? 'год' : 'мес'}
                        </span>
                      )}
                    </div>
                    
                    {billingCycle === 'yearly' && originalPrice && (
                      <div className=\"mt-2\">
                        <span className=\"text-sm text-gray-500 line-through\">
                          {formatPrice(originalPrice)}/год
                        </span>
                        <span className=\"ml-2 text-sm text-green-600 font-medium\">
                          Экономия {formatPrice(originalPrice - price)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Функции */}
                  <div className=\"space-y-3 mb-8\">
                    {plan.features && plan.features.map((feature, index) => (
                      <div key={index} className=\"flex items-center\">
                        <Check className=\"w-5 h-5 text-green-500 mr-3 flex-shrink-0\" />
                        <span className=\"text-gray-700\">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Кнопка подписки */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrent || plan.plan_type === 'free'}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : plan.plan_type === 'free'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : isPopular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrent
                      ? 'Текущий план'
                      : plan.plan_type === 'free'
                      ? 'Бесплатно'
                      : plan.plan_type === 'enterprise'
                      ? 'Связаться с нами'
                      : 'Выбрать план'
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Дополнительная информация */}
        <div className=\"mt-16 text-center\">
          <h2 className=\"text-2xl font-bold text-gray-900 mb-8\">
            Часто задаваемые вопросы
          </h2>
          
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto\">
            <div className=\"bg-white p-6 rounded-lg shadow-md\">
              <h3 className=\"font-semibold text-gray-900 mb-2\">
                Можно ли изменить план в любое время?
              </h3>
              <p className=\"text-gray-600\">
                Да, вы можете обновить или понизить свой план в любое время. 
                Изменения вступят в силу немедленно.
              </p>
            </div>
            
            <div className=\"bg-white p-6 rounded-lg shadow-md\">
              <h3 className=\"font-semibold text-gray-900 mb-2\">
                Есть ли бесплатный пробный период?
              </h3>
              <p className=\"text-gray-600\">
                Бесплатный план Dino Egg позволяет протестировать основные 
                функции без ограничений по времени.
              </p>
            </div>
            
            <div className=\"bg-white p-6 rounded-lg shadow-md\">
              <h3 className=\"font-semibold text-gray-900 mb-2\">
                Какие способы оплаты поддерживаются?
              </h3>
              <p className=\"text-gray-600\">
                Мы принимаем банковские карты, ЮMoney, СБП и другие 
                популярные способы оплаты в России.
              </p>
            </div>
            
            <div className=\"bg-white p-6 rounded-lg shadow-md\">
              <h3 className=\"font-semibold text-gray-900 mb-2\">
                Что происходит при превышении лимитов?
              </h3>
              <p className=\"text-gray-600\">
                При приближении к лимитам мы отправим уведомление. 
                При превышении функции будут временно ограничены.
              </p>
            </div>
          </div>
        </div>

        {/* Поддержка */}
        <div className=\"mt-16 text-center bg-white p-8 rounded-2xl shadow-lg\">
          <h2 className=\"text-2xl font-bold text-gray-900 mb-4\">
            Нужна помощь с выбором?
          </h2>
          <p className=\"text-gray-600 mb-6\">
            Наша команда поможет подобрать оптимальный план для ваших задач
          </p>
          <button className=\"bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors\">
            Связаться с поддержкой
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;

