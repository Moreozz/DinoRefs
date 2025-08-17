# 🔧 Устранение проблем развертывания DinoRefs

## ❌ Проблема: Docker Rate Limit

### **Симптомы:**
```
Error response from daemon: toomanyrequests: You have reached your unauthenticated pull rate limit
```

### **Причина:**
Docker Hub ограничивает количество скачиваний образов для неавторизованных пользователей.

### **🚀 Решение 1: Автоматическое исправление**
```bash
# Запустите скрипт исправления
curl -fsSL https://raw.githubusercontent.com/Moreozz/DinoRefs/main/scripts/fix-timeweb-issues.sh | bash
```

### **🔧 Решение 2: Ручное исправление**

#### Шаг 1: Остановка контейнеров
```bash
cd /root/DinoRefs
docker compose -f docker-compose.timeweb.yml down
```

#### Шаг 2: Создание .env файла
```bash
# Генерация секретных ключей
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Создание .env файла
cat > .env << EOF
DB_PASSWORD=${DB_PASSWORD}
SECRET_KEY=${SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
YOOMONEY_SHOP_ID=your-shop-id
YOOMONEY_SECRET_KEY=your-secret-key
EOF
```

#### Шаг 3: Использование упрощенной версии
```bash
# Создание упрощенного docker-compose
cat > docker-compose.simple.yml << 'EOF'
version: '3.8'

services:
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

networks:
  dinorefs-network:
    driver: bridge
EOF

# Запуск упрощенной версии
docker compose -f docker-compose.simple.yml up -d
```

---

## ⚠️ Проблема: Переменные окружения не установлены

### **Симптомы:**
```
WARN[0000] The "DB_PASSWORD" variable is not set. Defaulting to a blank string.
WARN[0000] The "SECRET_KEY" variable is not set. Defaulting to a blank string.
```

### **🚀 Решение:**

#### Создание корневого .env файла:
```bash
cd /root/DinoRefs

# Генерация ключей
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)

# Создание .env файла для docker-compose
cat > .env << EOF
DB_PASSWORD=${DB_PASSWORD}
SECRET_KEY=${SECRET_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
YOOMONEY_SHOP_ID=your-shop-id
YOOMONEY_SECRET_KEY=your-secret-key
EOF

# Обновление backend/.env
cat > backend/.env << EOF
FLASK_ENV=production
SECRET_KEY=${SECRET_KEY}
DATABASE_URL=postgresql://dinorefs:${DB_PASSWORD}@postgres:5432/dinorefs
JWT_SECRET_KEY=${JWT_SECRET_KEY}
CORS_ORIGINS=http://$(curl -s ifconfig.me)
REDIS_URL=redis://redis:6379/0
EOF

# Обновление frontend/.env
cat > frontend/.env << EOF
VITE_API_URL=http://$(curl -s ifconfig.me)/api
VITE_APP_NAME=DinoRefs
EOF
```

---

## 🐳 Проблема: Контейнеры не запускаются

### **Диагностика:**
```bash
# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs backend
docker compose logs frontend

# Проверка образов
docker images

# Проверка сети
docker network ls
```

### **🚀 Решения:**

#### 1. Перезапуск с очисткой:
```bash
docker compose down
docker system prune -f
docker compose up -d --build
```

#### 2. Пошаговый запуск:
```bash
# Запуск только backend
docker compose up -d backend

# Проверка логов
docker compose logs backend

# Запуск frontend
docker compose up -d frontend
```

#### 3. Использование SQLite вместо PostgreSQL:
```bash
# Изменение DATABASE_URL в backend/.env
sed -i 's|postgresql://.*|sqlite:///dinorefs.db|' backend/.env

# Перезапуск
docker compose restart backend
```

---

## 🌐 Проблема: Сайт не открывается

### **Проверки:**

#### 1. Статус контейнеров:
```bash
docker compose ps
```
Все должны быть в статусе "Up"

#### 2. Проверка портов:
```bash
netstat -tlnp | grep :80
netstat -tlnp | grep :5002
```

#### 3. Проверка файрвола:
```bash
ufw status
# Если активен, откройте порты:
ufw allow 80
ufw allow 443
```

#### 4. Проверка nginx:
```bash
docker compose logs frontend
```

### **🚀 Решения:**

#### 1. Прямой доступ к backend:
```bash
# Если frontend не работает, попробуйте backend напрямую
curl http://localhost:5002/api/health
```

#### 2. Перезапуск nginx:
```bash
docker compose restart frontend
```

#### 3. Проверка конфигурации nginx:
```bash
docker compose exec frontend nginx -t
```

---

## 📊 Мониторинг и отладка

### **Полезные команды:**

#### Просмотр ресурсов:
```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h

# Свободная память
free -h
```

#### Логи в реальном времени:
```bash
# Все сервисы
docker compose logs -f

# Только backend
docker compose logs -f backend

# Только frontend
docker compose logs -f frontend
```

#### Вход в контейнер:
```bash
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh
```

#### Проверка базы данных:
```bash
# Если используется PostgreSQL
docker compose exec postgres psql -U dinorefs -d dinorefs

# Если используется SQLite
docker compose exec backend ls -la instance/
```

---

## 🚀 Быстрые команды исправления

### **Полная перезагрузка:**
```bash
cd /root/DinoRefs
docker compose down
docker system prune -f
docker compose up -d --build
```

### **Обновление проекта:**
```bash
cd /root/DinoRefs
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

### **Сброс к заводским настройкам:**
```bash
cd /root
rm -rf DinoRefs
curl -fsSL https://raw.githubusercontent.com/Moreozz/DinoRefs/main/scripts/install-timeweb.sh | bash
```

---

## 📞 Получение помощи

### **Сбор информации для поддержки:**
```bash
# Создание отчета о системе
cat > debug-report.txt << EOF
=== DinoRefs Debug Report ===
Date: $(date)
Server IP: $(curl -s ifconfig.me)

=== Docker Info ===
$(docker --version)
$(docker compose --version)

=== Container Status ===
$(docker compose ps)

=== System Resources ===
$(free -h)
$(df -h)

=== Recent Logs ===
$(docker compose logs --tail=50)
EOF

echo "Отчет сохранен в debug-report.txt"
```

### **Контакты поддержки:**
- GitHub Issues: https://github.com/Moreozz/DinoRefs/issues
- Документация: https://github.com/Moreozz/DinoRefs/blob/main/README.md

---

## ✅ Проверочный список

После исправления проблем убедитесь:

- [ ] Все контейнеры запущены: `docker compose ps`
- [ ] Frontend доступен: `curl http://localhost`
- [ ] Backend API работает: `curl http://localhost/api/health`
- [ ] Логи без ошибок: `docker compose logs`
- [ ] Порты открыты: `netstat -tlnp | grep :80`

**DinoRefs должен работать стабильно! 🦕🚀**

