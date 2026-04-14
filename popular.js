// Страница популярного

async function loadPopularPage(container) {
    container.innerHTML = `
        <div class="popular-page">
            <div class="page-header">
                <h1 class="page-title">
                    <i data-lucide="flame" style="color: #FF4500;"></i>
                    Популярное
                </h1>
                <p class="text-muted">Посты с наибольшим рейтингом</p>
            </div>
            
            <div class="filter-tabs">
                <div class="filter-tab active" onclick="setPopularFilter('today')">
                    Сегодня
                </div>
                <div class="filter-tab" onclick="setPopularFilter('week')">
                    Неделя
                </div>
                <div class="filter-tab" onclick="setPopularFilter('month')">
                    Месяц
                </div>
                <div class="filter-tab" onclick="setPopularFilter('all')">
                    Всё время
                </div>
            </div>
            
            <div id="popularPostsContainer"></div>
        </div>
    `;
    
    await loadPopularPosts();
    lucide.createIcons();
}

async function loadPopularPosts() {
    const container = document.getElementById('popularPostsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    // Получаем все посты
    const posts = await DB.getPosts();
    
    // Получаем лайки для каждого поста
    const postsWithRating = [];
    
    for (const post of posts) {
        const likes = await DB.getPostLikes(post.id);
        const rating = likes.likes - likes.dislikes;
        
        postsWithRating.push({
            ...post,
            rating,
            likes: likes.likes,
            dislikes: likes.dislikes
        });
    }
    
    // Сортируем по рейтингу
    postsWithRating.sort((a, b) => b.rating - a.rating);
    
    if (postsWithRating.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
                <p>Нет постов</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    for (const post of postsWithRating) {
        const author = await DB.getUser(post.author_id);
        const postEl = createPopularPostElement(post, author);
        container.appendChild(postEl);
    }
    
    lucide.createIcons();
}

function createPopularPostElement(post, author) {
    const div = document.createElement('div');
    div.className = 'post-card popular-post';
    div.dataset.postId = post.id;
    
    const rating = post.rating || 0;
    const ratingClass = rating > 0 ? 'rating-positive' : rating < 0 ? 'rating-negative' : '';
    
    div.innerHTML = `
        <div class="popular-post-rating ${ratingClass}">
            <i data-lucide="trending-up"></i>
            <span>${rating > 0 ? '+' : ''}${rating}</span>
        </div>
        
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
            <div class="post-stats">
                <span class="stat-item">
                    <i data-lucide="thumbs-up" style="width: 16px; height: 16px;"></i>
                    ${post.likes || 0}
                </span>
                <span class="stat-item">
                    <i data-lucide="thumbs-down" style="width: 16px; height: 16px;"></i>
                    ${post.dislikes || 0}
                </span>
            </div>
            <button class="action-btn" onclick="window.location.href='#/?post=${post.id}'">
                <i data-lucide="message-circle"></i>
                Перейти к посту
            </button>
        </div>
    `;
    
    return div;
}

function setPopularFilter(filter) {
    // В реальном приложении здесь будет фильтрация по дате
    loadPopularPosts();
}

// Добавляем стили для популярного
const popularStyles = `
.popular-page {
    max-width: 800px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 24px;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.popular-post {
    position: relative;
}

.popular-post-rating {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: var(--bg-tertiary);
    border-radius: 20px;
    font-weight: 600;
    font-size: 16px;
}

.rating-positive {
    color: var(--accent-green);
}

.rating-negative {
    color: var(--accent-red);
}

.post-stats {
    display: flex;
    gap: 16px;
    margin-right: auto;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 14px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted);
}

.empty-state i {
    margin-bottom: 16px;
    opacity: 0.5;
}
`;

// Добавляем стили
const styleSheet = document.createElement('style');
styleSheet.textContent = popularStyles;
document.head.appendChild(styleSheet);