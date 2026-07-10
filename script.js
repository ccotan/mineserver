// ===== FIREBASE КОНФИГУРАЦИЯ (твои данные) =====
const firebaseConfig = {
  apiKey: "AIzaSyBX496oLlIFMD36SvyOl5zczX8d3vbvWEU",
  authDomain: "mineserver-bb0c6.firebaseapp.com",
  databaseURL: "https://mineserver-bb0c6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mineserver-bb0c6",
  storageBucket: "mineserver-bb0c6.firebasestorage.app",
  messagingSenderId: "630624618107",
  appId: "1:630624618107:web:4b2fdc9f2b7aaed44a44de",
  measurementId: "G-TEVM88WW3P"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== ЗВУКИ (очень тихие) =====
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
    
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
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
      gain.gain.setValueAtTime(0.02, t);
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

// ===== FIREBASE: АВТО-СОЗДАНИЕ АДМИНА =====
async function ensureAdmin() {
  try {
    const adminDoc = await db.collection('users').doc('admin').get();
    if (!adminDoc.exists) {
      await db.collection('users').doc('admin').set({
        password: 'admin123',
        role: 'admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch(e) {
    console.error('Error creating admin:', e);
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

async function handleLogin(e) {
  e.preventDefault();
  const nickname = document.getElementById('loginNick').value.trim();
  const password = document.getElementById('loginPass').value;
  
  try {
    const userDoc = await db.collection('users').doc(nickname).get();
    
    if (!userDoc.exists) {
      showFormMsg('loginMsg', 'Пользователь не найден', 'error');
      return;
    }
    
    const userData = userDoc.data();
    if (userData.password !== password) {
      showFormMsg('loginMsg', 'Неверный пароль', 'error');
      return;
    }
    
    localStorage.setItem('ms_current', nickname);
    playSuccess();
    updateUserUI();
    closeAuth();
    showToast('Добро пожаловать, ' + nickname + '!');
    
    if (nickname === 'admin') {
      setTimeout(() => window.location.href = 'admin.html', 800);
    }
  } catch(e) {
    console.error('Login error:', e);
    showFormMsg('loginMsg', 'Ошибка входа', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const nickname = document.getElementById('regNick').value.trim();
  const password = document.getElementById('regPass').value;
  const confirm = document.getElementById('regConfirm').value;
  
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
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const existingNick = usersSnapshot.docs.find(doc => 
      doc.id.toLowerCase() === nickname.toLowerCase()
    );
    
    if (existingNick) {
      showFormMsg('regMsg', 'Ник "' + existingNick.id + '" уже занят', 'error');
      return;
    }
    
    await db.collection('users').doc(nickname).set({
      password: password,
      role: 'player',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    localStorage.setItem('ms_current', nickname);
    playSuccess();
    updateUserUI();
    closeAuth();
    showToast('Регистрация успешна! Привет, ' + nickname + '!');
  } catch(e) {
    console.error('Register error:', e);
    showFormMsg('regMsg', 'Ошибка регистрации', 'error');
  }
}

function logout() {
  localStorage.removeItem('ms_current');
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

// ===== FIREBASE: ЧАТ ПОДДЕРЖКИ (для игрока) =====
let supportListener = null;

function openSupport() {
  const user = localStorage.getItem('ms_current');
  if (!user) { openAuth(); showToast('Сначала войди в аккаунт'); return; }
  if (user === 'admin') { window.location.href = 'admin.html'; return; }
  
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.add('active');
  listenToPlayerChat();
  playClick();
}

function closeSupport() {
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.remove('active');
  if (supportListener) {
    supportListener();
    supportListener = null;
  }
}

function listenToPlayerChat() {
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  
  if (supportListener) supportListener();
  
  supportListener = db.collection('support')
    .where('user', '==', user)
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        db.collection('support').add({
          user: user,
          messages: [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const chat = snapshot.docs[0];
        renderPlayerChat(chat.data().messages || []);
      }
    });
}

function renderPlayerChat(messages) {
  const box = document.getElementById('playerMessages');
  if (!box) return;
  
  if (messages.length === 0) {
    box.innerHTML = '<div class="support-empty">Напиши свой вопрос — админ ответит в ближайшее время</div>';
  } else {
    box.innerHTML = messages.map(m => `
      <div class="msg ${m.from === 'admin' ? 'msg-admin' : 'msg-user'}">
        <div class="msg-author">${m.from === 'admin' ? '🛡️ Поддержка' : '👤 Ты'}</div>
        <div class="msg-text">${escapeHtml(m.text)}</div>
        <div class="msg-time">${formatTime(m.time)}</div>
      </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  }
}

async function sendPlayerMessage(e) {
  e.preventDefault();
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  
  const input = document.getElementById('playerInput');
  const text = input.value.trim();
  if (!text) return;
  
  try {
    const snapshot = await db.collection('support').where('user', '==', user).get();
    
    if (snapshot.empty) {
      await db.collection('support').add({
        user: user,
        messages: [{
          from: user,
          text: text,
          time: Date.now(),
          read: false
        }],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const chatDoc = snapshot.docs[0];
      const chatData = chatDoc.data();
      const messages = chatData.messages || [];
      messages.push({
        from: user,
        text: text,
        time: Date.now(),
        read: false
      });
      await chatDoc.ref.update({ messages: messages });
    }
    
    input.value = '';
    playSuccess();
    showToast('Сообщение отправлено');
  } catch(e) {
    console.error('Send message error:', e);
    showToast('Ошибка отправки');
  }
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
  
  db.collection('support')
    .where('user', '==', user)
    .onSnapshot(snapshot => {
      if (!snapshot.empty) {
        const chat = snapshot.docs[0].data();
        const messages = chat.messages || [];
        const unread = messages.filter(m => m.from === 'admin' && !m.read).length;
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
    });
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
});

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    closeAuth();
    closeSupport();
  }
});
