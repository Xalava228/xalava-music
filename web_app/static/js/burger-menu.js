// ============================================
// BURGER MENU FUNCTIONALITY
// ============================================

let burgerMenuBtn = null;
let sidebar = null;
let sidebarOverlay = null;
let sidebarCloseBtn = null;
let navItems = null;

// Initialize burger menu
function initBurgerMenu() {
    burgerMenuBtn = document.getElementById('burgerMenuBtn');
    sidebar = document.getElementById('sidebar');
    sidebarOverlay = document.getElementById('sidebarOverlay');
    sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    navItems = document.querySelectorAll('.nav-item');
    
    if (!burgerMenuBtn || !sidebar || !sidebarOverlay) {
        console.warn('Burger menu elements not found');
        return;
    }
    
    if (!sidebarCloseBtn) {
        console.warn('Sidebar close button not found!');
    }
    
    // Open menu
    burgerMenuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openSidebar();
    });
    
    // Close menu - проверяем что элемент существует
    if (sidebarCloseBtn) {
        // Прямой обработчик на кнопку
        sidebarCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            closeSidebar();
        }, true); // Используем capture phase
        
        // Также добавляем обработчик через делегирование событий
        sidebar.addEventListener('click', function(e) {
            if (e.target === sidebarCloseBtn || e.target.closest('.sidebar-close-btn')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked (delegated)');
                closeSidebar();
            }
        });
        
        // Touch события для мобильных
        sidebarCloseBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button touched');
            closeSidebar();
        });
    } else {
        console.error('sidebarCloseBtn is null!');
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
    }
    
    // Close menu when nav item clicked
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Only close on mobile/tablet
            if (window.innerWidth < 992) {
                closeSidebar();
            }
        });
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
    
    // Close menu when resizing to desktop
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth >= 992 && sidebar && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        }, 250);
    });
    
    // Синхронизация поиска между мобильной и десктопной версиями
    syncSearchInputs();
    
    // Синхронизация кнопок авторизации
    syncAuthButtons();
}

function openSidebar() {
    if (!sidebar || !sidebarOverlay || !burgerMenuBtn) return;
    
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    burgerMenuBtn.classList.add('active');
    document.body.classList.add('menu-open');
    
    // Set focus to close button for accessibility
    setTimeout(function() {
        if (sidebarCloseBtn) {
            sidebarCloseBtn.focus();
        }
    }, 300);
}

function closeSidebar() {
    console.log('closeSidebar called');
    console.log('sidebar:', sidebar);
    console.log('sidebarOverlay:', sidebarOverlay);
    console.log('burgerMenuBtn:', burgerMenuBtn);
    
    if (!sidebar || !sidebarOverlay || !burgerMenuBtn) {
        console.warn('Cannot close sidebar: elements not found');
        return;
    }
    
    try {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        burgerMenuBtn.classList.remove('active');
        document.body.classList.remove('menu-open');
        
        console.log('Sidebar closed successfully');
        
        // Return focus to burger button
        if (burgerMenuBtn) {
            setTimeout(function() {
                burgerMenuBtn.focus();
            }, 100);
        }
    } catch (error) {
        console.error('Error closing sidebar:', error);
    }
}

// Синхронизация поиска между мобильной и десктопной версиями
function syncSearchInputs() {
    const searchInputDesktop = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const searchBtnDesktop = document.getElementById('searchBtn');
    const searchBtnMobile = document.getElementById('searchBtnMobile');
    
    if (searchInputDesktop && searchInputMobile) {
        // Синхронизация ввода
        searchInputDesktop.addEventListener('input', function() {
            if (searchInputMobile) {
                searchInputMobile.value = this.value;
            }
        });
        
        searchInputMobile.addEventListener('input', function() {
            if (searchInputDesktop) {
                searchInputDesktop.value = this.value;
            }
        });
        
        // Синхронизация Enter
        searchInputMobile.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchBtnMobile) {
                    searchBtnMobile.click();
                }
            }
        });
    }
    
    // Синхронизация кнопок поиска
    if (searchBtnMobile && searchBtnDesktop) {
        searchBtnMobile.addEventListener('click', function() {
            if (searchBtnDesktop) {
                searchBtnDesktop.click();
            }
            // Закрываем меню после поиска на мобильных
            if (window.innerWidth < 992) {
                setTimeout(closeSidebar, 300);
            }
        });
    }
}

// Синхронизация кнопок авторизации
function syncAuthButtons() {
    const authOpenBtnDesktop = document.getElementById('authOpenBtn');
    const authOpenBtnMobile = document.getElementById('authOpenBtnMobile');
    const profileBtnDesktop = document.getElementById('profileBtn');
    const profileBtnMobile = document.getElementById('profileBtnMobile');
    const authLogoutBtnDesktop = document.getElementById('authLogoutBtn');
    const authLogoutBtnMobile = document.getElementById('authLogoutBtnMobile');
    const authStatusDesktop = document.getElementById('authStatus');
    const authStatusMobile = document.getElementById('authStatusMobile');
    
    // Синхронизация кнопки "Войти"
    if (authOpenBtnMobile && authOpenBtnDesktop) {
        authOpenBtnMobile.addEventListener('click', function() {
            if (authOpenBtnDesktop) {
                authOpenBtnDesktop.click();
            }
            // Закрываем меню после открытия модального окна
            if (window.innerWidth < 992) {
                setTimeout(closeSidebar, 300);
            }
        });
    }
    
    // Синхронизация кнопки "Личный кабинет"
    if (profileBtnMobile && profileBtnDesktop) {
        profileBtnMobile.addEventListener('click', function() {
            if (profileBtnDesktop) {
                profileBtnDesktop.click();
            }
            if (window.innerWidth < 992) {
                setTimeout(closeSidebar, 300);
            }
        });
    }
    
    // Синхронизация кнопки "Выйти"
    if (authLogoutBtnMobile && authLogoutBtnDesktop) {
        authLogoutBtnMobile.addEventListener('click', function() {
            if (authLogoutBtnDesktop) {
                authLogoutBtnDesktop.click();
            }
            if (window.innerWidth < 992) {
                setTimeout(closeSidebar, 300);
            }
        });
    }
    
    // Синхронизация статуса авторизации через MutationObserver
    function updateAuthStatus() {
        if (authStatusDesktop && authStatusMobile) {
            authStatusMobile.textContent = authStatusDesktop.textContent;
        }
        
        // Синхронизация видимости кнопок
        if (profileBtnDesktop && profileBtnMobile) {
            profileBtnMobile.style.display = profileBtnDesktop.style.display;
        }
        
        if (authLogoutBtnDesktop && authLogoutBtnMobile) {
            authLogoutBtnMobile.style.display = authLogoutBtnDesktop.style.display;
        }
        
        if (authOpenBtnDesktop && authOpenBtnMobile) {
            if (authOpenBtnDesktop.style.display === 'none') {
                authOpenBtnMobile.style.display = 'none';
            } else {
                authOpenBtnMobile.style.display = 'block';
            }
        }
    }
    
    // Используем MutationObserver для отслеживания изменений
    if (authStatusDesktop) {
        const observer = new MutationObserver(function(mutations) {
            updateAuthStatus();
        });
        
        observer.observe(authStatusDesktop, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // Также отслеживаем изменения display у кнопок
    if (profileBtnDesktop) {
        const profileObserver = new MutationObserver(function() {
            updateAuthStatus();
        });
        profileObserver.observe(profileBtnDesktop, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
    if (authLogoutBtnDesktop) {
        const logoutObserver = new MutationObserver(function() {
            updateAuthStatus();
        });
        logoutObserver.observe(authLogoutBtnDesktop, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
    // Первоначальное обновление
    updateAuthStatus();
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBurgerMenu);
} else {
    initBurgerMenu();
}
