"""
Flask веб-приложение для прослушивания музыки через Yandex Music API
"""
import os
import io
from flask import Flask, render_template, jsonify, request, send_file, session, has_request_context
from flask_cors import CORS
from yandex_music import Client
from yandex_music.exceptions import YandexMusicError
import logging
from database import db
from database_api import register_database_routes
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')
CORS(app)

# Регистрация роутов для работы с БД
register_database_routes(app)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Глобальный клиент (инициализируется при первом запросе)
client = None


def init_client(token=None):
    """Инициализация клиента Yandex Music"""
    global client
    if token is None and has_request_context():
        token = session.get('token')
    if token:
        try:
            client = Client(token).init()
            logger.info("Клиент успешно инициализирован")
            return True
        except Exception as e:
            logger.error(f"Ошибка инициализации клиента: {e}")
            return False
    else:
        # Работа без токена (ограниченный функционал)
        try:
            client = Client().init()
            logger.info("Клиент инициализирован без токена")
            return True
        except Exception as e:
            logger.error(f"Ошибка инициализации клиента: {e}")
            return False


@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')


@app.route('/api/init', methods=['POST'])
def api_init():
    """Инициализация клиента с токеном"""
    data = request.get_json()
    token = data.get('token', '')
    
    if token:
        session['token'] = token
    else:
        session.pop('token', None)
    if init_client(token if token else None):
        return jsonify({'success': True, 'message': 'Клиент инициализирован'})
    else:
        return jsonify({'success': False, 'message': 'Ошибка инициализации'}), 400


@app.route('/api/auth/register', methods=['POST'])
def api_auth_register():
    """Регистрация пользователя"""
    import re
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    token = (data.get('token') or '').strip() or None
    
    if not username or not password:
        return jsonify({'error': 'Логин и пароль обязательны'}), 400
    
    # Валидация имени пользователя
    if len(username) < 3 or len(username) > 30:
        return jsonify({'error': 'Логин должен содержать от 3 до 30 символов'}), 400
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return jsonify({'error': 'Логин может содержать только буквы, цифры и _'}), 400
    
    # Валидация пароля
    if len(password) < 8:
        return jsonify({'error': 'Пароль должен содержать минимум 8 символов'}), 400
    
    if not re.search(r'[A-ZА-Я]', password):
        return jsonify({'error': 'Пароль должен содержать хотя бы одну заглавную букву'}), 400
    
    if not re.search(r'[a-zа-я]', password):
        return jsonify({'error': 'Пароль должен содержать хотя бы одну строчную букву'}), 400
    
    if not re.search(r'\d', password):
        return jsonify({'error': 'Пароль должен содержать хотя бы одну цифру'}), 400
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
        return jsonify({'error': 'Пароль должен содержать хотя бы один спецсимвол (!@#$%^&*)'}), 400
    
    if db.get_user_by_username(username):
        return jsonify({'error': 'Пользователь уже существует'}), 400
    
    password_hash = generate_password_hash(password)
    user_id = db.create_user(username, password_hash, token)
    
    session['user_id'] = user_id
    session['username'] = username
    session['token'] = token
    
    if token:
        init_client(token)
    
    return jsonify({'success': True, 'username': username})


@app.route('/api/auth/login', methods=['POST'])
def api_auth_login():
    """Вход пользователя"""
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    token = (data.get('token') or '').strip() or None
    
    user = db.get_user_by_username(username)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Неверный логин или пароль'}), 401
    
    if token:
        db.update_user_token(user['id'], token)
        user['token'] = token
    
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['token'] = user.get('token')
    
    init_client(user.get('token'))
    
    return jsonify({'success': True, 'username': user['username'], 'has_token': bool(user.get('token'))})


@app.route('/api/auth/logout', methods=['POST'])
def api_auth_logout():
    """Выход пользователя"""
    session.clear()
    return jsonify({'success': True})


@app.route('/api/auth/status', methods=['GET'])
def api_auth_status():
    """Статус авторизации"""
    return jsonify({
        'logged_in': bool(session.get('user_id')),
        'username': session.get('username'),
        'has_token': bool(session.get('token'))
    })


@app.route('/api/profile', methods=['GET'])
def api_profile():
    """Получить информацию о пользователе"""
    if not session.get('user_id'):
        return jsonify({'error': 'Не авторизован'}), 401
    
    user = db.get_user_by_username(session.get('username'))
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    # Маскируем токен для безопасности (показываем только последние 4 символа)
    token = user.get('token', '')
    masked_token = '•' * (len(token) - 4) + token[-4:] if token and len(token) > 4 else '•' * len(token) if token else 'Не установлен'
    
    return jsonify({
        'username': user['username'],
        'token': token,  # Полный токен для отображения (можно замаскировать на фронтенде)
        'masked_token': masked_token,
        'has_token': bool(token),
        'user_id': user['id']
    })


@app.route('/api/profile/token', methods=['PUT'])
def api_profile_update_token():
    """Обновить токен пользователя"""
    if not session.get('user_id'):
        return jsonify({'error': 'Не авторизован'}), 401
    
    data = request.get_json()
    token = (data.get('token') or '').strip() or None
    
    user = db.get_user_by_username(session.get('username'))
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    db.update_user_token(user['id'], token)
    session['token'] = token
    
    if token:
        init_client(token)
    
    return jsonify({'success': True, 'has_token': bool(token)})


@app.route('/api/profile/password', methods=['PUT'])
def api_profile_change_password():
    """Изменить пароль пользователя"""
    import re
    if not session.get('user_id'):
        return jsonify({'error': 'Не авторизован'}), 401
    
    data = request.get_json()
    old_password = (data.get('old_password') or '').strip()
    new_password = (data.get('new_password') or '').strip()
    
    if not old_password or not new_password:
        return jsonify({'error': 'Старый и новый пароль обязательны'}), 400
    
    user = db.get_user_by_username(session.get('username'))
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    # Проверка старого пароля
    if not check_password_hash(user['password_hash'], old_password):
        return jsonify({'error': 'Неверный текущий пароль'}), 401
    
    # Валидация нового пароля
    if len(new_password) < 8:
        return jsonify({'error': 'Пароль должен содержать минимум 8 символов'}), 400
    
    if not re.search(r'[A-ZА-Я]', new_password):
        return jsonify({'error': 'Пароль должен содержать хотя бы одну заглавную букву'}), 400
    
    if not re.search(r'[a-zа-я]', new_password):
        return jsonify({'error': 'Пароль должен содержать хотя бы одну строчную букву'}), 400
    
    if not re.search(r'\d', new_password):
        return jsonify({'error': 'Пароль должен содержать хотя бы одну цифру'}), 400
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', new_password):
        return jsonify({'error': 'Пароль должен содержать хотя бы один спецсимвол (!@#$%^&*)'}), 400
    
    # Обновление пароля
    new_password_hash = generate_password_hash(new_password)
    # Нужно добавить метод update_user_password в database.py
    # Пока используем существующий метод через SQL
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_password_hash, user['id']))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Пароль успешно изменён'})


@app.route('/api/search', methods=['GET'])
def api_search():
    """Поиск треков, альбомов, исполнителей"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'Пустой запрос'}), 400
    
    try:
        search_result = client.search(query, type_='all')
        
        result = {
            'tracks': [],
            'albums': [],
            'artists': [],
            'playlists': [],
            'podcasts': []
        }
        
        if search_result and search_result.tracks:
            for track_short in search_result.tracks.results[:20]:  # Ограничиваем 20 треками
                track_data = {
                    'id': track_short.track_id,  # track_id property возвращает правильный формат "id:album_id"
                    'title': track_short.title,
                    'artists': [a.name for a in track_short.artists] if track_short.artists else [],
                    'duration_ms': track_short.duration_ms,
                    'cover_uri': get_cover_url(track_short.cover_uri) if hasattr(track_short, 'cover_uri') and track_short.cover_uri else None
                }
                result['tracks'].append(track_data)
        
        if search_result and search_result.albums:
            for album in search_result.albums.results[:10]:
                album_data = {
                    'id': album.id,
                    'title': album.title,
                    'artists': [a.name for a in album.artists] if album.artists else [],
                    'year': album.year,
                    'cover_uri': get_cover_url(album.cover_uri) if hasattr(album, 'cover_uri') and album.cover_uri else None
                }
                result['albums'].append(album_data)
        
        if search_result and search_result.artists:
            for artist in search_result.artists.results[:10]:
                cover_uri = None
                if artist.cover and artist.cover.uri:
                    cover_uri = get_cover_url(artist.cover.uri)
                artist_data = {
                    'id': artist.id,
                    'name': artist.name,
                    'cover_uri': cover_uri
                }
                result['artists'].append(artist_data)
        
        # Подкасты
        if search_result and hasattr(search_result, 'podcasts') and search_result.podcasts:
            for podcast in search_result.podcasts.results[:10]:
                podcast_data = {
                    'id': podcast.id,
                    'title': podcast.title,
                    'cover_uri': get_cover_url(podcast.cover_uri) if hasattr(podcast, 'cover_uri') and podcast.cover_uri else None
                }
                result['podcasts'].append(podcast_data)
        
        # Эпизоды подкастов
        if search_result and hasattr(search_result, 'podcast_episodes') and search_result.podcast_episodes:
            for episode in search_result.podcast_episodes.results[:10]:
                episode_data = {
                    'id': episode.track_id if hasattr(episode, 'track_id') else episode.id,
                    'title': episode.title,
                    'artists': [a.name for a in episode.artists] if hasattr(episode, 'artists') and episode.artists else [],
                    'duration_ms': episode.duration_ms if hasattr(episode, 'duration_ms') else None,
                    'cover_uri': get_cover_url(episode.cover_uri) if hasattr(episode, 'cover_uri') and episode.cover_uri else None,
                    'is_podcast': True
                }
                result['tracks'].append(episode_data)
        
        # Сохраняем в историю поиска
        total_results = len(result.get('tracks', [])) + len(result.get('albums', [])) + \
                       len(result.get('artists', [])) + len(result.get('podcasts', []))
        db.add_search_history(query, 'all', total_results, session.get('user_id') or 0)
        
        return jsonify(result)
    
    except YandexMusicError as e:
        logger.error(f"Ошибка поиска: {e}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


@app.route('/api/track/<track_id>')
def api_track(track_id):
    """Получение информации о треке и прямой ссылки для прослушивания"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    try:
        # Проверяем кэш
        cached_track = db.get_cached_track(track_id)
        if cached_track and cached_track.get('stream_url'):
            logger.info(f"Трек {track_id} загружен из кэша")
            return jsonify(cached_track)
        
        # Получаем полную информацию о треке
        track = client.tracks([track_id])[0]
        
        if not track:
            return jsonify({'error': 'Трек не найден'}), 404
        
        # Получаем информацию о загрузке (оптимизация: не получаем прямые ссылки сразу)
        download_info_list = client.tracks_download_info(track_id, get_direct_links=False)
        
        if not download_info_list:
            return jsonify({'error': 'Информация о загрузке недоступна'}), 404
        
        # Выбираем лучший вариант (mp3, 192 kbps или выше)
        best_info = None
        for info in download_info_list:
            if info.codec == 'mp3' and info.bitrate_in_kbps >= 192:
                best_info = info
                break
        
        if not best_info and download_info_list:
            best_info = download_info_list[0]
        
        if not best_info:
            return jsonify({'error': 'Вариант загрузки недоступен'}), 404
        
        # Получаем прямую ссылку только для выбранного варианта (быстрее)
        try:
            stream_url = best_info.get_direct_link()
        except Exception as e:
            logger.error(f"Ошибка получения прямой ссылки: {e}")
            return jsonify({'error': 'Не удалось получить ссылку для воспроизведения'}), 500
        
        track_data = {
            'id': track_id,  # Используем track_id с album_id для консистентности
            'track_id': track_id,
            'yandex_id': track.id,
            'title': track.title,
            'artists': [{'id': a.id, 'name': a.name} for a in track.artists] if track.artists else [],
            'albums': [{'id': a.id, 'title': a.title} for a in track.albums] if track.albums else [],
            'duration_ms': track.duration_ms,
            'cover_uri': get_cover_url(track.cover_uri) if hasattr(track, 'cover_uri') and track.cover_uri else None,
            'stream_url': stream_url,
            'codec': best_info.codec,
            'bitrate': best_info.bitrate_in_kbps
        }
        
        # Сохраняем в кэш (прямые ссылки живут ~60 секунд)
        db.cache_track(track_data, expires_in_seconds=50)
        
        # Добавляем в историю прослушиваний
        db.add_play_history(track_data, user_id=session.get('user_id') or 0)
        
        return jsonify(track_data)
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения трека: {e}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


@app.route('/api/album/<album_id>')
def api_album(album_id):
    """Получение информации об альбоме и его треках"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    try:
        album = client.albums([album_id])[0]
        
        if album and not album.volumes:
            try:
                album_with_tracks = client.albums_with_tracks(album_id)
                if album_with_tracks:
                    album = album_with_tracks
            except Exception as e:
                logger.warning(f"Не удалось загрузить треки альбома через albums_with_tracks: {e}")
        
        if not album:
            return jsonify({'error': 'Альбом не найден'}), 404
        
        tracks_data = []
        if album.volumes:
            for volume in album.volumes:
                for track_short in volume:
                    track_id = track_short.track_id
                    if not track_id and hasattr(track_short, 'id'):
                        track_id = f"{track_short.id}:{album.id}"
                    track_data = {
                        'id': track_id,
                        'track_id': track_id,
                        'title': track_short.title,
                        'artists': [a.name for a in track_short.artists] if track_short.artists else [],
                        'duration_ms': track_short.duration_ms,
                        'cover_uri': get_cover_url(track_short.cover_uri) if hasattr(track_short, 'cover_uri') and track_short.cover_uri else None
                    }
                    tracks_data.append(track_data)
        
        album_data = {
            'id': str(album.id),  # Преобразуем в строку для консистентности
            'title': album.title,
            'artists': [{'id': a.id, 'name': a.name} for a in album.artists] if album.artists else [],
            'year': album.year,
            'genre': album.genre if hasattr(album, 'genre') else None,
            'cover_uri': get_cover_url(album.cover_uri) if hasattr(album, 'cover_uri') and album.cover_uri else None,
            'tracks': tracks_data
        }
        
        return jsonify(album_data)
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения альбома: {e}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


@app.route('/api/podcasts/list', methods=['GET'])
def api_podcasts_list():
    """Каталог подкастов"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    queries = ['подкаст', 'podcast', 'интервью']
    podcasts = []
    seen = set()
    
    try:
        for q in queries:
            search_result = client.search(q, type_='all')
            if search_result and hasattr(search_result, 'podcasts') and search_result.podcasts:
                for podcast in search_result.podcasts.results[:20]:
                    if podcast.id in seen:
                        continue
                    seen.add(podcast.id)
                    podcast_data = {
                        'id': podcast.id,
                        'title': podcast.title,
                        'cover_uri': get_cover_url(podcast.cover_uri) if hasattr(podcast, 'cover_uri') and podcast.cover_uri else None,
                        'description': podcast.description if hasattr(podcast, 'description') else None
                    }
                    podcasts.append(podcast_data)
            if len(podcasts) >= 30:
                break
        
        return jsonify({'podcasts': podcasts})
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения подкастов: {e}")
        return jsonify({'podcasts': []})
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return jsonify({'podcasts': []})


@app.route('/api/recommendations', methods=['GET'])
def api_recommendations():
    """Рекомендации для главной: трек, подкаст, артист"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    try:
        track = None
        artist = None
        podcast = None
        
        # Рандомный трек из чарта
        try:
            chart_info = client.chart()
            if chart_info and chart_info.chart and chart_info.chart.tracks:
                track_short = chart_info.chart.tracks[0]
                if track_short and track_short.track_id:
                    track = {
                        'id': track_short.track_id,
                        'title': track_short.title,
                        'artists': [a.name for a in track_short.artists] if track_short.artists else [],
                        'cover_uri': get_cover_url(track_short.cover_uri) if hasattr(track_short, 'cover_uri') and track_short.cover_uri else None
                    }
        except Exception as e:
            logger.warning(f"Не удалось получить трек для рекомендаций: {e}")
        
        # Подкаст и артист через поиск
        try:
            search_result = client.search('подкаст', type_='all')
            if search_result and hasattr(search_result, 'podcasts') and search_result.podcasts and search_result.podcasts.results:
                p = search_result.podcasts.results[0]
                podcast = {
                    'id': p.id,
                    'title': p.title,
                    'cover_uri': get_cover_url(p.cover_uri) if hasattr(p, 'cover_uri') and p.cover_uri else None,
                    'description': p.description if hasattr(p, 'description') else None
                }
            
            if search_result and search_result.artists and search_result.artists.results:
                a = search_result.artists.results[0]
                cover_uri = get_cover_url(a.cover.uri) if a.cover and a.cover.uri else None
                artist = {
                    'id': a.id,
                    'name': a.name,
                    'cover_uri': cover_uri,
                    'description': a.description.text if a.description and hasattr(a.description, 'text') else None
                }
        except Exception as e:
            logger.warning(f"Не удалось получить подкаст/артиста для рекомендаций: {e}")
        
        return jsonify({'track': track, 'podcast': podcast, 'artist': artist})
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения рекомендаций: {e}")
        return jsonify({'track': None, 'podcast': None, 'artist': None})
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return jsonify({'track': None, 'podcast': None, 'artist': None})


@app.route('/api/chart')
def api_chart():
    """Получение чарта"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    try:
        chart_info = client.chart()
        
        if not chart_info or not chart_info.chart:
            return jsonify({'error': 'Чарт недоступен'}), 404
        
        playlist = chart_info.chart
        tracks_data = []
        
        # Получаем треки из плейлиста
        if playlist.tracks:
            for track_short in playlist.tracks[:50]:  # Топ 50
                # Используем полный track если доступен, иначе track_short
                track = track_short.track if track_short.track else None
                chart_data = track_short.chart if track_short.chart else None
                
                # Берем данные из полного трека если есть, иначе из track_short
                title = track.title if track else track_short.title
                artists = track.artists if track and track.artists else track_short.artists
                duration_ms = track.duration_ms if track else track_short.duration_ms
                cover_uri = track.cover_uri if track and hasattr(track, 'cover_uri') and track.cover_uri else (track_short.cover_uri if hasattr(track_short, 'cover_uri') and track_short.cover_uri else None)
                
                track_id = track_short.track_id
                if not track_id and track:
                    if track.albums:
                        track_id = f"{track.id}:{track.albums[0].id}"
                    else:
                        track_id = str(track.id)

                track_data = {
                    'id': track_id,
                    'track_id': track_id,
                    'title': title,
                    'artists': [a.name for a in artists] if artists else [],
                    'duration_ms': duration_ms,
                    'cover_uri': get_cover_url(cover_uri) if cover_uri else None,
                    'chart_position': chart_data.position if chart_data else None
                }
                tracks_data.append(track_data)
        elif playlist.track_count and playlist.track_count > 0:
            # Если треки не загружены, получаем их через fetch_tracks
            try:
                fetched_tracks = playlist.fetch_tracks()
                for track_short in fetched_tracks[:50]:
                    track_id = track_short.track_id
                    track_data = {
                        'id': track_id,
                        'track_id': track_id,
                        'title': track_short.title,
                        'artists': [a.name for a in track_short.artists] if track_short.artists else [],
                        'duration_ms': track_short.duration_ms,
                        'cover_uri': get_cover_url(track_short.cover_uri) if hasattr(track_short, 'cover_uri') and track_short.cover_uri else None,
                        'chart_position': None
                    }
                    tracks_data.append(track_data)
            except Exception as e:
                logger.warning(f"Не удалось загрузить треки чарта: {e}")
        
        return jsonify({
            'title': playlist.title if playlist.title else 'Чарт',
            'tracks': tracks_data
        })
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения чарта: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Неожиданная ошибка получения чарта: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Внутренняя ошибка сервера: {str(e)}'}), 500


@app.route('/api/podcasts/recommended', methods=['GET'])
def api_podcasts_recommended():
    """Получение рекомендаций подкастов и авторов"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    query = request.args.get('q', 'подкаст')
    
    try:
        search_result = client.search(query, type_='all')
        
        podcasts = []
        artists = []
        
        if search_result and hasattr(search_result, 'podcasts') and search_result.podcasts:
            for podcast in search_result.podcasts.results[:12]:
                podcast_data = {
                    'id': podcast.id,
                    'title': podcast.title,
                    'cover_uri': get_cover_url(podcast.cover_uri) if hasattr(podcast, 'cover_uri') and podcast.cover_uri else None,
                    'description': podcast.description if hasattr(podcast, 'description') else None
                }
                podcasts.append(podcast_data)
        
        if search_result and search_result.artists:
            for artist in search_result.artists.results[:6]:
                cover_uri = None
                if artist.cover and artist.cover.uri:
                    cover_uri = get_cover_url(artist.cover.uri)
                artist_data = {
                    'id': artist.id,
                    'name': artist.name,
                    'cover_uri': cover_uri,
                    'description': artist.description.text if artist.description and hasattr(artist.description, 'text') else None
                }
                artists.append(artist_data)
        
        return jsonify({
            'podcasts': podcasts,
            'artists': artists
        })
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения рекомендаций: {e}")
        return jsonify({'podcasts': [], 'artists': []})
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return jsonify({'podcasts': [], 'artists': []})


@app.route('/api/artist/<artist_id>')
def api_artist(artist_id):
    """Получение информации об исполнителе, его треках и альбомах"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    try:
        artist = client.artists([artist_id])[0]
        
        if not artist:
            return jsonify({'error': 'Исполнитель не найден'}), 404
        
        # Получаем треки исполнителя
        tracks_data = []
        try:
            artist_tracks = client.artists_tracks(artist_id, page=0, page_size=50)
            if artist_tracks and artist_tracks.tracks:
                for track in artist_tracks.tracks:
                    track_data = {
                        'id': track.track_id,
                        'title': track.title,
                        'artists': [{'id': a.id, 'name': a.name} for a in track.artists] if track.artists else [],
                        'duration_ms': track.duration_ms,
                        'cover_uri': get_cover_url(track.cover_uri) if hasattr(track, 'cover_uri') and track.cover_uri else None
                    }
                    tracks_data.append(track_data)
        except Exception as e:
            logger.warning(f"Не удалось загрузить треки исполнителя: {e}")
        
        # Получаем альбомы исполнителя
        albums_data = []
        try:
            artist_albums = client.artists_direct_albums(artist_id, page=0, page_size=20)
            if artist_albums and artist_albums.albums:
                for album in artist_albums.albums:
                    album_data = {
                        'id': album.id,
                        'title': album.title,
                        'artists': [a.name for a in album.artists] if hasattr(album, 'artists') and album.artists else [],
                        'year': album.year,
                        'cover_uri': get_cover_url(album.cover_uri) if hasattr(album, 'cover_uri') and album.cover_uri else None
                    }
                    albums_data.append(album_data)
        except Exception as e:
            logger.warning(f"Не удалось загрузить альбомы исполнителя: {e}")
        
        cover_uri = None
        if artist.cover and artist.cover.uri:
            cover_uri = get_cover_url(artist.cover.uri, '400x400')
        
        artist_data = {
            'id': artist.id,
            'name': artist.name,
            'cover_uri': cover_uri,
            'description': artist.description.text if artist.description and hasattr(artist.description, 'text') else None,
            'genres': artist.genres if artist.genres else [],
            'tracks': tracks_data,
            'albums': albums_data
        }
        
        return jsonify(artist_data)
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения исполнителя: {e}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


@app.route('/api/podcast/<podcast_id>')
def api_podcast(podcast_id):
    """Получение информации о подкасте и его эпизодах"""
    global client
    
    if not client:
        if not init_client():
            return jsonify({'error': 'Клиент не инициализирован'}), 400
    
    try:
        # Подкаст - это альбом с типом podcast
        album = client.albums([podcast_id])[0]
        
        if album and not album.volumes:
            try:
                album_with_tracks = client.albums_with_tracks(podcast_id)
                if album_with_tracks:
                    album = album_with_tracks
            except Exception as e:
                logger.warning(f"Не удалось загрузить эпизоды подкаста через albums_with_tracks: {e}")
        
        if not album:
            return jsonify({'error': 'Подкаст не найден'}), 404
        
        episodes_data = []
        if album.volumes:
            for volume in album.volumes:
                for track_short in volume:
                    track_id = track_short.track_id
                    if not track_id and hasattr(track_short, 'id'):
                        track_id = f"{track_short.id}:{album.id}"
                    episode_data = {
                        'id': track_id,
                        'track_id': track_id,
                        'title': track_short.title,
                        'artists': [a.name for a in track_short.artists] if track_short.artists else [],
                        'duration_ms': track_short.duration_ms,
                        'cover_uri': get_cover_url(track_short.cover_uri) if hasattr(track_short, 'cover_uri') and track_short.cover_uri else None
                    }
                    episodes_data.append(episode_data)
        
        podcast_data = {
            'id': album.id,
            'title': album.title,
            'artists': [{'id': a.id, 'name': a.name} for a in album.artists] if album.artists else [],
            'cover_uri': get_cover_url(album.cover_uri) if hasattr(album, 'cover_uri') and album.cover_uri else None,
            'description': album.description if hasattr(album, 'description') else None,
            'episodes': episodes_data
        }
        
        return jsonify(podcast_data)
    
    except YandexMusicError as e:
        logger.error(f"Ошибка получения подкаста: {e}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500


def get_cover_url(cover_uri, size='200x200'):
    """Формирует URL обложки"""
    if not cover_uri:
        return None
    return f"https://{cover_uri.replace('%%', size)}"


if __name__ == '__main__':
    # Инициализация клиента без токена для базового функционала
    init_client()
    
    # Используем порт из переменной окружения или 8080 по умолчанию
    port = int(os.environ.get('PORT', 8080))
    
    # Для продакшена используем 0.0.0.0, для разработки - 127.0.0.1
    host = '0.0.0.0' if os.environ.get('FLASK_ENV') == 'production' else '127.0.0.1'
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print(f"Запуск сервера на http://{host}:{port}")
    app.run(debug=debug, host=host, port=port)
