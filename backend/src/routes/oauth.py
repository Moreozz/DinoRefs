from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from src.database import db
from src.models.user import User
from src.models.social_account import SocialAccount
import requests
import secrets
import os
from urllib.parse import urlencode

oauth_bp = Blueprint('oauth', __name__, url_prefix='/api/oauth')

# OAuth конфигурация (в продакшене должна быть в переменных окружения)
OAUTH_CONFIGS = {
    'google': {
        'client_id': os.getenv('GOOGLE_CLIENT_ID', 'demo-client-id'),
        'client_secret': os.getenv('GOOGLE_CLIENT_SECRET', 'demo-client-secret'),
        'auth_url': 'https://accounts.google.com/o/oauth2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'user_info_url': 'https://www.googleapis.com/oauth2/v2/userinfo',
        'scope': 'openid email profile'
    },
    'github': {
        'client_id': os.getenv('GITHUB_CLIENT_ID', 'demo-client-id'),
        'client_secret': os.getenv('GITHUB_CLIENT_SECRET', 'demo-client-secret'),
        'auth_url': 'https://github.com/login/oauth/authorize',
        'token_url': 'https://github.com/login/oauth/access_token',
        'user_info_url': 'https://api.github.com/user',
        'scope': 'user:email'
    },
    'vk': {
        'client_id': os.getenv('VK_CLIENT_ID', 'demo-client-id'),
        'client_secret': os.getenv('VK_CLIENT_SECRET', 'demo-client-secret'),
        'auth_url': 'https://oauth.vk.com/authorize',
        'token_url': 'https://oauth.vk.com/access_token',
        'user_info_url': 'https://api.vk.com/method/users.get',
        'scope': 'email'
    }
}

@oauth_bp.route('/providers')
def get_providers():
    """Получить список доступных OAuth провайдеров"""
    providers = []
    for provider, config in OAUTH_CONFIGS.items():
        providers.append({
            'name': provider,
            'display_name': {
                'google': 'Google',
                'github': 'GitHub', 
                'vk': 'ВКонтакте'
            }.get(provider, provider.title()),
            'icon': f'/icons/{provider}.svg',
            'available': config['client_id'] != 'demo-client-id'
        })
    
    return jsonify({
        'providers': providers,
        'telegram_bot': os.getenv('TELEGRAM_BOT_USERNAME', '@dinorefs_bot')
    })

@oauth_bp.route('/<provider>/login')
def oauth_login(provider):
    """Инициировать OAuth авторизацию"""
    if provider not in OAUTH_CONFIGS:
        return jsonify({'error': 'Неподдерживаемый провайдер'}), 400
    
    config = OAUTH_CONFIGS[provider]
    
    # Генерируем state для защиты от CSRF
    state = secrets.token_urlsafe(32)
    session[f'oauth_state_{provider}'] = state
    
    # Формируем URL для авторизации
    params = {
        'client_id': config['client_id'],
        'redirect_uri': request.host_url.rstrip('/') + f'/api/oauth/{provider}/callback',
        'scope': config['scope'],
        'response_type': 'code',
        'state': state
    }
    
    if provider == 'google':
        params['access_type'] = 'offline'
        params['prompt'] = 'consent'
    
    auth_url = f"{config['auth_url']}?{urlencode(params)}"
    
    return jsonify({
        'auth_url': auth_url,
        'state': state
    })

@oauth_bp.route('/<provider>/callback')
def oauth_callback(provider):
    """Обработать OAuth callback"""
    if provider not in OAUTH_CONFIGS:
        return jsonify({'error': 'Неподдерживаемый провайдер'}), 400
    
    # Проверяем state для защиты от CSRF
    state = request.args.get('state')
    expected_state = session.get(f'oauth_state_{provider}')
    
    if not state or state != expected_state:
        return jsonify({'error': 'Неверный state параметр'}), 400
    
    # Получаем код авторизации
    code = request.args.get('code')
    if not code:
        error = request.args.get('error', 'Неизвестная ошибка')
        return jsonify({'error': f'OAuth ошибка: {error}'}), 400
    
    try:
        # Обмениваем код на токен
        token_data = exchange_code_for_token(provider, code)
        if not token_data:
            return jsonify({'error': 'Не удалось получить токен'}), 400
        
        # Получаем информацию о пользователе
        user_info = get_user_info(provider, token_data['access_token'])
        if not user_info:
            return jsonify({'error': 'Не удалось получить информацию о пользователе'}), 400
        
        # Создаем или обновляем пользователя
        user, social_account = create_or_update_user(provider, user_info, token_data)
        
        # Создаем JWT токен
        access_token = create_access_token(identity=user.id)
        
        # Очищаем state из сессии
        session.pop(f'oauth_state_{provider}', None)
        
        # Редиректим на frontend с токеном
        frontend_url = request.host_url.rstrip('/').replace(':5002', ':8080')
        return redirect(f"{frontend_url}/auth/callback?token={access_token}&provider={provider}")
        
    except Exception as e:
        return jsonify({'error': f'Ошибка OAuth: {str(e)}'}), 500

def exchange_code_for_token(provider, code):
    """Обменять код авторизации на токен"""
    config = OAUTH_CONFIGS[provider]
    
    data = {
        'client_id': config['client_id'],
        'client_secret': config['client_secret'],
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': request.host_url.rstrip('/') + f'/api/oauth/{provider}/callback'
    }
    
    headers = {'Accept': 'application/json'}
    
    response = requests.post(config['token_url'], data=data, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    
    return None

def get_user_info(provider, access_token):
    """Получить информацию о пользователе от провайдера"""
    config = OAUTH_CONFIGS[provider]
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    if provider == 'vk':
        # VK API требует специальных параметров
        params = {
            'access_token': access_token,
            'fields': 'first_name,last_name,photo_200',
            'v': '5.131'
        }
        response = requests.get(config['user_info_url'], params=params)
    else:
        response = requests.get(config['user_info_url'], headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        # Нормализуем данные для разных провайдеров
        if provider == 'google':
            return {
                'id': data.get('id'),
                'email': data.get('email'),
                'name': data.get('name'),
                'first_name': data.get('given_name'),
                'last_name': data.get('family_name'),
                'avatar': data.get('picture')
            }
        elif provider == 'github':
            return {
                'id': str(data.get('id')),
                'email': data.get('email'),
                'name': data.get('name') or data.get('login'),
                'first_name': data.get('name', '').split(' ')[0] if data.get('name') else data.get('login'),
                'last_name': ' '.join(data.get('name', '').split(' ')[1:]) if data.get('name') and ' ' in data.get('name') else '',
                'avatar': data.get('avatar_url')
            }
        elif provider == 'vk':
            user_data = data.get('response', [{}])[0]
            return {
                'id': str(user_data.get('id')),
                'email': None,  # VK не всегда предоставляет email
                'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
                'first_name': user_data.get('first_name'),
                'last_name': user_data.get('last_name'),
                'avatar': user_data.get('photo_200')
            }
    
    return None

def create_or_update_user(provider, user_info, token_data):
    """Создать или обновить пользователя и социальный аккаунт"""
    provider_id = user_info['id']
    
    # Ищем существующий социальный аккаунт
    social_account = SocialAccount.query.filter_by(
        provider=provider,
        provider_id=provider_id
    ).first()
    
    if social_account:
        # Обновляем существующий аккаунт
        user = User.query.get(social_account.user_id)
        social_account.access_token = token_data.get('access_token')
        social_account.refresh_token = token_data.get('refresh_token')
        social_account.provider_name = user_info.get('name')
        social_account.provider_avatar = user_info.get('avatar')
        social_account.updated_at = datetime.utcnow()
    else:
        # Ищем пользователя по email
        user = None
        if user_info.get('email'):
            user = User.query.filter_by(email=user_info['email']).first()
        
        if not user:
            # Создаем нового пользователя
            user = User(
                email=user_info.get('email') or f"{provider}_{provider_id}@dinorefs.local",
                first_name=user_info.get('first_name', ''),
                last_name=user_info.get('last_name', ''),
                password_hash='oauth_user'  # Пароль не используется для OAuth пользователей
            )
            db.session.add(user)
            db.session.flush()  # Получаем ID пользователя
        
        # Создаем социальный аккаунт
        social_account = SocialAccount(
            user_id=user.id,
            provider=provider,
            provider_id=provider_id,
            provider_email=user_info.get('email'),
            provider_name=user_info.get('name'),
            provider_avatar=user_info.get('avatar'),
            access_token=token_data.get('access_token'),
            refresh_token=token_data.get('refresh_token'),
            is_primary=True  # Первый социальный аккаунт становится основным
        )
        db.session.add(social_account)
    
    db.session.commit()
    return user, social_account

@oauth_bp.route('/accounts')
@jwt_required()
def get_user_social_accounts():
    """Получить социальные аккаунты пользователя"""
    user_id = get_jwt_identity()
    
    accounts = SocialAccount.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'accounts': [account.to_dict_safe() for account in accounts]
    })

@oauth_bp.route('/accounts/<int:account_id>/primary', methods=['POST'])
@jwt_required()
def set_primary_account(account_id):
    """Установить основной социальный аккаунт"""
    user_id = get_jwt_identity()
    
    # Проверяем, что аккаунт принадлежит пользователю
    account = SocialAccount.query.filter_by(id=account_id, user_id=user_id).first()
    if not account:
        return jsonify({'error': 'Аккаунт не найден'}), 404
    
    # Убираем флаг primary у всех аккаунтов пользователя
    SocialAccount.query.filter_by(user_id=user_id).update({'is_primary': False})
    
    # Устанавливаем новый основной аккаунт
    account.is_primary = True
    db.session.commit()
    
    return jsonify({'message': 'Основной аккаунт обновлен'})

@oauth_bp.route('/accounts/<int:account_id>', methods=['DELETE'])
@jwt_required()
def unlink_social_account(account_id):
    """Отвязать социальный аккаунт"""
    user_id = get_jwt_identity()
    
    account = SocialAccount.query.filter_by(id=account_id, user_id=user_id).first()
    if not account:
        return jsonify({'error': 'Аккаунт не найден'}), 404
    
    # Проверяем, что у пользователя есть другие способы входа
    user = User.query.get(user_id)
    other_accounts = SocialAccount.query.filter_by(user_id=user_id).filter(SocialAccount.id != account_id).count()
    
    if not user.password_hash or user.password_hash == 'oauth_user':
        if other_accounts == 0:
            return jsonify({'error': 'Нельзя отвязать единственный способ входа'}), 400
    
    db.session.delete(account)
    db.session.commit()
    
    return jsonify({'message': 'Аккаунт отвязан'})

# Telegram Login Widget поддержка
@oauth_bp.route('/telegram/callback', methods=['POST'])
def telegram_callback():
    """Обработать авторизацию через Telegram"""
    data = request.get_json()
    
    # Проверяем подпись Telegram (в продакшене обязательно!)
    # Здесь упрощенная версия для демо
    
    telegram_id = str(data.get('id'))
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    username = data.get('username', '')
    photo_url = data.get('photo_url', '')
    
    # Создаем или обновляем пользователя
    user_info = {
        'id': telegram_id,
        'email': None,
        'name': f"{first_name} {last_name}".strip() or username,
        'first_name': first_name,
        'last_name': last_name,
        'avatar': photo_url
    }
    
    token_data = {'access_token': None, 'refresh_token': None}
    
    user, social_account = create_or_update_user('telegram', user_info, token_data)
    
    # Создаем JWT токен
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict_safe(),
        'provider': 'telegram'
    })

