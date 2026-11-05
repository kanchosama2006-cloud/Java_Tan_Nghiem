let currentCategory = 'ALL';
let shopItems = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  const initData = await initPage('shop');
  currentUser = initData.user;

  bindCategoryTabs();
  bindTxModal();
  loadShopItems();
});

function bindCategoryTabs() {
  const tabs = document.querySelectorAll('.store-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.cat;
      renderShopItems();
    });
  });
}

function bindTxModal() {
  const modal = $('txModal');
  const btnOpen = $('btnTxHistory');
  const btnClose = $('btnCloseTxModal');

  btnOpen.addEventListener('click', async () => {
    modal.classList.add('show');
    loadTransactions();
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });
}

async function loadShopItems() {
  const container = $('shopGrid');
  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <span class="btn-spinner"></span> Đang tải danh sách vật phẩm đấu trường...
    </div>
  `;

  try {
    shopItems = await api('/api/shop/items');
    renderShopItems();
  } catch (e) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <div class="error-crest"></div>
        <p style="color: #ef4444; margin-bottom: 12px;">${esc(e.message || 'Không thể tải vật phẩm cửa hàng')}</p>
        <button id="btnRetryShop" class="btn small" type="button">Thử Lại</button>
      </div>
    `;
    const btnRetry = $('btnRetryShop');
    if (btnRetry) btnRetry.onclick = loadShopItems;
  }
}

function renderShopItems() {
  const container = $('shopGrid');
  const filtered = currentCategory === 'ALL' 
    ? shopItems 
    : shopItems.filter(i => i.category === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
        <div class="empty-crest"></div>
        <h3 style="color: #fff; margin-bottom: 6px;">Không Tìm Thấy Vật Phẩm</h3>
        <p style="color: var(--text-muted);">Hiện chưa có vật phẩm nào trong phân mục này.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    let previewHtml = '';
    if (item.category === 'BOARD_THEME') {
      previewHtml = `
        <div class="shop-item-preview ${esc(item.cssClass)}" style="background: ${esc(item.previewGradient)}">
          <div style="display: grid; grid-template-columns: repeat(3, 24px); gap: 4px;">
            <div style="width:24px;height:24px;background:rgba(255,255,255,0.1);border-radius:4px;"></div>
            <div style="width:24px;height:24px;background:rgba(255,255,255,0.1);border-radius:4px;"></div>
            <div style="width:24px;height:24px;background:rgba(255,255,255,0.1);border-radius:4px;"></div>
          </div>
        </div>
      `;
    } else if (item.category === 'PIECE_SKIN') {
      previewHtml = `
        <div class="shop-item-preview" style="background: ${esc(item.previewGradient)}">
          <div style="display: flex; gap: 16px;">
            <div class="preview-cell ${esc(item.cssClass)}"><span class="cell-x">X</span></div>
            <div class="preview-cell ${esc(item.cssClass)}"><span class="cell-o">O</span></div>
          </div>
        </div>
      `;
    } else {
      // AVATAR_FRAME
      previewHtml = `
        <div class="shop-item-preview" style="background: rgba(15, 23, 42, 0.9);">
          <div class="preview-avatar ${esc(item.cssClass)}" style="box-shadow: 0 0 16px rgba(255,255,255,0.2);">
            <span style="color: #fff; font-size: 1.2rem;">K</span>
          </div>
        </div>
      `;
    }

    let actionBtnHtml = '';
    if (item.owned) {
      if (item.equipped) {
        actionBtnHtml = `<button class="btn small ghost" disabled type="button">Đang Trang Bị</button>`;
      } else {
        actionBtnHtml = `<button class="btn small light btn-equip" data-id="${item.id}" type="button">Trang Bị</button>`;
      }
    } else {
      actionBtnHtml = `<button class="btn small btn-buy" data-id="${item.id}" data-name="${esc(item.name)}" data-price="${item.price}" type="button">Mua Ngay</button>`;
    }

    return `
      <div class="shop-item-card">
        ${previewHtml}
        <div class="shop-item-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div class="shop-item-name">${esc(item.name)}</div>
            ${item.equipped ? '<span class="shop-status-badge equipped">ĐANG DÙNG</span>' : item.owned ? '<span class="shop-status-badge owned">ĐÃ CÓ</span>' : ''}
          </div>
          <div class="shop-item-desc">${esc(item.description || '')}</div>
          <div class="shop-item-meta">
            <div class="shop-item-price">${item.price.toLocaleString('vi-VN')} <span style="font-size: 0.75rem; color: #d4af37;">XU</span></div>
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  bindItemActions();
}

function bindItemActions() {
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price);

      const confirmed = await showConfirm({
        title: 'MUA VẬT PHẨM',
        message: `Bạn có muốn dùng ${price.toLocaleString('vi-VN')} Xu để sở hữu "${name}" không?`,
        confirmText: 'MUA NGAY',
        cancelText: 'HỦY',
        isDanger: false
      });

      if (!confirmed) return;

      setButtonLoading(btn, true, 'Đang giao dịch...');
      try {
        const res = await api(`/api/shop/buy/${id}`, { method: 'POST' });
        showToast(res.message || 'Giao dịch thành công!', 'success');
        updateNavCoins(res.newBalance || (currentUser.coins - price));
        loadShopItems();
      } catch (e) {
        showToast(errText(e), 'error');
        setButtonLoading(btn, false);
      }
    };
  });

  document.querySelectorAll('.btn-equip').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      setButtonLoading(btn, true, 'Đang trang bị...');
      try {
        const res = await api(`/api/shop/equip/${id}`, { method: 'POST' });
        showToast(res.message || 'Đã trang bị vật phẩm!', 'success');
        // Refresh page cosmetics
        const equipped = await api('/api/shop/my-equipped');
        const user = await api('/api/auth/me');
        renderNav(user, 'shop', equipped);
        loadShopItems();
      } catch (e) {
        showToast(errText(e), 'error');
        setButtonLoading(btn, false);
      }
    };
  });
}

async function loadTransactions() {
  const tbody = $('txTableBody');
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;"><span class="btn-spinner"></span> Đang tải...</td></tr>`;

  try {
    const list = await api('/api/shop/transactions');
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--text-muted);">Chưa có giao dịch nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(tx => {
      const isPositive = tx.amount > 0;
      const color = isPositive ? '#10b981' : '#ef4444';
      const sign = isPositive ? '+' : '';
      return `
        <tr>
          <td style="font-size:0.85rem; color:var(--text-muted);">${fmtDate(tx.createdAt)}</td>
          <td style="font-weight:700; color:${color}; font-family:'Orbitron', monospace;">${sign}${tx.amount.toLocaleString('vi-VN')} XU</td>
          <td style="font-weight:600; color:#fff; font-family:'Orbitron', monospace;">${tx.balanceAfter.toLocaleString('vi-VN')} XU</td>
          <td style="font-size:0.88rem; color:var(--text-main);">${esc(tx.description)}</td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #ef4444;">${esc(e.message)}</td></tr>`;
  }
}
