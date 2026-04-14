// Страница профиля

async function loadProfilePage(container) {
    // Получаем username из URL
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const username = params.get('user');
    
    let profileUser = null;
    
    if (username) {
        profileUser = await DB.getUser(username);
    } else if (currentUser) {
        profileUser = currentUser;
    }
    
    if (!profileUser) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="user-x" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
                <p>Пользователь не найден</p>
                <button class="btn btn-primary" onclick="window.location.href='#/'">На главную</button>
            </div>
        `;
        return;
    }
    
    const isOwnProfile = currentUser && currentUser.id === profileUser.id;
    const registeredDate = new Date(profileUser.registered_at);
    const monthYear = registeredDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    
    container.innerHTML = `
        <div class="profile-page">
            <div class="profile-header">
                <div class="profile-info">
                    <img src="${profileUser.profile_image_url}" alt="" class="profile-avatar">
                    <div class="profile-details">
                        <h1>
                            ${profileUser.display_name}
                            ${renderRoleBadges(profileUser.roles || [])}
                        </h1>
                        <div class="profile-meta">
                            <div>@${profileUser.login}</div>
                            <div>На сайте с ${monthYear}</div>
                        </div>
                        <a href="https://twitch.tv/${profileUser.login}" target="_blank" class="profile-link">
                            <i class="fab fa-twitch"></i>
                            twitch.tv/${profileUser.login}
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="profile-tabs">
                <div class="profile-tab active" onclick="switchProfileTab('posts')">
                    <i data-lucide="message-square"></i>
                    Посты
                </div>
                <div class="profile-tab" onclick="switchProfileTab('videos')">
                    <i data-lucide="video"></i>
                    Видео
                </div>
            </div>
            
            <div id="profileContent"></div>
        </div>
    `;
    
    await loadProfilePosts(profileUser.id);
    lucide.createIcons();
}

async function loadProfilePosts(userId) {
    const container = document.getElementById('profileContent');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const posts = await DB.getPosts({ userId });
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--text-muted);"></i>
                <p>Нет постов</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="profile-posts"></div>';
    const postsContainer = container.querySelector('.profile-posts');
    
    for (const post of posts) {
        const author = await DB.getUser(post.author_id);
        const likes = await DB.getPostLikes(post.id);
        const postEl = createPostElement(post, author, likes);
        postsContainer.appendChild(postEl);
    }
    
    lucide.createIcons();
}

async function loadProfileVideos(userId) {
    const container = document.getElementById('profileContent');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const videos = await DB.getVideos();
    const userVideos = videos.filter(v => v.author_id === userId);
    
    if (userVideos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="video-off" style="width: 48px; height: 48px; color: var(--text-muted);"></i>
                <p>Нет видео</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="profile-videos"></div>';
    const videosContainer = container.querySelector('.profile-videos');
    
    for (const video of userVideos) {
        const author = await DB.getUser(video.author_id);
        const videoEl = createVideoElement(video, author);
        videosContainer.appendChild(videoEl);
    }
    
    lucide.createIcons();
}

function switchProfileTab(tab) {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const username = params.get('user');
    
    let userId = currentUser?.id;
    if (username) {
        DB.getUser(username).then(user => {
            if (user) {
                if (tab === 'posts') {
                    loadProfilePosts(user.id);
                } else {
                    loadProfileVideos(user.id);
                }
            }
        });
    } else if (currentUser) {
        if (tab === 'posts') {
            loadProfilePosts(currentUser.id);
        } else {
            loadProfileVideos(currentUser.id);
        }
    }
    
    // Обновляем активную вкладку
    document.querySelectorAll('.profile-tab').forEach(t => {
        t.classList.remove('active');
    });
    event.target.closest('.profile-tab').classList.add('active');
}

// Стили для профиля
const profileStyles = `
.profile-page {
    max-width: 800px;
    margin: 0 auto;
}

.profile-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 12px;
}

.profile-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--border-radius);
    transition: all 0.2s;
    font-size: 14px;
}

.profile-tab:hover {
    background: var(--bg-tertiary);
}

.profile-tab.active {
    background: var(--bg-tertiary);
    color: var(--accent-purple);
}

.profile-posts,
.profile-videos {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
`;

const profileStyleSheet = document.createElement('style');
profileStyleSheet.textContent = profileStyles;
document.head.appendChild(profileStyleSheet);