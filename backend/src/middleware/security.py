from functools import wraps
from flask import request, jsonify, current_app
import time
import hashlib
import secrets
from collections import defaultdict, deque
import re

# Хранилище для rate limiting (в продакшене использовать Redis)
rate_limit_storage = defaultdict(lambda: deque())
failed_attempts = defaultdict(int)
blocked_ips = {}

class SecurityMiddleware:
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Инициализация middleware безопасности"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Настройки безопасности
        app.config.setdefault('SECURITY_RATE_LIMIT', 100)  # запросов в минуту
        app.config.setdefault('SECURITY_BLOCK_DURATION', 300)  # 5 минут блокировки
        app.config.setdefault('SECURITY_MAX_FAILED_ATTEMPTS', 5)
        
    def before_request(self):
        """Проверки безопасности перед обработкой запроса"""
        # Получаем IP адрес клиента
        client_ip = self.get_client_ip()
        
        # Проверяем заблокированные IP
        if self.is_ip_blocked(client_ip):
            return jsonify({
                'error': 'IP адрес временно заблокирован',
                'message': 'Превышено количество неудачных попыток'
            }), 429
        
        # Rate limiting
        if not self.check_rate_limit(client_ip):
            self.increment_failed_attempts(client_ip)
            return jsonify({
                'error': 'Превышен лимит запросов',
                'message': 'Слишком много запросов с вашего IP адреса'
            }), 429
        
        # Валидация заголовков
        if not self.validate_headers():
            return jsonify({
                'error': 'Недопустимые заголовки запроса'
            }), 400
        
        # XSS защита для POST/PUT запросов
        if request.method in ['POST', 'PUT', 'PATCH']:
            if not self.validate_request_data():
                return jsonify({
                    'error': 'Обнаружена попытка XSS атаки'
                }), 400
    
    def after_request(self, response):
        """Добавление заголовков безопасности"""
        # Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.dinorefs.ru; "
            "frame-ancestors 'none';"
        )
        response.headers['Content-Security-Policy'] = csp
        
        return response
    
    def get_client_ip(self):
        """Получение реального IP адреса клиента"""
        # Проверяем заголовки прокси
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        else:
            return request.remote_addr
    
    def check_rate_limit(self, ip):
        """Проверка лимита запросов"""
        now = time.time()
        minute_ago = now - 60
        
        # Очищаем старые записи
        while rate_limit_storage[ip] and rate_limit_storage[ip][0] < minute_ago:
            rate_limit_storage[ip].popleft()
        
        # Проверяем лимит
        if len(rate_limit_storage[ip]) >= current_app.config['SECURITY_RATE_LIMIT']:
            return False
        
        # Добавляем текущий запрос
        rate_limit_storage[ip].append(now)
        return True
    
    def is_ip_blocked(self, ip):
        """Проверка заблокированных IP"""
        if ip in blocked_ips:
            if time.time() - blocked_ips[ip] > current_app.config['SECURITY_BLOCK_DURATION']:
                # Разблокируем IP
                del blocked_ips[ip]
                failed_attempts[ip] = 0
                return False
            return True
        return False
    
    def increment_failed_attempts(self, ip):
        """Увеличение счетчика неудачных попыток"""
        failed_attempts[ip] += 1
        if failed_attempts[ip] >= current_app.config['SECURITY_MAX_FAILED_ATTEMPTS']:
            blocked_ips[ip] = time.time()
    
    def validate_headers(self):
        """Валидация заголовков запроса"""
        # Проверяем User-Agent
        user_agent = request.headers.get('User-Agent', '')
        if not user_agent or len(user_agent) > 500:
            return False
        
        # Проверяем Content-Length для больших запросов
        content_length = request.headers.get('Content-Length')
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB лимит
            return False
        
        return True
    
    def validate_request_data(self):
        """Валидация данных запроса на XSS"""
        try:
            # XSS паттерны
            xss_patterns = [
                r'<script[^>]*>.*?</script>',
                r'javascript:',
                r'on\w+\s*=',
                r'<iframe[^>]*>.*?</iframe>',
                r'<object[^>]*>.*?</object>',
                r'<embed[^>]*>.*?</embed>',
                r'<link[^>]*>.*?</link>',
                r'<meta[^>]*>.*?</meta>'
            ]
            
            # Проверяем JSON данные
            if request.is_json:
                data_str = str(request.get_json())
                for pattern in xss_patterns:
                    if re.search(pattern, data_str, re.IGNORECASE):
                        return False
            
            # Проверяем form данные
            if request.form:
                for key, value in request.form.items():
                    for pattern in xss_patterns:
                        if re.search(pattern, str(value), re.IGNORECASE):
                            return False
            
            return True
        except Exception:
            return False

# Декораторы для дополнительной защиты
def require_api_key(f):
    """Декоратор для проверки API ключа"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API ключ обязателен'}), 401
        
        # В продакшене проверять в базе данных
        valid_keys = current_app.config.get('API_KEYS', [])
        if api_key not in valid_keys:
            return jsonify({'error': 'Недействительный API ключ'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def validate_csrf_token(f):
    """Декоратор для проверки CSRF токена"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            csrf_token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
            
            if not csrf_token:
                return jsonify({'error': 'CSRF токен обязателен'}), 403
            
            # Проверяем токен (в продакшене использовать более сложную логику)
            if not validate_csrf_token_value(csrf_token):
                return jsonify({'error': 'Недействительный CSRF токен'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def sanitize_input(f):
    """Декоратор для санитизации входных данных"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.is_json:
            data = request.get_json()
            if data:
                sanitized_data = sanitize_dict(data)
                request._cached_json = (sanitized_data, True)
        
        return f(*args, **kwargs)
    return decorated_function

# Вспомогательные функции
def generate_csrf_token():
    """Генерация CSRF токена"""
    return secrets.token_urlsafe(32)

def validate_csrf_token_value(token):
    """Валидация CSRF токена"""
    # Простая проверка длины и формата
    if not token or len(token) < 32:
        return False
    
    # В продакшене проверять в сессии или базе данных
    return True

def sanitize_string(text):
    """Санитизация строки"""
    if not isinstance(text, str):
        return text
    
    # Удаляем потенциально опасные символы
    dangerous_chars = ['<', '>', '"', "'", '&', 'script', 'javascript']
    sanitized = text
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()

def sanitize_dict(data):
    """Рекурсивная санитизация словаря"""
    if isinstance(data, dict):
        return {key: sanitize_dict(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(item) for item in data]
    elif isinstance(data, str):
        return sanitize_string(data)
    else:
        return data

# Функции для работы с IP белыми/черными списками
def is_ip_whitelisted(ip):
    """Проверка IP в белом списке"""
    whitelist = current_app.config.get('IP_WHITELIST', [])
    return ip in whitelist

def is_ip_blacklisted(ip):
    """Проверка IP в черном списке"""
    blacklist = current_app.config.get('IP_BLACKLIST', [])
    return ip in blacklist

# Логирование безопасности
def log_security_event(event_type, ip, details=None):
    """Логирование событий безопасности"""
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    log_entry = {
        'timestamp': timestamp,
        'type': event_type,
        'ip': ip,
        'details': details or {}
    }
    
    # В продакшене отправлять в систему мониторинга
    current_app.logger.warning(f"Security Event: {log_entry}")

# Экспорт основных компонентов
__all__ = [
    'SecurityMiddleware',
    'require_api_key',
    'validate_csrf_token',
    'sanitize_input',
    'generate_csrf_token',
    'log_security_event'
]

