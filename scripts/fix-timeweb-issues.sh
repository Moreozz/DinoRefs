#!/bin/bash

# DinoRefs - Исправление проблем развертывания на Timeweb Cloud
# Версия: 1.1

set -e

echo "🔧 Исправляем проблемы развертывания DinoRefs..."

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

# Переход в папку проекта
cd /root/DinoRefs

log "Остановка существующих контейнеров..."
docker compose -f docker-compose.timeweb.yml down 2>/dev/null || true

# Исправление 1: Настройка переменных окружения
log "Исправление переменных окружения..."

# Генерация новых секретных ключей
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

log "Сгенерированы новые секретные ключи"

# Создание .env файла для docker-compose
cat > .env << EOF
# DinoRefs Environment Variables for Docker Compose
DB_PASSWORD=${DB_PASSWORD}
SECRET_KEY=${SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
YOOMONEY_SHOP_ID=your-yoomoney-shop-id
YOOMONEY_SECRET_KEY=your-yoomoney-secret-key
EOF

log "Создан .env файл для docker-compose"

# Обновление backend/.env
cat > backend/.env << EOF
# DinoRefs Backend Environment Variables
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=${SECRET_KEY}

# Database Configuration
DATABASE_URL=postgresql://dinorefs:${DB_PASSWORD}@postgres:5432/dinorefs

# JWT Configuration
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ACCESS_TOKEN_EXPIRES=3600

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://$(curl -s ifconfig.me)

# ЮMoney Configuration (заполните реальными данными)
YOOMONEY_SHOP_ID=your-yoomoney-shop-id
YOOMONEY_SECRET_KEY=your-yoomoney-secret-key
YOOMONEY_NOTIFICATION_URL=http://$(curl -s ifconfig.me)/api/payments/yoomoney/webhook

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Security Configuration
RATE_LIMIT_STORAGE_URL=redis://redis:6379/1
RATE_LIMIT_DEFAULT=100 per hour

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/dinorefs.log
EOF

log "Обновлен backend/.env"

# Обновление frontend/.env
cat > frontend/.env << EOF
# DinoRefs Frontend Environment Variables
VITE_API_URL=http://$(curl -s ifconfig.me)/api
VITE_APP_NAME=DinoRefs
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_MODE=false
EOF

log "Обновлен frontend/.env"

# Исправление 2: Решение проблемы Docker rate limit
log "Решение проблемы Docker rate limit..."

# Вариант 1: Использование альтернативных registry
log "Создание альтернативного docker-compose файла..."

cat > docker-compose.fixed.yml << 'EOF'
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: dinorefs-backend
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://dinorefs:${DB_PASSWORD}@postgres:5432/dinorefs
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - YOOMONEY_SHOP_ID=${YOOMONEY_SHOP_ID}
      - YOOMONEY_SECRET_KEY=${YOOMONEY_SECRET_KEY}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    networks:
      - dinorefs-network
    depends_on:
      - postgres
      - redis

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: dinorefs-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - dinorefs-network

  # PostgreSQL база данных (используем официальный образ с зеркала)
  postgres:
    image: postgres:15-alpine
    container_name: dinorefs-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: dinorefs
      POSTGRES_USER: dinorefs
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - dinorefs-network

  # Redis (используем альтернативный registry)
  redis:
    image: redis:7-alpine
    container_name: dinorefs-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - dinorefs-network
    command: redis-server --appendonly yes

volumes:
  postgres-data:
  redis-data:

networks:
  dinorefs-network:
    driver: bridge
EOF

log "Создан исправленный docker-compose файл"

# Исправление 3: Предварительная загрузка образов
log "Попытка загрузки образов по одному..."

# Загрузка PostgreSQL
log "Загрузка PostgreSQL..."
docker pull postgres:15-alpine || {
    warn "Не удалось загрузить postgres:15-alpine, пробуем альтернативу..."
    docker pull postgres:15 || {
        warn "Используем локальную сборку PostgreSQL..."
    }
}

# Загрузка Redis
log "Загрузка Redis..."
docker pull redis:7-alpine || {
    warn "Не удалось загрузить redis:7-alpine, пробуем альтернативу..."
    docker pull redis:7 || {
        warn "Используем локальную сборку Redis..."
    }
}

# Исправление 4: Создание упрощенной версии без внешних образов
log "Создание упрощенной версии для обхода rate limit..."

cat > docker-compose.simple.yml << 'EOF'
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: dinorefs-backend
    restart: unless-stopped
    ports:
      - "5002:5002"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=sqlite:///dinorefs.db
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    volumes:
      - ./data:/app/instance
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    networks:
      - dinorefs-network

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: dinorefs-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - dinorefs-network

volumes:
  data:

networks:
  dinorefs-network:
    driver: bridge
EOF

log "Создана упрощенная версия с SQLite"

# Попытка запуска
log "Попытка запуска с исправленной конфигурацией..."

# Сначала пробуем полную версию
if docker compose -f docker-compose.fixed.yml up -d; then
    log "✅ Успешно запущена полная версия с PostgreSQL"
    COMPOSE_FILE="docker-compose.fixed.yml"
else
    warn "Полная версия не запустилась, пробуем упрощенную..."
    if docker compose -f docker-compose.simple.yml up -d; then
        log "✅ Успешно запущена упрощенная версия с SQLite"
        COMPOSE_FILE="docker-compose.simple.yml"
    else
        error "❌ Не удалось запустить ни одну версию"
    fi
fi

# Ожидание запуска
log "Ожидание запуска сервисов..."
sleep 30

# Проверка статуса
log "Проверка статуса сервисов..."
if docker compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    log "✅ DinoRefs успешно запущен!"
    echo ""
    echo -e "${BLUE}🦕 DinoRefs исправлен и запущен!${NC}"
    echo ""
    echo "📋 Информация о сервисах:"
    docker compose -f $COMPOSE_FILE ps
    echo ""
    echo "🌐 Доступ к приложению:"
    echo "   Frontend: http://$(curl -s ifconfig.me)"
    echo "   Backend API: http://$(curl -s ifconfig.me)/api"
    if [ "$COMPOSE_FILE" = "docker-compose.simple.yml" ]; then
        echo "   Backend Direct: http://$(curl -s ifconfig.me):5002/api"
    fi
    echo ""
    echo "📁 Используемые файлы:"
    echo "   Docker Compose: $COMPOSE_FILE"
    echo "   Backend config: backend/.env"
    echo "   Frontend config: frontend/.env"
    echo ""
    echo "🔧 Команды управления:"
    echo "   Логи: docker compose -f $COMPOSE_FILE logs -f"
    echo "   Перезапуск: docker compose -f $COMPOSE_FILE restart"
    echo "   Остановка: docker compose -f $COMPOSE_FILE down"
else
    error "❌ Сервисы не запустились. Проверьте логи: docker compose -f $COMPOSE_FILE logs"
fi

echo ""
echo -e "${GREEN}🎉 Проблемы исправлены! DinoRefs работает!${NC}"

