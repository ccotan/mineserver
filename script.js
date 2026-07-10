// ===== FIREBASE =====
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const EMOJI_LIST = ['👤','🎮','️','🛡️','','👑','🐺','','🦁','','🦅','🐲','💀','🤖','👾','','🎲','❄️','','🌙','☀️','🍀','💎','','🗡️','🏰','🌳','🌊','','🎨','📚','','🎸','🎧','🎬','📷','','🔥','⭐',''];

// ===== ЗАЩИТА =====
document.addEventListener('copy', e => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  e.preventDefault(); showToast('Копирование запрещено');
});
document.addEventListener('cut', e => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  e.preventDefault();
});
document.addEventListener('contextmenu', e => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  e.preventDefault(); showToast('Правый клик отключён');
});
document.addEventListener('selectstart', e => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  e.preventDefault();
});
document.addEventListener('keydown', e => {
  if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  if ((e.ctrlKey && ['c','C','u','U','a','A','s','S'].includes(e.key)) || e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','i','J','j'].includes(e.key))) {
    e.preventDefault(); showToast('Действие заблокировано');
  }
});

// ===== КЛИК =====
document.addEventListener('click', e => {
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = e.clientX + 'px';
  ripple.style.top = e.clientY + 'px';
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ===== КОПИРОВАНИЕ IP =====
function copyIP(el) {
  const ip = el.dataset.ip || 'play.reished.ru';
  navigator.clipboard.writeText(ip).then(() => {
    el.classList.add('copied');
    const copy = el.querySelector('.copy');
    if (copy) { copy.textContent = '✓ скопировано'; setTimeout(() => { copy.textContent = 'скопировать'; }, 1500); }
    showToast('IP скопирован: ' + ip);
  });
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== АДМИН =====
async function ensureAdmin() {
  try {
    const adminDoc = await db.collection('users').doc('admin').get();
    if (!adminDoc.exists) {
      await db.collection('users').doc('admin').set({
        password: 'admin123', role: 'admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await db.collection('profiles').doc('admin').set({
        nickname: 'admin', avatar: '👑', description: 'Основатель сервера',
        status: 'online', friends: [], background: ''
      });
    }
  } catch(e) { console.error('Error creating admin:', e); }
}
function isAdmin() { return localStorage.getItem('ms_current') === 'admin'; }

// ===== АВТОРИЗАЦИЯ =====
function openAuth() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('active');
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
}

async function handleLogin(e) {
  e.preventDefault();
  const nickname = document.getElementById('loginNick').value.trim();
  const password = document.getElementById('loginPass').value;
  try {
    const userDoc = await db.collection('users').doc(nickname).get();
    if (!userDoc.exists) { showFormMsg('loginMsg', 'Пользователь не найден', 'error'); return; }
    if (userDoc.data().password !== password) { showFormMsg('loginMsg', 'Неверный пароль', 'error'); return; }
    localStorage.setItem('ms_current', nickname);
    await db.collection('profiles').doc(nickname).update({ status: 'online' });
    updateUserUI(); closeAuth();
    showToast('Добро пожаловать, ' + nickname + '!');
    if (nickname === 'admin') setTimeout(() => window.location.href = 'admin.html', 800);
  } catch(e) { console.error('Login error:', e); showFormMsg('loginMsg', 'Ошибка входа', 'error'); }
}

async function handleRegister(e) {
  e.preventDefault();
  const nickname = document.getElementById('regNick').value.trim();
  const password = document.getElementById('regPass').value;
  const confirm = document.getElementById('regConfirm').value;
  if (nickname.toLowerCase() === 'admin') { showFormMsg('regMsg', 'Этот ник зарезервирован', 'error'); return; }
  if (nickname.length < 3) { showFormMsg('regMsg', 'Ник минимум 3 символа', 'error'); return; }
  if (password.length < 4) { showFormMsg('regMsg', 'Пароль минимум 4 символа', 'error'); return; }
  if (password !== confirm) { showFormMsg('regMsg', 'Пароли не совпадают', 'error'); return; }
  try {
    const usersSnapshot = await db.collection('users').get();
    const existingNick = usersSnapshot.docs.find(doc => doc.id.toLowerCase() === nickname.toLowerCase());
    if (existingNick) { showFormMsg('regMsg', 'Ник "' + existingNick.id + '" уже занят', 'error'); return; }
    await db.collection('users').doc(nickname).set({
      password: password, role: 'player',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await db.collection('profiles').doc(nickname).set({
      nickname: nickname, avatar: '👤', description: 'Новый игрок',
      status: 'online', friends: [], background: ''
    });
    localStorage.setItem('ms_current', nickname);
    updateUserUI(); closeAuth();
    showToast('Регистрация успешна! Привет, ' + nickname + '!');
  } catch(e) { console.error('Register error:', e); showFormMsg('regMsg', 'Ошибка регистрации', 'error'); }
}

function logout() {
  const current = localStorage.getItem('ms_current');
  if (current) db.collection('profiles').doc(current).update({ status: 'offline' }).catch(() => {});
  localStorage.removeItem('ms_current');
  updateUserUI(); showToast('Вы вышли из аккаунта');
}

function showFormMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text; el.className = 'form-message ' + type;
  setTimeout(() => { el.className = 'form-message'; }, 3000);
}

function updateUserUI() {
  const current = localStorage.getItem('ms_current');
  const authBtn = document.getElementById('authBtn');
  const userBadge = document.getElementById('userBadge');
  const adminLink = document.getElementById('adminLink');
  const friendsFab = document.getElementById('friendsFab');
  if (current) {
    if (authBtn) authBtn.style.display = 'none';
    if (userBadge) {
      userBadge.style.display = 'flex';
      userBadge.innerHTML = `<span>${current}</span><span style="cursor:pointer;margin-left:8px" onclick="event.stopPropagation(); logout()" title="Выйти">✕</span>`;
    }
    if (adminLink) adminLink.style.display = current === 'admin' ? 'inline-block' : 'none';
    if (friendsFab) friendsFab.style.display = current === 'admin' ? 'none' : 'flex';
  } else {
    if (authBtn) authBtn.style.display = 'inline-block';
    if (userBadge) userBadge.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
    if (friendsFab) friendsFab.style.display = 'none';
  }
  updateSupportFab();
}

// ===== ПРОФИЛЬ =====
function openProfile() {
  const user = localStorage.getItem('ms_current');
  if (!user) { openAuth(); return; }
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('active');
  loadProfile(user);
}
function closeProfile() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('active');
}
async function loadProfile(nickname) {
  try {
    const doc = await db.collection('profiles').doc(nickname).get();
    if (!doc.exists) return;
    const profile = doc.data();
    const isOwn = nickname === localStorage.getItem('ms_current');
    
    document.getElementById('profileAvatar').textContent = profile.avatar || '👤';
    document.getElementById('profileNickname').textContent = profile.nickname;
    document.getElementById('profileDescription').textContent = profile.description || 'Нет описания';
    document.getElementById('profileStatus').textContent = profile.status === 'online' ? 'Онлайн' : 'Оффлайн';
    document.getElementById('profileStatus').className = 'profile-status ' + (profile.status === 'online' ? 'online' : 'offline');
    
    const profileBg = document.getElementById('profileBg');
    if (profile.background) {
      profileBg.style.backgroundImage = 'url(' + profile.background + ')';
    } else {
      profileBg.style.backgroundImage = '';
    }
    
    if (isOwn) {
      document.getElementById('editAvatar').value = profile.avatar || '👤';
      document.getElementById('editDescription').value = profile.description || '';
      document.getElementById('editSection').style.display = 'block';
      document.getElementById('friendActions').style.display = 'none';
      if (profile.background) {
        document.getElementById('backgroundPreview').style.backgroundImage = 'url(' + profile.background + ')';
        document.getElementById('backgroundData').value = profile.background;
      } else {
        document.getElementById('backgroundPreview').style.backgroundImage = '';
        document.getElementById('backgroundData').value = '';
      }
      renderEmojiPicker();
    } else {
      document.getElementById('editSection').style.display = 'none';
      document.getElementById('friendActions').style.display = 'block';
      await updateFriendButton(nickname);
    }
  } catch(e) { console.error('Load profile error:', e); }
}

function renderEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  if (!picker) return;
  const current = document.getElementById('editAvatar').value || '';
  picker.innerHTML = EMOJI_LIST.map(e => 
    `<span class="emoji-option ${e === current ? 'selected' : ''}" onclick="selectEmoji('${e}')">${e}</span>`
  ).join('');
}

function selectEmoji(emoji) {
  document.getElementById('editAvatar').value = emoji;
  document.querySelectorAll('.emoji-option').forEach(el => {
    el.classList.toggle('selected', el.textContent === emoji);
  });
}

function handleBackgroundUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('Файл слишком большой (макс. 2 МБ)');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('backgroundPreview').style.backgroundImage = 'url(' + ev.target.result + ')';
    document.getElementById('backgroundData').value = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function removeBackground() {
  document.getElementById('backgroundPreview').style.backgroundImage = '';
  document.getElementById('backgroundData').value = '';
  document.getElementById('backgroundFile').value = '';
}

async function saveProfile() {
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  const avatar = document.getElementById('editAvatar').value.trim() || '👤';
  const description = document.getElementById('editDescription').value.trim();
  const background = document.getElementById('backgroundData').value;
  try {
    await db.collection('profiles').doc(user).update({ avatar, description, background });
    showToast('Профиль обновлён');
    loadProfile(user);
  } catch(e) { console.error('Save profile error:', e); showToast('Ошибка сохранения'); }
}

// ===== ДРУЗЬЯ =====
function openFriends() {
  const user = localStorage.getItem('ms_current');
  if (!user) { openAuth(); return; }
  const modal = document.getElementById('friendsModal');
  if (modal) modal.classList.add('active');
  loadFriends(user);
}
function closeFriends() {
  const modal = document.getElementById('friendsModal');
  if (modal) modal.classList.remove('active');
}
async function loadFriends(nickname) {
  try {
    const doc = await db.collection('profiles').doc(nickname).get();
    if (!doc.exists) return;
    const friends = doc.data().friends || [];
    const list = document.getElementById('friendsList');
    if (friends.length === 0) {
      list.innerHTML = '<div class="support-empty">У тебя пока нет друзей. Найди кого-нибудь через поиск!</div>';
      return;
    }
    const items = await Promise.all(friends.map(async friendNick => {
      try {
        const friendDoc = await db.collection('profiles').doc(friendNick).get();
        const friend = friendDoc.exists ? friendDoc.data() : { nickname: friendNick, avatar: '👤', status: 'offline' };
        return `
          <div class="friend-item">
            <div class="friend-avatar">${friend.avatar}</div>
            <div class="friend-info">
              <div class="friend-name">${friend.nickname}</div>
              <div class="friend-status">${friend.status === 'online' ? 'Онлайн' : 'Оффлайн'}</div>
            </div>
            <button class="btn btn-primary" style="padding:6px 12px; font-size:12px" onclick="openChat('${friend.nickname}')">Чат</button>
            <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px" onclick="viewProfile('${friend.nickname}')">Профиль</button>
          </div>
        `;
      } catch(err) { return ''; }
    }));
    list.innerHTML = items.join('');
  } catch(e) { console.error('Load friends error:', e); }
}

async function searchUsers() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const current = localStorage.getItem('ms_current');
  if (!query) return;
  try {
    const snapshot = await db.collection('profiles').get();
    const results = snapshot.docs.filter(doc => doc.id.toLowerCase().includes(query) && doc.id !== current);
    const list = document.getElementById('searchResults');
    if (results.length === 0) {
      list.innerHTML = '<div class="support-empty">Никто не найден</div>';
      return;
    }
    const items = await Promise.all(results.map(async doc => {
      const profile = doc.data();
      const isFriend = await checkIfFriend(profile.nickname);
      return `
        <div class="friend-item">
          <div class="friend-avatar">${profile.avatar}</div>
          <div class="friend-info">
            <div class="friend-name">${profile.nickname}</div>
            <div class="friend-status">${profile.status === 'online' ? 'Онлайн' : 'Оффлайн'}</div>
          </div>
          ${isFriend 
            ? '<span style="color: var(--accent-2); font-size: 12px;">В друзьях</span>'
            : `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px" onclick="addFriend('${profile.nickname}')">Добавить</button>`
          }
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px" onclick="viewProfile('${profile.nickname}')">Профиль</button>
        </div>
      `;
    }));
    list.innerHTML = items.join('');
  } catch(e) { console.error('Search error:', e); }
}

async function checkIfFriend(nickname) {
  const current = localStorage.getItem('ms_current');
  if (!current) return false;
  try {
    const doc = await db.collection('profiles').doc(current).get();
    if (!doc.exists) return false;
    return (doc.data().friends || []).includes(nickname);
  } catch(e) { return false; }
}

async function addFriend(friendNick) {
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  if (user === friendNick) { showToast('Нельзя добавить себя'); return; }
  try {
    const friendDoc = await db.collection('profiles').doc(friendNick).get();
    if (!friendDoc.exists) { showToast('Пользователь не найден'); return; }
    const userDoc = await db.collection('profiles').doc(user).get();
    const friends = userDoc.data().friends || [];
    if (friends.includes(friendNick)) { showToast('Уже в друзьях'); return; }
    friends.push(friendNick);
    await db.collection('profiles').doc(user).update({ friends });
    showToast(friendNick + ' добавлен в друзья');
    loadFriends(user);
    searchUsers();
  } catch(e) { console.error('Add friend error:', e); showToast('Ошибка добавления'); }
}

async function removeFriend(friendNick) {
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  if (!confirm('Удалить ' + friendNick + ' из друзей?')) return;
  try {
    const userDoc = await db.collection('profiles').doc(user).get();
    const friends = (userDoc.data().friends || []).filter(n => n !== friendNick);
    await db.collection('profiles').doc(user).update({ friends });
    showToast(friendNick + ' удалён из друзей');
    loadProfile(friendNick);
  } catch(e) { console.error('Remove friend error:', e); showToast('Ошибка'); }
}

async function updateFriendButton(nickname) {
  const user = localStorage.getItem('ms_current');
  if (!user || user === nickname) return;
  const isFriend = await checkIfFriend(nickname);
  const container = document.getElementById('friendActions');
  if (isFriend) {
    container.innerHTML = `
      <button class="btn btn-primary" style="width:100%; margin-bottom: 8px;" onclick="openChat('${nickname}')">Написать сообщение</button>
      <button class="btn btn-secondary" style="width:100%; color: #ef4444;" onclick="removeFriend('${nickname}')">Удалить из друзей</button>
    `;
  } else {
    container.innerHTML = `<button class="btn btn-primary" style="width:100%" onclick="addFriend('${nickname}'); loadProfile('${nickname}');">Добавить в друзья</button>`;
  }
}

function viewProfile(nickname) {
  closeFriends();
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('active');
  loadProfile(nickname);
}

// ===== ЛИЧНЫЕ СООБЩЕНИЯ =====
let privateChatListener = null;
function openChat(friendNick) {
  closeFriends();
  const modal = document.getElementById('privateChatModal');
  if (modal) modal.classList.add('active');
  document.getElementById('chatWith').textContent = friendNick;
  listenToPrivateChat(friendNick);
}
function closePrivateChat() {
  const modal = document.getElementById('privateChatModal');
  if (modal) modal.classList.remove('active');
  if (privateChatListener) { privateChatListener(); privateChatListener = null; }
}
function listenToPrivateChat(friendNick) {
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  if (privateChatListener) privateChatListener();
  const chatId = [user, friendNick].sort().join('_');
  privateChatListener = db.collection('private_chats').doc(chatId).onSnapshot(doc => {
    const box = document.getElementById('privateMessages');
    if (!doc.exists) {
      box.innerHTML = '<div class="support-empty">Начни общение с ' + friendNick + '</div>';
      return;
    }
    const messages = doc.data().messages || [];
    box.innerHTML = messages.map(m => `
      <div class="msg ${m.from === user ? 'msg-user' : 'msg-friend'}">
        <div class="msg-text">${escapeHtml(m.text)}</div>
        <div class="msg-time">${formatTime(m.time)}</div>
      </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
  });
}
async function sendPrivateMessage(e) {
  e.preventDefault();
  const user = localStorage.getItem('ms_current');
  const friendNick = document.getElementById('chatWith').textContent;
  const input = document.getElementById('privateInput');
  const text = input.value.trim();
  if (!text || !friendNick) return;
  const chatId = [user, friendNick].sort().join('_');
  try {
    const doc = await db.collection('private_chats').doc(chatId).get();
    if (!doc.exists) {
      await db.collection('private_chats').doc(chatId).set({
        users: [user, friendNick],
        messages: [{ from: user, text, time: Date.now(), read: false }],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const messages = doc.data().messages || [];
      messages.push({ from: user, text, time: Date.now(), read: false });
      await doc.ref.update({ messages });
    }
    input.value = '';
  } catch(e) { console.error('Send private message error:', e); showToast('Ошибка отправки'); }
}

// ===== ПОДДЕРЖКА =====
let supportListener = null;
function openSupport() {
  const user = localStorage.getItem('ms_current');
  if (!user) { openAuth(); showToast('Сначала войди в аккаунт'); return; }
  if (user === 'admin') { window.location.href = 'admin.html'; return; }
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.add('active');
  listenToPlayerChat();
}
function closeSupport() {
  const modal = document.getElementById('supportModal');
  if (modal) modal.classList.remove('active');
  if (supportListener) { supportListener(); supportListener = null; }
}
function listenToPlayerChat() {
  const user = localStorage.getItem('ms_current');
  if (!user) return;
  if (supportListener) supportListener();
  supportListener = db.collection('support').where('user', '==', user).onSnapshot(snapshot => {
    if (snapshot.empty) {
      db.collection('support').add({ user, messages: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
      renderPlayerChat(snapshot.docs[0].data().messages || []);
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
      await db.collection('support').add({ user, messages: [{ from: user, text, time: Date.now(), read: false }], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
      const chatDoc = snapshot.docs[0];
      const messages = chatDoc.data().messages || [];
      messages.push({ from: user, text, time: Date.now(), read: false });
      await chatDoc.ref.update({ messages });
    }
    input.value = '';
    showToast('Сообщение отправлено');
  } catch(e) { console.error('Send message error:', e); showToast('Ошибка отправки'); }
}
function updateSupportFab() {
  const fab = document.getElementById('supportFab');
  if (!fab) return;
  const user = localStorage.getItem('ms_current');
  if (!user || user === 'admin') { fab.style.display = 'none'; return; }
  fab.style.display = 'flex';
  db.collection('support').where('user', '==', user).onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const messages = snapshot.docs[0].data().messages || [];
      const unread = messages.filter(m => m.from === 'admin' && !m.read).length;
      const badge = fab.querySelector('.fab-badge');
      if (badge) {
        if (unread > 0) { badge.style.display = 'flex'; badge.textContent = unread; }
        else badge.style.display = 'none';
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

function animateCounter(el) {
  const text = el.textContent;
  const match = text.match(/[\d.]+/);
  if (!match) return;
  const target = parseFloat(match[0].replace(/\s/g, ''));
  let current = 0;
  const step = target / 40;
  const interval = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(interval); }
    el.textContent = Math.floor(current).toLocaleString('ru-RU').replace(/,/g, ' ');
  }, 30);
}

function initScrollTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initActiveLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });
}

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
    closeAuth(); closeSupport(); closeProfile(); closeFriends(); closePrivateChat();
  }
});
