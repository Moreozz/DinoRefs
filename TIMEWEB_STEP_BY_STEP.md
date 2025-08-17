# 🚀 Пошаговое развертывание DinoRefs на Timeweb Cloud

## 📋 Что вам понадобится:
- Аккаунт на Timeweb Cloud
- Домен (опционально, можно использовать IP)
- 15-20 минут времени

---

## 🖥️ Шаг 1: Создание сервера на Timeweb Cloud

### 1.1 Вход в панель управления
1. Перейдите на **https://timeweb.cloud/**
2. Нажмите **"Войти"** в правом верхнем углу
3. Введите логин и пароль от аккаунта Timeweb

### 1.2 Создание облачного сервера
1. В левом меню нажмите **"Облачные серверы"**
2. Нажмите синюю кнопку **"Создать сервер"**

### 1.3 Выбор конфигурации сервера

#### **Операционная система:**
- Выберите **"Ubuntu"**
- Версия: **"Ubuntu 22.04 LTS"** (рекомендуется)

#### **Конфигурация (выберите одну):**

**🥉 Минимальная (для тестирования):**
- **CPU:** 2 ядра
- **RAM:** 4 GB
- **SSD:** 40 GB
- **Стоимость:** ~1,500₽/месяц

**🥈 Рекомендуемая (для продакшн):**
- **CPU:** 4 ядра  
- **RAM:** 8 GB
- **SSD:** 80 GB
- **Стоимость:** ~3,000₽/месяц

**🥇 Оптимальная (для высоких нагрузок):**
- **CPU:** 8 ядер
- **RAM:** 16 GB
- **SSD:** 160 GB
- **Стоимость:** ~6,000₽/месяц

#### **Дополнительные настройки:**
1. **Имя сервера:** введите `dinorefs-server`
2. **SSH ключи:** если есть - добавьте, если нет - пропустите
3. **Пароль root:** будет отправлен на email
4. **Резервные копии:** рекомендуется включить

### 1.4 Создание сервера
1. Нажмите **"Создать сервер"**
2. Дождитесь создания (2-5 минут)
3. **Запишите IP адрес** сервера (например: `185.xxx.xxx.xxx`)

---

## 🔐 Шаг 2: Подключение к серверу

### 2.1 Получение данных для подключения
1. В панели Timeweb найдите созданный сервер
2. Нажмите на его название
3. Во вкладке **"Основное"** найдите:
   - **IP адрес:** `185.xxx.xxx.xxx`
   - **Пароль root:** проверьте email

### 2.2 Подключение через SSH

#### **Windows (используйте PuTTY или PowerShell):**
```powershell
ssh root@185.xxx.xxx.xxx
```

#### **macOS/Linux (используйте Terminal):**
```bash
ssh root@185.xxx.xxx.xxx
```

### 2.3 Первое подключение
1. При первом подключении появится вопрос о fingerprint
2. Введите **`yes`** и нажмите Enter
3. Введите пароль root (из email)
4. Вы должны увидеть приглашение: `root@dinorefs-server:~#`

---

## 🚀 Шаг 3: Автоматическая установка DinoRefs

### 3.1 Запуск установки одной командой
Скопируйте и вставьте эту команду в терминал:

```bash
curl -fsSL https://raw.githubusercontent.com/Moreozz/DinoRefs/main/scripts/install-timeweb.sh | bash
```

**Что делать:**
1. **Скопируйте** команду выше (Ctrl+C)
2. **Вставьте** в терминал сервера (Ctrl+V или правая кнопка мыши)
3. Нажмите **Enter**

### 3.2 Процесс установки
Установка займет **5-10 минут**. Вы увидите:

```
🦕 Начинаем установку DinoRefs на Timeweb Cloud...
[INFO] Обновление системы...
[INFO] Установка Docker...
[INFO] Установка Docker Compose...
[INFO] Клонирование DinoRefs...
[INFO] Создание файлов конфигурации...
[INFO] Генерация секретных ключей...
[INFO] Запуск DinoRefs...
[INFO] ✅ DinoRefs успешно запущен!
```

### 3.3 Результат установки
После успешной установки вы увидите:

```
🦕 DinoRefs установлен и запущен!

📋 Информация о сервисах:
NAME                    COMMAND                  SERVICE             STATUS
dinorefs-backend        "gunicorn --bind 0.0…"   backend             running
dinorefs-frontend       "/docker-entrypoint.…"   frontend            running  
dinorefs-postgres       "docker-entrypoint.s…"   postgres            running
dinorefs-redis          "docker-entrypoint.s…"   redis               running

🌐 Доступ к приложению:
   Frontend: http://185.xxx.xxx.xxx
   Backend API: http://185.xxx.xxx.xxx/api
```

---

## 🌐 Шаг 4: Проверка работоспособности

### 4.1 Проверка через браузер
1. Откройте браузер
2. Перейдите по адресу: `http://185.xxx.xxx.xxx` (ваш IP)
3. Должна открыться главная страница DinoRefs с динозаврами

### 4.2 Проверка API
1. Перейдите по адресу: `http://185.xxx.xxx.xxx/api/health`
2. Должен отобразиться JSON: `{"status": "healthy"}`

### 4.3 Если что-то не работает
Выполните команды диагностики:

```bash
# Проверка статуса контейнеров
cd DinoRefs
docker compose -f docker-compose.timeweb.yml ps

# Просмотр логов
docker compose -f docker-compose.timeweb.yml logs backend
docker compose -f docker-compose.timeweb.yml logs frontend
```

---

## 🌍 Шаг 5: Настройка домена (опционально)

### 5.1 Если у вас есть домен
1. В панели Timeweb перейдите в **"DNS"**
2. Добавьте домен
3. Создайте A-запись:
   - **Имя:** `@` (или `dinorefs`)
   - **Тип:** `A`
   - **Значение:** `185.xxx.xxx.xxx` (IP вашего сервера)

### 5.2 Обновление конфигурации для домена
```bash
# Подключитесь к серверу
ssh root@185.xxx.xxx.xxx

# Перейдите в папку проекта
cd DinoRefs

# Отредактируйте конфигурацию backend
nano backend/.env
```

**Найдите и измените:**
```env
CORS_ORIGINS=https://your-domain.com
```

**Отредактируйте конфигурацию frontend:**
```bash
nano frontend/.env
```

**Найдите и измените:**
```env
VITE_API_URL=https://your-domain.com/api
```

**Перезапустите сервисы:**
```bash
docker compose -f docker-compose.timeweb.yml restart
```

---

## 🔒 Шаг 6: Настройка SSL (HTTPS)

### 6.1 Установка Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 6.2 Получение SSL сертификата
```bash
certbot --nginx -d your-domain.com
```

### 6.3 Автообновление сертификата
```bash
crontab -e
```

Добавьте строку:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🛠️ Шаг 7: Полезные команды для управления

### 7.1 Управление сервисами
```bash
# Перейти в папку проекта
cd DinoRefs

# Просмотр статуса
docker compose -f docker-compose.timeweb.yml ps

# Просмотр логов
docker compose -f docker-compose.timeweb.yml logs -f

# Перезапуск
docker compose -f docker-compose.timeweb.yml restart

# Остановка
docker compose -f docker-compose.timeweb.yml down

# Запуск
docker compose -f docker-compose.timeweb.yml up -d
```

### 7.2 Обновление приложения
```bash
cd DinoRefs
git pull origin main
docker compose -f docker-compose.timeweb.yml down
docker compose -f docker-compose.timeweb.yml build --no-cache
docker compose -f docker-compose.timeweb.yml up -d
```

### 7.3 Мониторинг ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h

# Использование памяти
free -h

# Загрузка CPU
top
```

---

## 🎯 Краткий чек-лист

### ✅ **Что должно работать после установки:**
- [ ] Сервер создан на Timeweb Cloud
- [ ] SSH подключение работает
- [ ] Автоматическая установка завершена успешно
- [ ] DinoRefs открывается по IP адресу
- [ ] API отвечает на `/api/health`
- [ ] Все 4 контейнера запущены (backend, frontend, postgres, redis)

### 🔧 **Дополнительные настройки (по желанию):**
- [ ] Домен настроен и работает
- [ ] SSL сертификат установлен
- [ ] Мониторинг настроен
- [ ] Резервные копии включены

---

## 📞 Поддержка

### Если что-то пошло не так:

1. **Проверьте логи:**
   ```bash
   cd DinoRefs
   docker compose -f docker-compose.timeweb.yml logs
   ```

2. **Перезапустите сервисы:**
   ```bash
   docker compose -f docker-compose.timeweb.yml restart
   ```

3. **Проверьте статус:**
   ```bash
   docker compose -f docker-compose.timeweb.yml ps
   ```

4. **Обратитесь в поддержку Timeweb** если проблемы с сервером

---

## 🎉 Поздравляем!

**DinoRefs успешно развернут на Timeweb Cloud!** 🦕🚀

Теперь у вас есть полноценная платформа управления реферальными программами с:
- ✅ Современным интерфейсом
- ✅ Мощным API
- ✅ Системой аналитики
- ✅ Интеграцией платежей
- ✅ Уникальными динозаврами

**Время развертывания: 15-20 минут**  
**Сложность: Легкая** (одна команда)

