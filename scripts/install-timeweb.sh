#!/bin/bash

# DinoRefs - Автоматическая установка на Timeweb Cloud
# Версия: 1.0

set -e

echo "🦕 Начинаем установку DinoRefs на Timeweb Cloud..."

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

# Обновление системы
log "Обновление системы..."
apt update && apt upgrade -y

# Установка Docker
log "Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    log "Docker уже установлен"
fi

# Установка Docker Compose
log "Установка Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose-plugin -y
else
    log "Docker Compose уже установлен"
fi

# Установка Git
log "Установка Git..."
if ! command -v git &> /dev/null; then
    apt install git -y
else
    log "Git уже установлен"
fi

# Клонирование репозитория
log "Клонирование DinoRefs..."
if [ -d "DinoRefs" ]; then
    warn "Папка DinoRefs уже существует. Обновляем..."
    cd DinoRefs
    git pull origin main
else
    git clone https://github.com/Moreozz/DinoRefs.git
    cd DinoRefs
fi

# Создание .env файлов
log "Создание файлов конфигурации..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    log "Создан backend/.env"
else
    warn "backend/.env уже существует"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    log "Создан frontend/.env"
else
    warn "frontend/.env уже существует"
fi

# Генерация секретных ключей
log "Генерация секретных ключей..."
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Обновление backend .env
sed -i "s/your-super-secret-key-change-this-in-production/$SECRET_KEY/" backend/.env
sed -i "s/your-jwt-secret-key-change-this-in-production/$JWT_SECRET_KEY/" backend/.env
sed -i "s/secure-password/$DB_PASSWORD/" backend/.env

log "Секретные ключи сгенерированы и установлены"

# Создание необходимых директорий
log "Создание директорий..."
mkdir -p data logs uploads

# Настройка прав доступа
chown -R 1000:1000 data logs uploads
chmod 755 data logs uploads

# Запуск приложения
log "Запуск DinoRefs..."
docker compose -f docker-compose.timeweb.yml down 2>/dev/null || true
docker compose -f docker-compose.timeweb.yml up -d

# Ожидание запуска сервисов
log "Ожидание запуска сервисов..."
sleep 30

# Проверка статуса
log "Проверка статуса сервисов..."
if docker compose -f docker-compose.timeweb.yml ps | grep -q "Up"; then
    log "✅ DinoRefs успешно запущен!"
    echo ""
    echo -e "${BLUE}🦕 DinoRefs установлен и запущен!${NC}"
    echo ""
    echo "📋 Информация о сервисах:"
    docker compose -f docker-compose.timeweb.yml ps
    echo ""
    echo "🌐 Доступ к приложению:"
    echo "   Frontend: http://$(curl -s ifconfig.me)"
    echo "   Backend API: http://$(curl -s ifconfig.me)/api"
    echo ""
    echo "📁 Важные файлы:"
    echo "   Конфигурация backend: $(pwd)/backend/.env"
    echo "   Конфигурация frontend: $(pwd)/frontend/.env"
    echo "   Логи: $(pwd)/logs/"
    echo "   Загрузки: $(pwd)/uploads/"
    echo ""
    echo "🔧 Полезные команды:"
    echo "   Просмотр логов: docker compose -f docker-compose.timeweb.yml logs -f"
    echo "   Перезапуск: docker compose -f docker-compose.timeweb.yml restart"
    echo "   Остановка: docker compose -f docker-compose.timeweb.yml down"
    echo ""
    echo "📚 Документация: https://github.com/Moreozz/DinoRefs/blob/main/TIMEWEB_DEPLOYMENT_GUIDE.md"
else
    error "❌ Ошибка запуска сервисов. Проверьте логи: docker compose -f docker-compose.timeweb.yml logs"
fi

# Настройка автозапуска
log "Настройка автозапуска..."
cat > /etc/systemd/system/dinorefs.service << EOF
[Unit]
Description=DinoRefs Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker compose -f docker-compose.timeweb.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.timeweb.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable dinorefs.service

log "✅ Автозапуск настроен"

echo ""
echo -e "${GREEN}🎉 Установка DinoRefs завершена успешно!${NC}"
echo ""
echo "Следующие шаги:"
echo "1. Настройте домен в панели Timeweb Cloud"
echo "2. Обновите CORS_ORIGINS в backend/.env"
echo "3. Обновите VITE_API_URL в frontend/.env"
echo "4. Перезапустите: docker compose -f docker-compose.timeweb.yml restart"
echo ""
echo "🦕 Добро пожаловать в DinoRefs!"

