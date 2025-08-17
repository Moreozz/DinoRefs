# Руководство по развертыванию DinoRefs на российских серверах

## Содержание
1. [Структура проекта и файлы](#структура-проекта-и-файлы)
2. [Требования к серверу](#требования-к-серверу)
3. [Российские хостинг-провайдеры](#российские-хостинг-провайдеры)
4. [Защита от DDoS](#защита-от-ddos)
5. [Соответствие 152-ФЗ](#соответствие-152-фз)
6. [Пошаговое руководство по развертыванию](#пошаговое-руководство-по-развертыванию)
7. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)

## Структура проекта и файлы

### Общая структура проекта DinoRefs

```
dinorefs/
├── dinorefs-frontend/          # Frontend приложение (React)
│   ├── node_modules/           # Зависимости Node.js
│   ├── public/                 # Статические файлы
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   └── assets/             # Изображения, шрифты и т.д.
│   ├── src/                    # Исходный код React
│   │   ├── components/         # React компоненты
│   │   ├── hooks/              # Пользовательские хуки
│   │   ├── utils/              # Утилиты и вспомогательные функции
│   │   ├── App.jsx             # Основной компонент приложения
│   │   └── main.jsx            # Точка входа
│   ├── package.json            # Зависимости и скрипты
│   ├── vite.config.js          # Конфигурация Vite
│   └── .env                    # Переменные окружения
│
├── dinorefs-backend/           # Backend приложение (Flask)
│   ├── src/                    # Исходный код Python
│   │   ├── routes/             # API маршруты
│   │   │   ├── analytics.py    # Аналитика
│   │   │   ├── comments.py     # Комментарии
│   │   │   ├── likes.py        # Лайки
│   │   │   ├── notifications.py # Уведомления
│   │   │   ├── oauth.py        # OAuth авторизация
│   │   │   ├── payments.py     # Платежи
│   │   │   └── referrals.py    # Рефералы
│   │   ├── database.py         # Работа с базой данных
│   │   └── main.py             # Основной файл приложения
│   ├── requirements.txt        # Зависимости Python
│   └── .env                    # Переменные окружения
│
├── nginx/                      # Конфигурация Nginx
│   ├── nginx.conf              # Основная конфигурация
│   └── sites-available/        # Конфигурации сайтов
│       └── dinorefs.conf       # Конфигурация DinoRefs
│
├── docker/                     # Docker конфигурация
│   ├── docker-compose.yml      # Композиция контейнеров
│   ├── frontend.Dockerfile     # Dockerfile для frontend
│   └── backend.Dockerfile      # Dockerfile для backend
│
├── scripts/                    # Скрипты развертывания
│   ├── deploy.sh               # Основной скрипт развертывания
│   ├── backup.sh               # Скрипт резервного копирования
│   └── setup_server.sh         # Настройка сервера
│
└── docs/                       # Документация
    ├── api.md                  # API документация
    └── setup.md                # Инструкции по установке
```

### Ключевые конфигурационные файлы

#### 1. Frontend (Vite + React)

**vite.config.js**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
  }
})
```

**package.json (основные зависимости)**
```json
{
  "name": "dinorefs-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "@radix-ui/react-dialog": "^1.0.4",
    "@radix-ui/react-dropdown-menu": "^2.0.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.268.0",
    "recharts": "^2.7.3",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.28",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
```

#### 2. Backend (Flask)

**requirements.txt**
```
Flask==2.3.2
Flask-Cors==4.0.0
Flask-JWT-Extended==4.5.2
Flask-SQLAlchemy==3.0.5
SQLAlchemy==2.0.19
psycopg2-binary==2.9.6
python-dotenv==1.0.0
requests==2.31.0
gunicorn==21.2.0
```

**main.py (основная структура)**
```python
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.database import init_db
from src.routes.comments import comments_bp
from src.routes.likes import likes_bp
from src.routes.oauth import oauth_bp
from src.routes.notifications import notifications_bp
from src.routes.referrals import referrals_bp
from src.routes.payments import payments_bp
from src.routes.analytics import analytics_bp
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dinorefs-secret-key')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dinorefs-jwt-secret')

# Инициализация JWT
jwt = JWTManager(app)

# Инициализация базы данных
db = init_db(app)

# Включаем CORS для всех доменов
CORS(app, origins="*", allow_headers="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Регистрируем маршруты
app.register_blueprint(comments_bp, url_prefix='/api/comments')
app.register_blueprint(likes_bp, url_prefix='/api/likes')
app.register_blueprint(oauth_bp, url_prefix='/api/oauth')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(referrals_bp, url_prefix='/api/referrals')
app.register_blueprint(payments_bp, url_prefix='/api/payments')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
```

#### 3. Nginx конфигурация

**nginx.conf (основная конфигурация)**
```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

**dinorefs.conf (конфигурация сайта)**
```nginx
server {
    listen 80;
    server_name dinorefs.ru www.dinorefs.ru;

    # Перенаправление на HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name dinorefs.ru www.dinorefs.ru;

    ssl_certificate /etc/letsencrypt/live/dinorefs.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dinorefs.ru/privkey.pem;

    # Настройки SSL
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";

    # Настройки безопасности
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (статические файлы)
    location / {
        root /var/www/dinorefs/frontend;
        try_files $uri $uri/ /index.html;
        expires 30d;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Логи
    access_log /var/log/nginx/dinorefs.access.log;
    error_log /var/log/nginx/dinorefs.error.log;
}
```

#### 4. Docker конфигурация

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: dinorefs-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - dinorefs-network

  backend:
    build:
      context: ..
      dockerfile: docker/backend.Dockerfile
    container_name: dinorefs-backend
    restart: always
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - YOOMONEY_API_KEY=${YOOMONEY_API_KEY}
      - SBP_API_KEY=${SBP_API_KEY}
    networks:
      - dinorefs-network

  frontend:
    build:
      context: ..
      dockerfile: docker/frontend.Dockerfile
    container_name: dinorefs-frontend
    restart: always
    depends_on:
      - backend
    networks:
      - dinorefs-network

  nginx:
    image: nginx:1.25
    container_name: dinorefs-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf
      - ../nginx/sites-available:/etc/nginx/sites-enabled
      - ../frontend/dist:/var/www/dinorefs/frontend
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
    networks:
      - dinorefs-network

networks:
  dinorefs-network:
    driver: bridge

volumes:
  postgres_data:
```

**backend.Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY dinorefs-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY dinorefs-backend/ .

CMD ["gunicorn", "--bind", "0.0.0.0:5002", "src.main:app"]
```

**frontend.Dockerfile**
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY dinorefs-frontend/package*.json ./
RUN npm ci

COPY dinorefs-frontend/ .
RUN npm run build

FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## Требования к серверу

### Минимальные требования

Для небольших проектов (до 1000 активных пользователей):

- **CPU**: 2 ядра (vCPU)
- **RAM**: 4 ГБ
- **Диск**: 40 ГБ SSD
- **Сеть**: 100 Мбит/с
- **ОС**: Ubuntu Server 22.04 LTS

### Рекомендуемые требования

Для средних проектов (до 10000 активных пользователей):

- **CPU**: 4 ядра (vCPU)
- **RAM**: 8 ГБ
- **Диск**: 80 ГБ SSD
- **Сеть**: 1 Гбит/с
- **ОС**: Ubuntu Server 22.04 LTS

### Требования для высоконагруженных проектов

Для крупных проектов (более 10000 активных пользователей):

- **CPU**: 8+ ядер (vCPU)
- **RAM**: 16+ ГБ
- **Диск**: 160+ ГБ SSD
- **Сеть**: 1 Гбит/с с возможностью расширения
- **ОС**: Ubuntu Server 22.04 LTS

### Программное обеспечение

Необходимое программное обеспечение для сервера:

- **Nginx**: Веб-сервер и обратный прокси
- **Docker и Docker Compose**: Контейнеризация приложений
- **PostgreSQL**: База данных
- **Python 3.11+**: Для бэкенда
- **Node.js 20+**: Для сборки фронтенда
- **Certbot**: Для получения SSL-сертификатов Let's Encrypt
- **UFW**: Файрвол
- **Fail2ban**: Защита от брутфорс-атак

## Российские хостинг-провайдеры

### Сравнение провайдеров

| Провайдер | Преимущества | Недостатки | Соответствие 152-ФЗ | Защита от DDoS | Цены (руб/мес) |
|-----------|--------------|------------|---------------------|---------------|---------------|
| **Reg.ru** | - Широкий выбор тарифов<br>- Интеграция с доменами<br>- Техподдержка 24/7 | - Высокая стоимость<br>- Ограниченные ресурсы на базовых тарифах | Да | Базовая защита включена | От 590 |
| **Timeweb** | - Хорошее соотношение цена/качество<br>- Быстрые SSD<br>- Простая панель управления | - Ограниченная масштабируемость | Да | Дополнительная услуга | От 299 |
| **Beget** | - Стабильная работа<br>- Хорошая техподдержка<br>- Простота использования | - Ограниченные возможности настройки | Да | Включена в тарифы | От 390 |
| **Selectel** | - Высокая производительность<br>- Гибкая настройка<br>- Масштабируемость | - Высокая стоимость<br>- Сложность настройки | Да | Продвинутая защита | От 400 |
| **MCS (Mail.ru Cloud Solutions)** | - Высокая надежность<br>- Интеграция с другими сервисами Mail.ru<br>- Масштабируемость | - Высокая стоимость для малого бизнеса | Да | Продвинутая защита | От 500 |

### Рекомендации для DinoRefs

#### Для малых проектов (до 1000 пользователей)
- **Рекомендуемый провайдер**: Timeweb
- **Тариф**: VPS 4 ГБ RAM
- **Стоимость**: ~600-800 руб/мес
- **Особенности**: Простота настройки, достаточная производительность, хорошая техподдержка

#### Для средних проектов (до 10000 пользователей)
- **Рекомендуемый провайдер**: Selectel
- **Тариф**: Cloud VPS 8 ГБ RAM
- **Стоимость**: ~2000-3000 руб/мес
- **Особенности**: Высокая надежность, возможность масштабирования, хорошая защита от DDoS

#### Для крупных проектов (более 10000 пользователей)
- **Рекомендуемый провайдер**: MCS (Mail.ru Cloud Solutions)
- **Тариф**: Выделенный сервер или кластер
- **Стоимость**: от 5000 руб/мес
- **Особенности**: Высокая производительность, масштабируемость, продвинутая защита от DDoS, соответствие всем требованиям 152-ФЗ

## Защита от DDoS

### Варианты защиты

#### 1. Встроенная защита хостинг-провайдера
Большинство российских хостинг-провайдеров предлагают базовую защиту от DDoS-атак:

- **Reg.ru**: Базовая защита включена во все тарифы, расширенная доступна за дополнительную плату
- **Timeweb**: Защита от DDoS как дополнительная услуга (~500 руб/мес)
- **Selectel**: Продвинутая защита включена в большинство тарифов
- **MCS**: Комплексная защита от DDoS-атак

#### 2. Российские CDN с защитой от DDoS
- **Qrator Labs**: Российская компания, специализирующаяся на защите от DDoS
- **StormWall**: Российский сервис защиты от DDoS-атак
- **NGENIX**: Российская CDN с защитой от DDoS

#### 3. Настройка Captcha
Для защиты форм и критичных страниц рекомендуется использовать российские аналоги reCAPTCHA:

- **Yandex SmartCaptcha**: https://captcha.yandex.ru/
- **VK Captcha**: Доступна через VK API

### Настройка Yandex SmartCaptcha

1. Зарегистрируйтесь на сайте https://captcha.yandex.ru/
2. Создайте новый сайт и получите ключи (публичный и секретный)
3. Интегрируйте в frontend:

```jsx
// Компонент YandexCaptcha.jsx
import React, { useEffect } from 'react';

const YandexCaptcha = ({ onVerify }) => {
  useEffect(() => {
    // Загрузка скрипта Яндекс Капчи
    const script = document.createElement('script');
    script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js';
    script.async = true;
    document.body.appendChild(script);

    // Инициализация капчи после загрузки скрипта
    script.onload = () => {
      window.smartCaptcha.render('captcha-container', {
        sitekey: 'YOUR_YANDEX_CAPTCHA_SITE_KEY',
        callback: (token) => {
          onVerify(token);
        },
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [onVerify]);

  return <div id="captcha-container"></div>;
};

export default YandexCaptcha;
```

4. Проверка токена на backend:

```python
import requests

def verify_captcha(token):
    response = requests.post('https://smartcaptcha.yandexcloud.net/validate', data={
        'secret': 'YOUR_YANDEX_CAPTCHA_SECRET_KEY',
        'token': token
    })
    
    result = response.json()
    return result.get('status') == 'ok'
```

## Соответствие 152-ФЗ

### Основные требования 152-ФЗ

1. **Локализация данных**: Персональные данные граждан РФ должны храниться на серверах, физически расположенных на территории РФ
2. **Согласие на обработку**: Необходимо получать согласие пользователей на обработку их персональных данных
3. **Политика конфиденциальности**: Должна быть доступна на сайте
4. **Защита данных**: Необходимо обеспечить защиту персональных данных от несанкционированного доступа
5. **Уведомление Роскомнадзора**: Необходимо уведомить Роскомнадзор о намерении обрабатывать персональные данные

### Реализация требований в DinoRefs

#### 1. Локализация данных
- Размещение на серверах российских хостинг-провайдеров (Reg.ru, Timeweb, Selectel, MCS)
- Использование российских CDN для кэширования контента

#### 2. Согласие на обработку
Добавьте форму согласия при регистрации:

```jsx
// Компонент согласия на обработку персональных данных
import { Checkbox } from '@/components/ui/checkbox';

const PrivacyConsent = ({ value, onChange }) => {
  return (
    <div className="flex items-center space-x-2 mt-4">
      <Checkbox 
        id="privacy-consent" 
        checked={value} 
        onCheckedChange={onChange} 
        required
      />
      <label 
        htmlFor="privacy-consent" 
        className="text-sm text-gray-600"
      >
        Я согласен на обработку моих персональных данных в соответствии с{' '}
        <a 
          href="/privacy-policy" 
          target="_blank" 
          className="text-blue-600 hover:underline"
        >
          Политикой конфиденциальности
        </a>
      </label>
    </div>
  );
};
```

#### 3. Политика конфиденциальности
Создайте страницу с политикой конфиденциальности:

```jsx
// Компонент страницы политики конфиденциальности
const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Политика конфиденциальности</h1>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
          <p className="text-gray-700">
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сервиса DinoRefs.
          </p>
        </section>
        
        {/* Другие разделы политики */}
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">8. Контактная информация</h2>
          <p className="text-gray-700">
            По всем вопросам, связанным с обработкой персональных данных, вы можете обратиться по адресу: support@dinorefs.ru
          </p>
        </section>
      </div>
    </Layout>
  );
};
```

#### 4. Защита данных
- Использование HTTPS (SSL-сертификаты Let's Encrypt)
- Шифрование паролей (bcrypt)
- Защита от SQL-инъекций (параметризованные запросы)
- Защита от XSS-атак (санитизация ввода)
- Регулярное обновление ПО

#### 5. Уведомление Роскомнадзора
- Заполните форму уведомления на сайте Роскомнадзора: https://pd.rkn.gov.ru/operators-registry/notification/form/
- Отправьте уведомление в территориальный орган Роскомнадзора

## Пошаговое руководство по развертыванию

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw fail2ban

# Настройка файрвола
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Установка Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Настройка Fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Клонирование репозитория

```bash
# Создание рабочей директории
mkdir -p /var/www/dinorefs
cd /var/www/dinorefs

# Клонирование репозитория
git clone https://github.com/your-username/dinorefs.git .
```

### 3. Настройка переменных окружения

```bash
# Создание файла .env
cat > .env << EOF
# Database
DB_USER=dinorefs
DB_PASSWORD=your_strong_password
DB_NAME=dinorefs

# Security
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# Payment systems
YOOMONEY_API_KEY=your_yoomoney_api_key
SBP_API_KEY=your_sbp_api_key
EOF
```

### 4. Настройка Nginx

```bash
# Создание конфигурации Nginx
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp nginx/sites-available/dinorefs.conf /etc/nginx/sites-available/

# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/dinorefs.conf /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

### 5. Получение SSL-сертификата

```bash
# Получение сертификата Let's Encrypt
sudo certbot --nginx -d dinorefs.ru -d www.dinorefs.ru
```

### 6. Запуск приложения с Docker Compose

```bash
# Запуск контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 7. Настройка автоматического обновления сертификатов

```bash
# Проверка работы Certbot
sudo certbot renew --dry-run

# Настройка cron-задания для обновления сертификатов
echo "0 3 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee -a /etc/crontab
```

## Мониторинг и обслуживание

### Мониторинг системы

#### 1. Установка Prometheus и Grafana

```bash
# Создание docker-compose.monitoring.yml
cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    ports:
      - "9090:9090"
    restart: always
    networks:
      - monitoring-network

  node-exporter:
    image: prom/node-exporter
    container_name: node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    restart: always
    networks:
      - monitoring-network

  grafana:
    image: grafana/grafana
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    restart: always
    networks:
      - monitoring-network

networks:
  monitoring-network:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
EOF

# Запуск мониторинга
docker-compose -f docker-compose.monitoring.yml up -d
```

#### 2. Настройка алертов

Создайте файл `prometheus/alert.rules`:

```yaml
groups:
- name: dinorefs-alerts
  rules:
  - alert: HighCPULoad
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU load (instance {{ $labels.instance }})"
      description: "CPU load is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: HighMemoryLoad
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory load (instance {{ $labels.instance }})"
      description: "Memory load is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: HighDiskUsage
    expr: (node_filesystem_size_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs"} - node_filesystem_free_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs"}) / node_filesystem_size_bytes{fstype!~"tmpfs|fuse.lxcfs|squashfs"} * 100 > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High disk usage (instance {{ $labels.instance }})"
      description: "Disk usage is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"
```

### Резервное копирование

#### 1. Создание скрипта резервного копирования

```bash
#!/bin/bash
# backup.sh

# Настройки
BACKUP_DIR="/var/backups/dinorefs"
DB_CONTAINER="dinorefs-postgres"
DB_USER="dinorefs"
DB_NAME="dinorefs"
FRONTEND_DIR="/var/www/dinorefs/frontend"
BACKEND_DIR="/var/www/dinorefs/backend"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="dinorefs_backup_$DATE"

# Создание директории для бэкапа
mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/$BACKUP_NAME.sql

# Бэкап файлов
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz $FRONTEND_DIR $BACKEND_DIR

# Удаление старых бэкапов (оставляем только последние 7)
find $BACKUP_DIR -name "dinorefs_backup_*.sql" -type f -mtime +7 -delete
find $BACKUP_DIR -name "dinorefs_backup_*.tar.gz" -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_NAME"
```

#### 2. Настройка автоматического резервного копирования

```bash
# Добавление прав на выполнение
chmod +x backup.sh

# Добавление в crontab (ежедневное резервное копирование в 2:00)
echo "0 2 * * * root /var/www/dinorefs/scripts/backup.sh >> /var/log/dinorefs-backup.log 2>&1" | sudo tee -a /etc/crontab
```

### Обновление приложения

#### 1. Создание скрипта обновления

```bash
#!/bin/bash
# update.sh

# Переход в директорию проекта
cd /var/www/dinorefs

# Получение последних изменений
git pull

# Перезапуск контейнеров
docker-compose down
docker-compose up -d

echo "Update completed at $(date)"
```

#### 2. Настройка автоматического обновления

```bash
# Добавление прав на выполнение
chmod +x update.sh

# Добавление в crontab (еженедельное обновление в воскресенье в 3:00)
echo "0 3 * * 0 root /var/www/dinorefs/scripts/update.sh >> /var/log/dinorefs-update.log 2>&1" | sudo tee -a /etc/crontab
```

---

Это руководство предоставляет полную информацию для развертывания DinoRefs на российских серверах с учетом требований 152-ФЗ и защиты от DDoS-атак. При возникновении вопросов или проблем обращайтесь в техническую поддержку.

