// Конфигурация приложения 42UP
const CONFIG = {
    // Twitch OAuth
    TWITCH: {
        CLIENT_ID: 'lb93nagju8liijf9xdtb17virppha2',
        REDIRECT_URI: window.location.origin + window.location.pathname,
        SCOPE: 'user:read:email'
    },
    
    // Google Sheets API
    GOOGLE: {
        API_KEY: 'AIzaSyBBnM6yvS3Cz5KIuVL33IW-m4Pr2U9312A',
        SPREADSHEET_ID: '1xx6nVIc6bLoC7nEcpqTYOm2RQZsRb6R-rKwbtQdsUbs',
        SHEETS: {
            USERS: 'Users',
            POSTS: 'Posts',
            LIKES: 'Likes',
            VIDEOS: 'Videos',
            REPORTS: 'Reports'
        }
    },
    
    // Домены для изображений
    ALLOWED_IMAGE_DOMAINS: [
        'imgur.com',
        'i.imgur.com',
        'ibb.co',
        'i.ibb.co',
        'postimg.cc',
        'i.postimg.cc',
        'cdn.discordapp.com'
    ],
    
    // Роли пользователей
    ROLES: {
        STREAMER: 'streamer',
        VIP: 'vip',
        MODERATOR: 'moderator',
        VERIFIED: 'verified',
        ADMIN: 'admin'
    },
    
    // Категории видео
    VIDEO_CATEGORIES: {
        HYPE: 'hype',
        FUNNY: 'funny',
        INTERESTING: 'interesting',
        OTHER: 'other'
    }
};

// Иконки ролей
const ROLE_ICONS = {
    streamer: { icon: 'glitch', color: '#9147FF', name: 'Стример' },
    vip: { icon: 'diamond', color: '#FF69B4', name: 'VIP' },
    moderator: { icon: 'sword', color: '#00FF00', name: 'Модератор' },
    verified: { icon: 'check', color: '#FFFFFF', name: 'Верифицирован' },
    admin: { icon: 'crown', color: '#FFD700', name: 'Админ' }
};

// Текущий пользователь
let currentUser = null;

// Состояние приложения
const AppState = {
    currentPage: 'feed',
    feedFilter: 'all',
    videoCategory: 'hype',
    posts: [],
    videos: []
};