# 🚀 Руководство по развертыванию DinoRefs на Timeweb Cloud

## 📋 Что нужно скачать дополнительно

### ❌ **Файлы НЕ включенные в репозиторий:**
1. **`.env` файлы** - переменные окружения (есть `.env.example`)
2. **`node_modules/`** - зависимости Node.js (устанавливаются автоматически)
3. **`venv/`** - виртуальное окружение Python (создается автоматически)
4. **База данных** - создается при первом запуске
5. **Логи и загрузки** - создаются автоматически

### ✅ **Все необходимые файлы ВКЛЮЧЕНЫ:**
- ✅ Исходный код frontend и backend
- ✅ Dockerfile для контейнеризации
- ✅ docker-compose.yml для оркестрации
- ✅ nginx.conf для веб-сервера
- ✅ requirements.txt с зависимостями
- ✅ package.json с зависимостями
- ✅ Примеры конфигурации (.env.example)

## 🎯 Рекомендуемые варианты развертывания на Timeweb Cloud

### **🥇 Вариант 1: Docker контейнеры (РЕКОМЕНДУЕТСЯ)**

**Преимущества:**
- ✅ Изолированная среда
- ✅ Легкое масштабирование
- ✅ Простое обновление
- ✅ Консистентность между dev/prod

**Шаги развертывания:**

#### 1. **Подготовка сервера**
```bash
# Подключение к серверу Timeweb Cloud
ssh root@your-server-ip

# Обновление системы
apt update && apt upgrade -y

# Установка Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
```

#### 2. **Клонирование репозитория**
```bash
# Клонирование проекта
git clone https://github.com/Moreozz/DinoRefs.git
cd DinoRefs

# Создание .env файлов
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### 3. **Настройка переменных окружения**
```bash
# Редактирование backend/.env
nano backend/.env
```

**Обязательные настройки для Timeweb:**
```env
# Backend .env
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-generate-new
JWT_SECRET_KEY=your-jwt-secret-generate-new
DATABASE_URL=postgresql://dinorefs:secure-password@postgres:5432/dinorefs
CORS_ORIGINS=https://your-domain.com
```

```bash
# Редактирование frontend/.env
nano frontend/.env
```

```env
# Frontend .env
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=DinoRefs
```

#### 4. **Запуск с Docker Compose**
```bash
# Для Timeweb Cloud (с PostgreSQL)
docker compose -f docker-compose.timeweb.yml up -d

# Или стандартный запуск (с SQLite)
docker compose up -d
```

#### 5. **Настройка домена и SSL**
- Привязать домен к серверу в панели Timeweb
- Настроить SSL сертификат (Let's Encrypt)

---

### **🥈 Вариант 2: Прямая установка на сервер**

**Преимущества:**
- ✅ Прямой контроль над системой
- ✅ Меньше накладных расходов
- ✅ Проще отладка

**Шаги развертывания:**

#### 1. **Подготовка сервера**
```bash
# Обновление системы
apt update && apt upgrade -y

# Установка зависимостей
apt install python3 python3-pip python3-venv nodejs npm nginx postgresql redis-server -y
```

#### 2. **Настройка Backend**
```bash
# Клонирование и настройка backend
git clone https://github.com/Moreozz/DinoRefs.git
cd DinoRefs/backend

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Настройка переменных окружения
cp .env.example .env
nano .env
```

#### 3. **Настройка Frontend**
```bash
# Переход в папку frontend
cd ../frontend

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
nano .env

# Сборка для продакшн
npm run build
```

#### 4. **Настройка базы данных**
```bash
# Создание пользователя и базы PostgreSQL
sudo -u postgres psql
CREATE DATABASE dinorefs;
CREATE USER dinorefs WITH ENCRYPTED PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE dinorefs TO dinorefs;
\q
```

#### 5. **Настройка Nginx**
```bash
# Копирование конфигурации
cp nginx.conf /etc/nginx/sites-available/dinorefs
ln -s /etc/nginx/sites-available/dinorefs /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

#### 6. **Создание systemd сервисов**
```bash
# Создание сервиса для backend
cat > /etc/systemd/system/dinorefs-backend.service << EOF
[Unit]
Description=DinoRefs Backend
After=network.target

[Service]
Type=exec
User=www-data
WorkingDirectory=/path/to/DinoRefs/backend
Environment=PATH=/path/to/DinoRefs/backend/venv/bin
ExecStart=/path/to/DinoRefs/backend/venv/bin/gunicorn --bind 127.0.0.1:5002 --workers 4 wsgi:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Запуск сервиса
systemctl daemon-reload
systemctl enable dinorefs-backend
systemctl start dinorefs-backend
```

---

## 🔧 Настройка специфичная для Timeweb Cloud

### **1. Переменные окружения для Timeweb**
```env
# backend/.env для Timeweb Cloud
DATABASE_URL=postgresql://dinorefs:password@localhost:5432/dinorefs
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=https://your-timeweb-domain.com
```

### **2. Настройка файрвола**
```bash
# Открытие необходимых портов
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### **3. Мониторинг и логи**
```bash
# Просмотр логов Docker
docker compose logs -f

# Просмотр логов приложения
tail -f logs/dinorefs.log

# Мониторинг ресурсов
docker stats
```

## 📊 Рекомендации по ресурсам Timeweb Cloud

### **Минимальные требования:**
- **CPU:** 2 ядра
- **RAM:** 4 GB
- **SSD:** 40 GB
- **Трафик:** 1 TB/месяц

### **Рекомендуемые для продакшн:**
- **CPU:** 4 ядра
- **RAM:** 8 GB
- **SSD:** 80 GB
- **Трафик:** Безлимитный

## 🚀 Команды для быстрого запуска

### **Docker вариант (РЕКОМЕНДУЕТСЯ):**
```bash
# Полная установка одной командой
curl -fsSL https://raw.githubusercontent.com/Moreozz/DinoRefs/main/scripts/install-timeweb.sh | bash
```

### **Ручная установка:**
```bash
git clone https://github.com/Moreozz/DinoRefs.git
cd DinoRefs
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Отредактируйте .env файлы
docker compose -f docker-compose.timeweb.yml up -d
```

## 🔍 Проверка работоспособности

### **Проверка сервисов:**
```bash
# Проверка статуса контейнеров
docker compose ps

# Проверка логов
docker compose logs backend
docker compose logs frontend

# Проверка доступности
curl http://localhost/health
curl http://localhost:5002/api/health
```

### **Проверка через браузер:**
- Frontend: `https://your-domain.com`
- Backend API: `https://your-domain.com/api/health`
- Админка: `https://your-domain.com/admin`

## 🛠️ Обновление приложения

### **Docker вариант:**
```bash
git pull origin main
docker compose -f docker-compose.timeweb.yml down
docker compose -f docker-compose.timeweb.yml build --no-cache
docker compose -f docker-compose.timeweb.yml up -d
```

### **Прямая установка:**
```bash
git pull origin main
cd backend && source venv/bin/activate && pip install -r requirements.txt
cd ../frontend && npm install && npm run build
systemctl restart dinorefs-backend nginx
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker compose logs`
2. Проверьте статус: `docker compose ps`
3. Перезапустите: `docker compose restart`
4. Обратитесь к документации Timeweb Cloud

**DinoRefs готов к запуску на Timeweb Cloud! 🦕🚀**

