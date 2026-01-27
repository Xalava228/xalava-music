// Глобальные переменные
let currentTrack = null;
let currentPlaylist = [];
let currentTrackIndex = -1;
let isPlaying = false;
let isAuthorized = false;
let shuffleEnabled = false;
let repeatMode = 'off'; // off | one | all
let shuffleHistory = [];

// Элементы DOM (будут инициализированы после загрузки DOM)
let audioPlayer, playBtn, prevBtn, nextBtn, progressSlider, progressFill;
let volumeSlider, volumeBtn, currentTimeEl, totalTimeEl;
let trackTitle, trackArtist, trackCover;
let searchInput, searchBtn;
let authOpenBtn, authLogoutBtn, authStatus, authModal, authModalClose;
let loginForm, registerForm;
let authFeedbackEl;
let profileBtn, profileModal, profileModalClose;
let shuffleBtn, repeatBtn, bufferFill, trackMeta;
let playerInfoEl;
let nowPlayingModal, npCloseBtn, npQueueBtn, npQueueCloseBtn;
let npCover, npTitleEl, npArtistEl;
let npPrevBtn, npPlayBtn, npNextBtn;
let npProgressFill, npProgressSlider, npCurrentTimeEl, npTotalTimeEl;
let npBufferFill;
let npFavoriteBtn;
let npQueue, npQueueList;

// Функция для получения элементов DOM
function getDOMElements() {
    audioPlayer = document.getElementById('audioPlayer');
    playBtn = document.getElementById('playBtn');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    progressSlider = document.getElementById('progressSlider');
    progressFill = document.getElementById('progressFill');
    volumeSlider = document.getElementById('volumeSlider');
    volumeBtn = document.getElementById('volumeBtn');
    currentTimeEl = document.getElementById('currentTime');
    totalTimeEl = document.getElementById('totalTime');
    trackTitle = document.getElementById('trackTitle');
    trackArtist = document.getElementById('trackArtist');
    trackCover = document.getElementById('trackCover');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    authOpenBtn = document.getElementById('authOpenBtn');
    authLogoutBtn = document.getElementById('authLogoutBtn');
    authStatus = document.getElementById('authStatus');
    authModal = document.getElementById('authModal');
    authModalClose = document.getElementById('authModalClose');
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    authFeedbackEl = document.getElementById('authFeedback');
    profileBtn = document.getElementById('profileBtn');
    profileModal = document.getElementById('profileModal');
    profileModalClose = document.getElementById('profileModalClose');
    shuffleBtn = document.getElementById('shuffleBtn');
    repeatBtn = document.getElementById('repeatBtn');
    bufferFill = document.getElementById('bufferFill');
    trackMeta = document.getElementById('trackMeta');

    playerInfoEl = document.querySelector('.player-info');
    nowPlayingModal = document.getElementById('nowPlayingModal');
    npCloseBtn = document.getElementById('npCloseBtn');
    npQueueBtn = document.getElementById('npQueueBtn');
    npQueueCloseBtn = document.getElementById('npQueueCloseBtn');
    npCover = document.getElementById('npCover');
    npTitleEl = document.getElementById('npTitle');
    npArtistEl = document.getElementById('npArtist');
    npPrevBtn = document.getElementById('npPrevBtn');
    npPlayBtn = document.getElementById('npPlayBtn');
    npNextBtn = document.getElementById('npNextBtn');
    npProgressFill = document.getElementById('npProgressFill');
    npProgressSlider = document.getElementById('npProgressSlider');
    npCurrentTimeEl = document.getElementById('npCurrentTime');
    npTotalTimeEl = document.getElementById('npTotalTime');
    npBufferFill = document.getElementById('npBufferFill');
    npFavoriteBtn = document.getElementById('npFavoriteBtn');
    npQueue = document.getElementById('npQueue');
    npQueueList = document.getElementById('npQueueList');
}

function clearAuthFeedback() {
    if (!authFeedbackEl) return;
    authFeedbackEl.textContent = '';
    authFeedbackEl.classList.remove('success', 'error');
    authFeedbackEl.style.display = 'none';
}

function setAuthFeedback(type, message) {
    if (!authFeedbackEl) return;
    authFeedbackEl.textContent = message || '';
    authFeedbackEl.classList.remove('success', 'error');
    if (type === 'success') authFeedbackEl.classList.add('success');
    if (type === 'error') authFeedbackEl.classList.add('error');
    authFeedbackEl.style.display = message ? 'block' : 'none';
}

function openAuthModal() {
    if (!authModal) return;
    clearAuthFeedback();
    authModal.classList.add('active');
    authModal.style.display = 'flex';
    authModal.style.zIndex = '9999';
}

function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('active');
    authModal.style.display = '';
    authModal.style.zIndex = '';
    clearAuthFeedback();
}

function setFormSubmitting(formEl, isSubmitting, submittingText) {
    if (!formEl) return;
    const btn = formEl.querySelector('button[type="submit"]');
    if (!btn) return;
    if (isSubmitting) {
        btn.dataset.originalText = btn.textContent || '';
        btn.textContent = submittingText || 'Отправка...';
        btn.disabled = true;
    } else {
        btn.textContent = btn.dataset.originalText || btn.textContent || '';
        btn.disabled = false;
        delete btn.dataset.originalText;
    }
}

function loadPlayerSettings() {
    const savedVolume = localStorage.getItem('playerVolume');
    const savedShuffle = localStorage.getItem('playerShuffle');
    const savedRepeat = localStorage.getItem('playerRepeat');

    if (savedVolume !== null && volumeSlider && audioPlayer) {
        const vol = Math.max(0, Math.min(100, parseInt(savedVolume, 10)));
        volumeSlider.value = vol;
        audioPlayer.volume = vol / 100;
        updateVolumeIcon(audioPlayer.volume);
        updateVolumeSliderColor(vol);
    }

    if (savedShuffle !== null) {
        shuffleEnabled = savedShuffle === 'true';
    }

    if (savedRepeat) {
        repeatMode = savedRepeat;
    }

    updatePlayerControlsUI();
}

function savePlayerSettings() {
    if (volumeSlider) {
        localStorage.setItem('playerVolume', volumeSlider.value);
    }
    localStorage.setItem('playerShuffle', String(shuffleEnabled));
    localStorage.setItem('playerRepeat', repeatMode);
}

// Инициализация
async function initApp() {
    getDOMElements();
    loadPlayerSettings();
    setupEventListeners();
    setupAuthValidation();
    setupPasswordToggles();
    setupAudioPlayer();
    setupNowPlaying();
    // Загружаем кэш избранного при старте
    await loadFavoritesCache();
    loadChart();
    setupHistoryTabs();
    setupPlaylistModal();
    loadRecommendations();
    await loadAuthStatus();
    setupHomePage();
    loadHomeRecentlyPlayed();
}

function openNowPlaying() {
    if (!nowPlayingModal) return;
    if (!audioPlayer || (!audioPlayer.src && !currentTrack)) return;
    syncNowPlayingUI();
    nowPlayingModal.classList.add('active');
    nowPlayingModal.style.display = 'flex';
    nowPlayingModal.style.zIndex = '9999';
}

function closeNowPlaying() {
    if (!nowPlayingModal) return;
    nowPlayingModal.classList.remove('active');
    nowPlayingModal.style.display = '';
    nowPlayingModal.style.zIndex = '';
    if (npQueue) npQueue.style.display = 'none';
}

function setupNowPlaying() {
    if (playerInfoEl) {
        playerInfoEl.addEventListener('click', () => openNowPlaying());
    }

    if (npCloseBtn) {
        npCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeNowPlaying();
        });
    }

    if (nowPlayingModal) {
        nowPlayingModal.addEventListener('click', (e) => {
            if (e.target === nowPlayingModal) {
                closeNowPlaying();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nowPlayingModal && nowPlayingModal.classList.contains('active')) {
            closeNowPlaying();
        }
    });

    if (npPrevBtn) npPrevBtn.addEventListener('click', (e) => { e.preventDefault(); playPrevious(); });
    if (npPlayBtn) npPlayBtn.addEventListener('click', (e) => { e.preventDefault(); togglePlay(); });
    if (npNextBtn) npNextBtn.addEventListener('click', (e) => { e.preventDefault(); playNext(); });

    if (npProgressSlider) {
        npProgressSlider.addEventListener('input', () => {
            audioPlayer.currentTime = npProgressSlider.value;
        });
    }

    if (npQueueBtn) {
        npQueueBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!npQueue) return;
            const willOpen = npQueue.style.display === 'none' || !npQueue.style.display;
            npQueue.style.display = willOpen ? 'block' : 'none';
            if (willOpen) renderNowPlayingQueue();
            // чтобы очередь не "уезжала" и не обрезалась снизу
            if (willOpen) {
                try {
                    npQueue.scrollIntoView({ behavior: 'smooth', block: 'end' });
                } catch {}
            }
        });
    }

    if (npQueueCloseBtn) {
        npQueueCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (npQueue) npQueue.style.display = 'none';
        });
    }

    if (npFavoriteBtn) {
        npFavoriteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const trackId = npFavoriteBtn.dataset.trackId || (currentTrack ? (currentTrack.track_id || currentTrack.id) : '');
            if (!trackId) return;
            toggleFavorite({ target: npFavoriteBtn, stopPropagation() {}, preventDefault() {} }, trackId);
        });
    }
}

function getArtistsTextFromTrackData(trackData) {
    if (!trackData) return '—';
    const artists = trackData.artists || [];
    if (Array.isArray(artists) && artists.length > 0) {
        return artists
            .map(a => (typeof a === 'string' ? a : (a && a.name ? a.name : '')))
            .filter(Boolean)
            .join(', ') || '—';
    }
    return '—';
}

function syncNowPlayingUI() {
    if (!nowPlayingModal) return;
    const title = currentTrack?.title || (trackTitle ? trackTitle.textContent : 'Выберите трек');
    const artist = currentTrack ? getArtistsTextFromTrackData(currentTrack) : (trackArtist ? trackArtist.textContent : '—');

    if (npTitleEl) npTitleEl.textContent = title || 'Выберите трек';
    if (npArtistEl) npArtistEl.textContent = artist || '—';

    if (npCover) {
        const coverUri = currentTrack?.cover_uri || '';
        if (coverUri) {
            npCover.innerHTML = `<img src="${coverUri}" alt="Cover" onerror="this.remove();">`;
        } else {
            npCover.innerHTML = '<div class="cover-placeholder">🎵</div>';
        }
    }

    if (npTotalTimeEl) npTotalTimeEl.textContent = formatTime(audioPlayer.duration || 0);
    if (npCurrentTimeEl) npCurrentTimeEl.textContent = formatTime(audioPlayer.currentTime || 0);
    if (npProgressSlider) {
        npProgressSlider.max = audioPlayer.duration || 0;
        npProgressSlider.value = audioPlayer.currentTime || 0;
    }
    if (npProgressFill) {
        const duration = audioPlayer.duration || 0;
        const progress = duration > 0 ? (audioPlayer.currentTime / duration) * 100 : 0;
        npProgressFill.style.width = progress + '%';
    }

    // favorite state
    if (npFavoriteBtn) {
        const trackId = currentTrack ? (currentTrack.track_id || currentTrack.id) : '';
        if (trackId) {
            npFavoriteBtn.dataset.trackId = trackId;
            const fav = isFavoriteTrack(trackId);
            updateFavoriteButtons(trackId, fav);
        } else {
            npFavoriteBtn.dataset.trackId = '';
            npFavoriteBtn.classList.remove('active');
            npFavoriteBtn.textContent = '🤍';
        }
    }

    // queue highlight if open
    if (npQueue && npQueue.style.display === 'block') {
        renderNowPlayingQueue();
    }
}

function renderNowPlayingQueue() {
    if (!npQueueList) return;
    if (!currentPlaylist || currentPlaylist.length === 0) {
        npQueueList.innerHTML = '<div class="empty-state" style="padding: 12px;">Очередь пуста</div>';
        return;
    }

    let html = '';
    currentPlaylist.forEach((t, idx) => {
        const id = (t && (t.id || t.track_id)) ? String(t.id || t.track_id) : '';
        const title = (t && t.title) ? String(t.title) : 'Без названия';
        const artistsText = getArtistsTextFromTrackData(t);
        const active = idx === currentTrackIndex ? ' active' : '';
        html += `
            <button class="np-queue-item${active}" data-track-id="${escapeHtml(id)}" data-index="${idx}">
                <div class="np-queue-item-title">${escapeHtml(title)}</div>
                <div class="np-queue-item-artist">${escapeHtml(artistsText)}</div>
            </button>
        `;
    });
    npQueueList.innerHTML = html;

    npQueueList.querySelectorAll('.np-queue-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackId = btn.dataset.trackId;
            const idx = parseInt(btn.dataset.index || '-1', 10);
            if (idx >= 0) currentTrackIndex = idx;
            if (trackId) playTrack(trackId);
        });
    });
}

function setupHomePage() {
    const goChartBtn = document.getElementById('homeGoChartBtn');
    if (goChartBtn) {
        goChartBtn.addEventListener('click', () => switchPage('chart'));
    }

    const goHistoryBtn = document.getElementById('homeGoHistoryBtn');
    if (goHistoryBtn) {
        goHistoryBtn.addEventListener('click', () => switchPage('history'));
    }

    const openHistoryBtn = document.getElementById('homeOpenHistoryBtn');
    if (openHistoryBtn) {
        openHistoryBtn.addEventListener('click', () => switchPage('history'));
    }

    const tokenBtn = document.getElementById('homeTokenBtn');
    if (tokenBtn) {
        tokenBtn.addEventListener('click', () => {
            if (!isAuthorized) {
                openAuthModal();
                setAuthFeedback('error', 'Войдите или зарегистрируйтесь, чтобы сохранить токен');
                return;
            }
            if (profileModal) {
                profileModal.classList.add('active');
                profileModal.style.display = 'flex';
                profileModal.style.zIndex = '9999';
                loadProfile();
            }
        });
    }

}

async function loadHomeRecentlyPlayed() {
    const container = document.getElementById('homeRecently');
    if (!container) return;
    container.innerHTML = '<div class="loading">Загрузка истории...</div>';

    try {
        const response = await fetch('/api/history/plays?limit=8');
        const data = await response.json();
        if (data.error) {
            container.innerHTML = `<div class="empty-state">Ошибка: ${escapeHtml(data.error)}</div>`;
            return;
        }
        const items = (data.history || []).slice(0, 8);
        if (!items.length) {
            container.innerHTML = '<div class="empty-state">Пока пусто — включите любой трек, и он появится здесь.</div>';
            return;
        }

        let html = '';
        items.forEach(item => {
            // artists может быть массивом или JSON строкой
            let artists = 'Неизвестный исполнитель';
            if (item.artists) {
                if (Array.isArray(item.artists)) {
                    artists = item.artists.map(a => typeof a === 'string' ? a : (a.name || '')).filter(Boolean).join(', ') || artists;
                } else if (typeof item.artists === 'string') {
                    try {
                        const parsed = JSON.parse(item.artists);
                        artists = Array.isArray(parsed) ? parsed.join(', ') : item.artists;
                    } catch {
                        artists = item.artists;
                    }
                }
            }

            const title = item.title || 'Без названия';
            const coverUrl = item.cover_uri ? String(item.cover_uri) : '';
            const safeCover = coverUrl ? encodeURI(coverUrl).replace(/'/g, '%27') : '';
            const coverStyle = safeCover ? ` style="background-image: url('${safeCover}');"` : '';
            const coverContent = safeCover ? '' : '🎵';
            html += `
                <button class="home-recent-item" data-track-id="${escapeHtml(String(item.track_id || ''))}">
                    <div class="home-recent-cover"${coverStyle}>${coverContent}</div>
                    <div class="home-recent-meta">
                        <div class="home-recent-title">${escapeHtml(title)}</div>
                        <div class="home-recent-artist">${escapeHtml(artists)}</div>
                    </div>
                </button>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.home-recent-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const trackId = btn.dataset.trackId;
                if (trackId) playTrack(trackId);
            });
        });
    } catch (e) {
        console.error('Ошибка загрузки недавних прослушиваний:', e);
        container.innerHTML = '<div class="empty-state">Не удалось загрузить историю</div>';
    }
}

// XALAVA MIX removed by request

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Загрузка кэша избранного при старте
async function loadFavoritesCache() {
    try {
        const response = await fetch('/api/favorites/tracks');
        const data = await response.json();
        if (data.tracks) {
            favoriteTracksCache = data.tracks.map(t => t.track_id);
        } else {
            favoriteTracksCache = [];
        }
    } catch (error) {
        console.error('Ошибка загрузки кэша избранного:', error);
        favoriteTracksCache = [];
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Поиск
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Авторизация
    if (authOpenBtn) {
        authOpenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAuthModal();
        });
    } else {
        console.error('Кнопка "Войти" не найдена!');
    }
    if (authModalClose) {
        authModalClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAuthModal();
        });
    }
    // Закрытие модального окна при клике вне его
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }
    if (authLogoutBtn) {
        authLogoutBtn.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            isAuthorized = false;
            updateAuthUI();
            alert('Вы вышли из аккаунта');
        });
    }
    
    // Личный кабинет
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (profileModal) {
                profileModal.classList.add('active');
                profileModal.style.display = 'flex';
                profileModal.style.zIndex = '9999';
                loadProfile();
            }
        });
    }
    if (profileModalClose) {
        profileModalClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (profileModal) {
                profileModal.classList.remove('active');
                profileModal.style.display = '';
            }
        });
    }
    // Закрытие модального окна при клике вне его
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.classList.remove('active');
                profileModal.style.display = '';
            }
        });
    }
    const authTabs = document.querySelectorAll('[data-auth-tab]');
    if (authTabs.length) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const mode = tab.dataset.authTab;
                clearAuthFeedback();
                if (loginForm) {
                    loginForm.style.display = mode === 'login' ? 'block' : 'none';
                    if (mode === 'login') {
                        loginForm.reset();
                        // Очистка ошибок
                        document.querySelectorAll('#loginForm .form-error').forEach(el => el.textContent = '');
                        document.querySelectorAll('#loginForm .form-input').forEach(el => {
                            el.classList.remove('error', 'valid');
                        });
                    }
                }
                if (registerForm) {
                    registerForm.style.display = mode === 'register' ? 'block' : 'none';
                    if (mode === 'register') {
                        registerForm.reset();
                        // Очистка ошибок
                        document.querySelectorAll('#registerForm .form-error').forEach(el => el.textContent = '');
                        document.querySelectorAll('#registerForm .form-input').forEach(el => {
                            el.classList.remove('error', 'valid');
                        });
                        // Сброс требований к паролю
                        document.querySelectorAll('.requirement').forEach(req => req.classList.remove('met'));
                    }
                }
            });
        });
    }
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const token = document.getElementById('loginToken').value.trim();
            
            // Валидация
            const isUsernameValid = validateLoginUsername(usernameInput, 'loginUsernameError');
            const isPasswordValid = validateLoginPassword(passwordInput, 'loginPasswordError');
            
            if (!isUsernameValid || !isPasswordValid) {
                return;
            }
            
            try {
                clearAuthFeedback();
                setFormSubmitting(loginForm, true, 'Входим...');
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, token: token || null })
                });
                if (!response.ok) {
                    const text = await response.text();
                    let errorMsg = 'Ошибка входа';
                    try {
                        const errorData = JSON.parse(text);
                        errorMsg = errorData.error || errorMsg;
                    } catch {
                        errorMsg = text || `HTTP ${response.status}`;
                    }
                    showError(usernameInput, document.getElementById('loginUsernameError'), errorMsg);
                    showError(passwordInput, document.getElementById('loginPasswordError'), '');
                    setAuthFeedback('error', errorMsg);
                    return;
                }
                const data = await response.json();
                if (data.success) {
                    isAuthorized = true;
                    updateAuthUI(data.username);
                    setAuthFeedback('success', `Успешный вход. Добро пожаловать, ${data.username || username}!`);
                    // Очистка форм
                    loginForm.reset();
                    setTimeout(() => closeAuthModal(), 700);
                } else {
                    showError(usernameInput, document.getElementById('loginUsernameError'), data.error || 'Ошибка входа');
                    setAuthFeedback('error', data.error || 'Ошибка входа');
                }
            } catch (error) {
                console.error('Ошибка входа:', error);
                showError(usernameInput, document.getElementById('loginUsernameError'), 'Ошибка соединения с сервером');
                setAuthFeedback('error', 'Ошибка соединения с сервером');
            } finally {
                setFormSubmitting(loginForm, false);
            }
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('registerUsername');
            const passwordInput = document.getElementById('registerPassword');
            const passwordConfirmInput = document.getElementById('registerPasswordConfirm');
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const passwordConfirm = passwordConfirmInput.value.trim();
            const token = document.getElementById('registerToken').value.trim();
            
            // Валидация
            const isUsernameValid = validateUsername(usernameInput, 'registerUsernameError');
            const isPasswordValid = validatePassword(password);
            const isPasswordConfirmValid = validatePasswordConfirm();
            
            if (!isUsernameValid || !isPasswordValid || !isPasswordConfirmValid) {
                return;
            }
            
            try {
                clearAuthFeedback();
                setFormSubmitting(registerForm, true, 'Регистрируем...');
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, token: token || null })
                });
                if (!response.ok) {
                    const text = await response.text();
                    let errorMsg = 'Ошибка регистрации';
                    try {
                        const errorData = JSON.parse(text);
                        errorMsg = errorData.error || errorMsg;
                    } catch {
                        errorMsg = text || `HTTP ${response.status}`;
                    }
                    if (errorMsg.includes('уже существует')) {
                        showError(usernameInput, document.getElementById('registerUsernameError'), errorMsg);
                    } else {
                        showError(passwordInput, document.getElementById('registerPasswordError'), errorMsg);
                    }
                    setAuthFeedback('error', errorMsg);
                    return;
                }
                const data = await response.json();
                if (data.success) {
                    isAuthorized = true;
                    updateAuthUI(data.username);
                    setAuthFeedback('success', `Аккаунт создан. Добро пожаловать, ${data.username || username}!`);
                    // Очистка форм
                    registerForm.reset();
                    // Сброс требований к паролю
                    document.querySelectorAll('.requirement').forEach(req => req.classList.remove('met'));
                    setTimeout(() => closeAuthModal(), 700);
                } else {
                    showError(usernameInput, document.getElementById('registerUsernameError'), data.error || 'Ошибка регистрации');
                    setAuthFeedback('error', data.error || 'Ошибка регистрации');
                }
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                showError(usernameInput, document.getElementById('registerUsernameError'), 'Ошибка соединения с сервером');
                setAuthFeedback('error', 'Ошибка соединения с сервером');
            } finally {
                setFormSubmitting(registerForm, false);
            }
        });
    }

    // Управление плеером
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (prevBtn) prevBtn.addEventListener('click', playPrevious);
    if (nextBtn) nextBtn.addEventListener('click', playNext);
    if (progressSlider) progressSlider.addEventListener('input', seek);
    if (volumeSlider) volumeSlider.addEventListener('input', () => {
        changeVolume();
        savePlayerSettings();
    });
    if (volumeBtn) volumeBtn.addEventListener('click', toggleMute);

    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            shuffleEnabled = !shuffleEnabled;
            if (!shuffleEnabled) {
                shuffleHistory = [];
            }
            updatePlayerControlsUI();
            savePlayerSettings();
        });
    }

    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            if (repeatMode === 'off') {
                repeatMode = 'all';
            } else if (repeatMode === 'all') {
                repeatMode = 'one';
            } else {
                repeatMode = 'off';
            }
            updatePlayerControlsUI();
            savePlayerSettings();
        });
    }

    const progressBar = document.querySelector('.progress-bar');
    if (progressBar && progressSlider) {
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            const newTime = ratio * (audioPlayer.duration || 0);
            if (!isNaN(newTime)) {
                audioPlayer.currentTime = newTime;
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') return;
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        }
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            audioPlayer.currentTime = Math.min(audioPlayer.duration || 0, audioPlayer.currentTime + 5);
        }
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
        }
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            volumeSlider.value = Math.min(100, parseInt(volumeSlider.value || 0, 10) + 5);
            changeVolume();
            savePlayerSettings();
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            volumeSlider.value = Math.max(0, parseInt(volumeSlider.value || 0, 10) - 5);
            changeVolume();
            savePlayerSettings();
        }
    });
}

// Переключение видимости пароля/токена
function setupPasswordToggles() {
    const eyeSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;
    const eyeOffSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M4 4l16 16"></path>
        </svg>
    `;

    const applyIcon = (btn, input) => {
        const isVisible = input && input.type !== 'password';
        btn.innerHTML = isVisible ? eyeOffSvg : eyeSvg;
        const title = isVisible ? 'Скрыть' : 'Показать';
        btn.title = title;
        btn.setAttribute('aria-label', title);
    };

    document.querySelectorAll('.password-toggle').forEach(btn => {
        const targetId = btn.dataset.target;
        if (!targetId) return;

        // Если кнопка уже инициализирована — просто синхронизируем иконку
        if (btn.dataset.passwordToggleInited === '1') {
            const input = document.getElementById(targetId);
            if (input) applyIcon(btn, input);
            return;
        }

        btn.dataset.passwordToggleInited = '1';
        const input = document.getElementById(targetId);
        if (input) applyIcon(btn, input);

        btn.addEventListener('click', () => {
            const inputEl = document.getElementById(targetId);
            if (!inputEl) return;
            inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
            applyIcon(btn, inputEl);
        });
    });
}

// Валидация форм авторизации
function setupAuthValidation() {
    // Валидация логина при регистрации
    const registerUsername = document.getElementById('registerUsername');
    if (registerUsername) {
        registerUsername.addEventListener('input', () => {
            validateUsername(registerUsername, 'registerUsernameError');
        });
        registerUsername.addEventListener('blur', () => {
            validateUsername(registerUsername, 'registerUsernameError');
        });
    }

    // Валидация логина при входе
    const loginUsername = document.getElementById('loginUsername');
    if (loginUsername) {
        loginUsername.addEventListener('blur', () => {
            validateLoginUsername(loginUsername, 'loginUsernameError');
        });
    }

    // Валидация пароля при регистрации
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', () => {
            validatePassword(registerPassword.value);
            validatePasswordConfirm();
        });
    }

    // Валидация подтверждения пароля
    const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
    if (registerPasswordConfirm) {
        registerPasswordConfirm.addEventListener('input', () => {
            validatePasswordConfirm();
        });
    }

    // Валидация пароля при входе
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('blur', () => {
            validateLoginPassword(loginPassword, 'loginPasswordError');
        });
    }
}

// Валидация имени пользователя
function validateUsername(input, errorId) {
    const value = input.value.trim();
    const errorEl = document.getElementById(errorId);
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    
    if (!value) {
        showError(input, errorEl, 'Логин обязателен');
        return false;
    }
    
    if (value.length < 3) {
        showError(input, errorEl, 'Логин должен содержать минимум 3 символа');
        return false;
    }
    
    if (value.length > 30) {
        showError(input, errorEl, 'Логин не должен превышать 30 символов');
        return false;
    }
    
    if (!usernameRegex.test(value)) {
        showError(input, errorEl, 'Логин может содержать только буквы, цифры и _');
        return false;
    }
    
    clearError(input, errorEl);
    return true;
}

// Валидация логина при входе
function validateLoginUsername(input, errorId) {
    const value = input.value.trim();
    const errorEl = document.getElementById(errorId);
    
    if (!value) {
        showError(input, errorEl, 'Логин обязателен');
        return false;
    }
    
    clearError(input, errorEl);
    return true;
}

// Валидация пароля при входе
function validateLoginPassword(input, errorId) {
    const value = input.value.trim();
    const errorEl = document.getElementById(errorId);
    
    if (!value) {
        showError(input, errorEl, 'Пароль обязателен');
        return false;
    }
    
    clearError(input, errorEl);
    return true;
}

// Валидация пароля при регистрации/смене пароля
function validatePassword(password, containerSelector = null) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-ZА-Я]/.test(password),
        lowercase: /[a-zа-я]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    // Обновляем визуальные индикаторы требований
    const container = containerSelector 
        ? document.querySelector(containerSelector)
        : document.querySelector('.password-requirements');
    
    if (container) {
        Object.keys(requirements).forEach(key => {
            const reqEl = container.querySelector(`[data-requirement="${key}"]`);
            if (reqEl) {
                if (requirements[key]) {
                    reqEl.classList.add('met');
                } else {
                    reqEl.classList.remove('met');
                }
            }
        });
    }

    // Проверяем все требования
    const allMet = Object.values(requirements).every(v => v);
    
    // Определяем, какое поле валидируем
    const passwordInput = document.getElementById('registerPassword') || document.getElementById('newPasswordInput');
    const errorEl = document.getElementById('registerPasswordError') || document.getElementById('newPasswordError');
    
    if (password && !allMet) {
        if (passwordInput && errorEl) {
            showError(passwordInput, errorEl, 'Пароль не соответствует требованиям');
        }
        return false;
    }
    
    if (password && allMet) {
        if (passwordInput && errorEl) {
            clearError(passwordInput, errorEl);
        }
    }
    
    return allMet;
}

// Валидация подтверждения пароля
function validatePasswordConfirm() {
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerPasswordConfirm').value;
    const confirmInput = document.getElementById('registerPasswordConfirm');
    const errorEl = document.getElementById('registerPasswordConfirmError');
    
    if (!confirm) {
        showError(confirmInput, errorEl, 'Подтверждение пароля обязательно');
        return false;
    }
    
    if (password !== confirm) {
        showError(confirmInput, errorEl, 'Пароли не совпадают');
        return false;
    }
    
    clearError(confirmInput, errorEl);
    return true;
}

// Показать ошибку
function showError(input, errorEl, message) {
    if (input) {
        input.classList.add('error');
        input.classList.remove('valid');
    }
    if (errorEl) {
        errorEl.textContent = message;
    }
}

// Очистить ошибку
function clearError(input, errorEl) {
    if (input) {
        input.classList.remove('error');
        input.classList.add('valid');
    }
    if (errorEl) {
        errorEl.textContent = '';
    }
}

// Настройка аудио плеера
function setupAudioPlayer() {
    audioPlayer.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
        progressSlider.max = audioPlayer.duration;
        if (npTotalTimeEl) npTotalTimeEl.textContent = formatTime(audioPlayer.duration);
        if (npProgressSlider) npProgressSlider.max = audioPlayer.duration;
        updateBuffer();
    });

    audioPlayer.addEventListener('timeupdate', () => {
        const duration = audioPlayer.duration || 0;
        const progress = duration > 0 ? (audioPlayer.currentTime / duration) * 100 : 0;
        progressFill.style.width = progress + '%';
        progressSlider.value = audioPlayer.currentTime || 0;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        if (npProgressFill) npProgressFill.style.width = progress + '%';
        if (npProgressSlider) npProgressSlider.value = audioPlayer.currentTime || 0;
        if (npCurrentTimeEl) npCurrentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    });

    audioPlayer.addEventListener('progress', updateBuffer);

    audioPlayer.addEventListener('ended', () => {
        handleTrackEnd();
    });

    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButtonIcon(true);
    });

    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButtonIcon(false);
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Ошибка воспроизведения:', e);
        alert('Ошибка загрузки трека. Возможно, требуется авторизация.');
    });
}

function updateBuffer() {
    if (!audioPlayer.buffered || audioPlayer.buffered.length === 0) {
        return;
    }
    const bufferedEnd = audioPlayer.buffered.end(audioPlayer.buffered.length - 1);
    const duration = audioPlayer.duration || 1;
    const percent = Math.min(100, Math.max(0, (bufferedEnd / duration) * 100));
    if (bufferFill) bufferFill.style.width = percent + '%';
    if (npBufferFill) npBufferFill.style.width = percent + '%';
}

function updatePlayerControlsUI() {
    if (shuffleBtn) {
        shuffleBtn.classList.toggle('active', shuffleEnabled);
    }
    if (repeatBtn) {
        repeatBtn.classList.toggle('active', repeatMode !== 'off');
        const badge = repeatMode === 'one'
            ? `<circle cx="18" cy="6" r="4" fill="currentColor"></circle>
               <text x="18" y="8" text-anchor="middle" font-size="6" fill="#0a0a0a" font-family="Manrope, sans-serif" font-weight="800">1</text>`
            : '';
        repeatBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                ${badge}
            </svg>
        `;
        if (repeatMode === 'one') {
            repeatBtn.title = 'Повтор: один трек';
        } else if (repeatMode === 'all') {
            repeatBtn.title = 'Повтор: весь список';
        } else {
            repeatBtn.title = 'Повтор: выкл';
        }
    }
}

function updateTrackMeta() {
    if (!trackMeta) return;
    if (currentPlaylist.length > 0 && currentTrackIndex >= 0) {
        trackMeta.textContent = `${currentTrackIndex + 1} / ${currentPlaylist.length}`;
    } else {
        trackMeta.textContent = '—';
    }
}

function handleTrackEnd() {
    if (repeatMode === 'one') {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        return;
    }

    if (shuffleEnabled) {
        playNext(true);
        return;
    }

    if (repeatMode === 'all') {
        if (currentPlaylist.length > 0 && currentTrackIndex >= currentPlaylist.length - 1) {
            currentTrackIndex = 0;
            playTrack(currentPlaylist[currentTrackIndex].id);
            return;
        }
    }

    if (currentPlaylist.length > 0 && currentTrackIndex < currentPlaylist.length - 1) {
        playNext(true);
        return;
    }

    isPlaying = false;
    updatePlayButtonIcon(false);
}

// Переключение страниц
function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Обновляем активный пункт меню
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    if (page === 'home') {
        document.getElementById('homePage').classList.add('active');
    } else if (page === 'chart') {
        document.getElementById('chartPage').classList.add('active');
        if (document.getElementById('chartContent').children.length === 1) {
            loadChart();
        }
    } else if (page === 'search') {
        document.getElementById('searchPage').classList.add('active');
    } else if (page === 'podcasts') {
        document.getElementById('podcastsPage').classList.add('active');
        const listEl = document.getElementById('podcastsContent');
        const viewMode = listEl ? listEl.dataset.view : null;
        if (!viewMode || viewMode === 'list') {
            loadPodcastsPage();
        }
    } else if (page === 'favorites') {
        document.getElementById('favoritesPage').classList.add('active');
        if (document.getElementById('favoritesContent').children.length === 1) {
            loadFavorites();
        }
    } else if (page === 'history') {
        document.getElementById('historyPage').classList.add('active');
        loadHistory('plays');
    } else if (page === 'playlists') {
        document.getElementById('playlistsPage').classList.add('active');
        if (document.getElementById('playlistsContent').children.length === 1) {
            loadPlaylists();
        }
    }
}

async function loadAuthStatus() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        isAuthorized = !!data.logged_in;
        updateAuthUI(data.username);
    } catch (error) {
        console.error('Ошибка статуса авторизации:', error);
    }
}

function updateAuthUI(username = null) {
    if (authStatus) {
        authStatus.textContent = isAuthorized ? `Пользователь: ${username || ''}` : 'Гость';
    }
    if (authOpenBtn) {
        authOpenBtn.style.display = isAuthorized ? 'none' : 'inline-block';
    }
    if (profileBtn) {
        profileBtn.style.display = isAuthorized ? 'inline-block' : 'none';
    }
    if (authLogoutBtn) {
        authLogoutBtn.style.display = isAuthorized ? 'inline-block' : 'none';
    }
}

// ========== Личный кабинет ==========

async function loadProfile() {
    const profileContent = document.getElementById('profileContent');
    if (!profileContent) return;
    
    profileContent.innerHTML = '<div class="loading">Загрузка информации...</div>';
    
    try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
            throw new Error('Ошибка загрузки профиля');
        }
        const data = await response.json();
        
        // Маскируем токен для отображения
        const displayToken = data.token ? '•'.repeat(Math.max(0, data.token.length - 4)) + data.token.slice(-4) : 'Не установлен';
        
        profileContent.innerHTML = `
            <div class="profile-section">
                <h4>Информация о пользователе</h4>
                <div class="profile-info">
                    <div class="profile-item">
                        <strong>Логин:</strong> <span>${escapeHtml(data.username)}</span>
                    </div>
                    <div class="profile-item">
                        <strong>Токен:</strong> 
                        <span id="profileTokenDisplay">${escapeHtml(displayToken)}</span>
                        <button type="button" class="btn-secondary" id="showTokenBtn" style="margin-left: 10px; font-size: 12px;">Показать</button>
                        <button type="button" class="btn-secondary" id="hideTokenBtn" style="margin-left: 5px; font-size: 12px; display: none;">Скрыть</button>
                    </div>
                    <div class="profile-item">
                        <strong>Статус токена:</strong> 
                        <span style="color: ${data.has_token ? '#27ae60' : '#e74c3c'}">
                            ${data.has_token ? '✓ Установлен' : '✗ Не установлен'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="profile-section" style="margin-top: 20px;">
                <h4>Обновить токен</h4>
                <form id="updateTokenForm" class="modal-form">
                    <div class="form-group">
                        <label class="form-label">Новый токен</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="newTokenInput" class="form-input" placeholder="Вставьте новый токен">
                            <button type="button" class="password-toggle" data-target="newTokenInput"></button>
                        </div>
                        <span class="form-error" id="updateTokenError"></span>
                    </div>
                    <button type="submit" class="btn-primary">Обновить токен</button>
                </form>
            </div>
            
            <div class="profile-section" style="margin-top: 20px;">
                <h4>Изменить пароль</h4>
                <form id="changePasswordForm" class="modal-form">
                    <div class="form-group">
                        <label class="form-label">Текущий пароль</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="oldPasswordInput" class="form-input" required>
                            <button type="button" class="password-toggle" data-target="oldPasswordInput"></button>
                        </div>
                        <span class="form-error" id="oldPasswordError"></span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Новый пароль</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="newPasswordInput" class="form-input" required minlength="8">
                            <button type="button" class="password-toggle" data-target="newPasswordInput"></button>
                        </div>
                        <span class="form-error" id="newPasswordError"></span>
                        <div class="password-requirements" id="changePasswordRequirements">
                            <div class="requirement" data-requirement="length">Минимум 8 символов</div>
                            <div class="requirement" data-requirement="uppercase">Одна заглавная буква</div>
                            <div class="requirement" data-requirement="lowercase">Одна строчная буква</div>
                            <div class="requirement" data-requirement="number">Одна цифра</div>
                            <div class="requirement" data-requirement="special">Один спецсимвол (!@#$%^&*)</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Подтверждение нового пароля</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="newPasswordConfirmInput" class="form-input" required>
                            <button type="button" class="password-toggle" data-target="newPasswordConfirmInput"></button>
                        </div>
                        <span class="form-error" id="newPasswordConfirmError"></span>
                    </div>
                    <button type="submit" class="btn-primary">Изменить пароль</button>
                </form>
            </div>
        `;
        
        // Настраиваем обработчики
        setupProfileHandlers(data.token);
        setupPasswordToggles(); // Переинициализируем для новых полей
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        profileContent.innerHTML = '<div class="empty-state">Ошибка загрузки профиля</div>';
    }
}

function setupProfileHandlers(fullToken) {
    // Показать/скрыть токен
    const showTokenBtn = document.getElementById('showTokenBtn');
    const hideTokenBtn = document.getElementById('hideTokenBtn');
    const tokenDisplay = document.getElementById('profileTokenDisplay');
    
    if (showTokenBtn && hideTokenBtn && tokenDisplay && fullToken) {
        showTokenBtn.addEventListener('click', () => {
            tokenDisplay.textContent = escapeHtml(fullToken);
            showTokenBtn.style.display = 'none';
            hideTokenBtn.style.display = 'inline-block';
        });
        
        hideTokenBtn.addEventListener('click', () => {
            const masked = '•'.repeat(Math.max(0, fullToken.length - 4)) + fullToken.slice(-4);
            tokenDisplay.textContent = escapeHtml(masked);
            showTokenBtn.style.display = 'inline-block';
            hideTokenBtn.style.display = 'none';
        });
    }
    
    // Обновление токена
    const updateTokenForm = document.getElementById('updateTokenForm');
    if (updateTokenForm) {
        updateTokenForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newToken = document.getElementById('newTokenInput').value.trim();
            const errorEl = document.getElementById('updateTokenError');
            
            try {
                const response = await fetch('/api/profile/token', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: newToken || null })
                });
                
                if (!response.ok) {
                    const data = await response.json();
                    showError(document.getElementById('newTokenInput'), errorEl, data.error || 'Ошибка обновления токена');
                    return;
                }
                
                const data = await response.json();
                if (data.success) {
                    alert('Токен успешно обновлён');
                    updateTokenForm.reset();
                    clearError(document.getElementById('newTokenInput'), errorEl);
                    loadProfile(); // Перезагружаем профиль
                }
            } catch (error) {
                console.error('Ошибка обновления токена:', error);
                showError(document.getElementById('newTokenInput'), errorEl, 'Ошибка соединения с сервером');
            }
        });
    }
    
    // Смена пароля
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        const newPasswordInput = document.getElementById('newPasswordInput');
        const newPasswordConfirmInput = document.getElementById('newPasswordConfirmInput');
        
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', () => {
                validatePassword(newPasswordInput.value, '#changePasswordRequirements');
                validatePasswordConfirmChange();
            });
        }
        
        if (newPasswordConfirmInput) {
            newPasswordConfirmInput.addEventListener('input', () => {
                validatePasswordConfirmChange();
            });
        }
        
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPasswordInput').value.trim();
            const newPassword = newPasswordInput.value.trim();
            const newPasswordConfirm = newPasswordConfirmInput.value.trim();
            
            // Валидация
            if (!oldPassword) {
                showError(document.getElementById('oldPasswordInput'), document.getElementById('oldPasswordError'), 'Текущий пароль обязателен');
                return;
            }
            
            const isPasswordValid = validatePassword(newPassword, '#changePasswordRequirements');
            const isConfirmValid = validatePasswordConfirmChange();
            
            if (!isPasswordValid || !isConfirmValid) {
                return;
            }
            
            try {
                const response = await fetch('/api/profile/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        old_password: oldPassword,
                        new_password: newPassword
                    })
                });
                
                if (!response.ok) {
                    const data = await response.json();
                    if (data.error.includes('текущий пароль')) {
                        showError(document.getElementById('oldPasswordInput'), document.getElementById('oldPasswordError'), data.error);
                    } else {
                        showError(newPasswordInput, document.getElementById('newPasswordError'), data.error);
                    }
                    return;
                }
                
                const data = await response.json();
                if (data.success) {
                    alert('Пароль успешно изменён');
                    changePasswordForm.reset();
                    document.querySelectorAll('#changePasswordForm .form-error').forEach(el => el.textContent = '');
                    document.querySelectorAll('#changePasswordForm .form-input').forEach(el => {
                        el.classList.remove('error', 'valid');
                    });
                    document.querySelectorAll('#changePasswordRequirements .requirement').forEach(req => req.classList.remove('met'));
                }
            } catch (error) {
                console.error('Ошибка смены пароля:', error);
                showError(newPasswordInput, document.getElementById('newPasswordError'), 'Ошибка соединения с сервером');
            }
        });
    }
}

function validatePasswordConfirmChange() {
    const password = document.getElementById('newPasswordInput').value;
    const confirm = document.getElementById('newPasswordConfirmInput').value;
    const confirmInput = document.getElementById('newPasswordConfirmInput');
    const errorEl = document.getElementById('newPasswordConfirmError');
    
    if (!confirm) {
        showError(confirmInput, errorEl, 'Подтверждение пароля обязательно');
        return false;
    }
    
    if (password !== confirm) {
        showError(confirmInput, errorEl, 'Пароли не совпадают');
        return false;
    }
    
    clearError(confirmInput, errorEl);
    return true;
}

// Поиск
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    switchPage('search');
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="loading">Поиск...</div>';

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            resultsDiv.innerHTML = `<div class="empty-state">Ошибка: ${data.error}</div>`;
            return;
        }

        let html = '<div class="search-results">';

        // Исполнители
        if (data.artists && data.artists.length > 0) {
            html += '<div class="search-section">';
            html += '<h3>Исполнители</h3>';
            html += '<div class="tracks-grid">';
            data.artists.forEach(artist => {
                html += createArtistCard(artist);
            });
            html += '</div></div>';
        }

        // Треки
        if (data.tracks && data.tracks.length > 0) {
            html += '<div class="search-section">';
            html += '<h3>Треки</h3>';
            html += '<div class="tracks-grid">';
            data.tracks.forEach(track => {
                html += createTrackCard(track, true);
            });
            html += '</div></div>';
        }

        // Альбомы
        if (data.albums && data.albums.length > 0) {
            html += '<div class="search-section">';
            html += '<h3>Альбомы</h3>';
            html += '<div class="tracks-grid">';
            data.albums.forEach(album => {
                html += createAlbumCard(album);
            });
            html += '</div></div>';
        }

        // Подкасты
        if (data.podcasts && data.podcasts.length > 0) {
            html += '<div class="search-section">';
            html += '<h3>Подкасты</h3>';
            html += '<div class="tracks-grid">';
            data.podcasts.forEach(podcast => {
                html += createPodcastCard(podcast);
            });
            html += '</div></div>';
        }

        if (!data.tracks?.length && !data.albums?.length && !data.artists?.length && !data.podcasts?.length) {
            html = '<div class="empty-state">Ничего не найдено</div>';
        }

        html += '</div>';
        resultsDiv.innerHTML = html;

        // Настраиваем обработчики через универсальную функцию
        setupTrackCardHandlers(resultsDiv);
        
        // Обработчики для карточек (не треков)
        document.querySelectorAll('.album-card-box').forEach(card => {
            card.addEventListener('click', () => {
                const albumId = card.dataset.albumId;
                if (albumId) {
                    loadAlbum(albumId);
                }
            });
        });

        document.querySelectorAll('.artist-card-box').forEach(card => {
            card.addEventListener('click', () => {
                const artistId = card.dataset.artistId;
                if (artistId) {
                    loadArtist(artistId);
                }
            });
        });

        document.querySelectorAll('.podcast-card').forEach(card => {
            card.addEventListener('click', () => {
                const podcastId = card.dataset.podcastId;
                if (podcastId) {
                    loadPodcast(podcastId, 'search');
                }
            });
        });

    } catch (error) {
        console.error('Ошибка поиска:', error);
        resultsDiv.innerHTML = '<div class="empty-state">Ошибка при выполнении поиска</div>';
    }
}

// Создание карточки трека
function createTrackCard(track, showFavoriteBtn = false, playlistId = null) {
    const coverUrl = track.cover_uri || '';
    const trackId = track.track_id || track.id;
    const artists = track.artists || [];
    const artistsHtml = artists.length > 0 
        ? artists.map(a => {
            const artistId = typeof a === 'object' && a.id ? a.id : null;
            const artistName = typeof a === 'object' && a.name ? a.name : a;
            if (artistId) {
                return `<span class="artist-link" data-artist-id="${artistId}">${escapeHtml(artistName)}</span>`;
            }
            return escapeHtml(artistName);
        }).join(', ')
        : 'Неизвестный исполнитель';
    
    // Кнопки всегда создаются, если есть trackId (скрываются через CSS при отсутствии hover)
    const isFavorite = trackId ? isFavoriteTrack(trackId) : false;
    const favoriteBtn = trackId 
        ? `<button class="favorite-btn ${isFavorite ? 'active' : ''}" data-track-id="${trackId}" title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}">${isFavorite ? '❤️' : '🤍'}</button>`
        : '';
    
    let actionBtn = '';
    if (trackId) {
        if (playlistId) {
            // В плейлисте показываем кнопку удаления
            actionBtn = `<button class="remove-from-playlist-btn add-to-playlist-btn" data-track-id="${trackId}" data-playlist-id="${playlistId}" title="Удалить из плейлиста">🗑️</button>`;
        } else {
            // Обычная кнопка добавления в плейлист
            actionBtn = `<button class="add-to-playlist-btn" data-track-id="${trackId}" title="Добавить в плейлист">📋</button>`;
        }
    }
    
    return `
        <div class="track-card" data-track-id="${trackId || ''}">
            <div class="track-cover-img" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                ${coverUrl ? `<img src="${coverUrl}" alt="Cover" onerror="this.style.display='none'">` : '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🎵</div>'}
            </div>
            <div class="track-card-title">${escapeHtml(track.title || 'Без названия')}</div>
            <div class="track-card-artist">${artistsHtml}</div>
            ${favoriteBtn || actionBtn ? `<div class="track-actions">${favoriteBtn}${actionBtn}</div>` : ''}
        </div>
    `;
}

// Создание карточки альбома
function createAlbumCard(album) {
    const coverUrl = album.cover_uri || '';
    const artists = album.artists || [];
    const artistsText = Array.isArray(artists) && artists.length > 0 
        ? artists.map(a => typeof a === 'object' ? a.name : a).join(', ')
        : 'Неизвестный исполнитель';
    const bgStyle = coverUrl 
        ? `background-image: url('${coverUrl}');` 
        : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
    
    return `
        <div class="album-card-box" data-album-id="${album.id}" style="${bgStyle}">
            <div class="album-card-footer">
                <div class="album-card-info">
                    <strong class="album-card-title">${escapeHtml(album.title || 'Без названия')}</strong>
                    <span class="album-card-artist">${escapeHtml(artistsText)}</span>
                </div>
            </div>
        </div>
    `;
}

// Создание карточки исполнителя
function createArtistCard(artist) {
    const coverUrl = artist.cover_uri || '';
    const bgStyle = coverUrl 
        ? `background-image: url('${coverUrl}');` 
        : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
    
    return `
        <div class="artist-card-box" data-artist-id="${artist.id}" style="${bgStyle}">
            <div class="artist-card-footer">
                <div class="artist-card-info">
                    <strong class="artist-card-title">${escapeHtml(artist.name)}</strong>
                </div>
            </div>
        </div>
    `;
}

// Создание карточки подкаста
function createPodcastCard(podcast) {
    const coverUrl = podcast.cover_uri || '';
    
    return `
        <div class="track-card podcast-card" data-podcast-id="${podcast.id}">
            <div class="track-cover-img" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                ${coverUrl ? `<img src="${coverUrl}" alt="Cover" onerror="this.style.display='none'">` : '🎙️'}
            </div>
            <div class="track-card-title">${escapeHtml(podcast.title)}</div>
        </div>
    `;
}

async function loadRecommendations() {
    const container = document.getElementById('homeRecommendations');
    if (container) {
        container.innerHTML = '<div class="loading">Загрузка рекомендаций...</div>';
    }
    try {
        const response = await fetch('/api/recommendations');
        const data = await response.json();
        if (!data || (!data.track && !data.podcast && !data.artist)) {
            if (container) {
                container.innerHTML = '<div class="empty-state">Рекомендации недоступны</div>';
            }
            return;
        }
        renderRecommendations('homeRecommendations', data);
    } catch (error) {
        console.error('Ошибка загрузки рекомендаций:', error);
        if (container) {
            container.innerHTML = '<div class="empty-state">Рекомендации недоступны</div>';
        }
    }
}

async function loadPodcastsPage() {
    const recommendationsEl = document.getElementById('podcastsRecommendations');
    const listEl = document.getElementById('podcastsContent');
    if (listEl) {
        listEl.dataset.view = 'list';
    }
    
    if (recommendationsEl) {
        recommendationsEl.innerHTML = '<div class="loading">Загрузка рекомендаций...</div>';
    }
    if (listEl) {
        listEl.innerHTML = '<div class="loading">Загрузка подкастов...</div>';
    }
    
    try {
        const recResponse = await fetch('/api/podcasts/recommended');
        const recData = await recResponse.json();
        if (!recData.error) {
            renderRecommendations('podcastsRecommendations', recData);
        }
        
        const listResponse = await fetch('/api/podcasts/list');
        const listData = await listResponse.json();
        if (listData.error) {
            if (listEl) listEl.innerHTML = `<div class="empty-state">Ошибка: ${listData.error}</div>`;
            return;
        }
        
        if (listEl) {
            if (listData.podcasts && listData.podcasts.length > 0) {
                let html = '<div class="tracks-grid">';
                listData.podcasts.forEach(podcast => {
                    html += createPodcastCard(podcast);
                });
                html += '</div>';
                listEl.innerHTML = html;
                
                setupTrackCardHandlers(listEl);
            } else {
                listEl.innerHTML = '<div class="empty-state">Подкасты не найдены</div>';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки подкастов:', error);
        if (recommendationsEl) recommendationsEl.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
        if (listEl) listEl.innerHTML = '<div class="empty-state">Ошибка загрузки</div>';
    }
}

function renderRecommendations(targetId, data) {
    const container = document.getElementById(targetId);
    if (!container) return;
    
    const podcasts = data.podcasts || (data.podcast ? [data.podcast] : []);
    const artists = data.artists || (data.artist ? [data.artist] : []);
    const tracks = data.tracks || (data.track ? [data.track] : []);
    
    let html = '';
    
    if (tracks[0]) {
        html += createRecommendationCard(
            tracks[0].title,
            (tracks[0].artists || []).join(', ') || 'Рекомендуем послушать',
            tracks[0].cover_uri,
            'track',
            tracks[0].id
        );
    }
    
    if (podcasts[0]) {
        html += createRecommendationCard(
            podcasts[0].title,
            podcasts[0].description || 'Рекомендуем послушать этот подкаст',
            podcasts[0].cover_uri,
            'podcast',
            podcasts[0].id
        );
    }
    
    if (artists[0]) {
        html += createRecommendationCard(
            artists[0].name,
            artists[0].description || 'Рекомендуем этого исполнителя',
            artists[0].cover_uri,
            'artist',
            artists[0].id
        );
    }
    
    if (!html) {
        html = '<div class="empty-state">Рекомендации недоступны</div>';
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('[data-rec-type="podcast"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const podcastId = btn.dataset.recId;
            if (podcastId) {
                loadPodcast(podcastId, targetId === 'homeRecommendations' ? 'search' : 'podcasts');
            }
        });
    });
    
    container.querySelectorAll('[data-rec-play="podcast"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const podcastId = btn.dataset.recId;
            if (podcastId) {
                playPodcastFirstEpisode(podcastId);
            }
        });
    });
    
    container.querySelectorAll('[data-rec-type="artist"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const artistId = btn.dataset.recId;
            if (artistId) {
                loadArtist(artistId);
                switchPage('search');
            }
        });
    });

    container.querySelectorAll('[data-rec-type="track"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const trackId = btn.dataset.recId;
            if (trackId) {
                playTrack(trackId);
            }
        });
    });
}

function createRecommendationCard(title, description, coverUri, type, id) {
    const icon = type === 'podcast' ? '🎙️' : (type === 'track' ? '🎵' : '🎤');
    const actions = type === 'podcast'
        ? `<button class="btn-secondary" data-rec-type="podcast" data-rec-id="${id}">Открыть</button>
           <button class="btn-secondary" data-rec-play="podcast" data-rec-id="${id}">▶ Слушать</button>`
        : type === 'track'
            ? `<button class="btn-secondary" data-rec-type="track" data-rec-id="${id}">▶ Слушать</button>`
            : `<button class="btn-secondary" data-rec-type="artist" data-rec-id="${id}">Открыть</button>`;
    
    return `
        <div class="recommendation-card">
            <div class="recommendation-cover">
                ${coverUri ? `<img src="${coverUri}" alt="Cover" onerror="this.style.display='none'">` : icon}
            </div>
            <div class="recommendation-info">
                <div class="recommendation-title">${escapeHtml(title)}</div>
                <div class="recommendation-desc">${escapeHtml(description || '')}</div>
                <div class="recommendation-actions">${actions}</div>
            </div>
        </div>
    `;
}

// Загрузка чарта
async function loadChart() {
    const chartContent = document.getElementById('chartContent');
    chartContent.innerHTML = '<div class="loading">Загрузка чарта...</div>';

    try {
        const response = await fetch('/api/chart');
        const data = await response.json();

        if (data.error) {
            chartContent.innerHTML = `<div class="empty-state">Ошибка: ${data.error}</div>`;
            return;
        }

        if (data.tracks && data.tracks.length > 0) {
            currentPlaylist = data.tracks;
            let html = '<div class="tracks-grid">';
            data.tracks.forEach((track, index) => {
                html += createTrackCard(track, true);
            });
            html += '</div>';
            chartContent.innerHTML = html;

            // Настраиваем обработчики
            setupTrackCardHandlers(chartContent);
        } else {
            chartContent.innerHTML = '<div class="empty-state">Чарт недоступен</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки чарта:', error);
        chartContent.innerHTML = '<div class="empty-state">Ошибка загрузки чарта</div>';
    }
}

// Загрузка исполнителя
async function loadArtist(artistId) {
    try {
        const response = await fetch(`/api/artist/${artistId}`);
        const data = await response.json();

        if (data.error) {
            alert('Ошибка загрузки исполнителя: ' + data.error);
            return;
        }

        let html = `<div class="artist-page">`;
        html += `<div class="artist-header">`;
        if (data.cover_uri) {
            html += `<img src="${data.cover_uri}" alt="${escapeHtml(data.name)}" class="artist-cover-large">`;
        }
        html += `<div class="artist-info">`;
        html += `<h2>${escapeHtml(data.name)}</h2>`;
        if (Array.isArray(data.genres) && data.genres.length > 0) {
            html += `<div class="artist-genres">`;
            data.genres.slice(0, 8).forEach(g => {
                html += `<span class="genre-chip">${escapeHtml(String(g))}</span>`;
            });
            html += `</div>`;
        }
        html += `<p class="artist-description ${data.description ? '' : 'is-empty'}">`;
        html += data.description
            ? escapeHtml(data.description)
            : 'Описание отсутствует';
        html += `</p>`;
        html += `</div></div>`;

        // Треки
        if (data.tracks && data.tracks.length > 0) {
            currentPlaylist = data.tracks;
            html += '<h3>Треки</h3>';
            html += '<div class="tracks-grid">';
            data.tracks.forEach((track, index) => {
                html += createTrackCard(track, true);
            });
            html += '</div>';
        }

        // Альбомы
        if (data.albums && data.albums.length > 0) {
            html += '<h3>Альбомы</h3>';
            html += '<div class="tracks-grid">';
            data.albums.forEach(album => {
                html += createAlbumCard(album);
            });
            html += '</div>';
        }

        html += '</div>';

        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = html;

        // Настраиваем обработчики
        setupTrackCardHandlers(searchResults);
        
        document.querySelectorAll('.album-card-box').forEach(card => {
            card.addEventListener('click', () => {
                const albumId = card.dataset.albumId;
                if (albumId) {
                    loadAlbum(albumId);
                }
            });
        });

        switchPage('search');
    } catch (error) {
        console.error('Ошибка загрузки исполнителя:', error);
        alert('Ошибка загрузки исполнителя');
    }
}

// Загрузка подкаста
async function loadPodcast(podcastId, targetPage = 'search') {
    try {
        const response = await fetch(`/api/podcast/${podcastId}`);
        const data = await response.json();

        if (data.error) {
            const targetContainer = targetPage === 'podcasts'
                ? document.getElementById('podcastsContent')
                : document.getElementById('searchResults');
            if (targetContainer) {
                targetContainer.innerHTML = `<div class="empty-state">Ошибка: ${data.error}</div>`;
            }
            alert('Ошибка загрузки подкаста: ' + data.error);
            return;
        }

        if (data.episodes && data.episodes.length > 0) {
            currentPlaylist = data.episodes;
            let html = `<h3>${escapeHtml(data.title)}</h3>`;
            if (data.description) {
                html += `<p>${escapeHtml(data.description)}</p>`;
            }
            html += '<div class="tracks-grid">';
            data.episodes.forEach((episode, index) => {
                    html += createTrackCard(episode, true);
            });
            html += '</div>';
            const targetContainer = targetPage === 'podcasts'
                ? document.getElementById('podcastsContent')
                : document.getElementById('searchResults');

            if (targetPage === 'podcasts') {
                targetContainer.dataset.view = 'detail';
                html = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>${escapeHtml(data.title)}</h3>
                        <button class="btn-secondary" id="backToPodcastsBtn">← Назад к каталогу</button>
                    </div>
                    ${data.description ? `<p>${escapeHtml(data.description)}</p>` : ''}
                ` + html;
            }

            targetContainer.innerHTML = html;

            // Настраиваем обработчики
            setupTrackCardHandlers(targetContainer);

            if (targetPage === 'podcasts') {
                const backBtn = document.getElementById('backToPodcastsBtn');
                if (backBtn) {
                    backBtn.addEventListener('click', () => {
                        loadPodcastsPage();
                    });
                }
                return;
            }

            switchPage(targetPage);
        } else {
            const targetContainer = targetPage === 'podcasts'
                ? document.getElementById('podcastsContent')
                : document.getElementById('searchResults');
            if (targetContainer) {
                targetContainer.innerHTML = '<div class="empty-state">Эпизоды подкаста не найдены</div>';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки подкаста:', error);
        alert('Ошибка загрузки подкаста');
    }
}

async function playPodcastFirstEpisode(podcastId) {
    try {
        const response = await fetch(`/api/podcast/${podcastId}`);
        const data = await response.json();
        if (data.error) {
            alert('Ошибка: ' + data.error);
            return;
        }
        if (data.episodes && data.episodes.length > 0) {
            const first = data.episodes[0];
            const episodeId = first.track_id || first.id;
            if (episodeId) {
                playTrack(episodeId);
            }
        }
    } catch (error) {
        console.error('Ошибка запуска подкаста:', error);
    }
}

// Загрузка альбома
async function loadAlbum(albumId) {
    try {
        switchPage('search');
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '<div class="loading">Загрузка альбома...</div>';
        }
        const response = await fetch(`/api/album/${encodeURIComponent(albumId)}`);
        const data = await response.json();

        if (data.error) {
            if (searchResults) {
                searchResults.innerHTML = `<div class="empty-state">Ошибка: ${data.error}</div>`;
            }
            alert('Ошибка загрузки альбома: ' + data.error);
            return;
        }

        if (data.tracks && data.tracks.length > 0) {
            currentPlaylist = data.tracks;
            const artists = (data.artists || []).map(a => a.name).join(', ') || 'Неизвестный исполнитель';
            let html = `
                <div class="artist-header">
                    ${data.cover_uri ? `<img src="${data.cover_uri}" alt="${escapeHtml(data.title)}" class="album-cover-large">` : ''}
                    <div class="artist-info">
                        <h2>${escapeHtml(data.title)}</h2>
                        <div class="track-card-artist">${escapeHtml(artists)}</div>
                    </div>
                </div>
            `;
            html += '<div class="tracks-grid">';
            data.tracks.forEach((track, index) => {
                html += createTrackCard(track, true);
            });
            html += '</div>';

            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = html;

            // Настраиваем обработчики
            setupTrackCardHandlers(searchResults);
        } else {
            const artists = (data.artists || []).map(a => a.name).join(', ') || 'Неизвестный исполнитель';
            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = `
                <div class="artist-header">
                    ${data.cover_uri ? `<img src="${data.cover_uri}" alt="${escapeHtml(data.title)}" class="album-cover-large">` : ''}
                    <div class="artist-info">
                        <h2>${escapeHtml(data.title)}</h2>
                        <div class="track-card-artist">${escapeHtml(artists)}</div>
                    </div>
                </div>
                <div class="empty-state">Треки альбома не найдены</div>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки альбома:', error);
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '<div class="empty-state">Ошибка загрузки альбома</div>';
        }
        alert('Ошибка загрузки альбома');
    }
}

// Воспроизведение трека
async function playTrack(trackId) {
    try {
        if (currentPlaylist.length > 0) {
            const idx = currentPlaylist.findIndex(t => t.id === trackId);
            if (idx >= 0) {
                currentTrackIndex = idx;
            }
        }
        const response = await fetch(`/api/track/${encodeURIComponent(trackId)}`);
        const data = await response.json();

        if (data.error) {
            alert('Ошибка загрузки трека: ' + data.error);
            return;
        }

        currentTrack = data;
        audioPlayer.src = data.stream_url;
        trackTitle.textContent = data.title;
        trackArtist.textContent = data.artists.map(a => a.name).join(', ') || 'Неизвестный исполнитель';
        
        // Обложка
        if (data.cover_uri) {
            trackCover.innerHTML = `<img src="${data.cover_uri}" alt="Cover" onerror="this.innerHTML='<div class=\\'cover-placeholder\\'>🎵</div>'">`;
        } else {
            trackCover.innerHTML = '<div class="cover-placeholder">🎵</div>';
        }

        updateTrackMeta();
        syncNowPlayingUI();
        await audioPlayer.play();
        isPlaying = true;
        updatePlayButtonIcon(true);
    } catch (error) {
        console.error('Ошибка воспроизведения:', error);
        alert('Ошибка воспроизведения трека');
    }
}

// Обновление иконки play/pause
function updatePlayButtonIcon(playing) {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    if (playIcon && pauseIcon) {
        playIcon.style.display = playing ? 'none' : 'block';
        pauseIcon.style.display = playing ? 'block' : 'none';
    }
    const npPlayIcon = document.getElementById('npPlayIcon');
    const npPauseIcon = document.getElementById('npPauseIcon');
    if (npPlayIcon && npPauseIcon) {
        npPlayIcon.style.display = playing ? 'none' : 'block';
        npPauseIcon.style.display = playing ? 'block' : 'none';
    }
}

// Управление воспроизведением
function togglePlay() {
    if (!audioPlayer.src) {
        return;
    }
    if (isPlaying) {
        audioPlayer.pause();
        updatePlayButtonIcon(false);
        isPlaying = false;
    } else {
        audioPlayer.play();
        updatePlayButtonIcon(true);
        isPlaying = true;
    }
}

function playPrevious() {
    if (currentPlaylist.length === 0) return;

    if (shuffleEnabled && shuffleHistory.length > 0) {
        currentTrackIndex = shuffleHistory.pop();
        const track = currentPlaylist[currentTrackIndex];
        playTrack(track.id);
        return;
    }

    if (currentTrackIndex > 0) {
        currentTrackIndex--;
        const track = currentPlaylist[currentTrackIndex];
        playTrack(track.id);
    }
}

function playNext(isAuto = false) {
    if (currentPlaylist.length === 0) return;

    if (shuffleEnabled) {
        if (currentPlaylist.length === 1) {
            return;
        }
        if (currentTrackIndex >= 0) {
            shuffleHistory.push(currentTrackIndex);
        }
        let nextIndex = currentTrackIndex;
        while (nextIndex === currentTrackIndex) {
            nextIndex = Math.floor(Math.random() * currentPlaylist.length);
        }
        currentTrackIndex = nextIndex;
        const track = currentPlaylist[currentTrackIndex];
        playTrack(track.id);
        return;
    }

    if (currentTrackIndex < currentPlaylist.length - 1) {
        currentTrackIndex++;
        const track = currentPlaylist[currentTrackIndex];
        playTrack(track.id);
        return;
    }

    if (repeatMode === 'all' && isAuto) {
        currentTrackIndex = 0;
        const track = currentPlaylist[currentTrackIndex];
        playTrack(track.id);
    }
}

function seek() {
    audioPlayer.currentTime = progressSlider.value;
}

// Обновление иконки громкости
function updateVolumeIcon(volume) {
    const volumeHigh = document.getElementById('volumeHigh');
    const volumeMid = document.getElementById('volumeMid');
    const volumeMute = document.getElementById('volumeMute');
    
    if (!volumeHigh || !volumeMid || !volumeMute) return;
    
    if (volume === 0) {
        volumeHigh.style.display = 'none';
        volumeMid.style.display = 'none';
        volumeMute.style.display = 'block';
    } else if (volume < 0.5) {
        volumeHigh.style.display = 'none';
        volumeMid.style.display = 'block';
        volumeMute.style.display = 'none';
    } else {
        volumeHigh.style.display = 'block';
        volumeMid.style.display = 'none';
        volumeMute.style.display = 'none';
    }
}

function updateVolumeSliderColor(value) {
    if (!volumeSlider) return;
    const percentage = `${value}%`;
    volumeSlider.style.setProperty('--volume-percent', percentage);
}

function changeVolume() {
    const value = volumeSlider.value;
    audioPlayer.volume = value / 100;
    updateVolumeIcon(audioPlayer.volume);
    updateVolumeSliderColor(value);
    savePlayerSettings();
}

function toggleMute() {
    if (audioPlayer.volume > 0) {
        audioPlayer.volume = 0;
        volumeSlider.value = 0;
    } else {
        audioPlayer.volume = 0.5;
        volumeSlider.value = 50;
    }
    updateVolumeIcon(audioPlayer.volume);
    updateVolumeSliderColor(volumeSlider.value);
    savePlayerSettings();
}

// Форматирование времени
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Экранирование HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ========== Работа с избранным ==========

let favoriteTracksCache = null;

async function loadFavorites() {
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) return;
    
    favoritesContent.innerHTML = '<div class="loading">Загрузка избранного...</div>';

    try {
        const response = await fetch('/api/favorites/tracks');
        const data = await response.json();

        if (data.error) {
            favoritesContent.innerHTML = `<div class="empty-state">Ошибка: ${data.error}</div>`;
            return;
        }

        if (data.tracks && data.tracks.length > 0) {
            favoriteTracksCache = data.tracks.map(t => t.track_id);
            currentPlaylist = data.tracks;
            let html = '<div class="tracks-grid">';
            data.tracks.forEach((track, index) => {
                html += createTrackCard({
                    id: track.track_id,
                    title: track.title,
                    artists: track.artists,
                    cover_uri: track.cover_uri
                }, true);
            });
            html += '</div>';
            favoritesContent.innerHTML = html;

            // Настраиваем обработчики
            setupTrackCardHandlers(favoritesContent);
        } else {
            favoritesContent.innerHTML = '<div class="empty-state">Нет избранных треков</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        favoritesContent.innerHTML = '<div class="empty-state">Ошибка загрузки избранного</div>';
    }
}

async function toggleFavorite(event, trackId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (!trackId) {
        return;
    }
    
    // Показываем индикатор загрузки
    const btn = event ? event.target : document.querySelector(`.favorite-btn[data-track-id="${trackId}"]`);
    const originalText = btn ? btn.textContent : '';
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳';
    }
    
    try {
        // Используем кэш для быстрой проверки
        const isFavorite = favoriteTracksCache && favoriteTracksCache.includes(trackId);

        if (isFavorite) {
            // Удаляем из избранного
            await fetch(`/api/favorites/tracks/${trackId}`, { method: 'DELETE' });
            // Обновляем кэш
            const index = favoriteTracksCache.indexOf(trackId);
            if (index > -1) {
                favoriteTracksCache.splice(index, 1);
            }
            // Обновляем все кнопки с этим trackId
            updateFavoriteButtons(trackId, false);
        } else {
            // Получаем данные трека и добавляем в избранное
            const trackResponse = await fetch(`/api/track/${encodeURIComponent(trackId)}`);
            const trackData = await trackResponse.json();
            
            if (trackData.error) {
                alert('Ошибка: ' + trackData.error);
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
                return;
            }

            // Формируем данные для отправки
            const favoriteData = {
                id: trackData.track_id || trackData.id,
                title: trackData.title || 'Без названия',
                artists: Array.isArray(trackData.artists) 
                    ? trackData.artists.map(a => typeof a === 'object' ? (a.name || String(a)) : String(a))
                    : [],
                duration_ms: trackData.duration_ms || 0,
                cover_uri: trackData.cover_uri || null
            };
            
            const response = await fetch('/api/favorites/tracks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(favoriteData)
            });
            
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }
            // Обновляем кэш
            if (!favoriteTracksCache) favoriteTracksCache = [];
            favoriteTracksCache.push(trackId);
            // Обновляем все кнопки с этим trackId
            updateFavoriteButtons(trackId, true);
        }
    } catch (error) {
        console.error('Ошибка изменения избранного:', error);
        alert('Ошибка изменения избранного');
        if (btn) {
            btn.disabled = false;
            btn.textContent = isFavoriteTrack(trackId) ? '❤️' : '🤍';
        }
    }
}

// Обновление всех кнопок избранного для конкретного трека
function updateFavoriteButtons(trackId, isFavorite) {
    document.querySelectorAll(`.favorite-btn[data-track-id="${trackId}"]`).forEach(btn => {
        btn.disabled = false;
        btn.textContent = isFavorite ? '❤️' : '🤍';
        if (isFavorite) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function isFavoriteTrack(trackId) {
    return favoriteTracksCache && favoriteTracksCache.includes(trackId);
}

// ========== Работа с историей ==========

function setupHistoryTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadHistory(tab);
        });
    });

    // Кнопка очистки истории
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите очистить историю прослушиваний?')) {
                try {
                    const response = await fetch('/api/history/plays', { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                        alert('История прослушиваний очищена');
                        loadHistory('plays');
                    } else {
                        alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Ошибка очистки истории:', error);
                    alert('Ошибка очистки истории');
                }
            }
        });
    }
}

async function loadHistory(type) {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    
    historyContent.innerHTML = '<div class="loading">Загрузка истории...</div>';

    try {
        let url = type === 'plays' ? '/api/history/plays' : '/api/history/search';
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            historyContent.innerHTML = `<div class="empty-state">Ошибка: ${data.error}</div>`;
            return;
        }

        if (type === 'plays') {
            if (data.history && data.history.length > 0) {
                let html = '';
                data.history.forEach(item => {
                    const time = new Date(item.played_at).toLocaleString('ru-RU');
                    // Обрабатываем artists - может быть массивом или JSON строкой
                    let artists = 'Неизвестный исполнитель';
                    if (item.artists) {
                        if (Array.isArray(item.artists)) {
                            artists = item.artists.map(a => typeof a === 'string' ? a : (a.name || '')).filter(a => a).join(', ') || 'Неизвестный исполнитель';
                        } else if (typeof item.artists === 'string') {
                            try {
                                const parsed = JSON.parse(item.artists);
                                artists = Array.isArray(parsed) ? parsed.join(', ') : item.artists;
                            } catch {
                                artists = item.artists;
                            }
                        }
                    }
                    const title = item.title || 'Без названия';
                    const coverUrl = item.cover_uri ? String(item.cover_uri) : '';
                    const safeCover = coverUrl ? encodeURI(coverUrl).replace(/'/g, '%27') : '';
                    const coverStyle = safeCover
                        ? ` style="background-image: url('${safeCover}'); background-size: cover; background-position: center;"`
                        : '';
                    const coverContent = safeCover ? '' : '🎵';
                    html += `
                        <div class="history-item" data-track-id="${item.track_id}">
                            <div class="history-item-cover"${coverStyle}>${coverContent}</div>
                            <div class="history-item-info">
                                <div class="history-item-title">${escapeHtml(title)}</div>
                                <div class="history-item-artist">${escapeHtml(artists)}</div>
                            </div>
                            <div class="history-item-time">${time}</div>
                        </div>
                    `;
                });
                historyContent.innerHTML = html;

                // Добавляем обработчики кликов
                document.querySelectorAll('.history-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const trackId = item.dataset.trackId;
                        if (trackId) {
                            playTrack(trackId);
                        }
                    });
                });
            } else {
                historyContent.innerHTML = '<div class="empty-state">История прослушиваний пуста</div>';
            }
        } else {
            if (data.history && data.history.length > 0) {
                let html = '';
                data.history.forEach(item => {
                    const time = new Date(item.created_at).toLocaleString('ru-RU');
                    const query = item.query || 'Без названия';
                    const resultsCount = item.results_count || 0;
                    html += `
                        <div class="search-history-item" data-query="${escapeHtml(query)}">
                            <div>
                                <div class="search-history-query">${escapeHtml(String(query))}</div>
                                <div class="search-history-meta">${time} • ${resultsCount} результатов</div>
                            </div>
                        </div>
                    `;
                });
                historyContent.innerHTML = html;

                // Добавляем обработчики кликов
                document.querySelectorAll('.search-history-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const query = item.dataset.query;
                        searchInput.value = query;
                        performSearch();
                    });
                });
            } else {
                historyContent.innerHTML = '<div class="empty-state">История поиска пуста</div>';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        historyContent.innerHTML = '<div class="empty-state">Ошибка загрузки истории</div>';
    }
}

// ========== Работа с плейлистами ==========

function setupPlaylistModal() {
    const createBtn = document.getElementById('createPlaylistBtn');
    const modal = document.getElementById('playlistModal');
    const closeBtn = document.querySelector('.modal-close');
    const form = document.getElementById('playlistForm');

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.add('active');
                modal.dataset.pendingTrackId = ''; // Сбрасываем
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.remove('active');
                modal.dataset.pendingTrackId = '';
            }
        });
    }

    if (form) {
        // Обработка предпросмотра изображения
        const coverFileInput = document.getElementById('playlistCoverFile');
        const coverUriInput = document.getElementById('playlistCoverUri');
        const coverPreview = document.getElementById('playlistCoverPreview');
        const coverPreviewImg = document.getElementById('playlistCoverPreviewImg');
        
        if (coverFileInput && coverPreviewImg) {
            coverFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        coverPreviewImg.src = e.target.result;
                        if (coverPreview) coverPreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        if (coverUriInput && coverPreviewImg) {
            coverUriInput.addEventListener('input', (e) => {
                const url = e.target.value.trim();
                if (url && (!coverFileInput || !coverFileInput.files[0])) {
                    coverPreviewImg.src = url;
                    if (coverPreview) coverPreview.style.display = 'block';
                } else if (!url && (!coverFileInput || !coverFileInput.files[0])) {
                    if (coverPreview) coverPreview.style.display = 'none';
                }
            });
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editPlaylistId = modal ? modal.dataset.editPlaylistId : null;
            const name = document.getElementById('playlistName').value;
            const description = document.getElementById('playlistDescription').value;
            const coverFile = document.getElementById('playlistCoverFile').files[0];
            const coverUri = document.getElementById('playlistCoverUri').value.trim() || null;
            const pendingTrackId = modal ? modal.dataset.pendingTrackId : null;

            try {
                let finalCoverUri = coverUri;
                
                // Если загружен файл, конвертируем в base64
                if (coverFile) {
                    finalCoverUri = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(coverFile);
                    });
                }
                
                let response;
                if (editPlaylistId) {
                    // Редактирование
                    response = await fetch(`/api/playlists/${editPlaylistId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, description, cover_uri: finalCoverUri })
                    });
                } else {
                    // Создание
                    response = await fetch('/api/playlists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, description, cover_uri: finalCoverUri })
                    });
                }

                const data = await response.json();
                if (data.success || data.id) {
                    if (modal) {
                        modal.classList.remove('active');
                        modal.dataset.editPlaylistId = '';
                        modal.dataset.pendingTrackId = '';
                        modal.querySelector('.modal-title').textContent = 'Создать плейлист';
                        const submitBtn = modal.querySelector('button[type="submit"]');
                        if (submitBtn) submitBtn.textContent = 'Создать';
                    }
                    form.reset();
                    if (coverPreview) coverPreview.style.display = 'none';
                    
                    // Если был отложенный трек, добавляем его
                    if (pendingTrackId && (data.id || editPlaylistId)) {
                        await addTrackToPlaylist(pendingTrackId, data.id || editPlaylistId);
                    }
                    
                    loadPlaylists();
                } else {
                    alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Ошибка сохранения плейлиста');
            }
        });
    }
}

async function loadPlaylists() {
    const playlistsContent = document.getElementById('playlistsContent');
    if (!playlistsContent) return;
    
    playlistsContent.innerHTML = '<div class="loading">Загрузка плейлистов...</div>';

    try {
        const response = await fetch('/api/playlists');
        const data = await response.json();

        if (data.error) {
            playlistsContent.innerHTML = `<div class="empty-state">Ошибка: ${data.error}</div>`;
            return;
        }

        if (data.playlists && data.playlists.length > 0) {
            let html = '';
            data.playlists.forEach(playlist => {
                const date = new Date(playlist.created_at).toLocaleDateString('ru-RU');
                const coverUri = playlist.cover_uri || '';
                html += `
                    <div class="playlist-item" data-playlist-id="${playlist.id}">
                        <div class="playlist-item-cover" style="${coverUri ? `background-image: url('${coverUri}'); background-size: cover;` : ''}">
                            ${coverUri ? '' : '📋'}
                        </div>
                        <div class="playlist-item-info">
                            <div class="playlist-item-name">${escapeHtml(playlist.name)}</div>
                            <div class="playlist-item-meta">Создан ${date}</div>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-secondary" onclick="viewPlaylist(${playlist.id}); event.stopPropagation();">Открыть</button>
                            <button class="btn-secondary" onclick="editPlaylist(${playlist.id}); event.stopPropagation();" style="background: #667eea; color: white;">✏️</button>
                            <button class="btn-secondary" onclick="deletePlaylist(${playlist.id}); event.stopPropagation();" style="background: #e74c3c; color: white;">🗑️</button>
                        </div>
                    </div>
                `;
            });
            playlistsContent.innerHTML = html;

            // Добавляем обработчики для открытия плейлистов
            document.querySelectorAll('.playlist-item').forEach(item => {
                item.addEventListener('click', () => {
                    const playlistId = parseInt(item.dataset.playlistId);
                    viewPlaylist(playlistId);
                });
            });
        } else {
            playlistsContent.innerHTML = '<div class="empty-state">У вас пока нет плейлистов</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки плейлистов:', error);
        playlistsContent.innerHTML = '<div class="empty-state">Ошибка загрузки плейлистов</div>';
    }
}

// Просмотр плейлиста
async function viewPlaylist(playlistId) {
    try {
        const response = await fetch(`/api/playlists/${playlistId}`);
        const data = await response.json();

        if (data.error) {
            alert('Ошибка: ' + data.error);
            return;
        }

        // Получаем треки плейлиста
        const trackIds = data.tracks || [];
        if (trackIds.length === 0) {
            alert('Плейлист пуст');
            return;
        }

        // Загружаем информацию о треках
        const tracksData = [];
        for (const trackId of trackIds) {
            try {
                const trackResponse = await fetch(`/api/track/${encodeURIComponent(trackId)}`);
                const trackData = await trackResponse.json();
                if (!trackData.error) {
                    // Сохраняем исходный track_id (с album_id) для корректных действий
                    trackData.track_id = trackId;
                    trackData.id = trackId;
                    tracksData.push(trackData);
                }
            } catch (e) {
                console.error(`Ошибка загрузки трека ${trackId}:`, e);
            }
        }

        if (tracksData.length === 0) {
            alert('Не удалось загрузить треки плейлиста');
            return;
        }

        currentPlaylist = tracksData;
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>${escapeHtml(data.name)}</h3>
                <button class="btn-secondary" id="backToPlaylistsBtn">← Назад к списку</button>
            </div>
        `;
        if (data.description) {
            html += `<p>${escapeHtml(data.description)}</p>`;
        }
        html += '<div class="tracks-grid">';
        tracksData.forEach((track, index) => {
            html += createTrackCard(track, true, playlistId);
        });
        html += '</div>';

        const playlistsContent = document.getElementById('playlistsContent');
        playlistsContent.innerHTML = html;
        switchPage('playlists');

        // Настраиваем обработчики
        setupTrackCardHandlers(playlistsContent);

        const backBtn = document.getElementById('backToPlaylistsBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                loadPlaylists();
            });
        }
    } catch (error) {
        console.error('Ошибка просмотра плейлиста:', error);
        alert('Ошибка загрузки плейлиста');
    }
}

// Показать меню добавления в плейлист
async function showAddToPlaylistMenu(event, trackId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    try {
        const response = await fetch('/api/playlists');
        const data = await response.json();

        if (data.error) {
            alert('Ошибка: ' + data.error);
            return;
        }

        const playlists = data.playlists || [];
        if (playlists.length === 0) {
            if (confirm('У вас нет плейлистов. Создать новый?')) {
                const modal = document.getElementById('playlistModal');
                if (modal) {
                    modal.classList.add('active');
                    modal.dataset.pendingTrackId = trackId;
                }
            }
            return;
        }

        // Создаем меню выбора плейлиста
        const menu = document.createElement('div');
        menu.className = 'playlist-menu';
        menu.style.cssText = 'position: fixed; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 2000; max-width: 300px; max-height: 400px; overflow-y: auto;';
        
        const rect = event.target.getBoundingClientRect();
        menu.style.top = Math.min(rect.bottom + 10, window.innerHeight - 400) + 'px';
        menu.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

        let html = '<h4 style="margin-bottom: 15px; color: #667eea;">Выберите плейлист:</h4>';
        playlists.forEach(playlist => {
            html += `<div style="padding: 10px; cursor: pointer; border-radius: 5px; margin-bottom: 5px; transition: background 0.2s;" 
                          onmouseover="this.style.background='#f0f0f0'" 
                          onmouseout="this.style.background='white'"
                          onclick="addTrackToPlaylist('${trackId}', ${playlist.id}); this.closest('.playlist-menu').remove();">
                      ${escapeHtml(playlist.name || 'Без названия')}
                    </div>`;
        });
        html += '<button class="btn-secondary" style="width: 100%; margin-top: 10px;" onclick="this.closest(\'.playlist-menu\').remove(); document.getElementById(\'playlistModal\').classList.add(\'active\'); document.getElementById(\'playlistModal\').dataset.pendingTrackId=\'' + trackId + '\';">+ Создать новый</button>';
        
        menu.innerHTML = html;
        document.body.appendChild(menu);

        // Закрытие при клике вне меню
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target) && e.target !== event.target && !e.target.closest('.playlist-menu')) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    } catch (error) {
        console.error('Ошибка загрузки плейлистов:', error);
        alert('Ошибка загрузки плейлистов');
    }
}

// Добавление трека в плейлист
async function addTrackToPlaylist(trackId, playlistId) {
    try {
        const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track_id: trackId })
        });
        const data = await response.json();

        if (data.success) {
            // Обновляем кнопку на "Добавлено"
            document.querySelectorAll(`.add-to-playlist-btn[data-track-id="${trackId}"]`).forEach(btn => {
                btn.textContent = '✓ Добавлено';
                btn.disabled = true;
                btn.style.opacity = '0.6';
                setTimeout(() => {
                    btn.textContent = '+ В плейлист';
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }, 2000);
            });
        } else {
            alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка добавления трека:', error);
        alert('Ошибка добавления трека в плейлист');
    }
}

// Удаление трека из плейлиста
async function removeTrackFromPlaylist(trackId, playlistId) {
    if (!confirm('Удалить трек из плейлиста?')) {
        return;
    }
    
    try {
        // Кодируем trackId для URL (может содержать двоеточие)
        const encodedTrackId = encodeURIComponent(trackId);
        const response = await fetch(`/api/playlists/${playlistId}/tracks/${encodedTrackId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            // Перезагружаем плейлист
            viewPlaylist(playlistId);
        } else {
            alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка удаления трека:', error);
        alert('Ошибка удаления трека из плейлиста');
    }
}

// Универсальная функция для настройки обработчиков
function setupTrackCardHandlers(container = document) {
    // Используем делегирование событий на уровне контейнера
    // Удаляем старый обработчик если есть
    if (container._clickHandler) {
        container.removeEventListener('click', container._clickHandler);
    }
    
    container._clickHandler = (e) => {
        // Обработчик клика на карточку альбома
        const albumCard = e.target.closest('.album-card-box');
        if (albumCard) {
            const albumId = albumCard.dataset.albumId;
            if (albumId) {
                loadAlbum(albumId);
            }
            return;
        }
        
        const artistCard = e.target.closest('.artist-card-box');
        if (artistCard) {
            const artistId = artistCard.dataset.artistId;
            if (artistId) {
                loadArtist(artistId);
            }
            return;
        }

        // Обработчик клика на карточку подкаста
        const podcastCard = e.target.closest('.podcast-card');
        if (podcastCard) {
            const podcastId = podcastCard.dataset.podcastId;
            if (podcastId) {
                const targetPage = container.id === 'podcastsContent' ? 'podcasts' : 'search';
                loadPodcast(podcastId, targetPage);
            }
            return;
        }

        // Обработчик клика на карточку трека
        const trackCard = e.target.closest('.track-card');
        if (trackCard && !e.target.closest('.track-actions') && !e.target.closest('.favorite-btn') && 
            !e.target.closest('.add-to-playlist-btn') && !e.target.closest('.remove-from-playlist-btn') &&
            !e.target.closest('.artist-link')) {
            const trackId = trackCard.dataset.trackId;
            if (trackId) {
                // Находим индекс в плейлисте
                const trackIndex = currentPlaylist.findIndex(t => t.id === trackId);
                if (trackIndex >= 0) {
                    currentTrackIndex = trackIndex;
                }
                playTrack(trackId);
            }
        }

        // Обработчик клика на кнопку избранного
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (favoriteBtn) {
            e.stopPropagation();
            e.preventDefault();
            const trackId = favoriteBtn.dataset.trackId;
            if (trackId) {
                toggleFavorite(e, trackId);
            }
            return;
        }

        // Обработчик клика на кнопку добавления в плейлист
        const addBtn = e.target.closest('.add-to-playlist-btn');
        if (addBtn) {
            e.stopPropagation();
            e.preventDefault();
            const trackId = addBtn.dataset.trackId;
            if (trackId) {
                showAddToPlaylistMenu(e, trackId);
            }
            return;
        }

        // Обработчик клика на кнопку удаления из плейлиста
        const removeBtn = e.target.closest('.remove-from-playlist-btn');
        if (removeBtn) {
            e.stopPropagation();
            e.preventDefault();
            const trackId = removeBtn.dataset.trackId;
            const playlistId = removeBtn.dataset.playlistId;
            if (trackId && playlistId) {
                removeTrackFromPlaylist(trackId, parseInt(playlistId));
            }
            return;
        }

        // Обработчик клика на ссылку исполнителя
        const artistLink = e.target.closest('.artist-link');
        if (artistLink) {
            e.stopPropagation();
            e.preventDefault();
            const artistId = artistLink.dataset.artistId;
            if (artistId) {
                switchPage('search'); // Переключаем на страницу поиска для отображения исполнителя
                loadArtist(artistId);
            }
            return;
        }
    };
    
    container.addEventListener('click', container._clickHandler);
}

// Редактирование плейлиста
async function editPlaylist(playlistId) {
    try {
        const response = await fetch(`/api/playlists/${playlistId}`);
        const data = await response.json();
        
        if (data.error) {
            alert('Ошибка: ' + data.error);
            return;
        }
        
        // Заполняем форму
        document.getElementById('playlistName').value = data.name || '';
        document.getElementById('playlistDescription').value = data.description || '';
        document.getElementById('playlistCoverUri').value = data.cover_uri || '';
        document.getElementById('playlistCoverFile').value = '';
        
        // Показываем превью если есть обложка
        const coverPreview = document.getElementById('playlistCoverPreview');
        const coverPreviewImg = document.getElementById('playlistCoverPreviewImg');
        if (data.cover_uri) {
            coverPreviewImg.src = data.cover_uri;
            coverPreview.style.display = 'block';
        } else {
            coverPreview.style.display = 'none';
        }
        
        // Показываем модальное окно
        const modal = document.getElementById('playlistModal');
        if (modal) {
            modal.classList.add('active');
            modal.dataset.editPlaylistId = playlistId;
            modal.querySelector('.modal-title').textContent = 'Редактировать плейлист';
            modal.querySelector('button[type="submit"]').textContent = 'Сохранить';
        }
    } catch (error) {
        console.error('Ошибка загрузки плейлиста:', error);
        alert('Ошибка загрузки плейлиста');
    }
}

// Удаление плейлиста
async function deletePlaylist(playlistId) {
    if (!confirm('Вы уверены, что хотите удалить этот плейлист?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/playlists/${playlistId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            loadPlaylists();
        } else {
            alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка удаления плейлиста:', error);
        alert('Ошибка удаления плейлиста');
    }
}

// ========== ENHANCED UX ANIMATIONS (SPECTRAL DESIGN) ==========

// Ripple Effect for Buttons
function addRippleEffect() {
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-primary, .control-btn, .init-btn, .btn-secondary, .favorite-btn, .add-to-playlist-btn');
        if (!button) return;
        
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size/2 + 'px';
        ripple.style.top = e.clientY - rect.top - size/2 + 'px';
        ripple.className = 'ripple';
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

// Stagger Animation for Cards
function addStaggerAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 50);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Наблюдаем за карточками треков
    const observeCards = () => {
        const cards = document.querySelectorAll('.track-card:not(.observed)');
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.classList.add('observed');
            observer.observe(card);
        });
    };
    
    // Наблюдаем при загрузке и при изменениях DOM
    observeCards();
    const mutationObserver = new MutationObserver(observeCards);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// Magnetic Effect for Interactive Elements
function addMagneticEffect() {
    const magneticElements = document.querySelectorAll('.track-card, .nav-item, .control-btn');
    
    magneticElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const moveX = x * 0.1;
            const moveY = y * 0.1;
            
            element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
        });
    });
}

// Smooth Page Transitions
function enhancePageTransitions() {
    const originalSwitchPage = window.switchPage;
    window.switchPage = function(page) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => {
            if (p.classList.contains('active')) {
                p.style.opacity = '0';
                p.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    p.classList.remove('active');
                }, 200);
            }
        });
        
        setTimeout(() => {
            originalSwitchPage.call(this, page);
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                activePage.style.opacity = '0';
                activePage.style.transform = 'scale(0.95)';
                requestAnimationFrame(() => {
                    activePage.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    activePage.style.opacity = '1';
                    activePage.style.transform = 'scale(1)';
                });
            }
        }, 200);
    };
}

// Enhanced Track Card Interactions
function enhanceTrackCards() {
    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.track-card');
        if (!card) return;
        
        // Подсветка соседних карточек
        const allCards = document.querySelectorAll('.track-card');
        const index = Array.from(allCards).indexOf(card);
        
        allCards.forEach((c, i) => {
            if (Math.abs(i - index) === 1) {
                c.style.opacity = '0.7';
                c.style.transform = 'scale(0.98)';
            }
        });
    });
    
    document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.track-card');
        if (!card) return;
        
        const allCards = document.querySelectorAll('.track-card');
        allCards.forEach(c => {
            if (c !== card) {
                c.style.opacity = '';
                c.style.transform = '';
            }
        });
    });
}

// Player Visualization (Simple Audio Bars)
function addPlayerVisualization() {
    if (!audioPlayer) return;
    
    audioPlayer.addEventListener('play', () => {
        const coverPlaceholder = trackCover?.querySelector('.cover-placeholder');
        if (coverPlaceholder) {
            coverPlaceholder.style.animation = 'pulse 2s ease infinite';
        }
    });
    
    audioPlayer.addEventListener('pause', () => {
        const coverPlaceholder = trackCover?.querySelector('.cover-placeholder');
        if (coverPlaceholder) {
            coverPlaceholder.style.animation = 'none';
        }
    });
}

// Smooth Scroll to Top Button
function addScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '↑';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 160px;
        right: 32px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--gradient-accent);
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: var(--shadow-glow);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 100;
    `;
    document.body.appendChild(scrollBtn);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.visibility = 'visible';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.visibility = 'hidden';
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 160px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--color-surface-elevated);
        color: var(--color-text-primary);
        padding: 16px 24px;
        border-radius: var(--radius-md);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: var(--shadow-hard);
        backdrop-filter: blur(20px);
        z-index: 2000;
        font-weight: 600;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    
    if (type === 'success') {
        toast.style.borderColor = 'var(--color-success)';
    } else if (type === 'error') {
        toast.style.borderColor = 'var(--color-danger)';
    }
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Initialize Enhanced UX
function initEnhancedUX() {
    addRippleEffect();
    addStaggerAnimation();
    addPlayerVisualization();
    addScrollToTop();
    
    // Замените alert на toast notifications
    const originalAlert = window.alert;
    window.customAlert = function(message) {
        showToast(message, 'info');
    };
}

// Вызываем инициализацию после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initEnhancedUX, 500);
    });
} else {
    setTimeout(initEnhancedUX, 500);
}
