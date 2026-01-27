# ⚡ Быстрый старт: Деплой на Render.com

> **Самый простой способ загрузить проект на сервер (5 минут)**

---

## 🎯 Шаг 1: GitHub (2 минуты)

### Если у вас нет репозитория:

1. Создайте аккаунт: https://github.com
2. Создайте репозиторий: **New repository** → `xalava-music`
3. Загрузите код:

```bash
cd c:\Users\bogda\Desktop\yandex-music-api-2.2.0
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/xalava-music.git
git push -u origin main
```

(Замените `YOUR_USERNAME` на ваш GitHub username)

---

## 🚀 Шаг 2: Render.com (3 минуты)

1. **Создайте аккаунт:** https://render.com → **Get Started for Free**

2. **Создайте Web Service:**
   - Нажмите **"New +"** → **"Web Service"**
   - Подключите GitHub → выберите репозиторий

3. **Настройте:**
   ```
   Name: xalava-music
   Root Directory: web_app  ⚠️ ВАЖНО!
   Build Command: pip install -r requirements.txt
   Start Command: python app.py
   ```

4. **Добавьте переменные:**
   - **Environment** → **Add Environment Variable**
   ```
   SECRET_KEY = ваш_секретный_ключ_32_символа
   PORT = 8080
   FLASK_ENV = production
   ```

5. **Нажмите "Create Web Service"**

6. **Дождитесь деплоя** (3-5 минут)

---

## ✅ Готово!

Ваш сайт: `https://xalava-music.onrender.com`

---

## 🔑 Как сгенерировать SECRET_KEY:

```python
import secrets
print(secrets.token_hex(32))
```

Или используйте любой случайный набор символов минимум 32 символа.

---

**Подробнее:** Читайте [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)
