# 🌳 DinoRefs - Полная структура проекта для развертывания

## 📁 Корневая структура

```
dinorefs-stage2/
├── dinorefs-backend/          # Backend API (Flask + Python)
├── dinorefs-frontend/         # Frontend SPA (React + Vite)
├── README.md                  # Документация проекта
└── .gitignore                 # Игнорируемые файлы
```

## 🐍 Backend структура (dinorefs-backend/)

```
dinorefs-backend/
├── src/
│   ├── __init__.py
│   ├── main.py                # Главный файл приложения Flask
│   ├── database.py            # Конфигурация базы данных SQLite
│   │
│   ├── models/                # Модели данных SQLAlchemy
│   │   ├── __init__.py
│   │   ├── user.py           # Модель пользователя
│   │   ├── project.py        # Модель проекта
│   │   ├── reference.py      # Модель референса
│   │   ├── project_member.py # Модель участника проекта
│   │   ├── social_account.py # Модель социальных аккаунтов
│   │   ├── referral_campaign.py # Модель реферальной кампании
│   │   ├── referral_channel.py  # Модель канала рефералов
│   │   ├── referral_step.py     # Модель шага рефералов
│   │   ├── referral_link.py     # Модель реферальной ссылки
│   │   ├── referral_tracking.py # Модель отслеживания рефералов
│   │   ├── comment.py           # Модель комментариев
│   │   ├── like.py              # Модель лайков
│   │   ├── notification.py      # Модель уведомлений
│   │   ├── analytics_event.py   # Модель событий аналитики
│   │   ├── subscription_plan.py # Модель тарифных планов
│   │   ├── user_subscription.py # Модель подписок пользователей
│   │   ├── payment.py           # Модель платежей
│   │   ├── invoice.py           # Модель счетов
│   │   ├── marketplace_item.py  # Модель товаров маркетплейса
│   │   └── purchase.py          # Модель покупок
│   │
│   ├── routes/                # API маршруты
│   │   ├── auth.py           # Авторизация и регистрация
│   │   ├── user.py           # Управление пользователями
│   │   ├── projects.py       # Управление проектами
│   │   ├── references.py     # Управление референсами
│   │   ├── admin.py          # Административные функции
│   │   ├── collaboration.py  # Совместная работа
│   │   ├── public.py         # Публичные API
│   │   ├── oauth.py          # OAuth интеграции
│   │   ├── comments.py       # Комментарии
│   │   ├── likes.py          # Лайки
│   │   ├── referrals.py      # Реферальная система
│   │   ├── notifications.py  # Уведомления
│   │   ├── analytics.py      # Аналитика
│   │   ├── predictions.py    # ML предсказания
│   │   ├── payments.py       # Платежная система
│   │   └── subscriptions.py  # Управление подписками
│   │
│   ├── services/             # Бизнес-логика и сервисы
│   │   ├── email_service.py         # Email уведомления
│   │   ├── notification_service.py  # Сервис уведомлений
│   │   ├── analytics_service.py     # Сервис аналитики
│   │   ├── ml_service.py           # ML сервис
│   │   ├── yoomoney_service.py     # Интеграция с ЮMoney
│   │   └── subscription_service.py  # Сервис подписок
│   │
│   └── tasks/                # Фоновые задачи
│       └── analytics_tasks.py # Задачи аналитики
│
├── requirements.txt          # Python зависимости
├── .env                     # Переменные окружения (создать)
└── dinorefs.db             # База данных SQLite
```

## ⚛️ Frontend структура (dinorefs-frontend/)

```
dinorefs-frontend/
├── public/
│   ├── vite.svg
│   └── favicon.ico          # Иконка сайта
│
├── src/
│   ├── components/          # React компоненты
│   │   ├── ui/             # UI компоненты (shadcn/ui)
│   │   │   ├── alert-dialog.jsx
│   │   │   ├── alert.jsx
│   │   │   ├── avatar.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── breadcrumb.jsx
│   │   │   ├── button.jsx
│   │   │   ├── calendar.jsx
│   │   │   ├── card.jsx
│   │   │   ├── carousel.jsx
│   │   │   ├── chart.jsx
│   │   │   ├── checkbox.jsx
│   │   │   ├── collapsible.jsx
│   │   │   ├── command.jsx
│   │   │   ├── context-menu.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── drawer.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── form.jsx
│   │   │   ├── hover-card.jsx
│   │   │   ├── input-otp.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── menubar.jsx
│   │   │   ├── navigation-menu.jsx
│   │   │   ├── pagination.jsx
│   │   │   ├── popover.jsx
│   │   │   ├── progress.jsx
│   │   │   ├── radio-group.jsx
│   │   │   ├── resizable.jsx
│   │   │   ├── scroll-area.jsx
│   │   │   ├── select.jsx
│   │   │   ├── separator.jsx
│   │   │   ├── sheet.jsx
│   │   │   ├── skeleton.jsx
│   │   │   ├── slider.jsx
│   │   │   ├── sonner.jsx
│   │   │   ├── switch.jsx
│   │   │   ├── table.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── toggle-group.jsx
│   │   │   ├── toggle.jsx
│   │   │   └── tooltip.jsx
│   │   │
│   │   ├── referrals/       # Компоненты реферальной системы
│   │   │   ├── ChannelSelector.jsx
│   │   │   ├── CampaignTypeSelector.jsx
│   │   │   ├── ChannelConfiguration.jsx
│   │   │   └── CampaignSummary.jsx
│   │   │
│   │   ├── LandingPage.jsx           # Лендинг страница
│   │   ├── AuthPage.jsx              # Страница авторизации
│   │   ├── Dashboard.jsx             # Главная страница
│   │   ├── Layout.jsx                # Основной макет
│   │   ├── ProjectsPage.jsx          # Страница проектов
│   │   ├── ProjectDetail.jsx         # Детали проекта
│   │   ├── ProfilePage.jsx           # Страница профиля
│   │   ├── AdminPage.jsx             # Админ панель
│   │   ├── ProjectMembers.jsx        # Участники проекта
│   │   ├── InvitationsPage.jsx       # Страница приглашений
│   │   ├── PublicProjectsPage.jsx    # Публичные проекты
│   │   ├── PublicProjectDetail.jsx   # Детали публичного проекта
│   │   ├── PublicLinksModal.jsx      # Модальное окно публичных ссылок
│   │   ├── CommentsSection.jsx       # Секция комментариев
│   │   ├── LikeButton.jsx            # Кнопка лайка
│   │   ├── SocialLoginButtons.jsx    # Кнопки социального входа
│   │   ├── OAuthCallback.jsx         # OAuth коллбэк
│   │   ├── SocialAccountsManager.jsx # Управление соц. аккаунтами
│   │   ├── ReferralCampaignWizard.jsx # Мастер реферальных кампаний
│   │   ├── ReferralsPage.jsx         # Страница рефералов
│   │   ├── ReferralAnalytics.jsx     # Аналитика рефералов
│   │   ├── NotificationBell.jsx      # Колокольчик уведомлений
│   │   ├── NotificationsPage.jsx     # Страница уведомлений
│   │   ├── NotificationToast.jsx     # Тост уведомления
│   │   ├── PushNotificationManager.jsx # Менеджер push уведомлений
│   │   ├── NotificationSettingsPage.jsx # Настройки уведомлений
│   │   ├── AnalyticsDashboard.jsx    # Дашборд аналитики
│   │   ├── ProjectAnalytics.jsx      # Аналитика проектов
│   │   ├── UserAnalytics.jsx         # Аналитика пользователей
│   │   ├── SubscriptionPlansPage.jsx # Страница тарифных планов
│   │   ├── SubscriptionManagementPage.jsx # Управление подписками
│   │   ├── PaymentCheckoutPage.jsx   # Страница оплаты
│   │   ├── PricingPage.jsx           # Страница тарифов
│   │   ├── PaymentModal.jsx          # Модальное окно оплаты
│   │   ├── PlanLimitNotification.jsx # Уведомления о лимитах
│   │   └── SubscriptionManagement.jsx # Управление подпиской
│   │
│   ├── hooks/               # React хуки
│   │   ├── use-mobile.js    # Хук для мобильных устройств
│   │   ├── useAuth.jsx      # Хук авторизации
│   │   └── usePlanLimits.jsx # Хук лимитов планов
│   │
│   ├── services/            # Сервисы frontend
│   │   ├── pushNotificationService.js # Push уведомления
│   │   └── analyticsService.js        # Аналитика
│   │
│   ├── utils/               # Утилиты
│   │   └── planLimits.js    # Утилиты лимитов планов
│   │
│   ├── lib/                 # Библиотеки
│   │   └── utils.js         # Общие утилиты
│   │
│   ├── assets/              # Статические ресурсы
│   │   └── react.svg        # Логотип React
│   │
│   ├── App.css              # Стили приложения
│   ├── App.jsx              # Главный компонент
│   ├── index.css            # Глобальные стили
│   └── main.jsx             # Точка входа
│
├── .eslintrc.cjs           # Конфигурация ESLint
├── components.json         # Конфигурация shadcn/ui
├── index.html              # HTML шаблон
├── jsconfig.json           # Конфигурация JavaScript
├── package.json            # NPM зависимости
├── package-lock.json       # Заблокированные версии
├── postcss.config.js       # Конфигурация PostCSS
├── tailwind.config.js      # Конфигурация Tailwind CSS
└── vite.config.js          # Конфигурация Vite
```

## 📋 Дополнительные файлы для развертывания

### Backend (.env файл)
```bash
# Создать файл /home/ubuntu/dinorefs-stage2/dinorefs-backend/.env
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///dinorefs.db
JWT_SECRET_KEY=your-jwt-secret-here
YOOMONEY_SHOP_ID=your-shop-id
YOOMONEY_SECRET_KEY=your-secret-key
```

### Frontend (.env файл)
```bash
# Создать файл /home/ubuntu/dinorefs-stage2/dinorefs-frontend/.env
VITE_API_URL=http://your-domain.com/api
VITE_APP_NAME=DinoRefs
```

## 🚀 Файлы для развертывания

### Dockerfile для Backend
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY src/ ./src/
EXPOSE 5002
CMD ["python", "-m", "src.main"]
```

### Dockerfile для Frontend
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./dinorefs-backend
    ports:
      - "5002:5002"
    environment:
      - FLASK_ENV=production
    volumes:
      - ./data:/app/data
  
  frontend:
    build: ./dinorefs-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

## 📊 Размер проекта

- **Backend**: ~50 файлов Python, ~15MB
- **Frontend**: ~80 файлов JS/JSX, ~200MB с node_modules
- **База данных**: SQLite файл ~5MB
- **Общий размер**: ~220MB с зависимостями

## 🔧 Команды для развертывания

```bash
# 1. Клонирование проекта
git clone <repository-url> dinorefs-stage2

# 2. Backend setup
cd dinorefs-stage2/dinorefs-backend
pip install -r requirements.txt
python -m src.main

# 3. Frontend setup
cd ../dinorefs-frontend
npm install
npm run build
npm run preview

# 4. Docker развертывание
docker-compose up -d
```

