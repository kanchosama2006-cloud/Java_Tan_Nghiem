// ===== Cac ham dung chung cho tat ca cac trang (Artistic Grandmaster Arena) =====

const $ = (id) => document.getElementById(id);

/** Chong chen ma HTML khi in du lieu nguoi dung ra man hinh. */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** Toast notification hien thi o goc man hinh (Zero emoji, sleek aesthetic) */
function showToast(message, type = 'info', duration = 3200) {
  let container = $('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const markMap = {
    success: 'SUCCESS',
    error: 'ERROR',
    info: 'INFO'
  };

  toast.innerHTML = `
    <span class="toast-tag">${markMap[type] || 'INFO'}</span>
    <span class="toast-msg">${esc(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, duration);
}

/** Goi API tra ve JSON. Neu loi se nem Error co thuoc tinh status va data. */
async function api(path, options = {}) {
  const init = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    cache: 'no-store',
    credentials: 'same-origin'
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(path, init);
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = text; }
  }
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Có lỗi xảy ra, vui lòng thử lại');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Gop thong bao loi + loi tung truong (neu co) thanh mot chuoi de hien thi. */
function errText(e) {
  let msg = e.message || 'Có lỗi xảy ra';
  if (e.data && e.data.fieldErrors) {
    msg += ': ' + Object.values(e.data.fieldErrors).join('; ');
  }
  return msg;
}

function showAlert(el, type, text) {
  if (!el) return;
  el.className = 'alert show ' + type;
  el.textContent = text;
}

function hideAlert(el) {
  if (!el) return;
  el.className = 'alert';
  el.textContent = '';
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN');
}

/** Chu mo ta ket qua cua mot van. */
function resultText(g) {
  if (g.winner === 'X') return g.playerX + ' (X) thắng';
  if (g.winner === 'O') return g.playerO + ' (O) thắng';
  return 'Hòa';
}

/** Kiem tra dang nhap; chua dang nhap thi chuyen ve trang login. */
async function requireLogin() {
  try {
    return await api('/api/auth/me');
  } catch (e) {
    if (e.status === 401) {
      location.replace('login.html');
      return new Promise(() => {});
    }
    throw e;
  }
}

/** Render thanh Navbar toan he thong */
function renderNav(user, active, equipped = {}) {
  const links = [
    { href: 'game.html', label: 'Chơi Cờ', key: 'game' },
    { href: 'shop.html', label: 'Cửa Hàng', key: 'shop' },
    { href: 'achievements.html', label: 'Thành Tựu', key: 'achievements' },
    { href: 'history.html', label: 'Lịch Sử', key: 'history' },
    { href: 'leaderboard.html', label: 'Xếp Hạng', key: 'leaderboard' },
    { href: 'profile.html', label: 'Hồ Sơ', key: 'profile' }
  ];

  if (user && user.role === 'ADMIN') {
    links.push({ href: 'admin.html', label: 'Quản Trị', key: 'admin', isAdmin: true });
  }

  const nav = $('nav');
  if (!nav) return;

  const initial = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
  const frameClass = (equipped.avatarFrameClass || equipped.avatarFrame) ? esc(equipped.avatarFrameClass || equipped.avatarFrame) : '';
  const coinsDisplay = (user.coins !== undefined && user.coins !== null) ? Number(user.coins).toLocaleString('vi-VN') : '500';

  nav.innerHTML = `
    <div class="nav-wrapper">
      <div class="nav">
        <a href="game.html" class="brand">
          <span class="brand-crest"></span>
          <span class="brand-text">GRANDMASTER ARENA</span>
        </a>
        <div class="nav-links">
          ${links.map(l => `
            <a href="${l.href}" class="${l.key === active ? 'active' : ''} ${l.isAdmin ? 'admin-tab' : ''}">
              ${l.label}
            </a>
          `).join('')}
        </div>
        <span class="spacer"></span>
        <div class="nav-user">
          <a href="shop.html" class="coin-badge" title="Ví Xu Đấu Trường">
            <span class="coin-amount" id="navCoinAmount">${coinsDisplay}</span>
            <span class="coin-unit">XU</span>
          </a>
          <div class="nav-avatar-mini ${frameClass}" title="${esc(user.fullName)}">
            <span class="nav-avatar-char">${esc(initial)}</span>
          </div>
          <span class="who">
            <b>${esc(user.fullName)}</b>
            <span class="badge ${esc(user.role)}">${esc(user.role)}</span>
          </span>
          <button id="btnLogout" class="btn small ghost" type="button">Đăng Xuất</button>
        </div>
      </div>
    </div>
  `;

  $('btnLogout').onclick = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    location.replace('login.html');
  };
}

/** Moi trang (tru login) goi ham nay dau tien. */
async function initPage(active) {
  const user = await requireLogin();
  let equipped = {};
  try {
    equipped = await api('/api/shop/my-equipped');
  } catch (e) {
    // Neu chua co data or loi, mac dinh rong
    equipped = {};
  }
  renderNav(user, active, equipped);
  return { user, equipped };
}

/** Cap nhat so xu hien thi tren Navbar ngay lap tuc sau giao dich */
function updateNavCoins(amount) {
  const el = $('navCoinAmount');
  if (el) {
    el.textContent = Number(amount).toLocaleString('vi-VN');
  }
}

/**
 * Xử lý sự kiện pageshow để chặn triệt để BFCache (Back-Forward Cache):
 */
window.addEventListener('pageshow', function (event) {
  const path = window.location.pathname;
  const isLoginPage = path.endsWith('login.html') || path.endsWith('/login');

  if (!isLoginPage) {
    if (event.persisted) {
      requireLogin().catch(() => {
        location.replace('login.html');
      });
    }
  } else {
    if (event.persisted) {
      api('/api/auth/me')
        .then(() => location.replace('game.html'))
        .catch(() => {});
    }
  }
});

// =========================================================
// CUSTOM CONFIRM MODAL (Sleek Grandmaster style, zero emoji)
// =========================================================
function showConfirm({ title = 'Xác Nhận Hành Động', message = 'Bạn có chắc chắn muốn thực hiện thao tác này?', confirmText = 'Xác Nhận', cancelText = 'Hủy Bỏ', isDanger = true }) {
  return new Promise((resolve) => {
    let modal = $('customConfirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customConfirmModal';
      modal.className = 'confirm-modal-bg';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="confirm-card">
        <div class="confirm-crest"></div>
        <div class="confirm-title">${esc(title)}</div>
        <div class="confirm-message">${esc(message)}</div>
        <div class="confirm-actions">
          <button id="cfmCancelBtn" class="btn ghost small" type="button">${esc(cancelText)}</button>
          <button id="cfmOkBtn" class="btn small ${isDanger ? 'danger' : ''}" type="button">${esc(confirmText)}</button>
        </div>
      </div>
    `;

    modal.classList.add('show');

    const cleanUp = (result) => {
      modal.classList.remove('show');
      resolve(result);
    };

    $('cfmCancelBtn').onclick = () => cleanUp(false);
    $('cfmOkBtn').onclick = () => cleanUp(true);
    modal.onclick = (e) => {
      if (e.target === modal) cleanUp(false);
    };
  });
}

// =========================================================
// FORM & BUTTON HELPERS
// =========================================================
function setButtonLoading(btn, isLoading, loadingText = 'Đang xử lý...') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
    }
  }
}

function setFieldError(inputEl, errorEl, msg) {
  if (!inputEl || !errorEl) return;
  if (msg) {
    inputEl.classList.add('is-invalid');
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  } else {
    inputEl.classList.remove('is-invalid');
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }
}

// =========================================================
// UI STATES TEMPLATES (SKELETON, EMPTY, ERROR) - Zero Emojis
// =========================================================
function renderSkeletonRows(colCount, rowCount = 5) {
  let html = '';
  for (let r = 0; r < rowCount; r++) {
    html += '<tr class="skeleton-row">';
    for (let c = 0; c < colCount; c++) {
      html += `<td><div class="skeleton-bar" style="width: ${c === 0 ? '40%' : c === 1 ? '70%' : '55%'}"></div></td>`;
    }
    html += '</tr>';
  }
  return html;
}

function renderEmptyState(colCount, { title = 'Không Có Dữ Liệu', desc = 'Hiện tại chưa ghi nhận bản ghi nào trong hệ thống.', actionText = '', actionHref = '', actionId = '' }) {
  return `
    <tr>
      <td colspan="${colCount}" style="padding: 0;">
        <div class="empty-state">
          <div class="empty-crest"></div>
          <div class="empty-state-title">${esc(title)}</div>
          <div class="empty-state-desc">${esc(desc)}</div>
          ${actionText ? (
            actionHref 
              ? `<a href="${actionHref}" class="btn small">${esc(actionText)}</a>`
              : `<button id="${actionId}" class="btn small" type="button">${esc(actionText)}</button>`
          ) : ''}
        </div>
      </td>
    </tr>
  `;
}

function renderErrorState(colCount, { title = 'Lỗi Kết Nối', desc = 'Không thể tải dữ liệu từ máy chủ đấu trường.', retryId = 'btnRetry' }) {
  return `
    <tr>
      <td colspan="${colCount}" style="padding: 0;">
        <div class="error-state">
          <div class="error-crest"></div>
          <div class="error-state-title">${esc(title)}</div>
          <div class="error-state-desc">${esc(desc)}</div>
          <button id="${retryId}" class="btn small light" type="button" style="margin-top:10px;">Thử Lại (Retry)</button>
        </div>
      </td>
    </tr>
  `;
}
