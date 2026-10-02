// ── DATA LAYER ──
const DB_KEY       = 'blog_posts';
const AUTH_KEY     = 'blog_auth';
const PASS_KEY     = 'blog_password';
const SETTINGS_KEY = 'blog_settings';

const DEFAULT_SETTINGS = {
  blogTitle:    'The Journal',
  tagline:      'Thoughts, stories, and ideas — written to share.',
  authorName:   'Author',
  authorBio:    '',
  authorAvatar: '',
  accentColor:  '#C8922A',
  navyColor:    '#0A1F44',
  categories:   ['Personal', 'Insights', 'Thoughts', 'Technology', 'Travel', 'Books', 'Projects'],
  social: { twitter: '', instagram: '', linkedin: '', github: '' },
  aboutTitle:   'About',
  aboutContent: '',
};

function initDB() {
  if (!localStorage.getItem(PASS_KEY))     localStorage.setItem(PASS_KEY, 'admin123');
  if (!localStorage.getItem(DB_KEY))       localStorage.setItem(DB_KEY, JSON.stringify([]));
  if (!localStorage.getItem(SETTINGS_KEY)) localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
}

// ── SETTINGS ──
function getSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  applyTheme(s);
}

function applyTheme(s) {
  if (!s) s = getSettings();
  const root = document.documentElement;
  if (s.accentColor) { root.style.setProperty('--gold',    s.accentColor); root.style.setProperty('--gold-lt', s.accentColor + 'cc'); }
  if (s.navyColor)   { root.style.setProperty('--navy',    s.navyColor);   root.style.setProperty('--navy-md', s.navyColor + 'dd'); }
}

function getPosts() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

function getPost(id) {
  return getPosts().find(p => p.id === id) || null;
}

function savePost(post) {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === post.id);
  if (idx >= 0) {
    posts[idx] = post;
  } else {
    posts.unshift(post);
  }
  localStorage.setItem(DB_KEY, JSON.stringify(posts));
}

function deletePost(id) {
  const posts = getPosts().filter(p => p.id !== id);
  localStorage.setItem(DB_KEY, JSON.stringify(posts));
}

// ── CATEGORY BADGE COLORS ──
const BADGE_COLORS = ['badge--navy', 'badge--gold', 'badge--green', 'badge--gray'];
function categoryBadgeClass(cat, settings) {
  settings = settings || getSettings();
  const idx = (settings.categories || []).indexOf(cat);
  if (idx === -1) return 'badge--gray';
  return BADGE_COLORS[idx % BADGE_COLORS.length];
}

function generateId() {
  return 'post-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── AUTH ──
function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function login(password) {
  const stored = localStorage.getItem(PASS_KEY) || 'admin123';
  if (password === stored) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}

function checkPassword(password) {
  const stored = localStorage.getItem(PASS_KEY) || 'admin123';
  return password === stored;
}

function setPassword(newPassword) {
  localStorage.setItem(PASS_KEY, newPassword);
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'admin.html';
  }
}

// ── URL PARAMS ──
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ── SITE FOOTER ──
const SOCIAL_ICONS = {
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M23 4.5c-.85.38-1.76.63-2.7.74a4.7 4.7 0 0 0 2.06-2.6 9.4 9.4 0 0 1-2.98 1.14 4.68 4.68 0 0 0-7.97 4.27A13.28 13.28 0 0 1 1.64 3.16a4.67 4.67 0 0 0 1.45 6.24A4.65 4.65 0 0 1 1 8.84v.06a4.68 4.68 0 0 0 3.75 4.59 4.7 4.7 0 0 1-2.11.08 4.69 4.69 0 0 0 4.37 3.25A9.4 9.4 0 0 1 .5 18.57 13.25 13.25 0 0 0 7.67 20.7c8.6 0 13.3-7.13 13.3-13.31 0-.2 0-.4-.02-.6A9.4 9.4 0 0 0 23 4.5z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.13-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z"/></svg>',
};

function renderSiteFooter(elId, settings) {
  settings = settings || getSettings();
  const el = document.getElementById(elId);
  if (!el) return;

  const logoLetter = (settings.blogTitle || 'J')[0].toUpperCase();
  const logoText   = settings.blogTitle.replace(/\s+(\S+)$/, '<span>$1</span>') || 'The<span>Journal</span>';

  const social = settings.social || {};
  const links = Object.keys(SOCIAL_ICONS)
    .filter(key => social[key])
    .map(key => `<a href="${social[key]}" target="_blank" rel="noopener" title="${key}">${SOCIAL_ICONS[key]}</a>`)
    .join('');

  el.innerHTML = `
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <div class="blog-logo">
          <div class="blog-logo__mark">${logoLetter}</div>
          <div class="blog-logo__text">${logoText}</div>
        </div>
        <p class="site-footer__tagline">${settings.tagline || ''}</p>
      </div>
      ${links ? `<div class="site-footer__social">${links}</div>` : ''}
    </div>
    <div class="site-footer__bottom">© ${new Date().getFullYear()} ${settings.authorName || 'Author'}. All rights reserved.</div>
  `;
}

// ── TOAST ──
function showToast(message, type = 'success') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast--visible'), 10);
  setTimeout(() => { toast.classList.remove('toast--visible'); setTimeout(() => toast.remove(), 300); }, 3200);
}

initDB();
applyTheme();
