// ===== ЗВУКИ (мягкие и приятные) =====
let audioCtx;
function playClick() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch(e) {}
}

function playSuccess() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    [400, 500, 600].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      osc.frequency.value = freq;
      
      const t = audioCtx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      osc.start(t);
      osc.stop(t + 0.15);
    });
  } catch(e) {}
}

// ===== ЗАЩИТА ОТ КОПИРОВАНИЯ =====
document.addEventListener('copy', e => { e.preventDefault(); showToast('Копирование запрещено'); });
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('contextmenu', e => { e.preventDefault(); showToast('Правый клик отключён'); });
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if ((e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U' || e.key === 'a' || e.key === 'A' || e.key === 's' || e.key === 'S')) ||
      e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j'))) {
    e.preventDefault(); showToast('Действие заблокировано');
  }
});

// ===== КЛИК С ЗВУКОМ И ЭФФЕКТОМ =====
document.addEventListener('click', e => {
  playClick();
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = e.clientX + 'px';
  ripple.style.top = e.clientY + 'px';
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ===== КОПИРОВАНИЕ IP =====
function copyIP(el) {
  const ip = el.dataset.ip || 'play.mineserver.ru';
  navigator.clipboard.writeText(ip).then(() => {
    playSuccess();
    el.classList.add('copied');
    const copy = el.querySelector('.copy');
    if (copy) {
      copy.textContent = '✓ скопировано';
      setTimeout(() => { copy.textContent = 'скопировать'; }, 1500);
    }
    showToast('IP скопирован: ' + ip);
  });
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ =====
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mineserver_sync') : null;

function broadcastUpdate(type, data) {
  if (channel) {
    channel.postMessage({ type, data });
  }
  // Также обновляем timestamp для storage event
  localStorage.setItem('ms_lastUpdate', Date.now().toString());
}

if (channel) {
  channel.onmessage = (event) => {
    const { type, data } = event.data;
    if (type === 'support') {
      if (document.getElementById('supportModal')?.classList.contains('active')) {
        loadPlayerChat();
      }
      updateSupportFab();
    }
    if (type === 'users') {
      updateUserUI();
    }
  };
}

// Слушаем изменения localStorage
window.addEventListener('storage', (e) => {
  if (e.key === 'ms_support') {
    if (document.getElementById('supportModal')?.classList.contains('active')) {
      loadPlayerChat();
    }
    updateSupportFab();
  }
  if (e.key === 'ms_users' || e.key === 'ms_current') {
    updateUserUI();
  }
});

// ===== АВТО-СОЗДАНИЕ АДМИНА =====
function ensureAdmin() {
  const users = JSON.parse(localStorage.getItem('ms_users') || '{}');
  if (!users.admin) {
    users.admin = 'admin123';
    localStorage.setItem('ms_users', JSON.stringify(users));
  }
}

// ===== ПРОВЕРКА АДМИНА =====
function isAdmin() {
  return localStorage.getItem('ms_current') === 'admin';
}

// ===== МОДАЛКА АВТОРИЗАЦИИ =====
function openAuth() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('active');
  playClick();
}

function closeAuth() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.modal-tab[data-tab="${tab}"]`)?.classList.add('active');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
  if (registerForm) registerForm.style.display = tab === 'register' ? 'block' : 'none';
  playClick();
}

function handleLogin(e) {
  e.preventDefault();
  const nickname = document.getElementById('loginNick').value.trim();
  const password = document.getElementById('loginPass').value;
  const users = JSON.parse(localStorage.getItem('ms_users') || '{}');
  
  if (!users[nickname]) {
    showFormMsg('loginMsg', 'Пользователь не найден', 'error');
    return;
  }
  if (users[nickname] !== password) {
    showFormMsg('loginMsg', 'Неверный пароль', 'error');
    return;
  }
  
  localStorage.setItem('ms_current', nickname);
  broadcastUpdate('users', { action: 'login', user: nickname });
  playSuccess();
  updateUserUI();
  closeAuth();
  showToast('Добро пожаловать, ' + nickname + '!');
  
  if (nickname === 'admin') {
    setTimeout(() => window.location.href = 'admin.html', 800);
  }
}

function handleRegister(e) {
  e.preventDefault();
  const nickname = document.getElementById('regNick').value.trim();
  const password = document.getElementById('regPass').value;
  const confirm = document.getElementById('regConfirm').value;
  
  // Проверка на уникальность (case-insensitive)
  const users = JSON.parse(localStorage.getItem('ms_users') || '{}');
  const existingNick = Object.keys(users).find(n => n.toLowerCase() === nickname.toLowerCase());
  
  if (existingNick) {
    showFormMsg('regMsg', 'Ник "' + existingNick + '" уже занят', 'error');
    return;
  }
  
  if (nickname.toLowerCase() === 'admin') {
    showFormMsg('regMsg', 'Этот ник зарезервирован', 'error');
    return;
  }
  if (nickname.length < 3) {
    showFormMsg('regMsg', 'Ник минимум 3 символа', 'error');
    return;
  }
  if (password.length < 4) {
    showFormMsg('regMsg', 'Пароль минимум 4 символа', 'error');
    return;
  }
  if (password !== confirm) {
    showFormMsg('regMsg', 'Пароли не совпадают', 'error');
    return;
  }
  
  users[nickname] = password;
  localStorage.setItem('ms_users', JSON.stringify(users));
  localStorage.setItem('ms_current', nickname);
  broadcastUpdate('users', { action: 'register', user: nickname });
  playSuccess();
  updateUserUI();
  closeAuth();
  showToast('Регистрация успешна! Привет, ' + nickname + '!');
}

function logout() {
  localStorage.removeItem('ms_current');
  broadcastUpdate('users', { action: 'logout' });
  updateUserUI();
  showToast('Вы вышли из аккаунта');
  playClick();
}

function showFormMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message ' + type;
  setTimeout(() => { el.className = 'form-message'; }, 3000);
}

function updateUserUI() {
  const current = localStorage.getItem('ms_current');
  const authBtn = document.getElementById('authBtn');
  const userBadge = document.getElementById('userBadge');
  const adminLink = document.getElementById('adminLink');
  
  if (current) {
    if (authBtn) authBtn.style.display = 'none';
    if (userBadge) {
      userBadge.style.display = 'flex';
      userBadge.innerHTML = `<span>${current === 'admin' ? '👑' : '👤'}</span><span>${current}</span><span style="cursor:pointer;margin-left:4px" onclick="logout()" title="Выйти">✕</span>`;
    }
    if (adminLink) adminLink.style.display = current === 'admin' ? 'inline-block' : 'none';
  } else {
    if (authBtn) authBtn.style.display = 'inline-block';
    if (userBadge) userBadge.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }
  updateSupportFab();
}

// ===== ЧАТ ПОДДЕРЖКИ (для игрока) =====
function openSupport() {
  const user = localStorage.getItem('ms_current');
  if (!user) { openAuth(); showToast('Сначала войди в аккаунт'); return; }
  if (user === 'admin') { window.location.href = 'admin.html'; return; }
  
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.add('active');
  loadPlayerChat();
  playClick();
}

function closeSupport() {
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.remove('active');
}

function loadPlayerChat() {
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  
  const chats = JSON.parse(localStorage.getItem('ms_support') || '[]');
  let chat = chats.find(c => c.user === user);
  
  if (!chat) {
    chat = { id: Date.now(), user, messages: [] };
    chats.push(chat);
    localStorage.setItem('ms_support', JSON.stringify(chats));
  }
  
  const box = document.getElementById('playerMessages');
  if (!box) return;
  
  if (chat.messages.length === 0) {
    box.innerHTML = '<div class="support-empty">Напиши свой вопрос — админ ответит в ближайшее время</div>';
  } else {
    box.innerHTML = chat.messages.map(m => `
      <div class="msg ${m.from === 'admin' ? 'msg-admin' : 'msg-user'}">
        <div class="msg-author">${m.from === 'admin' ? '🛡️ Поддержка' : '👤 Ты'}</div>
        <div class="msg-text">${escapeHtml(m.text)}</div>
        <div class="msg-time">${formatTime(m.time)}</div>
      </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }
}

function sendPlayerMessage(e) {
  e.preventDefault();
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  
  const input = document.getElementById('playerInput');
  const text = input.value.trim();
  if (!text) return;
  
  const chats = JSON.parse(localStorage.getItem('ms_support') || '[]');
  let chat = chats.find(c => c.user === user);
  
  if (!chat) {
    chat = { id: Date.now(), user, messages: [] };
    chats.push(chat);
  }
  
  chat.messages.push({ from: user, text, time: Date.now(), read: false });
  localStorage.setItem('ms_support', JSON.stringify(chats));
  broadcastUpdate('support', { user, message: text });
  
  input.value = '';
  loadPlayerChat();
  playSuccess();
  showToast('Сообщение отправлено');
}

function updateSupportFab() {
  const fab = document.getElementById('supportFab');
  if (!fab) return;
  
  const user = localStorage.getItem('ms_current');
  if (!user || user === 'admin') {
    fab.style.display = 'none';
    return;
  }
  
  fab.style.display = 'flex';
  const chats = JSON.parse(localStorage.getItem('ms_support') || '[]');
  const chat = chats.find(c => c.user === user);
  const unread = chat ? chat.messages.filter(m => m.from === 'admin' && !m.read).length : 0;
  const badge = fab.querySelector('.fab-badge');
  
  if (badge) {
    if (unread > 0) {
      badge.style.display = 'flex';
      badge.textContent = unread;
    } else {
      badge.style.display = 'none';
    }
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function formatTime(ts) {
  const d = new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return Math.floor(diff/60) + ' мин назад';
  if (diff < 86400) return Math.floor(diff/3600) + ' ч назад';
  return d.toLocaleDateString('ru-RU');
}

// ===== АНИМИРОВАННЫЕ СЧЁТЧИКИ =====
function animateCounter(el) {
  const text = el.textContent;
  const match = text.match(/[\d.]+/);
  if (!match) return;
  const target = parseFloat(match[0].replace(/\s/g, ''));
  const suffix = text.replace(match[0], '');
  const prefix = text.indexOf(match[0]) > 0 ? text.substring(0, text.indexOf(match[0])) : '';
  let current = 0;
  const step = target / 40;
  const interval = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(interval); }
    el.textContent = prefix + Math.floor(current).toLocaleString('ru-RU').replace(/,/g, ' ') + suffix.replace(prefix, '');
  }, 30);
}

// ===== КНОПКА НАВЕРХ =====
function initScrollTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== ПОДСВЕТКА АКТИВНОЙ ССЫЛКИ =====
function initActiveLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  ensureAdmin();
  updateUserUI();
  initScrollTop();
  initActiveLink();
  
  document.querySelectorAll('.stat-num').forEach(el => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { animateCounter(el); observer.disconnect(); }
    });
    observer.observe(el);
  });
  
  // Автообновление чата игрока
  setInterval(() => {
    if (document.getElementById('supportModal')?.classList.contains('active')) {
      loadPlayerChat();
    }
    updateSupportFab();
  }, 3000);
});

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    closeAuth();
    closeSupport();
  }
});
