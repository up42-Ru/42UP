// Модуль авторизации через Twitch

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuth();
        this.renderAuthButton();
    }

    checkAuth() {
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            if (accessToken) {
                this.handleTwitchAuth(accessToken);
                window.location.hash = '';
            }
        }

        // Проверяем сохраненную сессию
        const savedUser = localStorage.getItem('42up_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            this.updateUIForAuth();
        }
    }

    async handleTwitchAuth(accessToken) {
        try {
            showToast('Авторизация через Twitch...', 'info');
            
            const response = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': CONFIG.TWITCH.CLIENT_ID
                }
            });

            const data = await response.json();
            
            if (data.data && data.data[0]) {
                const twitchUser = data.data[0];
                
                // Получаем email
                const emailResponse = await fetch('https://api.twitch.tv/helix/users?scope=user:read:email', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Client-Id': CONFIG.TWITCH.CLIENT_ID
                    }
                });
                
                const user = {
                    id: twitchUser.id,
                    login: twitchUser.login,
                    display_name: twitchUser.display_name,
                    profile_image_url: twitchUser.profile_image_url,
                    email: twitchUser.email || '',
                    roles: [],
                    registered_at: new Date().toISOString(),
                    access_token: accessToken
                };

                // Сохраняем в БД
                await DB.saveUser(user);
                
                currentUser = user;
                localStorage.setItem('42up_user', JSON.stringify(user));
                
                this.updateUIForAuth();
                showToast('Успешная авторизация!', 'success');
                
                // Перезагружаем текущую страницу
                if (typeof loadPage === 'function') {
                    loadPage(AppState.currentPage);
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            showToast('Ошибка авторизации', 'error');
        }
    }

    login() {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CONFIG.TWITCH.CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.TWITCH.REDIRECT_URI)}&response_type=token&scope=${CONFIG.TWITCH.SCOPE}`;
        window.location.href = authUrl;
    }

    logout() {
        currentUser = null;
        localStorage.removeItem('42up_user');
        this.updateUIForAuth();
        showToast('Вы вышли из аккаунта', 'info');
        
        if (typeof loadPage === 'function') {
            loadPage(AppState.currentPage);
        }
    }

    renderAuthButton() {
        const container = document.getElementById('authContainer');
        if (!container) return;

        if (currentUser) {
            container.innerHTML = `
                <div class="user-profile-btn" onclick="window.location.href='#/profile'">
                    <img src="${currentUser.profile_image_url}" alt="${currentUser.display_name}" class="user-avatar">
                    <span class="user-name">${currentUser.display_name}</span>
                </div>
                <button class="btn btn-secondary" onclick="authManager.logout()">
                    <i data-lucide="log-out"></i> Выйти
                </button>
            `;
        } else {
            container.innerHTML = `
                <div class="auth-buttons">
                    <button class="btn btn-primary" onclick="authManager.login()">
                        <i class="fab fa-twitch"></i> Войти через Twitch
                    </button>
                </div>
            `;
        }
        
        lucide.createIcons();
    }

    updateUIForAuth() {
        this.renderAuthButton();
        
        // Обновляем видимость элементов
        const createPostCard = document.querySelector('.create-post-card');
        if (createPostCard) {
            createPostCard.style.display = currentUser ? 'block' : 'none';
        }
    }
}

// Глобальные функции
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

const authManager = new AuthManager();