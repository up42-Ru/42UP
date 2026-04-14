// Админ-панель и модерация

async function loadModPage(container) {
    // Проверяем права доступа
    if (!currentUser) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="shield" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
                <p>Войдите, чтобы получить доступ</p>
            </div>
        `;
        return;
    }
    
    const isAdmin = currentUser.roles?.includes('admin');
    const isModerator = currentUser.roles?.includes('moderator');
    
    if (!isAdmin && !isModerator) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="shield-off" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
                <p>У вас нет доступа к этой странице</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="admin-panel">
            <h1 class="page-title">
                <i data-lucide="shield"></i>
                ${isAdmin ? 'Админ-панель' : 'Панель модератора'}
            </h1>
            
            <div class="admin-tabs">
                <div class="admin-tab active" onclick="switchAdminTab('reports')">
                    <i data-lucide="flag"></i>
                    Жалобы
                </div>
                ${isAdmin ? `
                    <div class="admin-tab" onclick="switchAdminTab('users')">
                        <i data-lucide="users"></i>
                        Пользователи
                    </div>
                ` : ''}
                <div class="admin-tab" onclick="switchAdminTab('posts')">
                    <i data-lucide="message-square"></i>
                    Посты
                </div>
                <div class="admin-tab" onclick="switchAdminTab('videos')">
                    <i data-lucide="video"></i>
                    Видео
                </div>
            </div>
            
            <div id="adminContent"></div>
        </div>
    `;
    
    await loadAdminReports();
    lucide.createIcons();
}

async function loadAdminReports() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const reports = await DB.getReports();
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="check-circle" style="width: 48px; height: 48px; color: var(--accent-green);"></i>
                <p>Нет активных жалоб</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="admin-section">
            <h2 class="admin-section-title">Активные жалобы</h2>
            <div class="reports-list"></div>
        </div>
    `;
    
    const reportsList = container.querySelector('.reports-list');
    
    for (const report of reports) {
        const reporter = await DB.getUser(report.reporter_id);
        const post = (await DB.getPosts()).find(p => p.id === report.post_id);
        const postAuthor = post ? await DB.getUser(post.author_id) : null;
        
        const reportEl = document.createElement('div');
        reportEl.className = 'report-card';
        reportEl.innerHTML = `
            <div class="report-header">
                <div>
                    <strong>Пост #${report.post_id}</strong>
                    <span class="report-status ${report.status}">${getReportStatus(report.status)}</span>
                </div>
                <div class="report-time">${formatDate(report.created_at)}</div>
            </div>
            <div class="report-content">
                <p><strong>Автор поста:</strong> ${postAuthor?.display_name || 'Неизвестно'}</p>
                <p><strong>Отправил жалобу:</strong> ${reporter?.display_name || 'Неизвестно'}</p>
                <p><strong>Причина:</strong> ${getReportReason(report.reason)}</p>
                ${report.comment ? `<p><strong>Комментарий:</strong> ${escapeHtml(report.comment)}</p>` : ''}
                ${post ? `
                    <div class="reported-post">
                        <p><strong>Содержание поста:</strong></p>
                        <p>${escapeHtml(post.content)}</p>
                    </div>
                ` : ''}
            </div>
            <div class="report-actions">
                <button class="btn btn-danger" onclick="deleteReportedPost('${report.post_id}', '${report.id}')">
                    <i data-lucide="trash-2"></i>
                    Удалить пост
                </button>
                <button class="btn btn-secondary" onclick="dismissReport('${report.id}')">
                    <i data-lucide="x"></i>
                    Отклонить жалобу
                </button>
            </div>
        `;
        reportsList.appendChild(reportEl);
    }
    
    lucide.createIcons();
}

async function loadAdminUsers() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const users = await DB.getAllUsers();
    
    container.innerHTML = `
        <div class="admin-section">
            <h2 class="admin-section-title">Управление пользователями</h2>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Пользователь</th>
                        <th>Роли</th>
                        <th>Дата регистрации</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody"></tbody>
            </table>
        </div>
    `;
    
    const tbody = document.getElementById('usersTableBody');
    
    for (const user of users) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${user.profile_image_url}" style="width: 32px; height: 32px; border-radius: 50%;">
                    <div>
                        <div>${user.display_name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">@${user.login}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    ${user.roles?.map(role => `
                        <span class="role-badge-admin" style="background: ${ROLE_ICONS[role]?.color}20; color: ${ROLE_ICONS[role]?.color}">
                            ${ROLE_ICONS[role]?.name || role}
                        </span>
                    `).join('') || '<span class="text-muted">Нет ролей</span>'}
                </div>
            </td>
            <td>${formatDate(user.registered_at)}</td>
            <td>
                <div class="admin-actions">
                    <button class="admin-btn" onclick="showRoleModal('${user.id}')">
                        <i data-lucide="shield"></i>
                    </button>
                    ${user.id !== currentUser?.id ? `
                        <button class="admin-btn admin-btn-danger" onclick="deleteUser('${user.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    }
    
    lucide.createIcons();
}

async function loadAdminPosts() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const posts = await DB.getPosts();
    
    container.innerHTML = `
        <div class="admin-section">
            <h2 class="admin-section-title">Управление постами</h2>
            <div class="posts-list"></div>
        </div>
    `;
    
    const postsList = container.querySelector('.posts-list');
    
    for (const post of posts) {
        const author = await DB.getUser(post.author_id);
        
        const postEl = document.createElement('div');
        postEl.className = 'admin-post-card';
        postEl.innerHTML = `
            <div class="post-header">
                <img src="${author?.profile_image_url}" class="post-avatar">
                <div>
                    <div class="author-name">${author?.display_name}</div>
                    <div class="post-time">${formatDate(post.created_at)}</div>
                </div>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            <div class="admin-actions">
                <button class="admin-btn admin-btn-danger" onclick="deletePost('${post.id}')">
                    <i data-lucide="trash-2"></i>
                    Удалить
                </button>
            </div>
        `;
        postsList.appendChild(postEl);
    }
    
    lucide.createIcons();
}

async function loadAdminVideos() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    const videos = await DB.getVideos();
    
    container.innerHTML = `
        <div class="admin-section">
            <h2 class="admin-section-title">Модерация видео</h2>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Категория</th>
                        <th>Автор</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="videosTableBody"></tbody>
            </table>
        </div>
    `;
    
    const tbody = document.getElementById('videosTableBody');
    
    for (const video of videos) {
        const author = await DB.getUser(video.author_id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(video.title)}</td>
            <td>
                <select class="form-select" onchange="updateVideoCategory('${video.id}', this.value)">
                    <option value="hype" ${video.category === 'hype' ? 'selected' : ''}>Хайп</option>
                    <option value="funny" ${video.category === 'funny' ? 'selected' : ''}>Смешные</option>
                    <option value="interesting" ${video.category === 'interesting' ? 'selected' : ''}>Интересные</option>
                    <option value="other" ${video.category === 'other' ? 'selected' : ''}>Разное</option>
                </select>
            </td>
            <td>${author?.display_name || 'Неизвестно'}</td>
            <td>
                <div class="admin-actions">
                    <button class="admin-btn admin-btn-danger" onclick="deleteVideo('${video.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    }
    
    lucide.createIcons();
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.remove('active');
    });
    event.target.closest('.admin-tab').classList.add('active');
    
    switch(tab) {
        case 'reports':
            loadAdminReports();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'posts':
            loadAdminPosts();
            break;
        case 'videos':
            loadAdminVideos();
            break;
    }
}

async function deletePost(postId) {
    if (!confirm('Удалить этот пост?')) return;
    
    await DB.deletePost(postId);
    showToast('Пост удален', 'success');
    loadAdminPosts();
}

async function deleteUser(userId) {
    if (!confirm('Удалить пользователя? Это действие нельзя отменить.')) return;
    
    const users = JSON.parse(localStorage.getItem('42up_users') || '[]');
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem('42up_users', JSON.stringify(filtered));
    
    showToast('Пользователь удален', 'success');
    loadAdminUsers();
}

async function deleteReportedPost(postId, reportId) {
    await DB.deletePost(postId);
    
    // Обновляем статус жалобы
    const reports = JSON.parse(localStorage.getItem('42up_reports') || '[]');
    const report = reports.find(r => r.id == reportId);
    if (report) {
        report.status = 'resolved';
        localStorage.setItem('42up_reports', JSON.stringify(reports));
    }
    
    showToast('Пост удален по жалобе', 'success');
    loadAdminReports();
}

async function dismissReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('42up_reports') || '[]');
    const report = reports.find(r => r.id == reportId);
    if (report) {
        report.status = 'dismissed';
        localStorage.setItem('42up_reports', JSON.stringify(reports));
    }
    
    showToast('Жалоба отклонена', 'info');
    loadAdminReports();
}

async function deleteVideo(videoId) {
    if (!confirm('Удалить видео?')) return;
    
    const videos = JSON.parse(localStorage.getItem('42up_videos') || '[]');
    const filtered = videos.filter(v => v.id !== videoId);
    localStorage.setItem('42up_videos', JSON.stringify(filtered));
    
    showToast('Видео удалено', 'success');
    loadAdminVideos();
}

function showRoleModal(userId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Управление ролями</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" value="streamer" class="role-checkbox"> 🟣 Стример
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" value="vip" class="role-checkbox"> 💎 VIP
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" value="moderator" class="role-checkbox"> 🗡️ Модератор
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" value="verified" class="role-checkbox"> ✅ Верифицирован
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" value="admin" class="role-checkbox"> 👑 Админ
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Отмена</button>
                <button class="btn btn-primary" onclick="saveUserRoles('${userId}')">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Загружаем текущие роли
    DB.getUser(userId).then(user => {
        if (user && user.roles) {
            document.querySelectorAll('.role-checkbox').forEach(cb => {
                cb.checked = user.roles.includes(cb.value);
            });
        }
    });
}

async function saveUserRoles(userId) {
    const roles = [];
    document.querySelectorAll('.role-checkbox:checked').forEach(cb => {
        roles.push(cb.value);
    });
    
    const users = JSON.parse(localStorage.getItem('42up_users') || '[]');
    const user = users.find(u => u.id === userId);
    if (user) {
        user.roles = roles;
        localStorage.setItem('42up_users', JSON.stringify(users));
        
        // Обновляем текущего пользователя если это он
        if (currentUser && currentUser.id === userId) {
            currentUser.roles = roles;
            localStorage.setItem('42up_user', JSON.stringify(currentUser));
        }
    }
    
    showToast('Роли обновлены', 'success');
    document.querySelector('.modal-overlay')?.remove();
    loadAdminUsers();
}

// Вспомогательные функции
function getReportStatus(status) {
    const statuses = {
        pending: 'В обработке',
        resolved: 'Решено',
        dismissed: 'Отклонено'
    };
    return statuses[status] || status;
}

function getReportReason(reason) {
    const reasons = {
        spam: 'Спам',
        inappropriate: 'Неприемлемый контент',
        harassment: 'Оскорбления/Домогательства',
        other: 'Другое'
    };
    return reasons[reason] || reason;
}

// Стили для админ-панели
const adminStyles = `
.admin-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 12px;
}

.admin-tab {
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

.admin-tab:hover {
    background: var(--bg-tertiary);
}

.admin-tab.active {
    background: var(--bg-tertiary);
    color: var(--accent-purple);
}

.report-card {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    padding: 16px;
    margin-bottom: 16px;
}

.report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.report-status {
    margin-left: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.1);
}

.report-status.resolved {
    background: rgba(0, 255, 0, 0.2);
    color: var(--accent-green);
}

.report-content {
    margin-bottom: 16px;
}

.report-content p {
    margin-bottom: 8px;
}

.reported-post {
    background: var(--bg-secondary);
    padding: 12px;
    border-radius: var(--border-radius);
    margin-top: 12px;
}

.report-actions {
    display: flex;
    gap: 12px;
}

.btn-danger {
    background: rgba(255, 0, 0, 0.2);
    color: var(--accent-red);
}

.btn-danger:hover {
    background: rgba(255, 0, 0, 0.3);
}

.admin-post-card {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius);
    padding: 16px;
    margin-bottom: 16px;
}

.role-badge-admin {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}
`;

const adminStyleSheet = document.createElement('style');
adminStyleSheet.textContent = adminStyles;
document.head.appendChild(adminStyleSheet);