# Как обновить проект на Git

Краткая инструкция: как закоммитить изменения и отправить их в удалённый репозиторий.

---

## 1. Проверить статус

Посмотреть, какие файлы изменены:

```bash
git status
```

Увидишь список изменённых (modified), новых (untracked) и удалённых (deleted) файлов.

---

## 2. Добавить файлы в коммит

**Вариант А — добавить всё:**

```bash
git add .
```

**Вариант Б — добавить только нужные файлы:**

```bash
git add web_app/static/css/style.css
git add web_app/static/css/style-responsive.css
git add web_app/templates/index.html
git add web_app/static/js/app.js
# и т.д.
```

---

## 3. Сделать коммит

```bash
git commit -m "Краткое описание изменений"
```

Примеры сообщений:

- `Обновление дизайна: главная, плеер, подкасты, отступы`
- `Фон video2.mp4, замедление, правки UI`
- `Правки по отзывам: отступы, карточки подкастов`

---

## 4. Отправить на GitHub / GitLab / другой remote

Если ветка называется `main`:

```bash
git push origin main
```

Если ветка `master`:

```bash
git push origin master
```

Узнать текущую ветку:

```bash
git branch
```

---

## Полная последовательность одной командой

```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

(замени `main` на свою ветку, если она другая)

---

## Если push просит логин/пароль

- **GitHub:** пароль больше не подходит — нужен [Personal Access Token](https://github.com/settings/tokens).  
  Либо используй SSH: настрой ключ и remote вида `git@github.com:user/repo.git`.
- **GitLab / другой хостинг:** смотри в разделе «SSH keys» или «Access tokens» в настройках.

---

## Полезные команды

| Команда | Что делает |
|--------|------------|
| `git status` | Показать изменённые файлы |
| `git diff` | Показать разницу в коде |
| `git log --oneline -5` | Последние 5 коммитов |
| `git pull origin main` | Скачать изменения с сервера перед push |
