import requests
import json
import uuid
from datetime import datetime, timedelta
from flask import current_app
from src.database import db
from src.models.payment import Payment, PaymentStatus, PaymentMethod

class YooMoneyService:
    """Сервис для работы с ЮMoney (Яндекс.Касса)"""
    
    def __init__(self):
        self.shop_id = current_app.config.get('YOOMONEY_SHOP_ID')
        self.secret_key = current_app.config.get('YOOMONEY_SECRET_KEY')
        self.api_url = 'https://api.yookassa.ru/v3'
        
    def create_payment(self, amount, currency='RUB', description='', user_id=None, 
                      subscription_id=None, marketplace_item_id=None, return_url=None):
        """Создать платеж в ЮMoney"""
        
        # Создаем запись о платеже в БД
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription_id,
            marketplace_item_id=marketplace_item_id,
            amount=amount,
            currency=currency,
            payment_method=PaymentMethod.YOOMONEY,
            description=description,
            status=PaymentStatus.PENDING
        )
        
        db.session.add(payment)
        db.session.commit()
        
        # Подготавливаем данные для ЮMoney
        payment_data = {
            'amount': {
                'value': str(amount),
                'currency': currency
            },
            'confirmation': {
                'type': 'redirect',
                'return_url': return_url or f"{current_app.config.get('FRONTEND_URL')}/payment/success"
            },
            'capture': True,
            'description': description,
            'metadata': {
                'payment_id': payment.payment_id,
                'user_id': str(user_id) if user_id else None,
                'subscription_id': str(subscription_id) if subscription_id else None,
                'marketplace_item_id': str(marketplace_item_id) if marketplace_item_id else None
            }
        }
        
        # Добавляем методы оплаты
        payment_data['payment_method_data'] = {
            'type': 'bank_card'
        }
        
        try:
            headers = {
                'Authorization': f'Basic {self._get_auth_header()}',
                'Content-Type': 'application/json',
                'Idempotence-Key': str(uuid.uuid4())
            }
            
            response = requests.post(
                f'{self.api_url}/payments',
                headers=headers,
                json=payment_data
            )
            
            if response.status_code == 200:
                yoomoney_payment = response.json()
                
                # Обновляем платеж данными из ЮMoney
                payment.yoomoney_payment_id = yoomoney_payment['id']
                payment.metadata = {
                    'yoomoney_data': yoomoney_payment,
                    'confirmation_url': yoomoney_payment['confirmation']['confirmation_url']
                }
                db.session.commit()
                
                return {
                    'success': True,
                    'payment_id': payment.payment_id,
                    'yoomoney_payment_id': yoomoney_payment['id'],
                    'confirmation_url': yoomoney_payment['confirmation']['confirmation_url'],
                    'payment': payment.to_dict()
                }
            else:
                payment.mark_failed(f"ЮMoney API error: {response.text}")
                return {
                    'success': False,
                    'error': f'Ошибка создания платежа: {response.text}'
                }
                
        except Exception as e:
            payment.mark_failed(f"Exception: {str(e)}")
            return {
                'success': False,
                'error': f'Ошибка при обращении к ЮMoney: {str(e)}'
            }
    
    def create_sbp_payment(self, amount, currency='RUB', description='', user_id=None,
                          subscription_id=None, marketplace_item_id=None):
        """Создать платеж через СБП"""
        
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription_id,
            marketplace_item_id=marketplace_item_id,
            amount=amount,
            currency=currency,
            payment_method=PaymentMethod.SBP,
            description=description,
            status=PaymentStatus.PENDING
        )
        
        db.session.add(payment)
        db.session.commit()
        
        payment_data = {
            'amount': {
                'value': str(amount),
                'currency': currency
            },
            'confirmation': {
                'type': 'sbp'
            },
            'capture': True,
            'description': description,
            'payment_method_data': {
                'type': 'sbp'
            },
            'metadata': {
                'payment_id': payment.payment_id,
                'user_id': str(user_id) if user_id else None,
                'subscription_id': str(subscription_id) if subscription_id else None,
                'marketplace_item_id': str(marketplace_item_id) if marketplace_item_id else None
            }
        }
        
        try:
            headers = {
                'Authorization': f'Basic {self._get_auth_header()}',
                'Content-Type': 'application/json',
                'Idempotence-Key': str(uuid.uuid4())
            }
            
            response = requests.post(
                f'{self.api_url}/payments',
                headers=headers,
                json=payment_data
            )
            
            if response.status_code == 200:
                yoomoney_payment = response.json()
                
                payment.yoomoney_payment_id = yoomoney_payment['id']
                payment.metadata = {
                    'yoomoney_data': yoomoney_payment,
                    'sbp_qr_code': yoomoney_payment['confirmation'].get('confirmation_data')
                }
                db.session.commit()
                
                return {
                    'success': True,
                    'payment_id': payment.payment_id,
                    'yoomoney_payment_id': yoomoney_payment['id'],
                    'qr_code': yoomoney_payment['confirmation'].get('confirmation_data'),
                    'payment': payment.to_dict()
                }
            else:
                payment.mark_failed(f"ЮMoney SBP API error: {response.text}")
                return {
                    'success': False,
                    'error': f'Ошибка создания СБП платежа: {response.text}'
                }
                
        except Exception as e:
            payment.mark_failed(f"SBP Exception: {str(e)}")
            return {
                'success': False,
                'error': f'Ошибка при создании СБП платежа: {str(e)}'
            }
    
    def check_payment_status(self, yoomoney_payment_id):
        """Проверить статус платежа в ЮMoney"""
        try:
            headers = {
                'Authorization': f'Basic {self._get_auth_header()}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'{self.api_url}/payments/{yoomoney_payment_id}',
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            current_app.logger.error(f"Error checking payment status: {str(e)}")
            return None
    
    def handle_webhook(self, webhook_data):
        """Обработать webhook от ЮMoney"""
        try:
            event_type = webhook_data.get('event')
            payment_data = webhook_data.get('object')
            
            if not payment_data:
                return {'success': False, 'error': 'No payment data in webhook'}
            
            yoomoney_payment_id = payment_data.get('id')
            if not yoomoney_payment_id:
                return {'success': False, 'error': 'No payment ID in webhook'}
            
            # Находим платеж в нашей БД
            payment = Payment.query.filter_by(yoomoney_payment_id=yoomoney_payment_id).first()
            if not payment:
                return {'success': False, 'error': 'Payment not found'}
            
            # Обрабатываем разные типы событий
            if event_type == 'payment.succeeded':
                payment.mark_completed()
                
                # Если это платеж за подписку, активируем/продлеваем подписку
                if payment.subscription_id:
                    self._activate_subscription(payment)
                
                # Если это покупка в marketplace, завершаем покупку
                if payment.marketplace_item_id:
                    self._complete_marketplace_purchase(payment)
                    
            elif event_type == 'payment.canceled':
                payment.status = PaymentStatus.CANCELED
                db.session.commit()
                
            elif event_type == 'payment.waiting_for_capture':
                # Платеж ожидает подтверждения
                pass
                
            return {'success': True, 'message': 'Webhook processed'}
            
        except Exception as e:
            current_app.logger.error(f"Error processing webhook: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def refund_payment(self, yoomoney_payment_id, amount=None, reason=''):
        """Вернуть платеж"""
        try:
            refund_data = {
                'payment_id': yoomoney_payment_id,
                'reason': reason or 'Возврат по запросу пользователя'
            }
            
            if amount:
                refund_data['amount'] = {
                    'value': str(amount),
                    'currency': 'RUB'
                }
            
            headers = {
                'Authorization': f'Basic {self._get_auth_header()}',
                'Content-Type': 'application/json',
                'Idempotence-Key': str(uuid.uuid4())
            }
            
            response = requests.post(
                f'{self.api_url}/refunds',
                headers=headers,
                json=refund_data
            )
            
            if response.status_code == 200:
                refund_info = response.json()
                
                # Обновляем статус платежа
                payment = Payment.query.filter_by(yoomoney_payment_id=yoomoney_payment_id).first()
                if payment:
                    payment.mark_refunded(amount)
                
                return {
                    'success': True,
                    'refund_id': refund_info['id'],
                    'refund_info': refund_info
                }
            else:
                return {
                    'success': False,
                    'error': f'Ошибка возврата: {response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка при возврате платежа: {str(e)}'
            }
    
    def _get_auth_header(self):
        """Получить заголовок авторизации для ЮMoney"""
        import base64
        credentials = f"{self.shop_id}:{self.secret_key}"
        return base64.b64encode(credentials.encode()).decode()
    
    def _activate_subscription(self, payment):
        """Активировать/продлить подписку после успешного платежа"""
        from src.models.user_subscription import UserSubscription
        
        subscription = UserSubscription.query.get(payment.subscription_id)
        if subscription:
            subscription.extend_subscription()
            
            # Отправляем уведомление пользователю
            from src.services.notification_service import NotificationService
            NotificationService.send_notification(
                user_id=payment.user_id,
                type='subscription_activated',
                title='Подписка активирована',
                message=f'Ваша подписка "{subscription.plan.name}" успешно активирована',
                data={
                    'subscription_id': subscription.id,
                    'plan_name': subscription.plan.name,
                    'expires_at': subscription.expires_at.isoformat()
                }
            )
    
    def _complete_marketplace_purchase(self, payment):
        """Завершить покупку в marketplace после успешного платежа"""
        from src.models.purchase import Purchase
        
        purchase = Purchase.query.filter_by(payment_id=payment.id).first()
        if purchase:
            purchase.complete_purchase()
            
            # Отправляем уведомления покупателю и продавцу
            from src.services.notification_service import NotificationService
            
            # Уведомление покупателю
            NotificationService.send_notification(
                user_id=purchase.buyer_id,
                type='purchase_completed',
                title='Покупка завершена',
                message=f'Вы успешно приобрели "{purchase.item.title}"',
                data={
                    'purchase_id': purchase.purchase_id,
                    'item_title': purchase.item.title,
                    'download_token': purchase.download_token
                }
            )
            
            # Уведомление продавцу
            NotificationService.send_notification(
                user_id=purchase.seller_id,
                type='item_sold',
                title='Товар продан',
                message=f'Ваш товар "{purchase.item.title}" был продан',
                data={
                    'purchase_id': purchase.purchase_id,
                    'item_title': purchase.item.title,
                    'earnings': float(purchase.seller_earnings)
                }
            )
    
    @staticmethod
    def get_supported_payment_methods():
        """Получить поддерживаемые методы оплаты"""
        return [
            {
                'id': 'bank_card',
                'name': 'Банковская карта',
                'description': 'Visa, MasterCard, МИР',
                'icon': 'credit-card'
            },
            {
                'id': 'sbp',
                'name': 'СБП',
                'description': 'Система быстрых платежей',
                'icon': 'qr-code'
            },
            {
                'id': 'yoomoney',
                'name': 'ЮMoney',
                'description': 'Кошелек ЮMoney',
                'icon': 'wallet'
            },
            {
                'id': 'sberbank',
                'name': 'Сбербанк Онлайн',
                'description': 'Оплата через Сбербанк',
                'icon': 'bank'
            }
        ]

