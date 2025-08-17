#!/bin/bash

# DinoRefs - Установка без Docker на Timeweb Cloud
# Версия: 2.0 - Обход Docker rate limit

set -e

echo "🦕 Установка DinoRefs без Docker (обход rate limit)..."

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

# Обновление системы
log "Обновление системы..."
apt update && apt upgrade -y

# Установка необходимых пакетов
log "Установка системных зависимостей..."
apt install -y python3 python3-pip python3-venv nodejs npm nginx postgresql postgresql-contrib redis-server curl git build-essential

# Создание пользователя для приложения
log "Создание пользователя dinorefs..."
if ! id "dinorefs" &>/dev/null; then
    useradd -m -s /bin/bash dinorefs
    usermod -aG www-data dinorefs
fi

# Клонирование или обновление репозитория
log "Получение исходного кода DinoRefs..."
if [ -d "/home/dinorefs/DinoRefs" ]; then
    warn "Обновление существующего репозитория..."
    cd /home/dinorefs/DinoRefs
    sudo -u dinorefs git pull origin main
else
    log "Клонирование репозитория..."
    sudo -u dinorefs git clone https://github.com/Moreozz/DinoRefs.git /home/dinorefs/DinoRefs
    cd /home/dinorefs/DinoRefs
fi

# Настройка PostgreSQL
log "Настройка PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Создание базы данных и пользователя
DB_PASSWORD=$(openssl rand -hex 16)
sudo -u postgres psql << EOF
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

# Создание виртуального окружения
sudo -u dinorefs python3 -m venv venv
sudo -u dinorefs ./venv/bin/pip install --upgrade pip

# Установка зависимостей Python
log "Установка зависимостей Python..."
sudo -u dinorefs ./venv/bin/pip install -r requirements.txt

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
YOOMONEY_NOTIFICATION_URL=http://$SERVER_IP/api/payments/yoomoney/webhook

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

# Инициализация базы данных
log "Инициализация базы данных..."
cd /home/dinorefs/DinoRefs/backend
sudo -u dinorefs ./venv/bin/python -c "
from src.database import db
from src.main import app
with app.app_context():
    db.create_all()
    print('База данных инициализирована')
" || warn "Ошибка инициализации БД, будет создана при первом запуске"

# Настройка Frontend
log "Настройка Frontend (Node.js/React)..."
cd /home/dinorefs/DinoRefs/frontend

# Создание конфигурации frontend
cat > /home/dinorefs/DinoRefs/frontend/.env << EOF
# DinoRefs Frontend Configuration
VITE_API_URL=http://$SERVER_IP/api
VITE_APP_NAME=DinoRefs
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_MODE=false
EOF

chown dinorefs:dinorefs /home/dinorefs/DinoRefs/frontend/.env

# Установка зависимостей Node.js
log "Установка зависимостей Node.js..."
sudo -u dinorefs npm install

# Сборка frontend
log "Сборка frontend приложения..."
sudo -u dinorefs npm run build

# Настройка Nginx
log "Настройка Nginx..."
cat > /etc/nginx/sites-available/dinorefs << 'EOF'
server {
    listen 80;
    server_name _;
    
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
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Активация конфигурации Nginx
ln -sf /etc/nginx/sites-available/dinorefs /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Создание systemd сервиса для backend
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
ExecStart=/home/dinorefs/DinoRefs/backend/venv/bin/gunicorn --bind 127.0.0.1:5002 --workers 4 --timeout 120 wsgi:app
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

if systemctl is-active --quiet dinorefs-backend; then
    log "✅ Backend запущен успешно"
else
    warn "❌ Проблемы с backend, проверяем логи..."
    systemctl status dinorefs-backend --no-pager -l
fi

if systemctl is-active --quiet nginx; then
    log "✅ Nginx запущен успешно"
else
    warn "❌ Проблемы с Nginx"
    systemctl status nginx --no-pager -l
fi

if systemctl is-active --quiet postgresql; then
    log "✅ PostgreSQL работает"
else
    warn "❌ Проблемы с PostgreSQL"
fi

if systemctl is-active --quiet redis-server; then
    log "✅ Redis работает"
else
    warn "❌ Проблемы с Redis"
fi

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
else
    warn "❌ Backend API недоступен, проверяем прямое подключение..."
    if curl -s http://localhost:5002/api/health > /dev/null; then
        log "✅ Backend работает, проблема в Nginx"
    else
        warn "❌ Backend не отвечает"
    fi
fi

# Настройка файрвола
log "Настройка файрвола..."
ufw --force enable
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS

# Финальная информация
echo ""
echo -e "${BLUE}🦕 DinoRefs установлен без Docker!${NC}"
echo ""
echo "📋 Информация о сервисах:"
echo "   Backend: $(systemctl is-active dinorefs-backend)"
echo "   Nginx: $(systemctl is-active nginx)"
echo "   PostgreSQL: $(systemctl is-active postgresql)"
echo "   Redis: $(systemctl is-active redis-server)"
echo ""
echo "🌐 Доступ к приложению:"
echo "   Frontend: http://$SERVER_IP"
echo "   Backend API: http://$SERVER_IP/api"
echo "   Health Check: http://$SERVER_IP/health"
echo ""
echo "📁 Важные файлы:"
echo "   Проект: /home/dinorefs/DinoRefs/"
echo "   Backend config: /home/dinorefs/DinoRefs/backend/.env"
echo "   Frontend config: /home/dinorefs/DinoRefs/frontend/.env"
echo "   Nginx config: /etc/nginx/sites-available/dinorefs"
echo "   Systemd service: /etc/systemd/system/dinorefs-backend.service"
echo ""
echo "🔧 Полезные команды:"
echo "   Статус backend: systemctl status dinorefs-backend"
echo "   Логи backend: journalctl -u dinorefs-backend -f"
echo "   Перезапуск backend: systemctl restart dinorefs-backend"
echo "   Перезапуск nginx: systemctl restart nginx"
echo ""
echo "📊 Мониторинг:"
echo "   Backend логи: tail -f /home/dinorefs/DinoRefs/logs/dinorefs.log"
echo "   Nginx логи: tail -f /var/log/nginx/access.log"
echo "   Системные ресурсы: htop"
echo ""

# Создание скрипта управления
cat > /usr/local/bin/dinorefs << 'EOF'
#!/bin/bash
# DinoRefs Management Script

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
        ;;
    logs)
        journalctl -u dinorefs-backend -f
        ;;
    update)
        cd /home/dinorefs/DinoRefs
        sudo -u dinorefs git pull origin main
        cd backend && sudo -u dinorefs ./venv/bin/pip install -r requirements.txt
        cd ../frontend && sudo -u dinorefs npm install && sudo -u dinorefs npm run build
        systemctl restart dinorefs-backend nginx
        echo "DinoRefs обновлен"
        ;;
    *)
        echo "Использование: dinorefs {start|stop|restart|status|logs|update}"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/dinorefs

echo -e "${GREEN}🎉 Установка завершена! DinoRefs работает без Docker!${NC}"
echo ""
echo "Команды управления:"
echo "   dinorefs start    - Запуск"
echo "   dinorefs stop     - Остановка"
echo "   dinorefs restart  - Перезапуск"
echo "   dinorefs status   - Статус"
echo "   dinorefs logs     - Логи"
echo "   dinorefs update   - Обновление"
echo ""
echo "🦕 Откройте http://$SERVER_IP в браузере!"

