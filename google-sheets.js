// Модуль работы с Google Sheets API

class GoogleSheetsDB {
    constructor() {
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
        this.init();
    }

    async init() {
        // В реальном приложении здесь будет создание таблицы
        console.log('Google Sheets DB initialized');
    }

    async request(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}/${endpoint}?key=${CONFIG.GOOGLE.API_KEY}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error('DB Error:', error);
            return null;
        }
    }

    // Пользователи
    async saveUser(user) {
        // В демо-режиме сохраняем в localStorage
        const users = JSON.parse(localStorage.getItem('42up_users') || '[]');
        const existingIndex = users.findIndex(u => u.id === user.id);
        
        if (existingIndex >= 0) {
            users[existingIndex] = { ...users[existingIndex], ...user };
        } else {
            users.push(user);
        }
        
        localStorage.setItem('42up_users', JSON.stringify(users));
        return user;
    }

    async getUser(userId) {
        const users = JSON.parse(localStorage.getItem('42up_users') || '[]');
        return users.find(u => u.id === userId || u.login === userId);
    }

    async getAllUsers() {
        return JSON.parse(localStorage.getItem('42up_users') || '[]');
    }

    // Посты
    async savePost(post) {
        const posts = JSON.parse(localStorage.getItem('42up_posts') || '[]');
        post.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        post.created_at = new Date().toISOString();
        posts.unshift(post);
        localStorage.setItem('42up_posts', JSON.stringify(posts));
        return post;
    }

    async getPosts(filter = {}) {
        let posts = JSON.parse(localStorage.getItem('42up_posts') || '[]');
        
        if (filter.forStream === true) {
            posts = posts.filter(p => p.for_stream);
        }
        
        if (filter.userId) {
            posts = posts.filter(p => p.author_id === filter.userId);
        }
        
        return posts;
    }

    async deletePost(postId) {
        let posts = JSON.parse(localStorage.getItem('42up_posts') || '[]');
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem('42up_posts', JSON.stringify(posts));
    }

    // Лайки
    async toggleLike(postId, userId, type) {
        const likes = JSON.parse(localStorage.getItem('42up_likes') || '[]');
        const existingIndex = likes.findIndex(l => l.post_id === postId && l.user_id === userId);
        
        if (existingIndex >= 0) {
            if (likes[existingIndex].type === type) {
                likes.splice(existingIndex, 1);
            } else {
                likes[existingIndex].type = type;
            }
        } else {
            likes.push({ post_id: postId, user_id: userId, type });
        }
        
        localStorage.setItem('42up_likes', JSON.stringify(likes));
        return this.getPostLikes(postId);
    }

    async getPostLikes(postId) {
        const likes = JSON.parse(localStorage.getItem('42up_likes') || '[]');
        const postLikes = likes.filter(l => l.post_id === postId);
        
        return {
            likes: postLikes.filter(l => l.type === 'like').length,
            dislikes: postLikes.filter(l => l.type === 'dislike').length,
            userVote: currentUser ? postLikes.find(l => l.user_id === currentUser.id)?.type : null
        };
    }

    // Видео
    async saveVideo(video) {
        const videos = JSON.parse(localStorage.getItem('42up_videos') || '[]');
        video.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        video.created_at = new Date().toISOString();
        video.category = 'other';
        videos.push(video);
        localStorage.setItem('42up_videos', JSON.stringify(videos));
        return video;
    }

    async getVideos(category = null) {
        let videos = JSON.parse(localStorage.getItem('42up_videos') || '[]');
        
        if (category && category !== 'all') {
            videos = videos.filter(v => v.category === category);
        }
        
        return videos;
    }

    async updateVideoCategory(videoId, category) {
        const videos = JSON.parse(localStorage.getItem('42up_videos') || '[]');
        const video = videos.find(v => v.id === videoId);
        if (video) {
            video.category = category;
            localStorage.setItem('42up_videos', JSON.stringify(videos));
        }
        return video;
    }

    // Жалобы
    async saveReport(report) {
        const reports = JSON.parse(localStorage.getItem('42up_reports') || '[]');
        report.id = Date.now();
        report.created_at = new Date().toISOString();
        report.status = 'pending';
        reports.push(report);
        localStorage.setItem('42up_reports', JSON.stringify(reports));
        return report;
    }

    async getReports() {
        return JSON.parse(localStorage.getItem('42up_reports') || '[]');
    }
}

const DB = new GoogleSheetsDB();