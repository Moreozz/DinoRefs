import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  ArrowLeft,
  Lock,
  AlertCircle
} from 'lucide-react';

const PaymentCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plan, billingCycle } = location.state || {};
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    agreementAccepted: false
  });

  useEffect(() => {
    if (!plan) {
      navigate('/subscription/plans');
    }
  }, [plan, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPrice = () => {
    if (!plan) return 0;
    return billingCycle === 'yearly' ? plan.price_yearly_rub : plan.price_monthly_rub;
  };

  const handlePayment = async () => {
    if (!formData.agreementAccepted) {
      setError('Необходимо принять пользовательское соглашение');
      return;
    }

    if (!formData.email) {
      setError('Укажите email для отправки чека');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: billingCycle,
          payment_method: paymentMethod,
          customer_email: formData.email,
          customer_phone: formData.phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Перенаправляем на страницу оплаты ЮMoney
        window.location.href = data.payment_url;
      } else {
        setError(data.error || 'Произошла ошибка при создании платежа');
      }
    } catch (error) {
      console.error('Ошибка оплаты:', error);
      setError('Произошла ошибка при обработке платежа');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return null;
  }

  const price = getPrice();
  const savings = billingCycle === 'yearly' ? (plan.price_monthly_rub * 12) - price : 0;

  return (
    <div className=\"min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-3xl mx-auto\">
        {/* Заголовок */}
        <div className=\"mb-8\">
          <button
            onClick={() => navigate('/subscription/plans')}
            className=\"flex items-center text-gray-600 hover:text-gray-900 mb-4\"
          >
            <ArrowLeft className=\"w-4 h-4 mr-2\" />
            Вернуться к планам
          </button>
          
          <h1 className=\"text-3xl font-bold text-gray-900\">Оформление подписки</h1>
          <p className=\"text-gray-600 mt-2\">Завершите оплату для активации плана {plan.name}</p>
        </div>

        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-8\">
          {/* Форма оплаты */}
          <div className=\"bg-white rounded-lg shadow-md p-6\">
            <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">Способ оплаты</h2>

            {/* Выбор способа оплаты */}
            <div className=\"space-y-4 mb-6\">
              <div
                onClick={() => setPaymentMethod('card')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'card' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className=\"flex items-center\">
                  <CreditCard className=\"w-6 h-6 text-gray-600 mr-3\" />
                  <div>
                    <h3 className=\"font-medium text-gray-900\">Банковская карта</h3>
                    <p className=\"text-sm text-gray-600\">Visa, MasterCard, МИР</p>
                  </div>
                  {paymentMethod === 'card' && (
                    <CheckCircle className=\"w-5 h-5 text-indigo-500 ml-auto\" />
                  )}
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('sbp')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'sbp' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className=\"flex items-center\">
                  <Smartphone className=\"w-6 h-6 text-gray-600 mr-3\" />
                  <div>
                    <h3 className=\"font-medium text-gray-900\">СБП</h3>
                    <p className=\"text-sm text-gray-600\">Система быстрых платежей</p>
                  </div>
                  {paymentMethod === 'sbp' && (
                    <CheckCircle className=\"w-5 h-5 text-indigo-500 ml-auto\" />
                  )}
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('yoomoney')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'yoomoney' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className=\"flex items-center\">
                  <div className=\"w-6 h-6 bg-yellow-400 rounded mr-3 flex items-center justify-center\">
                    <span className=\"text-xs font-bold text-white\">Ю</span>
                  </div>
                  <div>
                    <h3 className=\"font-medium text-gray-900\">ЮMoney</h3>
                    <p className=\"text-sm text-gray-600\">Кошелек ЮMoney</p>
                  </div>
                  {paymentMethod === 'yoomoney' && (
                    <CheckCircle className=\"w-5 h-5 text-indigo-500 ml-auto\" />
                  )}
                </div>
              </div>
            </div>

            {/* Контактная информация */}
            <div className=\"space-y-4 mb-6\">
              <h3 className=\"font-medium text-gray-900\">Контактная информация</h3>
              
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                  Email для чека *
                </label>
                <input
                  type=\"email\"
                  name=\"email\"
                  value={formData.email}
                  onChange={handleInputChange}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500\"
                  placeholder=\"your@email.com\"
                  required
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">
                  Телефон (опционально)
                </label>
                <input
                  type=\"tel\"
                  name=\"phone\"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500\"
                  placeholder=\"+7 (999) 123-45-67\"
                />
              </div>
            </div>

            {/* Соглашение */}
            <div className=\"mb-6\">
              <label className=\"flex items-start\">
                <input
                  type=\"checkbox\"
                  name=\"agreementAccepted\"
                  checked={formData.agreementAccepted}
                  onChange={handleInputChange}
                  className=\"mt-1 mr-3\"
                />
                <span className=\"text-sm text-gray-600\">
                  Я принимаю{' '}
                  <a href=\"/terms\" className=\"text-indigo-600 hover:text-indigo-700\">
                    пользовательское соглашение
                  </a>{' '}
                  и{' '}
                  <a href=\"/privacy\" className=\"text-indigo-600 hover:text-indigo-700\">
                    политику конфиденциальности
                  </a>
                </span>
              </label>
            </div>

            {/* Ошибка */}
            {error && (
              <div className=\"mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center\">
                <AlertCircle className=\"w-5 h-5 text-red-500 mr-3\" />
                <span className=\"text-red-700\">{error}</span>
              </div>
            )}

            {/* Кнопка оплаты */}
            <button
              onClick={handlePayment}
              disabled={loading || !formData.agreementAccepted}
              className=\"w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center\"
            >
              {loading ? (
                <div className=\"animate-spin rounded-full h-5 w-5 border-b-2 border-white\"></div>
              ) : (
                <>
                  <Lock className=\"w-4 h-4 mr-2\" />
                  Оплатить {formatPrice(price)}
                </>
              )}
            </button>

            {/* Безопасность */}
            <div className=\"mt-4 flex items-center justify-center text-sm text-gray-500\">
              <Shield className=\"w-4 h-4 mr-2\" />
              Защищенная оплата через ЮMoney
            </div>
          </div>

          {/* Сводка заказа */}
          <div className=\"bg-white rounded-lg shadow-md p-6\">
            <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">Сводка заказа</h2>

            {/* Детали плана */}
            <div className=\"border-b pb-4 mb-4\">
              <h3 className=\"font-medium text-gray-900 mb-2\">{plan.name}</h3>
              <p className=\"text-gray-600 text-sm mb-4\">{plan.description}</p>
              
              <div className=\"space-y-2\">
                <div className=\"flex justify-between\">
                  <span className=\"text-gray-600\">План:</span>
                  <span className=\"font-medium\">{billingCycle === 'yearly' ? 'Годовой' : 'Месячный'}</span>
                </div>
                
                <div className=\"flex justify-between\">
                  <span className=\"text-gray-600\">Цена:</span>
                  <span className=\"font-medium\">{formatPrice(price)}</span>
                </div>
                
                {savings > 0 && (
                  <div className=\"flex justify-between text-green-600\">
                    <span>Экономия:</span>
                    <span className=\"font-medium\">{formatPrice(savings)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Включенные функции */}
            <div className=\"mb-6\">
              <h4 className=\"font-medium text-gray-900 mb-3\">Что включено:</h4>
              <div className=\"space-y-2\">
                {plan.features && plan.features.map((feature, index) => (
                  <div key={index} className=\"flex items-center\">
                    <CheckCircle className=\"w-4 h-4 text-green-500 mr-2 flex-shrink-0\" />
                    <span className=\"text-sm text-gray-600\">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Итого */}
            <div className=\"border-t pt-4\">
              <div className=\"flex justify-between items-center\">
                <span className=\"text-lg font-semibold text-gray-900\">Итого:</span>
                <span className=\"text-2xl font-bold text-gray-900\">{formatPrice(price)}</span>
              </div>
              
              {billingCycle === 'yearly' && (
                <p className=\"text-sm text-gray-500 mt-1\">
                  {formatPrice(price / 12)}/месяц при годовой оплате
                </p>
              )}
            </div>

            {/* Гарантии */}
            <div className=\"mt-6 p-4 bg-gray-50 rounded-lg\">
              <h4 className=\"font-medium text-gray-900 mb-2\">Гарантии:</h4>
              <ul className=\"text-sm text-gray-600 space-y-1\">
                <li>• 14 дней на возврат средств</li>
                <li>• Мгновенная активация</li>
                <li>• Техническая поддержка 24/7</li>
                <li>• Безопасная оплата</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckoutPage;

