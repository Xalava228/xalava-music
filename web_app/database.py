"""
Модуль для работы с базой данных SQLite
Хранит историю поиска, избранное, историю прослушиваний и кэш данных
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class Database:
    """Класс для работы с базой данных"""
    
    def __init__(self, db_path='music_app.db'):
        """Инициализация подключения к БД"""
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Получение подключения к БД"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Для доступа к колонкам по имени
        return conn

    def _table_exists(self, cursor, table_name: str) -> bool:
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,),
        )
        return cursor.fetchone() is not None

    def _column_exists(self, cursor, table_name: str, column_name: str) -> bool:
        cursor.execute(f"PRAGMA table_info({table_name})")
        return any(row["name"] == column_name for row in cursor.fetchall())

    def _table_sql(self, cursor, table_name: str) -> str:
        cursor.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,),
        )
        row = cursor.fetchone()
        return row["sql"] if row and row["sql"] else ""
    
    def init_database(self):
        """Создание таблиц в БД"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Миграции для пользовательских данных
        self._migrate_user_tables(cursor)
        
        # Таблица истории поиска
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 0,
                query TEXT NOT NULL,
                search_type TEXT,
                results_count INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица избранных треков
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS favorite_tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 0,
                track_id TEXT NOT NULL,
                title TEXT NOT NULL,
                artists TEXT,  -- JSON массив имен исполнителей
                duration_ms INTEGER,
                cover_uri TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, track_id)
            )
        ''')
        
        # Таблица избранных альбомов
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS favorite_albums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 0,
                album_id TEXT NOT NULL,
                title TEXT NOT NULL,
                artists TEXT,  -- JSON массив имен исполнителей
                year INTEGER,
                cover_uri TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, album_id)
            )
        ''')
        
        # Таблица избранных исполнителей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS favorite_artists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 0,
                artist_id TEXT NOT NULL,
                name TEXT NOT NULL,
                cover_uri TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, artist_id)
            )
        ''')
        
        # Таблица истории прослушиваний
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS play_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 0,
                track_id TEXT NOT NULL,
                title TEXT NOT NULL,
                artists TEXT,  -- JSON массив имен исполнителей
                cover_uri TEXT,
                duration_ms INTEGER,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                play_duration INTEGER  -- Сколько секунд прослушано
            )
        ''')

        # Миграции колонок для play_history (старые БД могли быть без cover_uri/duration_ms)
        if self._table_exists(cursor, "play_history") and not self._column_exists(
            cursor, "play_history", "cover_uri"
        ):
            cursor.execute("ALTER TABLE play_history ADD COLUMN cover_uri TEXT")
        if self._table_exists(cursor, "play_history") and not self._column_exists(
            cursor, "play_history", "duration_ms"
        ):
            cursor.execute("ALTER TABLE play_history ADD COLUMN duration_ms INTEGER")
        
        # Таблица кэша данных треков
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS track_cache (
                track_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artists TEXT,  -- JSON массив
                albums TEXT,   -- JSON массив
                duration_ms INTEGER,
                cover_uri TEXT,
                stream_url TEXT,
                codec TEXT,
                bitrate INTEGER,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP  -- Когда кэш истекает (прямые ссылки живут ~1 минуту)
            )
        ''')
        
        # Таблица кэша альбомов
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS album_cache (
                album_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artists TEXT,  -- JSON массив
                year INTEGER,
                cover_uri TEXT,
                tracks TEXT,   -- JSON массив треков
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица кэша исполнителей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS artist_cache (
                artist_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                cover_uri TEXT,
                description TEXT,
                genres TEXT,  -- JSON массив
                tracks TEXT,  -- JSON массив треков
                albums TEXT,  -- JSON массив альбомов
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица пользовательских плейлистов
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL DEFAULT 0,
                name TEXT NOT NULL,
                description TEXT,
                cover_uri TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Добавляем колонку cover_uri если её нет
        try:
            cursor.execute('ALTER TABLE user_playlists ADD COLUMN cover_uri TEXT')
        except sqlite3.OperationalError:
            pass  # Колонка уже существует
        
        # Таблица треков в пользовательских плейлистах
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS playlist_tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                playlist_id INTEGER NOT NULL,
                track_id TEXT NOT NULL,
                position INTEGER,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (playlist_id) REFERENCES user_playlists(id) ON DELETE CASCADE,
                UNIQUE(playlist_id, track_id)
            )
        ''')
        
        # Таблица пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                token TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("База данных инициализирована")

    def _migrate_user_tables(self, cursor):
        """Миграция таблиц для поддержки user_id"""
        # Избранные треки
        self._migrate_favorites_table(
            cursor,
            table_name="favorite_tracks",
            id_column="track_id",
            columns=[
                "track_id",
                "title",
                "artists",
                "duration_ms",
                "cover_uri",
                "added_at",
            ],
        )

        # Избранные альбомы
        self._migrate_favorites_table(
            cursor,
            table_name="favorite_albums",
            id_column="album_id",
            columns=[
                "album_id",
                "title",
                "artists",
                "year",
                "cover_uri",
                "added_at",
            ],
        )

        # Избранные исполнители
        self._migrate_favorites_table(
            cursor,
            table_name="favorite_artists",
            id_column="artist_id",
            columns=[
                "artist_id",
                "name",
                "cover_uri",
                "added_at",
            ],
        )

        # История поиска
        self._ensure_user_id_column(cursor, "search_history")

        # История прослушиваний
        self._ensure_user_id_column(cursor, "play_history")

        # Плейлисты
        self._ensure_user_id_column(cursor, "user_playlists")

    def _ensure_user_id_column(self, cursor, table_name: str):
        if self._table_exists(cursor, table_name) and not self._column_exists(
            cursor, table_name, "user_id"
        ):
            cursor.execute(
                f"ALTER TABLE {table_name} ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0"
            )
            cursor.execute(
                f"UPDATE {table_name} SET user_id = 0 WHERE user_id IS NULL"
            )

    def _migrate_favorites_table(self, cursor, table_name: str, id_column: str, columns: List[str]):
        if not self._table_exists(cursor, table_name):
            return

        has_user_id = self._column_exists(cursor, table_name, "user_id")
        sql = self._table_sql(cursor, table_name)
        has_user_unique = f"UNIQUE(user_id, {id_column})" in sql

        if has_user_id and has_user_unique:
            return

        temp_table = f"{table_name}_old"
        cursor.execute(f"ALTER TABLE {table_name} RENAME TO {temp_table}")

        # Создаем новую таблицу с user_id и уникальностью по user_id + id_column
        if table_name == "favorite_tracks":
            cursor.execute('''
                CREATE TABLE favorite_tracks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL DEFAULT 0,
                    track_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    artists TEXT,
                    duration_ms INTEGER,
                    cover_uri TEXT,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, track_id)
                )
            ''')
        elif table_name == "favorite_albums":
            cursor.execute('''
                CREATE TABLE favorite_albums (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL DEFAULT 0,
                    album_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    artists TEXT,
                    year INTEGER,
                    cover_uri TEXT,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, album_id)
                )
            ''')
        elif table_name == "favorite_artists":
            cursor.execute('''
                CREATE TABLE favorite_artists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL DEFAULT 0,
                    artist_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    cover_uri TEXT,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, artist_id)
                )
            ''')

        user_id_expr = "user_id" if has_user_id else "0"
        columns_list = ", ".join(columns)
        cursor.execute(
            f'''
            INSERT INTO {table_name} (user_id, {columns_list})
            SELECT {user_id_expr}, {columns_list} FROM {temp_table}
            '''
        )
        cursor.execute(f"DROP TABLE {temp_table}")
    
    # ========== История поиска ==========
    
    def add_search_history(self, query: str, search_type: str = 'all', results_count: int = 0, user_id: int = 0):
        """Добавление записи в историю поиска"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO search_history (user_id, query, search_type, results_count)
            VALUES (?, ?, ?, ?)
        ''', (user_id, query, search_type, results_count))
        conn.commit()
        conn.close()
    
    def get_search_history(self, limit: int = 20, user_id: int = 0) -> List[Dict]:
        """Получение истории поиска"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM search_history
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (user_id, limit))
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
    
    def clear_search_history(self, user_id: int = 0):
        """Очистка истории поиска"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM search_history WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
    
    # ========== Избранное ==========
    
    def add_favorite_track(self, track_data: Dict, user_id: int = 0) -> bool:
        """Добавление трека в избранное"""
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            # Проверяем наличие обязательных полей
            if 'id' not in track_data:
                logger.error("Отсутствует поле 'id' в track_data")
                return False
            
            track_id = str(track_data['id'])  # Преобразуем в строку
            title = track_data.get('title', 'Без названия')
            artists = track_data.get('artists', [])
            duration_ms = track_data.get('duration_ms', 0)
            cover_uri = track_data.get('cover_uri')
            
            cursor.execute('''
                INSERT OR REPLACE INTO favorite_tracks 
                (user_id, track_id, title, artists, duration_ms, cover_uri)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                track_id,
                title,
                json.dumps(artists) if isinstance(artists, list) else json.dumps([]),
                duration_ms,
                cover_uri
            ))
            conn.commit()
            return True
        except Exception as e:
            logger.error(f"Ошибка добавления в избранное: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
        finally:
            conn.close()
    
    def remove_favorite_track(self, track_id: str, user_id: int = 0):
        """Удаление трека из избранного"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM favorite_tracks WHERE track_id = ? AND user_id = ?',
            (track_id, user_id),
        )
        conn.commit()
        conn.close()
    
    def get_favorite_tracks(self, user_id: int = 0) -> List[Dict]:
        """Получение списка избранных треков"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM favorite_tracks WHERE user_id = ? ORDER BY added_at DESC',
            (user_id,),
        )
        results = []
        for row in cursor.fetchall():
            track = dict(row)
            track['artists'] = json.loads(track['artists']) if track['artists'] else []
            results.append(track)
        conn.close()
        return results
    
    def is_favorite_track(self, track_id: str, user_id: int = 0) -> bool:
        """Проверка, находится ли трек в избранном"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT 1 FROM favorite_tracks WHERE track_id = ? AND user_id = ?',
            (track_id, user_id),
        )
        result = cursor.fetchone() is not None
        conn.close()
        return result
    
    # ========== История прослушиваний ==========
    
    def add_play_history(self, track_data: Dict, play_duration: int = 0, user_id: int = 0):
        """Добавление записи в историю прослушиваний (удаляет дубликаты и перемещает вверх)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Удаляем старую запись с таким же track_id, если есть
        cursor.execute('''
            DELETE FROM play_history WHERE track_id = ? AND user_id = ?
        ''', (track_data['id'], user_id))
        
        # Добавляем новую запись
        cursor.execute('''
            INSERT INTO play_history 
            (user_id, track_id, title, artists, cover_uri, duration_ms, play_duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            track_data['id'],
            track_data['title'],
            json.dumps(track_data.get('artists', [])),
            track_data.get('cover_uri'),
            track_data.get('duration_ms'),
            play_duration
        ))
        conn.commit()
        conn.close()
    
    def get_play_history(self, limit: int = 50, user_id: int = 0) -> List[Dict]:
        """Получение истории прослушиваний"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM play_history
            WHERE user_id = ?
            ORDER BY played_at DESC
            LIMIT ?
        ''', (user_id, limit))
        results = []
        for row in cursor.fetchall():
            history = dict(row)
            history['artists'] = json.loads(history['artists']) if history['artists'] else []
            results.append(history)
        conn.close()
        return results
    
    def clear_play_history(self, user_id: int = 0):
        """Очистка истории прослушиваний"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM play_history WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
    
    # ========== Кэш данных ==========
    
    def cache_track(self, track_data: Dict, expires_in_seconds: int = 60):
        """Кэширование данных трека"""
        conn = self.get_connection()
        cursor = conn.cursor()
        from datetime import timedelta
        expires_at = datetime.now() + timedelta(seconds=expires_in_seconds)
        
        cursor.execute('''
            INSERT OR REPLACE INTO track_cache
            (track_id, title, artists, albums, duration_ms, cover_uri, 
             stream_url, codec, bitrate, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            track_data['id'],
            track_data['title'],
            json.dumps(track_data.get('artists', [])),
            json.dumps(track_data.get('albums', [])),
            track_data.get('duration_ms'),
            track_data.get('cover_uri'),
            track_data.get('stream_url'),
            track_data.get('codec'),
            track_data.get('bitrate'),
            expires_at
        ))
        conn.commit()
        conn.close()
    
    def get_cached_track(self, track_id: str) -> Optional[Dict]:
        """Получение трека из кэша (если не истек)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM track_cache
            WHERE track_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
        ''', (track_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            track = dict(row)
            track['artists'] = json.loads(track['artists']) if track['artists'] else []
            track['albums'] = json.loads(track['albums']) if track['albums'] else []
            return track
        return None
    
    def clear_expired_cache(self):
        """Очистка истекшего кэша"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM track_cache
            WHERE expires_at IS NOT NULL AND expires_at < datetime('now')
        ''')
        conn.commit()
        conn.close()
    
    # ========== Пользовательские плейлисты ==========
    
    def create_playlist(self, name: str, description: str = '', cover_uri: str = None, user_id: int = 0) -> int:
        """Создание пользовательского плейлиста"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_playlists (user_id, name, description, cover_uri)
            VALUES (?, ?, ?, ?)
        ''', (user_id, name, description, cover_uri))
        playlist_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return playlist_id
    
    def add_track_to_playlist(self, playlist_id: int, track_id: str, position: int = None):
        """Добавление трека в плейлист"""
        conn = self.get_connection()
        cursor = conn.cursor()
        if position is None:
            # Автоматически определяем позицию
            cursor.execute('SELECT MAX(position) FROM playlist_tracks WHERE playlist_id = ?', (playlist_id,))
            max_pos = cursor.fetchone()[0]
            position = (max_pos or 0) + 1
        
        cursor.execute('''
            INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position)
            VALUES (?, ?, ?)
        ''', (playlist_id, track_id, position))
        conn.commit()
        conn.close()
    
    def get_playlists(self, user_id: int = 0) -> List[Dict]:
        """Получение списка плейлистов"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM user_playlists WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,),
        )
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
    
    def get_playlist_tracks(self, playlist_id: int) -> List[str]:
        """Получение треков плейлиста"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT track_id FROM playlist_tracks
            WHERE playlist_id = ?
            ORDER BY position
        ''', (playlist_id,))
        results = [row[0] for row in cursor.fetchall()]
        conn.close()
        return results
    
    def remove_track_from_playlist(self, playlist_id: int, track_id: str):
        """Удаление трека из плейлиста"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM playlist_tracks
            WHERE playlist_id = ? AND track_id = ?
        ''', (playlist_id, track_id))
        conn.commit()
        conn.close()
    
    def update_playlist(self, playlist_id: int, name: str = None, description: str = None, cover_uri: str = None, user_id: int = 0):
        """Обновление плейлиста"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        updates = []
        params = []
        
        if name is not None:
            updates.append('name = ?')
            params.append(name)
        if description is not None:
            updates.append('description = ?')
            params.append(description)
        if cover_uri is not None:
            updates.append('cover_uri = ?')
            params.append(cover_uri)
        
        if updates:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(playlist_id)
            params.append(user_id)
            cursor.execute(f'''
                UPDATE user_playlists
                SET {', '.join(updates)}
                WHERE id = ? AND user_id = ?
            ''', params)
            conn.commit()
        
        conn.close()
    
    def delete_playlist(self, playlist_id: int, user_id: int = 0):
        """Удаление плейлиста (треки удалятся автоматически из-за CASCADE)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM user_playlists WHERE id = ? AND user_id = ?',
            (playlist_id, user_id),
        )
        conn.commit()
        conn.close()

    # ========== Пользователи ==========

    def create_user(self, username: str, password_hash: str, token: str = None) -> int:
        """Создание пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, password_hash, token)
            VALUES (?, ?, ?)
        ''', (username, password_hash, token))
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return user_id

    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Получение пользователя по имени"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def update_user_token(self, user_id: int, token: str):
        """Обновление токена пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET token = ? WHERE id = ?', (token, user_id))
        conn.commit()
        conn.close()


# Глобальный экземпляр БД
db = Database()
