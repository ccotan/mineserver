// Копирование IP
function copyIP(el) {
  const ip = el.dataset.ip || 'play.mineserver.ru';
  navigator.clipboard.writeText(ip).then(() => {
    el.classList.add('copied');
    const copy = el.querySelector('.copy');
    if (copy) {
      copy.textContent = '✓ скопировано';
      setTimeout(() => { copy.textContent = 'скопировать'; }, 1500);
    }
  });
}

// Подсветка активного пункта меню
document.addEventListener('DOMContentLoaded', () => {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === current) link.classList.add('active');
  });
});