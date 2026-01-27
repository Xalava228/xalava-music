# 🚀 Полное руководство по деплою XALAVA MUSIC

> **Как загрузить проект на бесплатный сервер максимально легко**

---

## 📋 Содержание

1. [Подготовка проекта](#подготовка-проекта)
2. [Вариант 1: Render.com (РЕКОМЕНДУЕТСЯ)](#вариант-1-rendercom-рекомендуется)
3. [Вариант 2: Railway.app](#вариант-2-railwayapp)
4. [Вариант 3: PythonAnywhere](#вариант-3-pythonanywhere)
5. [Вариант 4: Fly.io](#вариант-4-flyio)
6. [Настройка после деплоя](#настройка-после-деплоя)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Подготовка проекта

### Шаг 1: Проверьте файлы

Убедитесь, что у вас есть:
- ✅ `app.py` - главный файл приложения
- ✅ `requirements.txt` - зависимости
- ✅ `Procfile` - для некоторых платформ
- ✅ `runtime.txt` - версия Python
- ✅ `.gitignore` - исключения для Git

### Шаг 2: Обновите requirements.txt

Убедитесь, что `requirements.txt` содержит:
```
Flask==3.0.0
flask-cors==4.0.0
yandex-music
```

### Шаг 3: Настройте app.py для продакшена

Убедитесь, что в конце `app.py` есть:
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

**Важно:** `host='0.0.0.0'` необходим для работы на сервере!

---

## 🌟 Вариант 1: Render.com (РЕКОМЕНДУЕТСЯ)

> **Самый простой и бесплатный вариант!**

### ✅ Преимущества:
- ✅ Полностью бесплатный tier
- ✅ Автоматический деплой из GitHub
- ✅ Простая настройка
- ✅ HTTPS из коробки
- ✅ Автоматические обновления

### 📝 Пошаговая инструкция:

#### 1. Создайте аккаунт на Render.com

1. Перейдите на https://render.com
2. Нажмите **"Get Started for Free"**
3. Зарегистрируйтесь через GitHub (рекомендуется) или email

#### 2. Подготовьте репозиторий GitHub

**Если у вас нет репозитория:**

1. Создайте аккаунт на https://github.com (если нет)
2. Создайте новый репозиторий:
   - Нажмите **"New repository"**
   - Название: `xalava-music` (или любое другое)
   - Выберите **Private** (или Public)
   - Нажмите **"Create repository"**

3. Загрузите код в репозиторий:

```bash
# Откройте терминал в папке проекта
cd c:\Users\bogda\Desktop\yandex-music-api-2.2.0

# Инициализируйте Git (если еще не сделано)
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: XALAVA MUSIC app"

# Добавьте удаленный репозиторий (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/xalava-music.git

# Загрузите код
git branch -M main
git push -u origin main
```

**Если у вас уже есть репозиторий:**
```bash
git add .
git commit -m "Ready for deployment"
git push
```

#### 3. Создайте Web Service на Render

1. Войдите в Render Dashboard: https://dashboard.render.com
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите GitHub:
   - Нажмите **"Connect GitHub"**
   - Разрешите доступ к репозиторию
   - Выберите ваш репозиторий `xalava-music`

4. Настройте сервис:

   **Basic Settings:**
   - **Name:** `xalava-music` (или любое другое)
   - **Region:** `Frankfurt` (или ближайший к вам)
   - **Branch:** `main` (или `master`)
   - **Root Directory:** `web_app` ⚠️ **ВАЖНО!**
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`

   **Advanced Settings (опционально):**
   - **Environment Variables:**
     ```
     SECRET_KEY=your_secret_key_here_min_32_chars
     PORT=8080
     ```

5. Нажмите **"Create Web Service"**

#### 4. Дождитесь деплоя

- Render автоматически начнет деплой
- Это займет 3-5 минут
- Вы увидите логи в реальном времени
- После успешного деплоя вы получите URL: `https://xalava-music.onrender.com`

#### 5. Настройте переменные окружения

1. В Dashboard Render перейдите в ваш сервис
2. Откройте вкладку **"Environment"**
3. Добавьте переменные:
   ```
   SECRET_KEY=ваш_секретный_ключ_минимум_32_символа
   PORT=8080
   ```
4. Нажмите **"Save Changes"** (автоматически перезапустится)

#### 6. Готово! 🎉

Ваш сайт доступен по адресу:
```
https://xalava-music.onrender.com
```

---

## 🚂 Вариант 2: Railway.app

> **Очень простой деплой через GitHub**

### ✅ Преимущества:
- ✅ Бесплатный tier ($5 кредитов в месяц)
- ✅ Очень простая настройка
- ✅ Автоматический деплой
- ✅ HTTPS из коробки

### 📝 Пошаговая инструкция:

#### 1. Создайте аккаунт

1. Перейдите на https://railway.app
2. Нажмите **"Start a New Project"**
3. Войдите через GitHub

#### 2. Создайте проект

1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Выберите ваш репозиторий `xalava-music`
4. Railway автоматически определит Python проект

#### 3. Настройте проект

1. Railway автоматически создаст сервис
2. Откройте **Settings** → **Root Directory**
3. Установите: `web_app` ⚠️ **ВАЖНО!**

4. Добавьте переменные окружения:
   - Откройте **Variables**
   - Добавьте:
     ```
     SECRET_KEY=your_secret_key_here
     PORT=8080
     ```

#### 4. Настройте команду запуска

1. Откройте **Settings** → **Deploy**
2. **Start Command:** `python app.py`

#### 5. Готово! 🎉

Railway автоматически даст вам URL:
```
https://xalava-music-production.up.railway.app
```

---

## 🐍 Вариант 3: PythonAnywhere

> **Классический вариант для Python приложений**

### ✅ Преимущества:
- ✅ Бесплатный tier (1 веб-приложение)
- ✅ Простая настройка
- ✅ Поддержка SQLite
- ✅ Прямой доступ к файлам

### 📝 Пошаговая инструкция:

#### 1. Создайте аккаунт

1. Перейдите на https://www.pythonanywhere.com
2. Нажмите **"Sign up for Beginner account"** (бесплатно)
3. Зарегистрируйтесь

#### 2. Загрузите файлы

**Способ 1: Через веб-интерфейс**

1. Войдите в Dashboard
2. Откройте вкладку **"Files"**
3. Создайте папку `xalava-music`
4. Загрузите все файлы из `web_app/`:
   - `app.py`
   - `database.py`
   - `database_api.py`
   - `requirements.txt`
   - Папку `templates/`
   - Папку `static/`

**Способ 2: Через Git (рекомендуется)**

1. Откройте вкладку **"Consoles"**
2. Создайте **Bash console**
3. Выполните:
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/xalava-music.git
cd xalava-music/web_app
```

#### 3. Установите зависимости

1. Откройте **Bash console**
2. Выполните:
```bash
cd ~/xalava-music/web_app
pip3.10 install --user -r requirements.txt
```

#### 4. Настройте Web App

1. Откройте вкладку **"Web"**
2. Нажмите **"Add a new web app"**
3. Выберите **"Manual configuration"**
4. Выберите **Python 3.10**

5. Настройте WSGI файл:
   - Нажмите на ссылку **WSGI configuration file**
   - Замените содержимое на:
   ```python
   import sys
   import os
   
   # Добавляем путь к приложению
   path = '/home/YOUR_USERNAME/xalava-music/web_app'
   if path not in sys.path:
       sys.path.insert(0, path)
   
   os.chdir(path)
   
   from app import app as application
   ```
   (Замените `YOUR_USERNAME` на ваш username)

6. Настройте Source code:
   - **Source code:** `/home/YOUR_USERNAME/xalava-music/web_app`
   - **Working directory:** `/home/YOUR_USERNAME/xalava-music/web_app`

#### 5. Настройте переменные окружения

1. В WSGI файле добавьте перед `from app import`:
   ```python
   import os
   os.environ['SECRET_KEY'] = 'your_secret_key_here'
   ```

#### 6. Перезапустите приложение

1. На вкладке **"Web"**
2. Нажмите зеленую кнопку **"Reload"**

#### 7. Готово! 🎉

Ваш сайт доступен по адресу:
```
https://YOUR_USERNAME.pythonanywhere.com
```

---

## ✈️ Вариант 4: Fly.io

> **Современная платформа с хорошим бесплатным tier**

### ✅ Преимущества:
- ✅ Бесплатный tier (3 shared-cpu VMs)
- ✅ Быстрый деплой
- ✅ Глобальная сеть
- ✅ HTTPS из коробки

### 📝 Пошаговая инструкция:

#### 1. Установите Fly CLI

**Windows:**
```powershell
# Через PowerShell
iwr https://fly.io/install.ps1 -useb | iex
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. Создайте аккаунт

```bash
fly auth signup
```

#### 3. Создайте fly.toml

В папке `web_app/` создайте файл `fly.toml`:

```toml
app = "xalava-music"
primary_region = "fra"

[build]

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

#### 4. Создайте Dockerfile

В папке `web_app/` создайте `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["python", "app.py"]
```

#### 5. Деплой

```bash
cd web_app
fly launch
```

Следуйте инструкциям:
- Выберите регион (например, `fra` для Frankfurt)
- Не создавайте PostgreSQL (нажмем No)
- Не создавайте Redis (нажмем No)

#### 6. Настройте секреты

```bash
fly secrets set SECRET_KEY=your_secret_key_here
```

#### 7. Готово! 🎉

Ваш сайт доступен по адресу:
```
https://xalava-music.fly.dev
```

---

## ⚙️ Настройка после деплоя

### 1. Проверьте работу сайта

Откройте ваш URL в браузере:
- Render: `https://xalava-music.onrender.com`
- Railway: `https://xalava-music-production.up.railway.app`
- PythonAnywhere: `https://YOUR_USERNAME.pythonanywhere.com`
- Fly.io: `https://xalava-music.fly.dev`

### 2. Настройте переменные окружения

**Обязательные:**
```
SECRET_KEY=ваш_секретный_ключ_минимум_32_символа
PORT=8080
```

**Как сгенерировать SECRET_KEY:**
```python
import secrets
print(secrets.token_hex(32))
```

### 3. Проверьте базу данных

- SQLite файл `music_app.db` будет создан автоматически
- На некоторых платформах (Render, Railway) файлы могут удаляться при перезапуске
- Для продакшена рекомендуется использовать PostgreSQL (опционально)

### 4. Настройте видео-фон

**Важно:** Видео файлы (`fonone.mp4`, `fontwo.mp4`) слишком большие для Git!

**Варианты:**

**Вариант A: Загрузите вручную после деплоя**
- Через веб-интерфейс платформы
- Или через SFTP/FTP

**Вариант B: Используйте внешний хостинг**
- Загрузите на Google Drive / Dropbox
- Получите прямую ссылку
- Обновите путь в `index.html`

**Вариант C: Удалите видео (временно)**
- Сайт будет работать без видео-фона
- Используется только overlay

---

## 🔧 Troubleshooting

### Проблема: "Module not found"

**Решение:**
1. Проверьте `requirements.txt`
2. Убедитесь, что все зависимости указаны
3. Перезапустите приложение

### Проблема: "Port already in use"

**Решение:**
- Используйте переменную окружения `PORT`
- Платформы автоматически устанавливают порт

### Проблема: "Database locked"

**Решение:**
- SQLite может блокироваться при множественных запросах
- Для продакшена используйте PostgreSQL (опционально)

### Проблема: "Application error"

**Решение:**
1. Проверьте логи в Dashboard платформы
2. Убедитесь, что `Root Directory` = `web_app`
3. Проверьте, что `Start Command` правильный
4. Проверьте переменные окружения

### Проблема: Видео не загружается

**Решение:**
- Видео файлы слишком большие для Git
- Загрузите их вручную или используйте внешний хостинг
- Или временно удалите видео-фон

---

## 📊 Сравнение платформ

| Платформа | Сложность | Бесплатный tier | Автодеплой | Рекомендация |
|-----------|-----------|-----------------|------------|--------------|
| **Render.com** | ⭐ Легко | ✅ Да | ✅ Да | ⭐⭐⭐⭐⭐ |
| **Railway.app** | ⭐ Легко | ✅ $5/мес | ✅ Да | ⭐⭐⭐⭐ |
| **PythonAnywhere** | ⭐⭐ Средне | ✅ Да | ❌ Нет | ⭐⭐⭐ |
| **Fly.io** | ⭐⭐⭐ Сложно | ✅ Да | ✅ Да | ⭐⭐⭐ |

---

## 🎯 Рекомендация

**Для начинающих:** Используйте **Render.com** - самый простой вариант!

**Пошагово:**
1. Создайте GitHub репозиторий
2. Загрузите код
3. Создайте аккаунт на Render.com
4. Подключите GitHub
5. Настройте Web Service
6. Готово! 🎉

---

## 📝 Чек-лист перед деплоем

- [ ] Код загружен в GitHub
- [ ] `requirements.txt` обновлен
- [ ] `app.py` использует `host='0.0.0.0'`
- [ ] `Procfile` создан (для некоторых платформ)
- [ ] `.gitignore` настроен
- [ ] `SECRET_KEY` готов
- [ ] Видео файлы обработаны (загружены отдельно или удалены)

---

## 🎉 После успешного деплоя

1. ✅ Проверьте работу сайта
2. ✅ Протестируйте все функции
3. ✅ Настройте кастомный домен (опционально)
4. ✅ Настройте мониторинг (опционально)

---

**Удачи с деплоем! 🚀**

**Версия:** 1.0  
**Дата:** 2026-01-25
