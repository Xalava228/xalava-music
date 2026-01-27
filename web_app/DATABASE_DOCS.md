  Документация по базе данных

## Обзор

В проекте используется **SQLite** - легковесная встраиваемая реляционная база данных. SQLite не требует отдельного сервера и хранит все данные в одном файле `music_app.db`.

## Архитектура базы данных

### Принцип работы

1. **Источник данных**: Все музыкальные данные (треки, альбомы, исполнители) получаются в реальном времени через API Яндекс.Музыки
2. **Локальное хранение**: В БД сохраняются только пользовательские данные:
   - История поиска
   - Избранное (треки, альбомы, исполнители)
   - История прослушиваний
   - Кэш данных для ускорения работы
   - Пользовательские плейлисты

**Важно:** все пользовательские данные теперь привязаны к `user_id`, поэтому у каждого аккаунта свой набор избранного, истории и плейлистов.

### Схема базы данных

#### 1. `search_history` - История поиска
Хранит все поисковые запросы пользователя.

**Поля:**
- `id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор
- `user_id` (INTEGER) - ID пользователя
- `query` (TEXT) - Поисковый запрос
- `search_type` (TEXT) - Тип поиска (all, tracks, albums, etc.)
- `results_count` (INTEGER) - Количество найденных результатов
- `created_at` (TIMESTAMP) - Время создания записи

**Назначение:** Позволяет пользователю видеть историю своих поисковых запросов.

#### 2. `favorite_tracks` - Избранные треки
Хранит треки, добавленные пользователем в избранное.

**Поля:**
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (INTEGER) - ID пользователя
- `track_id` (TEXT) - ID трека в формате "track_id:album_id"
- `title` (TEXT) - Название трека
- `artists` (TEXT) - JSON массив имен исполнителей
- `duration_ms` (INTEGER) - Длительность в миллисекундах
- `cover_uri` (TEXT) - URL обложки
- `added_at` (TIMESTAMP) - Время добавления

**Уникальность:** `UNIQUE(user_id, track_id)`

**Назначение:** Позволяет пользователю сохранять любимые треки для быстрого доступа.

#### 3. `favorite_albums` - Избранные альбомы
Хранит альбомы, добавленные в избранное.

**Поля:**
- `id` (INTEGER, PRIMARY KEY)
- `album_id` (TEXT, UNIQUE) - ID альбома
- `title` (TEXT) - Название альбома
- `artists` (TEXT) - JSON массив имен исполнителей
- `year` (INTEGER) - Год выпуска
- `cover_uri` (TEXT) - URL обложки
- `added_at` (TIMESTAMP) - Время добавления

#### 4. `favorite_artists` - Избранные исполнители
Хранит исполнителей, добавленных в избранное.

**Поля:**
- `id` (INTEGER, PRIMARY KEY)
- `artist_id` (TEXT, UNIQUE) - ID исполнителя
- `name` (TEXT) - Имя исполнителя
- `cover_uri` (TEXT) - URL обложки
- `added_at` (TIMESTAMP) - Время добавления

#### 5. `play_history` - История прослушиваний
Хранит все прослушанные треки.

**Поля:**
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (INTEGER) - ID пользователя
- `track_id` (TEXT) - ID трека
- `title` (TEXT) - Название трека
- `artists` (TEXT) - JSON массив имен исполнителей
- `played_at` (TIMESTAMP) - Время прослушивания
- `play_duration` (INTEGER) - Сколько секунд было прослушано

**Назначение:** Позволяет отслеживать историю прослушиваний и строить рекомендации.

#### 6. `track_cache` - Кэш данных треков
Временное хранилище данных о треках для ускорения загрузки.

**Поля:**
- `track_id` (TEXT, PRIMARY KEY)
- `title` (TEXT) - Название трека
- `artists` (TEXT) - JSON массив
- `albums` (TEXT) - JSON массив
- `duration_ms` (INTEGER) - Длительность
- `cover_uri` (TEXT) - URL обложки
- `stream_url` (TEXT) - Прямая ссылка для воспроизведения
- `codec` (TEXT) - Кодек аудио
- `bitrate` (INTEGER) - Битрейт
- `cached_at` (TIMESTAMP) - Время кэширования
- `expires_at` (TIMESTAMP) - Время истечения кэша

**Назначение:** 
- Ускоряет повторную загрузку треков
- Прямые ссылки на аудио живут ~60 секунд, поэтому кэш автоматически истекает

#### 7. `album_cache` - Кэш альбомов
Временное хранилище данных об альбомах.

**Поля:**
- `album_id` (TEXT, PRIMARY KEY)
- `title` (TEXT)
- `artists` (TEXT) - JSON массив
- `year` (INTEGER)
- `cover_uri` (TEXT)
- `tracks` (TEXT) - JSON массив треков
- `cached_at` (TIMESTAMP)

#### 8. `artist_cache` - Кэш исполнителей
Временное хранилище данных об исполнителях.

**Поля:**
- `artist_id` (TEXT, PRIMARY KEY)
- `name` (TEXT)
- `cover_uri` (TEXT)
- `description` (TEXT)
- `genres` (TEXT) - JSON массив жанров
- `tracks` (TEXT) - JSON массив треков
- `albums` (TEXT) - JSON массив альбомов
- `cached_at` (TIMESTAMP)

#### 9. `user_playlists` - Пользовательские плейлисты
Хранит созданные пользователем плейлисты.

**Поля:**
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (INTEGER) - ID пользователя
- `name` (TEXT) - Название плейлиста
- `description` (TEXT) - Описание
- `created_at` (TIMESTAMP) - Время создания
- `updated_at` (TIMESTAMP) - Время последнего обновления

#### 10. `playlist_tracks` - Треки в плейлистах
Связывает треки с плейлистами (связь многие-ко-многим).

**Поля:**
- `id` (INTEGER, PRIMARY KEY)
- `playlist_id` (INTEGER, FOREIGN KEY) - Ссылка на плейлист
- `track_id` (TEXT) - ID трека
- `position` (INTEGER) - Позиция трека в плейлисте
- `added_at` (TIMESTAMP) - Время добавления

**Связи:** 
- `FOREIGN KEY (playlist_id) REFERENCES user_playlists(id) ON DELETE CASCADE`
- При удалении плейлиста автоматически удаляются все связанные треки

## Работа с базой данных

### Инициализация

База данных автоматически создается при первом запуске приложения. Файл `music_app.db` создается в директории `web_app/`.

### Основные операции

#### 1. История поиска
```python
# Добавление записи
db.add_search_history("The Beatles", "all", 15)

# Получение истории
history = db.get_search_history(limit=20)

# Очистка истории
db.clear_search_history()
```

#### 2. Избранное
```python
# Добавление трека в избранное
track_data = {
    'id': '123456:789012',
    'title': 'Song Title',
    'artists': ['Artist Name'],
    'duration_ms': 180000,
    'cover_uri': 'https://...'
}
db.add_favorite_track(track_data)

# Получение избранных треков
favorites = db.get_favorite_tracks()

# Проверка, в избранном ли трек
is_fav = db.is_favorite_track('123456:789012')

# Удаление из избранного
db.remove_favorite_track('123456:789012')
```

#### 3. История прослушиваний
```python
# Добавление записи
db.add_play_history(track_data, play_duration=180)

# Получение истории
history = db.get_play_history(limit=50)
```

#### 4. Кэширование
```python
# Кэширование трека (на 60 секунд)
db.cache_track(track_data, expires_in_seconds=60)

# Получение из кэша
cached = db.get_cached_track('123456:789012')

# Очистка истекшего кэша
db.clear_expired_cache()
```

#### 5. Плейлисты
```python
# Создание плейлиста
playlist_id = db.create_playlist("My Playlist", "Description")

# Добавление трека
db.add_track_to_playlist(playlist_id, '123456:789012')

# Получение плейлистов
playlists = db.get_playlists()

# Получение треков плейлиста
tracks = db.get_playlist_tracks(playlist_id)
```

## API Endpoints для работы с БД

### Избранное
- `GET /api/favorites/tracks` - Получить избранные треки
- `POST /api/favorites/tracks` - Добавить трек в избранное
- `DELETE /api/favorites/tracks/<track_id>` - Удалить из избранного
- `GET /api/favorites/tracks/<track_id>/check` - Проверить, в избранном ли

### История
- `GET /api/history/search` - История поиска
- `GET /api/history/plays` - История прослушиваний

### Плейлисты
- `GET /api/playlists` - Список плейлистов
- `POST /api/playlists` - Создать плейлист
- `POST /api/playlists/<id>/tracks` - Добавить трек в плейлист

### Кэш
- `POST /api/cache/clear` - Очистить истекший кэш

## Преимущества использования БД

1. **Производительность**: Кэширование ускоряет повторную загрузку данных
2. **Персонализация**: Сохранение избранного и истории для каждого пользователя
3. **Офлайн-доступ**: Избранные треки доступны даже без интернета (метаданные)
4. **Аналитика**: История прослушиваний позволяет строить рекомендации

## Ограничения

1. **SQLite**: Подходит для одного пользователя или небольшого количества пользователей
2. **Нет аутентификации**: В текущей версии нет системы пользователей, все данные общие
3. **Кэш ограничен**: Прямые ссылки на аудио истекают через ~60 секунд

## Для курсовой работы

### Что можно описать:

1. **Архитектура БД**: Схема таблиц, связи между ними
2. **Нормализация**: Объяснить, почему данные хранятся в таком виде
3. **Оптимизация**: Использование индексов, кэширование
4. **Типы данных**: Почему выбраны TEXT для JSON, TIMESTAMP для дат
5. **Целостность данных**: Использование FOREIGN KEY, UNIQUE constraints
6. **Производительность**: Кэширование для ускорения работы

### Примеры запросов для описания:

```sql
-- Получить последние 10 поисковых запросов
SELECT query, results_count, created_at 
FROM search_history 
ORDER BY created_at DESC 
LIMIT 10;

-- Получить самые часто прослушиваемые треки
SELECT track_id, title, COUNT(*) as play_count
FROM play_history
GROUP BY track_id
ORDER BY play_count DESC
LIMIT 10;

-- Получить плейлист с треками
SELECT pt.track_id, pt.position, ut.title
FROM playlist_tracks pt
JOIN user_playlists up ON pt.playlist_id = up.id
WHERE up.id = 1
ORDER BY pt.position;
```

## Файлы базы данных

- `database.py` - Модуль для работы с БД (класс Database)
- `database_api.py` - API endpoints для работы с БД
- `music_app.db` - Файл базы данных SQLite (создается автоматически)

## Резервное копирование

Для резервного копирования просто скопируйте файл `music_app.db`. SQLite хранит все данные в одном файле.
