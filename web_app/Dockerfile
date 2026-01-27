# Используем официальный Python образ
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем все файлы приложения
COPY . .

# Устанавливаем переменные окружения
ENV PORT=8080
ENV FLASK_ENV=production

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["python", "app.py"]
