import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpCircle,
  Download,
  Clock,
  Crown
} from 'lucide-react';
import { getPlanLimits } from '../utils/planLimits';
import { PlanUsageStats } from './PlanLimitNotification';

const SubscriptionManagement = ({ onUpgrade }) => {
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    projects: 1,
    campaigns: 1,
    referrals: 25
  });

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Симуляция загрузки данных подписки
      // В реальном приложении здесь будет API запрос
      const mockSubscription = {
        id: 'sub_123456',
        planId: 'free',
        status: 'active',
        currentPeriodStart: '2025-08-01',
        currentPeriodEnd: '2025-09-01',
        cancelAtPeriodEnd: false,
        trialEnd: null,
        amount: 0,
        currency: 'RUB',
        paymentMethod: null
      };

      const mockPaymentHistory = [
        {
          id: 'pay_001',
          amount: 0,
          currency: 'RUB',
          status: 'succeeded',
          created: '2025-08-01',
          description: 'Подписка на план Dino Egg'
        }
      ];

      setSubscription(mockSubscription);
      setPaymentHistory(mockPaymentHistory);
    } catch (error) {
      console.error('Ошибка загрузки данных подписки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить подписку? Она будет активна до конца текущего периода.')) {
      return;
    }

    try {
      // API запрос для отмены подписки
      console.log('Отмена подписки...');
      
      setSubscription(prev => ({
        ...prev,
        cancelAtPeriodEnd: true
      }));
    } catch (error) {
      console.error('Ошибка отмены подписки:', error);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      // API запрос для возобновления подписки
      console.log('Возобновление подписки...');
      
      setSubscription(prev => ({
        ...prev,
        cancelAtPeriodEnd: false
      }));
    } catch (error) {
      console.error('Ошибка возобновления подписки:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getPlanIcon = (planId) => {
    const icons = {
      free: '🥚',
      starter: '🦕',
      growth: '🦖',
      enterprise: '👑'
    };
    return icons[planId] || '📦';
  };

  const getStatusBadge = (status, cancelAtPeriodEnd) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="destructive">Отменяется</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Активна</Badge>;
      case 'trialing':
        return <Badge variant="secondary">Пробный период</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Просрочена</Badge>;
      case 'canceled':
        return <Badge variant="outline">Отменена</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Не удалось загрузить информацию о подписке. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  const planLimits = getPlanLimits(subscription.planId);

  return (
    <div className="space-y-6">
      {/* Текущая подписка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Текущая подписка
          </CardTitle>
          <CardDescription>
            Управляйте своим тарифным планом и подпиской
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getPlanIcon(subscription.planId)}</span>
              <div>
                <h3 className="text-lg font-semibold">{planLimits.name}</h3>
                <p className="text-sm text-gray-600">
                  {subscription.amount > 0 
                    ? `${formatAmount(subscription.amount, subscription.currency)} в месяц`
                    : 'Бесплатный план'
                  }
                </p>
              </div>
            </div>
            {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
          </div>

          {subscription.cancelAtPeriodEnd && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ваша подписка будет отменена {formatDate(subscription.currentPeriodEnd)}. 
                После этого вы перейдете на бесплатный план.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Период подписки</p>
              <p className="font-medium">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            {subscription.paymentMethod && (
              <div>
                <p className="text-sm text-gray-600">Способ оплаты</p>
                <p className="font-medium">{subscription.paymentMethod}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {subscription.planId !== 'enterprise' && (
              <Button onClick={onUpgrade} className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                Обновить план
              </Button>
            )}
            
            {subscription.planId !== 'free' && (
              <>
                {subscription.cancelAtPeriodEnd ? (
                  <Button 
                    variant="outline" 
                    onClick={handleReactivateSubscription}
                  >
                    Возобновить подписку
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                  >
                    Отменить подписку
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Статистика использования */}
      <PlanUsageStats 
        planId={subscription.planId}
        usage={usage}
        onUpgrade={onUpgrade}
      />

      {/* История платежей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            История платежей
          </CardTitle>
          <CardDescription>
            Все ваши платежи и счета
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              История платежей пуста
            </p>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getPaymentStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.created)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Информация о следующем платеже */}
      {subscription.planId !== 'free' && !subscription.cancelAtPeriodEnd && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Следующий платеж
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {formatAmount(subscription.amount, subscription.currency)}
                </p>
                <p className="text-sm text-gray-600">
                  Будет списан {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
              <Badge variant="outline">Автоматически</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManagement;

