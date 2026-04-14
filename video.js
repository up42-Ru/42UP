// Страница видео

async function loadVideosPage(container) {
    container.innerHTML = `
        <div class="videos-page">
            <div class="page-header">
                <h1 class="page-title">
                    <i data-lucide="video" style="color: var(--accent-purple);"></i>
                    Видео
                </h1>
                <p class="text-muted">Лучшие моменты со стримов</p>
            </div>
            
            ${currentUser ? `
                <div class="add-video-card">
                    <button class="btn btn-primary" onclick="showAddVideoModal()">
                        <i data-lucide="plus"></i>
                        Добавить видео
                    </button>
                </div>
            ` : ''}
            
            <div class="video-categories">
                <div class="video-category ${AppState.videoCategory === 'hype' ? 'active' : ''}" 
                     onclick="setVideoCategory('hype')">
                    <i data-lucide="flame"></i> Хайп
                </div>
                <div class="video-category ${AppState.videoCategory === 'funny' ? 'active' : ''}" 
                     onclick="setVideoCategory('funny')">
                    <i data-lucide="laugh"></i> Смешные
                </div>
                <div class="video-category ${AppState.videoCategory === 'interesting' ? 'active' : ''}" 
                     onclick="setVideoCategory('interesting')">
                    <i data-lucide="lightbulb"></i> Интересные
                </div>
                <div class="video-category ${AppState.videoCategory === 'other' ? 'active' : ''}" 
                     onclick="setVideoCategory('other')">
                    <i data-lucide="folder"></i> Разное
                </div>
            </div>
            
            <div id="videosContainer"></div>
        </div>
    `;
    
    await loadVideos();
    lucide.createIcons();
}

async function loadVideos() {
    const container = document.getElementById('videosContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const videos = await DB.getVideos(AppState.videoCategory);
    
    // Сортируем по лайкам
    videos.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    if (videos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="video-off" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
                <p>Нет видео в этой категории</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    for (const video of videos) {
        const author = await DB.getUser(video.author_id);
        const videoEl = createVideoElement(video, author);
        container.appendChild(videoEl);
    }
    
    lucide.createIcons();
}

function createVideoElement(video, author) {
    const div = document.createElement('div');
    div.className = 'video-card';
    div.dataset.videoId = video.id;
    
    const videoId = extractVideoId(video.url);
    const isYouTube = video.url.includes('youtube.com') || video.url.includes('youtu.be');
    const isVK = video.url.includes('vk.com') || video.url.includes('vkvideo.ru');
    
    let embedUrl = '';
    if (isYouTube) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (isVK) {
        embedUrl = `https://vk.com/video_ext.php?oid=${videoId}`;
    }
    
    div.innerHTML = `
        <div class="video-header">
            <img src="${author?.profile_image_url || 'https://via.placeholder.com/40'}" alt="" class="post-avatar">
            <div class="post-info">
                <div class="post-author">
                    <a href="#/profile?user=${author?.login}" class="author-name">${author?.display_name || 'Пользователь'}</a>
                    ${renderRoleBadges(author?.roles || [])}
                </div>
                <div class="post-time">${formatDate(video.created_at)}</div>
            </div>
        </div>
        
        <h3 class="video-title">${escapeHtml(video.title)}</h3>
        
        <div class="video-thumbnail">
            ${embedUrl ? `
                <iframe 
                    src="${embedUrl}" 
                    frameborder="0" 
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
            ` : ''}
        </div>
        
        <div class="video-meta">
            <span class="video-duration">
                <i data-lucide="clock"></i>
                ${escapeHtml(video.duration || '--:--')}
            </span>
            <span class="video-source">
                <i data-lucide="${isYouTube ? 'youtube' : 'video'}"></i>
                ${isYouTube ? 'YouTube' : isVK ? 'VK Video' : 'Другое'}
            </span>
        </div>
        
        <div class="video-actions">
            <button class="action-btn" onclick="handleVideoLike('${video.id}')">
                <i data-lucide="thumbs-up"></i>
                <span>${video.likes || 0}</span>
            </button>
            
            ${isMobile() ? `
                <a href="${video.url}" target="_blank" class="open-video-btn">
                    <i data-lucide="external-link"></i>
                    Открыть в ${isYouTube ? 'YouTube' : 'VK'}
                </a>
            ` : ''}
            
            ${currentUser && (currentUser.roles?.includes('admin') || currentUser.roles?.includes('moderator')) ? `
                <button class="action-btn" onclick="showVideoCategoryModal('${video.id}', '${video.category}')">
                    <i data-lucide="folder-edit"></i>
                    Категория
                </button>
            ` : ''}
        </div>
    `;
    
    return div;
}

function extractVideoId(url) {
    // YouTube
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) return match[1];
    
    // VK
    match = url.match(/vk\.com\/video(-?\d+_\d+)/);
    if (match) return match[1];
    
    match = url.match(/vkvideo\.ru\/video(-?\d+_\d+)/);
    if (match) return match[1];
    
    return '';
}

function setVideoCategory(category) {
    AppState.videoCategory = category;
    loadPage('videos');
}

function showAddVideoModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Добавить видео</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Ссылка на видео (YouTube или VK Video)</label>
                    <input type="text" class="form-input" id="videoUrl" placeholder="https://youtube.com/watch?v=...">
                </div>
                <div class="form-group">
                    <label class="form-label">Название</label>
                    <input type="text" class="form-input" id="videoTitle" placeholder="Введите название">
                </div>
                <div class="form-group">
                    <label class="form-label">Длительность</label>
                    <input type="text" class="form-input" id="videoDuration" placeholder="Например: 10:30">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Отмена</button>
                <button class="btn btn-primary" onclick="addVideo()">Добавить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function addVideo() {
    const url = document.getElementById('videoUrl')?.value.trim();
    const title = document.getElementById('videoTitle')?.value.trim();
    const duration = document.getElementById('videoDuration')?.value.trim();
    
    if (!url || !title) {
        showToast('Заполните все поля', 'error');
        return;
    }
    
    // Проверяем, что это YouTube или VK
    if (!url.includes('youtube.com') && !url.includes('youtu.be') && 
        !url.includes('vk.com') && !url.includes('vkvideo.ru')) {
        showToast('Поддерживаются только YouTube и VK Video', 'error');
        return;
    }
    
    const video = {
        author_id: currentUser.id,
        url: url,
        title: title,
        duration: duration,
        likes: 0,
        category: 'other'
    };
    
    await DB.saveVideo(video);
    showToast('Видео добавлено!', 'success');
    
    document.querySelector('.modal-overlay')?.remove();
    await loadVideos();
}

async function handleVideoLike(videoId) {
    if (!currentUser) {
        showToast('Войдите, чтобы оценивать видео', 'info');
        return;
    }
    
    // В реальном приложении здесь будет API запрос
    showToast('Лайк учтен!', 'success');
}

function showVideoCategoryModal(videoId, currentCategory) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Изменить категорию</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Категория</label>
                    <select class="form-select" id="videoCategorySelect">
                        <option value="hype" ${currentCategory === 'hype' ? 'selected' : ''}>Хайп</option>
                        <option value="funny" ${currentCategory === 'funny' ? 'selected' : ''}>Смешные</option>
                        <option value="interesting" ${currentCategory === 'interesting' ? 'selected' : ''}>Интересные</option>
                        <option value="other" ${currentCategory === 'other' ? 'selected' : ''}>Разное</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Отмена</button>
                <button class="btn btn-primary" onclick="updateVideoCategory('${videoId}')">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function updateVideoCategory(videoId) {
    const category = document.getElementById('videoCategorySelect')?.value;
    
    await DB.updateVideoCategory(videoId, category);
    showToast('Категория обновлена', 'success');
    
    document.querySelector('.modal-overlay')?.remove();
    await loadVideos();
}

function isMobile() {
    return window.innerWidth <= 768;
}

// Стили для видео
const videoStyles = `
.videos-page {
    max-width: 800px;
    margin: 0 auto;
}

.add-video-card {
    background: var(--bg-secondary);
    border-radius: var(--border-radius-lg);
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
    text-align: center;
}

.video-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.video-source {
    display: flex;
    align-items: center;
    gap: 4px;
}
`;

const videoStyleSheet = document.createElement('style');
videoStyleSheet.textContent = videoStyles;
document.head.appendChild(videoStyleSheet);