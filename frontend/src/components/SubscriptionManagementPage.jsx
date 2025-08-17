import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';

const SubscriptionManagementPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subResponse, usageResponse, paymentsResponse] = await Promise.all([
        fetch('/api/user/subscription', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/user/subscription/usage', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/user/payments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData.usage);
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.payments);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных подписки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/subscription/plans');
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Вы уверены, что хотите отменить подписку?')) {
      return;
    }

    try {
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Подписка отменена. Она будет активна до конца текущего периода.');
        fetchSubscriptionData();
      }
    } catch (error) {
      console.error('Ошибка отмены подписки:', error);
      alert('Произошла ошибка при отмене подписки');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUsageBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600\"></div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-4xl mx-auto\">
        {/* Заголовок */}
        <div className=\"mb-8\">
          <h1 className=\"text-3xl font-bold text-gray-900\">Управление подпиской</h1>
          <p className=\"text-gray-600 mt-2\">Управляйте своим планом и отслеживайте использование</p>
        </div>

        {/* Текущая подписка */}
        <div className=\"bg-white rounded-lg shadow-md p-6 mb-8\">
          <div className=\"flex items-center justify-between mb-6\">
            <h2 className=\"text-xl font-semibold text-gray-900\">Текущий план</h2>
            <button
              onClick={handleUpgrade}
              className=\"bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors\"
            >
              Изменить план
            </button>
          </div>

          {subscription && (
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
              <div className=\"bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg\">
                <h3 className=\"text-lg font-semibold mb-2\">{subscription.plan.name}</h3>
                <p className=\"text-2xl font-bold\">{formatPrice(subscription.plan.price_monthly_rub)}/мес</p>
                <p className=\"text-indigo-100 mt-2\">{subscription.plan.description}</p>
              </div>

              <div className=\"space-y-4\">
                <div className=\"flex items-center\">
                  <Calendar className=\"w-5 h-5 text-gray-400 mr-3\" />
                  <div>
                    <p className=\"text-sm text-gray-500\">Следующий платеж</p>
                    <p className=\"font-medium\">{formatDate(subscription.next_billing_date)}</p>
                  </div>
                </div>
                
                <div className=\"flex items-center\">
                  <CreditCard className=\"w-5 h-5 text-gray-400 mr-3\" />
                  <div>
                    <p className=\"text-sm text-gray-500\">Статус</p>
                    <p className={`font-medium ${subscription.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {subscription.is_active ? 'Активна' : 'Неактивна'}
                    </p>
                  </div>
                </div>
              </div>

              <div className=\"space-y-2\">
                {subscription.plan.plan_type !== 'free' && (
                  <button
                    onClick={handleCancelSubscription}
                    className=\"w-full text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors\"
                  >
                    Отменить подписку
                  </button>
                )}
                
                <button className=\"w-full text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors\">
                  <Settings className=\"w-4 h-4 inline mr-2\" />
                  Настройки
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Использование лимитов */}
        {usage && (
          <div className=\"bg-white rounded-lg shadow-md p-6 mb-8\">
            <h2 className=\"text-xl font-semibold text-gray-900 mb-6\">Использование в этом месяце</h2>
            
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
              {/* Рефералы */}
              <div className=\"border rounded-lg p-4\">
                <div className=\"flex items-center justify-between mb-2\">
                  <h3 className=\"font-medium text-gray-900\">Рефералы</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(usage.referrals.percentage)}`}>
                    {Math.round(usage.referrals.percentage)}%
                  </span>
                </div>
                
                <div className=\"mb-2\">
                  <div className=\"flex justify-between text-sm text-gray-600\">
                    <span>{usage.referrals.used}</span>
                    <span>{usage.referrals.limit === 0 ? 'Безлимит' : usage.referrals.limit}</span>
                  </div>
                  
                  {usage.referrals.limit > 0 && (
                    <div className=\"w-full bg-gray-200 rounded-full h-2 mt-1\">
                      <div 
                        className={`h-2 rounded-full ${getUsageBarColor(usage.referrals.percentage)}`}
                        style={{ width: `${Math.min(usage.referrals.percentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                {usage.referrals.percentage >= 80 && (
                  <div className=\"flex items-center text-sm text-yellow-600 mt-2\">
                    <AlertTriangle className=\"w-4 h-4 mr-1\" />
                    Приближается к лимиту
                  </div>
                )}
              </div>

              {/* Проекты */}
              <div className=\"border rounded-lg p-4\">
                <div className=\"flex items-center justify-between mb-2\">
                  <h3 className=\"font-medium text-gray-900\">Проекты</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(usage.projects.percentage)}`}>
                    {Math.round(usage.projects.percentage)}%
                  </span>
                </div>
                
                <div className=\"mb-2\">
                  <div className=\"flex justify-between text-sm text-gray-600\">
                    <span>{usage.projects.used}</span>
                    <span>{usage.projects.limit === 0 ? 'Безлимит' : usage.projects.limit}</span>
                  </div>
                  
                  {usage.projects.limit > 0 && (
                    <div className=\"w-full bg-gray-200 rounded-full h-2 mt-1\">
                      <div 
                        className={`h-2 rounded-full ${getUsageBarColor(usage.projects.percentage)}`}
                        style={{ width: `${Math.min(usage.projects.percentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Участники команды */}
              <div className=\"border rounded-lg p-4\">
                <div className=\"flex items-center justify-between mb-2\">
                  <h3 className=\"font-medium text-gray-900\">Участники</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(usage.team_members.percentage)}`}>
                    {Math.round(usage.team_members.percentage)}%
                  </span>
                </div>
                
                <div className=\"mb-2\">
                  <div className=\"flex justify-between text-sm text-gray-600\">
                    <span>{usage.team_members.used}</span>
                    <span>{usage.team_members.limit === 0 ? 'Безлимит' : usage.team_members.limit}</span>
                  </div>
                  
                  {usage.team_members.limit > 0 && (
                    <div className=\"w-full bg-gray-200 rounded-full h-2 mt-1\">
                      <div 
                        className={`h-2 rounded-full ${getUsageBarColor(usage.team_members.percentage)}`}
                        style={{ width: `${Math.min(usage.team_members.percentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Доступные функции */}
            <div className=\"mt-6 pt-6 border-t\">
              <h3 className=\"font-medium text-gray-900 mb-4\">Доступные функции</h3>
              <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
                {Object.entries(usage.features).map(([feature, available]) => (
                  <div key={feature} className=\"flex items-center\">
                    {available ? (
                      <CheckCircle className=\"w-5 h-5 text-green-500 mr-2\" />
                    ) : (
                      <div className=\"w-5 h-5 border-2 border-gray-300 rounded-full mr-2\"></div>
                    )}
                    <span className={`text-sm ${available ? 'text-gray-900' : 'text-gray-500'}`}>
                      {feature === 'advanced_analytics' && 'Расширенная аналитика'}
                      {feature === 'api_access' && 'API доступ'}
                      {feature === 'white_label' && 'White-label'}
                      {feature === 'priority_support' && 'Приоритетная поддержка'}
                      {feature === 'custom_rewards' && 'Кастомные награды'}
                      {feature === 'marketplace_access' && 'Доступ к маркетплейсу'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* История платежей */}
        <div className=\"bg-white rounded-lg shadow-md p-6\">
          <div className=\"flex items-center justify-between mb-6\">
            <h2 className=\"text-xl font-semibold text-gray-900\">История платежей</h2>
            <button className=\"text-indigo-600 hover:text-indigo-700 flex items-center\">
              <Download className=\"w-4 h-4 mr-2\" />
              Скачать все
            </button>
          </div>

          {payments.length > 0 ? (
            <div className=\"overflow-x-auto\">
              <table className=\"min-w-full divide-y divide-gray-200\">
                <thead className=\"bg-gray-50\">
                  <tr>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Дата
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Описание
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Сумма
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Статус
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className=\"bg-white divide-y divide-gray-200\">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">
                        {payment.description}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">
                        {formatPrice(payment.amount)}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap\">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'completed' && 'Завершен'}
                          {payment.status === 'pending' && 'В обработке'}
                          {payment.status === 'failed' && 'Неудачно'}
                        </span>
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\">
                        <button className=\"text-indigo-600 hover:text-indigo-700\">
                          Скачать чек
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className=\"text-center py-8\">
              <CreditCard className=\"w-12 h-12 text-gray-400 mx-auto mb-4\" />
              <p className=\"text-gray-500\">История платежей пуста</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;

