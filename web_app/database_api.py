"""
API endpoints для работы с базой данных
"""
from flask import jsonify, request, session
from database import db
import logging

logger = logging.getLogger(__name__)


def register_database_routes(app):
    """Регистрация роутов для работы с БД"""

    def current_user_id():
        return session.get('user_id') or 0
    
    @app.route('/api/favorites/tracks', methods=['GET'])
    def get_favorite_tracks():
        """Получение списка избранных треков"""
        try:
            tracks = db.get_favorite_tracks(current_user_id())
            return jsonify({'tracks': tracks})
        except Exception as e:
            logger.error(f"Ошибка получения избранного: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/favorites/tracks', methods=['POST'])
    def add_favorite_track():
        """Добавление трека в избранное"""
        try:
            data = request.get_json()
            if db.add_favorite_track(data, current_user_id()):
                return jsonify({'success': True})
            return jsonify({'error': 'Не удалось добавить в избранное'}), 400
        except Exception as e:
            logger.error(f"Ошибка добавления в избранное: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/favorites/tracks/<track_id>', methods=['DELETE'])
    def remove_favorite_track(track_id):
        """Удаление трека из избранного"""
        try:
            db.remove_favorite_track(track_id, current_user_id())
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Ошибка удаления из избранного: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/favorites/tracks/<track_id>/check', methods=['GET'])
    def check_favorite_track(track_id):
        """Проверка, находится ли трек в избранном"""
        try:
            is_favorite = db.is_favorite_track(track_id, current_user_id())
            return jsonify({'is_favorite': is_favorite})
        except Exception as e:
            logger.error(f"Ошибка проверки избранного: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/history/search', methods=['GET'])
    def get_search_history():
        """Получение истории поиска"""
        try:
            limit = request.args.get('limit', 20, type=int)
            history = db.get_search_history(limit, current_user_id())
            return jsonify({'history': history})
        except Exception as e:
            logger.error(f"Ошибка получения истории: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/history/plays', methods=['GET'])
    def get_play_history():
        """Получение истории прослушиваний"""
        try:
            limit = request.args.get('limit', 50, type=int)
            history = db.get_play_history(limit, current_user_id())
            return jsonify({'history': history})
        except Exception as e:
            logger.error(f"Ошибка получения истории: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/history/plays', methods=['DELETE'])
    def clear_play_history():
        """Очистка истории прослушиваний"""
        try:
            db.clear_play_history(current_user_id())
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Ошибка очистки истории: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists', methods=['GET'])
    def get_playlists():
        """Получение списка плейлистов"""
        try:
            playlists = db.get_playlists(current_user_id())
            return jsonify({'playlists': playlists})
        except Exception as e:
            logger.error(f"Ошибка получения плейлистов: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists', methods=['POST'])
    def create_playlist():
        """Создание плейлиста"""
        try:
            data = request.get_json()
            playlist_id = db.create_playlist(
                data.get('name'),
                data.get('description', ''),
                data.get('cover_uri'),
                current_user_id()
            )
            return jsonify({'id': playlist_id, 'success': True})
        except Exception as e:
            logger.error(f"Ошибка создания плейлиста: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists/<int:playlist_id>/tracks', methods=['GET'])
    def get_playlist_tracks(playlist_id):
        """Получение треков плейлиста"""
        try:
            playlists = db.get_playlists(current_user_id())
            if not any(p['id'] == playlist_id for p in playlists):
                return jsonify({'error': 'Плейлист не найден'}), 404
            track_ids = db.get_playlist_tracks(playlist_id)
            return jsonify({'tracks': track_ids})
        except Exception as e:
            logger.error(f"Ошибка получения треков плейлиста: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists/<int:playlist_id>/tracks', methods=['POST'])
    def add_track_to_playlist(playlist_id):
        """Добавление трека в плейлист"""
        try:
            data = request.get_json()
            playlists = db.get_playlists(current_user_id())
            if not any(p['id'] == playlist_id for p in playlists):
                return jsonify({'error': 'Плейлист не найден'}), 404
            db.add_track_to_playlist(playlist_id, data.get('track_id'))
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Ошибка добавления трека: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists/<int:playlist_id>/tracks/<path:track_id>', methods=['DELETE'])
    def remove_track_from_playlist(playlist_id, track_id):
        """Удаление трека из плейлиста (path позволяет обрабатывать track_id с двоеточием)"""
        try:
            playlists = db.get_playlists(current_user_id())
            if not any(p['id'] == playlist_id for p in playlists):
                return jsonify({'error': 'Плейлист не найден'}), 404
            db.remove_track_from_playlist(playlist_id, track_id)
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Ошибка удаления трека: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists/<int:playlist_id>', methods=['GET'])
    def get_playlist(playlist_id):
        """Получение информации о плейлисте"""
        try:
            playlists = db.get_playlists(current_user_id())
            playlist = next((p for p in playlists if p['id'] == playlist_id), None)
            if not playlist:
                return jsonify({'error': 'Плейлист не найден'}), 404
            
            track_ids = db.get_playlist_tracks(playlist_id)
            playlist['tracks'] = track_ids
            return jsonify(playlist)
        except Exception as e:
            logger.error(f"Ошибка получения плейлиста: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists/<int:playlist_id>', methods=['PUT'])
    def update_playlist(playlist_id):
        """Обновление плейлиста"""
        try:
            playlists = db.get_playlists(current_user_id())
            if not any(p['id'] == playlist_id for p in playlists):
                return jsonify({'error': 'Плейлист не найден'}), 404
            data = request.get_json()
            db.update_playlist(
                playlist_id,
                data.get('name'),
                data.get('description'),
                data.get('cover_uri'),
                current_user_id()
            )
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Ошибка обновления плейлиста: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/playlists/<int:playlist_id>', methods=['DELETE'])
    def delete_playlist(playlist_id):
        """Удаление плейлиста"""
        try:
            playlists = db.get_playlists(current_user_id())
            if not any(p['id'] == playlist_id for p in playlists):
                return jsonify({'error': 'Плейлист не найден'}), 404
            db.delete_playlist(playlist_id, current_user_id())
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Ошибка удаления плейлиста: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/cache/clear', methods=['POST'])
    def clear_cache():
        """Очистка истекшего кэша"""
        try:
            db.clear_expired_cache()
            return jsonify({'success': True})
        except Exception as e:
            logger.error(f"Ошибка очистки кэша: {e}")
            return jsonify({'error': str(e)}), 500
