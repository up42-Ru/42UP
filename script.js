// Основной скрипт приложения

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    initNavigation();
    initRouting();
    loadPage('feed');
}

function initNavigation() {
    // Обработчики для навигации
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                window.location.hash = page === 'feed' ? '/' : `/${page}`;
            }
        });
    });

    // Обновляем активный пункт меню
    updateActiveNav();
}

function initRouting() {
    window.addEventListener('hashchange', () => {
        const page = getCurrentPageFromHash();
        loadPage(page);
        updateActiveNav();
    });
}

function getCurrentPageFromHash() {
    const hash = window.location.hash.slice(1) || '/';
    const routes = {
        '/': 'feed',
        '/popular': 'popular',
        '/videos': 'videos',
        '/profile': 'profile',
        '/mod': 'mod',
        '/dashboard': 'mod'
    };
    return routes[hash] || 'feed';
}

function updateActiveNav() {
    const currentPage = getCurrentPageFromHash();
    
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        const page = item.dataset.page;
        if (page === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

async function loadPage(page) {
    AppState.currentPage = page;
    const container = document.getElementById('pageContainer');
    
    switch (page) {
        case 'feed':
            await loadFeedPage(container);
            break;
        case 'popular':
            await loadPopularPage(container);
            break;
        case 'videos':
            await loadVideosPage(container);
            break;
        case 'profile':
            await loadProfilePage(container);
            break;
        case 'mod':
            await loadModPage(container);
            break;
        default:
            container.innerHTML = '<div class="loading">Страница не найдена</div>';
    }
    
    lucide.createIcons();
}

async function loadFeedPage(container) {
    container.innerHTML = `
        <div class="feed-page">
            ${currentUser ? `
                <div class="create-post-card">
                    <textarea 
                        class="create-post-input" 
                        id="postContent" 
                        placeholder="Что нового?"
                        maxlength="150"
                        rows="2"
                    ></textarea>
                    <div class="create-post-actions">
                        <div>
                            <input type="text" id="postImage" placeholder="Ссылка на картинку (imgur, ibb.co...)" class="form-input" style="width: 300px;">
                            <label style="margin-left: 12px;">
                                <input type="checkbox" id="forStream"> Для стрима
                            </label>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span class="char-counter" id="charCounter">0/150</span>
                            <button class="btn btn-primary" onclick="createPost()">
                                <i data-lucide="send"></i> Отправить
                            </button>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="create-post-card" style="text-align: center; color: var(--text-muted);">
                    <i data-lucide="log-in" style="width: 40px; height: 40px; margin-bottom: 12px;"></i>
                    <p>Войдите через Twitch, чтобы создавать посты</p>
                </div>
            `}
            
            <div class="filter-tabs">
                <div class="filter-tab ${AppState.feedFilter === 'all' ? 'active' : ''}" onclick="setFeedFilter('all')">
                    Все посты
                </div>
                <div class="filter-tab ${AppState.feedFilter === 'stream' ? 'active' : ''}" onclick="setFeedFilter('stream')">
                    <i data-lucide="video"></i> Для стрима
                </div>
            </div>
            
            <div id="postsContainer"></div>
        </div>
    `;
    
    // Счетчик символов
    const textarea = document.getElementById('postContent');
    const counter = document.getElementById('charCounter');
    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            counter.textContent = `${length}/150`;
            counter.classList.toggle('limit', length >= 150);
        });
    }
    
    await loadPosts();
    lucide.createIcons();
}

async function loadPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    const posts = await DB.getPosts({
        forStream: AppState.feedFilter === 'stream'
    });
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="loading">Нет постов</div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const post of posts) {
        const author = await DB.getUser(post.author_id);
        const likes = await DB.getPostLikes(post.id);
        
        const postEl = createPostElement(post, author, likes);
        container.appendChild(postEl);
    }
    
    lucide.createIcons();
}

function createPostElement(post, author, likes) {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.dataset.postId = post.id;
    
    const userVote = likes.userVote;
    
    div.innerHTML = `
        <div class="post-header">
            <img src="${author?.profile_image_url || 'https://via.placeholder.com/40'}" alt="" class="post-avatar">
            <div class="post-info">
                <div class="post-author">
                    <a href="#/profile?user=${author?.login}" class="author-name">${author?.display_name || 'Пользователь'}</a>
                    ${renderRoleBadges(author?.roles || [])}
                </div>
                <div class="post-time">${formatDate(post.created_at)}</div>
                ${post.for_stream ? '<span class="stream-tag"><i data-lucide="video"></i> Для стрима</span>' : ''}
            </div>
        </div>
        
        <div class="post-content">${escapeHtml(post.content)}</div>
        
        ${post.image_url ? `
            <img src="${post.image_url}" alt="" class="post-image" onclick="openLightbox('${post.image_url}')">
        ` : ''}
        
        <div class="post-actions">
            <button class="action-btn ${userVote === 'like' ? 'liked' : ''}" onclick="handleLike('${post.id}', 'like')">
                <i data-lucide="thumbs-up"></i>
                <span>${likes.likes || 0}</span>
            </button>
            <button class="action-btn ${userVote === 'dislike' ? 'disliked' : ''}" onclick="handleLike('${post.id}', 'dislike')">
                <i data-lucide="thumbs-down"></i>
                <span>${likes.dislikes || 0}</span>
            </button>
            <button class="action-btn report" onclick="reportPost('${post.id}')">
                <i data-lucide="flag"></i>
            </button>
        </div>
    `;
    
    return div;
}

function renderRoleBadges(roles) {
    if (!roles || roles.length === 0) return '';
    
    return roles.map(role => {
        const roleInfo = ROLE_ICONS[role];
        if (!roleInfo) return '';
        return `<span class="role-badge" style="color: ${roleInfo.color}" title="${roleInfo.name}">
            <i data-lucide="${roleInfo.icon}" style="width: 14px; height: 14px;"></i>
        </span>`;
    }).join('');
}

async function handleLike(postId, type) {
    if (!currentUser) {
        showToast('Войдите, чтобы оценивать посты', 'info');
        return;
    }
    
    await DB.toggleLike(postId, currentUser.id, type);
    await loadPosts();
}

async function createPost() {
    if (!currentUser) {
        showToast('Войдите, чтобы создавать посты', 'error');
        return;
    }
    
    const content = document.getElementById('postContent')?.value.trim();
    const imageUrl = document.getElementById('postImage')?.value.trim();
    const forStream = document.getElementById('forStream')?.checked;
    
    if (!content) {
        showToast('Введите текст поста', 'error');
        return;
    }
    
    if (content.length > 150) {
        showToast('Максимальная длина поста - 150 символов', 'error');
        return;
    }
    
    // Проверка домена изображения
    if (imageUrl && !isValidImageDomain(imageUrl)) {
        showToast('Недопустимый домен для изображения', 'error');
        return;
    }
    
    const post = {
        author_id: currentUser.id,
        content: content,
        image_url: imageUrl || null,
        for_stream: forStream || false
    };
    
    await DB.savePost(post);
    showToast('Пост опубликован!', 'success');
    
    // Очищаем форму
    document.getElementById('postContent').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('forStream').checked = false;
    document.getElementById('charCounter').textContent = '0/150';
    
    await loadPosts();
}

function isValidImageDomain(url) {
    try {
        const urlObj = new URL(url);
        return CONFIG.ALLOWED_IMAGE_DOMAINS.some(domain => urlObj.hostname.includes(domain));
    } catch {
        return false;
    }
}

function setFeedFilter(filter) {
    AppState.feedFilter = filter;
    loadPage('feed');
}

function openLightbox(imageUrl) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <button class="lightbox-close" onclick="this.parentElement.remove()">&times;</button>
        <img src="${imageUrl}" alt="" class="lightbox-image">
    `;
    document.body.appendChild(lightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.remove();
        }
    });
}

async function reportPost(postId) {
    if (!currentUser) {
        showToast('Войдите, чтобы отправлять жалобы', 'info');
        return;
    }
    
    showReportModal(postId);
}

function showReportModal(postId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Жалоба на пост</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Причина жалобы</label>
                    <select class="form-select" id="reportReason">
                        <option value="spam">Спам</option>
                        <option value="inappropriate">Неприемлемый контент</option>
                        <option value="harassment">Оскорбления/Домогательства</option>
                        <option value="other">Другое</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Комментарий</label>
                    <textarea class="form-textarea" id="reportComment" rows="3" placeholder="Опишите проблему..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Отмена</button>
                <button class="btn btn-primary" onclick="submitReport('${postId}')">Отправить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitReport(postId) {
    const reason = document.getElementById('reportReason')?.value;
    const comment = document.getElementById('reportComment')?.value;
    
    const report = {
        post_id: postId,
        reporter_id: currentUser.id,
        reason: reason,
        comment: comment
    };
    
    await DB.saveReport(report);
    showToast('Жалоба отправлена', 'success');
    
    document.querySelector('.modal-overlay')?.remove();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Заглушки для других страниц
async function loadPopularPage(container) {
    container.innerHTML = '<div class="loading">Страница популярного в разработке</div>';
}

async function loadVideosPage(container) {
    container.innerHTML = '<div class="loading">Страница видео в разработке</div>';
}

async function loadProfilePage(container) {
    container.innerHTML = '<div class="loading">Страница профиля в разработке</div>';
}

async function loadModPage(container) {
    container.innerHTML = '<div class="loading">Админ-панель в разработке</div>';
}