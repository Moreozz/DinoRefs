#!/bin/bash

# DinoRefs - Исправленная установка без Docker на Timeweb Cloud
# Версия: 2.1 - Исправление проблемы setuptools

set -e

echo "🦕 Исправленная установка DinoRefs без Docker..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка прав root
if [[ $EUID -ne 0 ]]; then
   error "Этот скрипт должен запускаться с правами root"
fi

# Получение IP адреса сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")
log "IP сервера: $SERVER_IP"

# Остановка предыдущих попыток установки
log "Очистка предыдущих попыток..."
pkill -f gunicorn || true
systemctl stop dinorefs-backend 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

# Обновление системы
log "Обновление системы..."
apt update

# Исправление проблемы setuptools в Ubuntu 24.04
log "Исправление проблемы setuptools..."
apt remove -y python3-pip python3-setuptools python3-wheel 2>/dev/null || true
apt autoremove -y
apt install -y python3-distutils python3-dev python3-venv curl wget

# Установка pip вручную
log "Установка pip вручную..."
if ! command -v pip3 &> /dev/null; then
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3
    export PATH="$HOME/.local/bin:$PATH"
fi

# Установка системных зависимостей
log "Установка системных зависимостей..."
apt install -y nodejs npm nginx postgresql postgresql-contrib redis-server git build-essential

# Обновление Node.js до последней LTS версии
log "Обновление Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Создание пользователя для приложения
log "Создание пользователя dinorefs..."
if ! id "dinorefs" &>/dev/null; then
    useradd -m -s /bin/bash dinorefs
    usermod -aG www-data dinorefs
fi

# Клонирование или обновление репозитория
log "Получение исходного кода DinoRefs..."
if [ -d "/home/dinorefs/DinoRefs" ]; then
    warn "Удаление старой версии..."
    rm -rf /home/dinorefs/DinoRefs
fi

log "Клонирование свежей версии..."
sudo -u dinorefs git clone https://github.com/Moreozz/DinoRefs.git /home/dinorefs/DinoRefs
cd /home/dinorefs/DinoRefs

# Настройка PostgreSQL
log "Настройка PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Создание базы данных и пользователя
DB_PASSWORD=$(openssl rand -hex 16)
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS dinorefs;
DROP USER IF EXISTS dinorefs;
CREATE DATABASE dinorefs;
CREATE USER dinorefs WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE dinorefs TO dinorefs;
ALTER USER dinorefs CREATEDB;
\q
EOF

log "База данных PostgreSQL настроена"

# Настройка Redis
log "Настройка Redis..."
systemctl start redis-server
systemctl enable redis-server

# Настройка Backend
log "Настройка Backend (Python/Flask)..."
cd /home/dinorefs/DinoRefs/backend

# Создание виртуального окружения с исправлением setuptools
log "Создание виртуального окружения..."
sudo -u dinorefs python3 -m venv venv

# Обновление pip и setuptools в виртуальном окружении
log "Обновление pip и setuptools в venv..."
sudo -u dinorefs ./venv/bin/python -m pip install --upgrade pip
sudo -u dinorefs ./venv/bin/python -m pip install --upgrade setuptools wheel

# Установка зависимостей по одной для лучшей диагностики
log "Установка базовых зависимостей..."
sudo -u dinorefs ./venv/bin/pip install Flask==3.1.1
sudo -u dinorefs ./venv/bin/pip install flask-cors==6.0.0
sudo -u dinorefs ./venv/bin/pip install Flask-JWT-Extended==4.7.1
sudo -u dinorefs ./venv/bin/pip install Flask-SQLAlchemy==3.1.1
sudo -u dinorefs ./venv/bin/pip install gunicorn==21.2.0
sudo -u dinorefs ./venv/bin/pip install psycopg2-binary==2.9.7
sudo -u dinorefs ./venv/bin/pip install redis==5.0.1
sudo -u dinorefs ./venv/bin/pip install python-dotenv==1.0.0

log "Установка дополнительных зависимостей..."
sudo -u dinorefs ./venv/bin/pip install bcrypt==4.3.0
sudo -u dinorefs ./venv/bin/pip install requests==2.31.0
sudo -u dinorefs ./venv/bin/pip install scikit-learn==1.3.0
sudo -u dinorefs ./venv/bin/pip install pandas==2.0.3
sudo -u dinorefs ./venv/bin/pip install numpy==1.24.3

# Генерация секретных ключей
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Создание конфигурации backend
log "Создание конфигурации backend..."
cat > /home/dinorefs/DinoRefs/backend/.env << EOF
# DinoRefs Backend Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=$SECRET_KEY

# Database Configuration
DATABASE_URL=postgresql://dinorefs:$DB_PASSWORD@localhost:5432/dinorefs

# JWT Configuration
JWT_SECRET_KEY=$JWT_SECRET_KEY
JWT_ACCESS_TOKEN_EXPIRES=3600

# CORS Configuration
CORS_ORIGINS=http://$SERVER_IP,https://$SERVER_IP

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Payment Configuration (Demo mode)
PAYMENTS_ENABLED=true
DEMO_PAYMENTS=true
YOOMONEY_SHOP_ID=demo-shop-id
YOOMONEY_SECRET_KEY=demo-secret-key

# Security Configuration
RATE_LIMIT_STORAGE_URL=redis://localhost:6379/1
RATE_LIMIT_DEFAULT=100 per hour

# Logging
LOG_LEVEL=INFO
LOG_FILE=/home/dinorefs/DinoRefs/logs/dinorefs.log

# File Upload
UPLOAD_FOLDER=/home/dinorefs/DinoRefs/uploads
MAX_CONTENT_LENGTH=16777216
EOF

chown dinorefs:dinorefs /home/dinorefs/DinoRefs/backend/.env

# Создание необходимых директорий
log "Создание директорий..."
sudo -u dinorefs mkdir -p /home/dinorefs/DinoRefs/logs
sudo -u dinorefs mkdir -p /home/dinorefs/DinoRefs/uploads
sudo -u dinorefs mkdir -p /home/dinorefs/DinoRefs/backend/instance

# Создание минимального приложения для тестирования
log "Создание тестового приложения..."
cat > /home/dinorefs/DinoRefs/backend/test_app.py << 'EOF'
from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "message": "DinoRefs Backend is running!"})

@app.route('/api/test')
def test():
    return jsonify({
        "message": "DinoRefs API Test",
        "version": "1.0.0",
        "features": ["referrals", "analytics", "payments_demo"]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
EOF

chown dinorefs:dinorefs /home/dinorefs/DinoRefs/backend/test_app.py

# Настройка Frontend
log "Настройка Frontend (Node.js/React)..."
cd /home/dinorefs/DinoRefs/frontend

# Создание конфигурации frontend
cat > /home/dinorefs/DinoRefs/frontend/.env << EOF
VITE_API_URL=http://$SERVER_IP/api
VITE_APP_NAME=DinoRefs
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PWA=true
VITE_DEBUG_MODE=false
EOF

chown dinorefs:dinorefs /home/dinorefs/DinoRefs/frontend/.env

# Очистка npm кэша и установка зависимостей
log "Установка зависимостей Node.js..."
sudo -u dinorefs npm cache clean --force
sudo -u dinorefs npm install --legacy-peer-deps

# Сборка frontend
log "Сборка frontend приложения..."
sudo -u dinorefs npm run build

# Настройка Nginx
log "Настройка Nginx..."
cat > /etc/nginx/sites-available/dinorefs << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Увеличиваем размер загружаемых файлов
    client_max_body_size 50M;
    
    # Frontend (статические файлы)
    location / {
        root /home/dinorefs/DinoRefs/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5002/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Таймауты
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Буферизация
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "DinoRefs is healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Активация конфигурации Nginx
ln -sf /etc/nginx/sites-available/dinorefs /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Создание systemd сервиса для backend (сначала тестовый)
log "Создание systemd сервиса..."
cat > /etc/systemd/system/dinorefs-backend.service << EOF
[Unit]
Description=DinoRefs Backend
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=exec
User=dinorefs
Group=dinorefs
WorkingDirectory=/home/dinorefs/DinoRefs/backend
Environment=PATH=/home/dinorefs/DinoRefs/backend/venv/bin
Environment=PYTHONPATH=/home/dinorefs/DinoRefs/backend
ExecStart=/home/dinorefs/DinoRefs/backend/venv/bin/python test_app.py
Restart=always
RestartSec=3

# Логирование
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dinorefs-backend

[Install]
WantedBy=multi-user.target
EOF

# Запуск и включение сервисов
log "Запуск сервисов..."
systemctl daemon-reload
systemctl enable dinorefs-backend
systemctl start dinorefs-backend
systemctl enable nginx
systemctl start nginx

# Проверка статуса сервисов
log "Проверка статуса сервисов..."
sleep 5

# Проверка доступности
log "Проверка доступности приложения..."
sleep 3

if curl -s http://localhost/health > /dev/null; then
    log "✅ Frontend доступен"
else
    warn "❌ Frontend недоступен"
fi

if curl -s http://localhost/api/health > /dev/null; then
    log "✅ Backend API доступен"
    # Показываем ответ API
    echo "API Response: $(curl -s http://localhost/api/health)"
else
    warn "❌ Backend API недоступен, проверяем прямое подключение..."
    if curl -s http://localhost:5002/api/health > /dev/null; then
        log "✅ Backend работает, проблема в Nginx"
    else
        warn "❌ Backend не отвечает, проверяем логи..."
        journalctl -u dinorefs-backend --no-pager -l | tail -10
    fi
fi

# Настройка файрвола
log "Настройка файрвола..."
ufw --force enable
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS

# Создание скрипта управления
cat > /usr/local/bin/dinorefs << 'EOF'
#!/bin/bash
case "$1" in
    start)
        systemctl start dinorefs-backend nginx postgresql redis-server
        echo "DinoRefs запущен"
        ;;
    stop)
        systemctl stop dinorefs-backend nginx
        echo "DinoRefs остановлен"
        ;;
    restart)
        systemctl restart dinorefs-backend nginx
        echo "DinoRefs перезапущен"
        ;;
    status)
        echo "=== DinoRefs Status ==="
        echo "Backend: $(systemctl is-active dinorefs-backend)"
        echo "Nginx: $(systemctl is-active nginx)"
        echo "PostgreSQL: $(systemctl is-active postgresql)"
        echo "Redis: $(systemctl is-active redis-server)"
        echo ""
        echo "=== API Test ==="
        curl -s http://localhost/api/health | python3 -m json.tool 2>/dev/null || echo "API недоступен"
        ;;
    logs)
        journalctl -u dinorefs-backend -f
        ;;
    test)
        echo "=== Testing DinoRefs ==="
        echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/)"
        echo "API Health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)"
        echo "API Test: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/test)"
        ;;
    *)
        echo "Использование: dinorefs {start|stop|restart|status|logs|test}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/dinorefs

# Финальная информация
echo ""
echo -e "${BLUE}🦕 DinoRefs установлен (тестовая версия)!${NC}"
echo ""
echo "📋 Статус сервисов:"
systemctl is-active dinorefs-backend nginx postgresql redis-server | paste <(echo -e "Backend:\nNginx:\nPostgreSQL:\nRedis:") -
echo ""
echo "🌐 Доступ к приложению:"
echo "   Frontend: http://$SERVER_IP"
echo "   Backend API: http://$SERVER_IP/api/health"
echo "   API Test: http://$SERVER_IP/api/test"
echo ""
echo "🔧 Команды управления:"
echo "   dinorefs status  - Статус и тест API"
echo "   dinorefs logs    - Логи backend"
echo "   dinorefs restart - Перезапуск"
echo "   dinorefs test    - Тест всех компонентов"
echo ""
echo -e "${GREEN}🎉 Базовая версия установлена! Проверьте работу в браузере.${NC}"
echo ""
echo "Если всё работает, можно будет обновить до полной версии с помощью:"
echo "dinorefs update"

