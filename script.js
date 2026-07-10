// ===== ЗВУКИ =====
let audioCtx;
function playClick() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
  } catch(e) {}
}
function playSuccess() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    [600, 800, 1000].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = audioCtx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
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
  const textEl = el.querySelector('.copy') || el;
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

// ===== МОДАЛКА АВТОРИЗАЦИИ =====
function openAuth() {
  document.getElementById('authModal').classList.add('active');
  playClick();
}
function closeAuth() {
  document.getElementById('authModal').classList.remove('active');
}
function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.modal-tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
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
  playSuccess();
  updateUserUI();
  closeAuth();
  showToast('Добро пожаловать, ' + nickname + '!');
}
function handleRegister(e) {
  e.preventDefault();
  const nickname = document.getElementById('regNick').value.trim();
  const password = document.getElementById('regPass').value;
  const confirm = document.getElementById('regConfirm').value;
  if (nickname.length < 3) { showFormMsg('regMsg', 'Ник минимум 3 символа', 'error'); return; }
  if (password.length < 4) { showFormMsg('regMsg', 'Пароль минимум 4 символа', 'error'); return; }
  if (password !== confirm) { showFormMsg('regMsg', 'Пароли не совпадают', 'error'); return; }
  const users = JSON.parse(localStorage.getItem('ms_users') || '{}');
  if (users[nickname]) { showFormMsg('regMsg', 'Ник уже занят', 'error'); return; }
  users[nickname] = password;
  localStorage.setItem('ms_users', JSON.stringify(users));
  localStorage.setItem('ms_current', nickname);
  playSuccess();
  updateUserUI();
  closeAuth();
  showToast('Регистрация успешна! Привет, ' + nickname + '!');
}
function logout() {
  localStorage.removeItem('ms_current');
  updateUserUI();
  showToast('Вы вышли из аккаунта');
  playClick();
}
function showFormMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'form-message ' + type;
  setTimeout(() => { el.className = 'form-message'; }, 3000);
}
function updateUserUI() {
  const current = localStorage.getItem('ms_current');
  const authBtn = document.getElementById('authBtn');
  const userBadge = document.getElementById('userBadge');
  if (current) {
    authBtn.style.display = 'none';
    userBadge.style.display = 'flex';
    userBadge.innerHTML = `<span>👤</span><span>${current}</span><span style="cursor:pointer;margin-left:4px" onclick="logout()" title="Выйти">✕</span>`;
  } else {
    authBtn.style.display = 'inline-block';
    userBadge.style.display = 'none';
  }
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
  updateUserUI();
  initScrollTop();
  initActiveLink();
  document.querySelectorAll('.stat-num').forEach(el => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { animateCounter(el); observer.disconnect(); }
    });
    observer.observe(el);
  });
});

// Закрытие модалки по клику вне
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeAuth();
});
