import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, plan, onPaymentSuccess }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/payments/methods');
      const data = await response.json();
      
      if (data.methods) {
        setPaymentMethods(data.methods);
        if (data.methods.length > 0) {
          setSelectedMethod(data.methods[0].id);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки методов оплаты:', error);
      setError('Не удалось загрузить способы оплаты');
    }
  };

  const createPayment = async () => {
    if (!selectedMethod || !plan) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5002/api/payments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_id: plan.id,
          payment_method: selectedMethod
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentUrl(data.payment_url);
        setPaymentId(data.payment_id);
        
        // Открываем платежную страницу в новом окне
        window.open(data.payment_url, '_blank');
        
        // Начинаем проверку статуса платежа
        checkPaymentStatus(data.payment_id);
      } else {
        setError(data.error || 'Ошибка создания платежа');
      }
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      setError('Не удалось создать платеж');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5002/api/payments/status/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.status === 'completed') {
        onPaymentSuccess(paymentId);
        onClose();
      } else if (data.status === 'failed') {
        setError('Платеж не был завершен');
      } else {
        // Продолжаем проверку через 5 секунд
        setTimeout(() => checkPaymentStatus(paymentId), 5000);
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
    }
  };

  const getMethodIcon = (methodId) => {
    switch (methodId) {
      case 'yoomoney':
        return <CreditCard className="w-5 h-5" />;
      case 'sbp':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Оплата подписки</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {plan && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {plan.price}₽ <span className="text-sm font-normal text-gray-500">в месяц</span>
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {paymentUrl ? (
          <div className="text-center">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-700 font-medium">Платеж создан!</p>
              <p className="text-blue-600 text-sm mt-1">
                Страница оплаты открыта в новом окне
              </p>
            </div>
            
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть страницу оплаты
            </a>
            
            <p className="text-gray-500 text-sm mt-4">
              После завершения оплаты это окно автоматически закроется
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Способ оплаты
              </label>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === method.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`mr-3 ${selectedMethod === method.id ? 'text-purple-600' : 'text-gray-400'}`}>
                        {getMethodIcon(method.id)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{method.name}</div>
                        <div className="text-sm text-gray-500">{method.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={createPayment}
                disabled={loading || !selectedMethod}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Создание...' : 'Оплатить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;

