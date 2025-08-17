from flask import Blueprint, request, jsonify
import uuid
from datetime import datetime, timedelta

payments_bp = Blueprint('payments', __name__)

# Тарифные планы для тестирования
PRICING_PLANS = {
    'starter': {
        'name': 'Baby Dino',
        'price': 2800,
        'currency': 'RUB',
        'features': ['1000 referrals/month', '3 projects', 'Extended analytics']
    },
    'growth': {
        'name': 'T-Rex', 
        'price': 9500,
        'currency': 'RUB',
        'features': ['10000 referrals/month', '10 projects', 'API access', 'White-label']
    }
}

@payments_bp.route('/plans', methods=['GET'])
def get_pricing_plans():
    """Получить список тарифных планов"""
    return jsonify({
        'success': True,
        'plans': PRICING_PLANS
    })

@payments_bp.route('/create-payment', methods=['POST'])
def create_payment():
    """Создать платеж (упрощенная версия для тестирования)"""
    try:
        data = request.get_json()
        
        # Валидация данных
        required_fields = ['plan_id', 'payment_method']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Поле {field} обязательно'
                }), 400
        
        plan_id = data['plan_id']
        payment_method = data['payment_method']  # 'yoomoney' или 'sbp'
        
        # Проверяем существование плана
        if plan_id not in PRICING_PLANS:
            return jsonify({
                'success': False,
                'error': 'Неизвестный тарифный план'
            }), 400
        
        plan = PRICING_PLANS[plan_id]
        
        # Генерируем уникальный ID платежа
        payment_id = str(uuid.uuid4())
        
        # Создаем тестовые URL для оплаты
        if payment_method == 'yoomoney':
            payment_url = f"https://yoomoney.ru/quickpay/confirm.xml?receiver=123456&quickpay-form=shop&targets=Подписка {plan['name']}&paymentType=AC&sum={plan['price']}&label={payment_id}"
        elif payment_method == 'sbp':
            payment_url = f"https://sbp-test.nspk.ru/payment?orderId={payment_id}&amount={plan['price']}"
        else:
            return jsonify({
                'success': False,
                'error': 'Неподдерживаемый способ оплаты'
            }), 400
        
        return jsonify({
            'success': True,
            'payment_id': payment_id,
            'payment_url': payment_url,
            'amount': plan['price'],
            'currency': plan['currency'],
            'plan_name': plan['name'],
            'expires_at': (datetime.now() + timedelta(hours=1)).isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка создания платежа: {str(e)}'
        }), 500

@payments_bp.route('/status/<payment_id>', methods=['GET'])
def get_payment_status(payment_id):
    """Получить статус платежа"""
    try:
        # Для демонстрации возвращаем тестовые данные
        return jsonify({
            'success': True,
            'payment_id': payment_id,
            'status': 'pending',  # pending, completed, failed, expired
            'amount': 2800,
            'currency': 'RUB',
            'created_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Ошибка получения статуса: {str(e)}'
        }), 500

@payments_bp.route('/webhook/yoomoney', methods=['POST'])
def yoomoney_webhook():
    """Webhook для уведомлений от ЮMoney"""
    try:
        # Получаем данные от ЮMoney
        notification_data = request.form.to_dict()
        
        payment_id = notification_data.get('label')
        operation_id = notification_data.get('operation_id')
        amount = float(notification_data.get('amount', 0))
        status = notification_data.get('status')
        
        if status == 'success':
            print(f"✅ Платеж {payment_id} успешно завершен через ЮMoney")
        
        return 'OK', 200
        
    except Exception as e:
        print(f"❌ Ошибка обработки webhook ЮMoney: {e}")
        return 'Error', 500

@payments_bp.route('/webhook/sbp', methods=['POST'])
def sbp_webhook():
    """Webhook для уведомлений от СБП"""
    try:
        # Получаем данные от СБП
        notification_data = request.get_json()
        
        payment_id = notification_data.get('orderId')
        amount = notification_data.get('amount', 0) / 100  # Переводим из копеек
        status = notification_data.get('status')
        
        if status == 'PAID':
            print(f"✅ Платеж {payment_id} успешно завершен через СБП")
        
        return jsonify({'result': 'OK'}), 200
        
    except Exception as e:
        print(f"❌ Ошибка обработки webhook СБП: {e}")
        return jsonify({'error': 'Internal error'}), 500

# Оригинальные эндпоинты для совместимости
@payments_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """Получить доступные методы оплаты"""
    try:
        methods = [
            {
                'id': 'yoomoney',
                'name': 'ЮMoney',
                'description': 'Банковские карты, электронные кошельки',
                'icon': '💳'
            },
            {
                'id': 'sbp',
                'name': 'СБП',
                'description': 'Система быстрых платежей',
                'icon': '📱'
            }
        ]
        return jsonify({
            'methods': methods
        })
    except Exception as e:
        return jsonify({'error': f'Ошибка получения методов оплаты: {str(e)}'}), 500



