// ===== Trang Quan Tri He Thong: E-Commerce Admin Suite, KPIs, Products CRUD & Moderation =====
(async function () {
  const initData = await initPage('admin');
  const user = initData.user;
  if (user.role !== 'ADMIN') {
    location.replace('game.html');
    return;
  }

  // Bind Sidebar Tabs
  const tabBtns = document.querySelectorAll('.admin-nav-item');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const targetId = 'tab-' + btn.dataset.tab;
      const targetEl = $(targetId);
      if (targetEl) targetEl.style.display = 'block';

      if (btn.dataset.tab === 'dashboard') loadDashboard();
      if (btn.dataset.tab === 'shop') loadAdminShop();
      if (btn.dataset.tab === 'transactions') loadAdminTransactions();
      if (btn.dataset.tab === 'users') loadUsers();
      if (btn.dataset.tab === 'comments') loadAdminComments();
      if (btn.dataset.tab === 'games') loadGames();
    };
  });

  // =========================================================
  // TAB 1: DASHBOARD & KPIS (CHART.JS)
  // =========================================================
  let ratioChartInstance = null;
  let categoryChartInstance = null;

  async function loadDashboard() {
    try {
      const data = await api('/api/admin/dashboard');

      $('kpiRevenue').textContent = Number(data.totalCoinsSpent || 0).toLocaleString('vi-VN') + ' XU';
      $('kpiItemsSold').textContent = Number(data.totalItemsSold || 0).toLocaleString('vi-VN');
      $('kpiUsers').textContent = Number(data.totalUsers || 0).toLocaleString('vi-VN');
      $('kpiGames').textContent = Number(data.totalGames || 0).toLocaleString('vi-VN');

      // 1. Chart Tỷ Lệ Kết Quả
      const ctxRatio = $('ratioChart');
      if (ctxRatio) {
        if (ratioChartInstance) ratioChartInstance.destroy();
        ratioChartInstance = new Chart(ctxRatio, {
          type: 'doughnut',
          data: {
            labels: ['X Thắng', 'O Thắng', 'Hòa'],
            datasets: [{
              data: [data.xWins, data.oWins, data.draws],
              backgroundColor: ['#f43f5e', '#06b6d4', '#fbbf24'],
              borderWidth: 2,
              borderColor: '#0f172a'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
          }
        });
      }

      // 2. Chart Doanh Thu Danh Mục
      const ctxCat = $('categoryRevenueChart');
      if (ctxCat) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        const catMap = data.categoryRevenue || {};
        const catLabels = Object.keys(catMap);
        const catValues = Object.values(catMap);

        categoryChartInstance = new Chart(ctxCat, {
          type: 'bar',
          data: {
            labels: catLabels.length ? catLabels : ['Chưa có'],
            datasets: [{
              label: 'Doanh Thu (Xu)',
              data: catValues.length ? catValues : [0],
              backgroundColor: '#6366f1',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
              y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    } catch (e) {
      showToast('Lỗi tải dữ liệu Dashboard: ' + errText(e), 'error');
    }
  }

  // =========================================================
  // TAB 2: SHOP PRODUCTS MANAGEMENT
  // =========================================================
  const shopRows = $('adminShopRows');
  const shopModal = $('shopItemModal');
  const shopForm = $('shopItemForm');

  $('btnOpenNewItemModal').onclick = () => {
    $('shopModalTitle').textContent = 'THÊM VẬT PHẨM MỚI';
    $('shopItemId').value = '';
    shopForm.reset();
    shopModal.classList.add('show');
  };

  $('btnCancelShopModal').onclick = () => shopModal.classList.remove('show');
  shopModal.onclick = (e) => { if (e.target === shopModal) shopModal.classList.remove('show'); };

  async function loadAdminShop() {
    shopRows.innerHTML = renderSkeletonRows(7, 4);
    try {
      const items = await api('/api/admin/shop-items');
      if (!items || items.length === 0) {
        shopRows.innerHTML = renderEmptyState(7, { title: 'Chưa có sản phẩm', desc: 'Hãy thêm sản phẩm đầu tiên cho shop.' });
        return;
      }

      shopRows.innerHTML = items.map(i => `
        <tr>
          <td><b style="font-family:'Orbitron',monospace; color:var(--text-muted);">${esc(i.code)}</b></td>
          <td><b>${esc(i.name)}</b></td>
          <td><span class="badge" style="background:rgba(255,255,255,0.08);">${esc(i.category)}</span></td>
          <td style="font-family:'Orbitron',monospace; color:#fef08a; font-weight:700;">${i.price.toLocaleString('vi-VN')} XU</td>
          <td><code>${esc(i.cssClass)}</code></td>
          <td>${i.active ? '<span style="color:#10b981; font-weight:700;">Hoạt động</span>' : '<span style="color:#ef4444;">Đã ẩn</span>'}</td>
          <td style="text-align: right;">
            <button class="btn small light btn-edit-item" data-id="${i.id}" type="button">Sửa</button>
            <button class="btn small danger btn-del-item" data-id="${i.id}" data-name="${esc(i.name)}" type="button">Xóa</button>
          </td>
        </tr>
      `).join('');

      // Bind edit / del
      document.querySelectorAll('.btn-edit-item').forEach(b => {
        b.onclick = () => {
          const it = items.find(x => x.id == b.dataset.id);
          if (!it) return;
          $('shopModalTitle').textContent = 'CẬP NHẬT VẬT PHẨM';
          $('shopItemId').value = it.id;
          $('itemCode').value = it.code;
          $('itemName').value = it.name;
          $('itemCategory').value = it.category;
          $('itemPrice').value = it.price;
          $('itemCssClass').value = it.cssClass;
          $('itemGradient').value = it.previewGradient;
          $('itemDesc').value = it.description || '';
          shopModal.classList.add('show');
        };
      });

      document.querySelectorAll('.btn-del-item').forEach(b => {
        b.onclick = async () => {
          const confirmed = await showConfirm({
            title: 'XÓA SẢN PHẨM',
            message: `Bạn có chắc chắn muốn xóa "${b.dataset.name}" khỏi cửa hàng?`,
            confirmText: 'XÓA',
            cancelText: 'HỦY',
            isDanger: true
          });
          if (!confirmed) return;

          try {
            await api(`/api/admin/shop-items/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Đã xóa vật phẩm thành công!', 'success');
            loadAdminShop();
          } catch (err) {
            showToast(errText(err), 'error');
          }
        };
      });
    } catch (e) {
      shopRows.innerHTML = renderErrorState(7, { desc: errText(e), retryId: 'btnRetryAdminShop' });
      const retry = $('btnRetryAdminShop');
      if (retry) retry.onclick = loadAdminShop;
    }
  }

  shopForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = $('shopItemId').value;
    const body = {
      code: $('itemCode').value.trim(),
      name: $('itemName').value.trim(),
      category: $('itemCategory').value,
      price: parseInt($('itemPrice').value, 10),
      cssClass: $('itemCssClass').value.trim(),
      previewGradient: $('itemGradient').value.trim(),
      description: $('itemDesc').value.trim(),
      active: true
    };

    const submitBtn = $('btnSaveShopItem');
    setButtonLoading(submitBtn, true, 'Đang lưu...');

    try {
      if (id) {
        await api(`/api/admin/shop-items/${id}`, { method: 'PUT', body });
        showToast('Đã cập nhật sản phẩm thành công!', 'success');
      } else {
        await api('/api/admin/shop-items', { method: 'POST', body });
        showToast('Đã thêm sản phẩm mới vào shop!', 'success');
      }
      shopModal.classList.remove('show');
      loadAdminShop();
    } catch (err) {
      showToast(errText(err), 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  };

  // =========================================================
  // TAB 3: TRANSACTIONS LOG
  // =========================================================
  const txRows = $('adminTxRows');
  async function loadAdminTransactions() {
    txRows.innerHTML = renderSkeletonRows(7, 5);
    try {
      const list = await api('/api/admin/transactions');
      if (!list || list.length === 0) {
        txRows.innerHTML = renderEmptyState(7, { title: 'Chưa có giao dịch', desc: 'Server chưa ghi nhận giao dịch nào.' });
        return;
      }

      txRows.innerHTML = list.map(tx => {
        const isPos = tx.amount > 0;
        const color = isPos ? '#10b981' : '#ef4444';
        const sign = isPos ? '+' : '';
        return `
          <tr>
            <td><b style="font-family:'Orbitron',monospace; color:var(--text-muted);">#${tx.id}</b></td>
            <td style="font-size:0.85rem; color:var(--text-muted);">${fmtDate(tx.createdAt)}</td>
            <td><b>${esc(tx.userFullName || tx.username || 'N/A')}</b></td>
            <td style="font-weight:700; color:${color}; font-family:'Orbitron', monospace;">${sign}${tx.amount.toLocaleString('vi-VN')} XU</td>
            <td style="font-weight:600; color:#fff; font-family:'Orbitron', monospace;">${tx.balanceAfter.toLocaleString('vi-VN')} XU</td>
            <td><span class="badge" style="background:rgba(255,255,255,0.08);">${esc(tx.type)}</span></td>
            <td style="font-size:0.88rem;">${esc(tx.description)}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      txRows.innerHTML = renderErrorState(7, { desc: errText(e), retryId: 'btnRetryAdminTx' });
      const retry = $('btnRetryAdminTx');
      if (retry) retry.onclick = loadAdminTransactions;
    }
  }

  // =========================================================
  // TAB 4: USERS MANAGEMENT & COIN ADJUSTMENT
  // =========================================================
  const userRows = $('userRows');
  const userSearch = $('userSearch');
  const coinModal = $('coinModal');
  const coinForm = $('coinAdjustForm');

  $('btnReloadUsers').onclick = loadUsers;
  userSearch.oninput = () => {
    const q = userSearch.value.trim().toLowerCase();
    document.querySelectorAll('#userRows tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  };

  $('btnCancelCoinModal').onclick = () => coinModal.classList.remove('show');
  coinModal.onclick = (e) => { if (e.target === coinModal) coinModal.classList.remove('show'); };

  async function loadUsers() {
    userRows.innerHTML = renderSkeletonRows(7, 5);
    try {
      const users = await api('/api/admin/users');
      if (!users || users.length === 0) {
        userRows.innerHTML = renderEmptyState(7, { title: 'Không tìm thấy người dùng' });
        return;
      }

      userRows.innerHTML = users.map(u => `
        <tr id="userRow-${u.id}">
          <td><b style="font-family:'Orbitron',monospace; color:var(--text-muted);">#${u.id}</b></td>
          <td><b>${esc(u.username)}</b></td>
          <td>${esc(u.fullName)}</td>
          <td><span class="badge ${esc(u.role)}">${esc(u.role)}</span></td>
          <td style="font-family:'Orbitron',monospace; font-weight:700; color:#fef08a;">${(u.coins || 0).toLocaleString('vi-VN')} XU</td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${fmtDate(u.createdAt)}</td>
          <td style="text-align: right;">
            <div class="table-actions" style="justify-content: flex-end;">
              <button class="btn small light btn-adjust-coin" data-id="${u.id}" data-name="${esc(u.fullName)}" type="button">Sửa Xu</button>
              ${u.id !== user.id ? `
                <button class="btn small light btn-toggle-role" data-id="${u.id}" data-role="${u.role}" type="button">
                  ${u.role === 'ADMIN' ? 'Hạ Quyền' : 'Nâng Admin'}
                </button>
                <button class="btn small danger btn-del-user" data-id="${u.id}" data-name="${esc(u.fullName)}" type="button">Xóa</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');

      // Bind coin modal
      document.querySelectorAll('.btn-adjust-coin').forEach(b => {
        b.onclick = () => {
          $('adjustUserId').value = b.dataset.id;
          $('adjustUserName').textContent = 'Kỳ Thủ: ' + b.dataset.name;
          coinForm.reset();
          coinModal.classList.add('show');
        };
      });

      // Bind toggle role
      document.querySelectorAll('.btn-toggle-role').forEach(b => {
        b.onclick = async () => {
          const targetRole = b.dataset.role === 'ADMIN' ? 'PLAYER' : 'ADMIN';
          try {
            await api(`/api/admin/users/${b.dataset.id}/role`, { method: 'PUT', body: { role: targetRole } });
            showToast('Đã cập nhật vai trò người dùng!', 'success');
            loadUsers();
          } catch (err) {
            showToast(errText(err), 'error');
          }
        };
      });

      // Bind delete user
      document.querySelectorAll('.btn-del-user').forEach(b => {
        b.onclick = async () => {
          const confirmed = await showConfirm({
            title: 'XÓA TÀI KHOẢN',
            message: `Bạn có chắc muốn xóa tài khoản "${b.dataset.name}" và toàn bộ dữ liệu kèm theo?`,
            confirmText: 'XÓA VĨNH VIỄN',
            cancelText: 'HỦY',
            isDanger: true
          });
          if (!confirmed) return;

          try {
            await api(`/api/admin/users/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Đã xóa người dùng thành công!', 'success');
            loadUsers();
          } catch (err) {
            showToast(errText(err), 'error');
          }
        };
      });
    } catch (e) {
      userRows.innerHTML = renderErrorState(7, { desc: errText(e), retryId: 'btnRetryUsers' });
      const retry = $('btnRetryUsers');
      if (retry) retry.onclick = loadUsers;
    }
  }

  coinForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = $('adjustUserId').value;
    const amount = parseInt($('adjustAmount').value, 10);
    const reason = $('adjustReason').value.trim();

    const submitBtn = $('btnSubmitCoinAdjust');
    setButtonLoading(submitBtn, true, 'Đang thực hiện...');

    try {
      await api(`/api/admin/users/${id}/coins`, {
        method: 'POST',
        body: { amount, reason }
      });
      showToast('Đã cập nhật số dư Xu thành công!', 'success');
      coinModal.classList.remove('show');
      loadUsers();
      loadDashboard();
    } catch (err) {
      showToast(errText(err), 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  };

  // =========================================================
  // TAB 5: COMMENTS MODERATION
  // =========================================================
  const commentRows = $('adminCommentRows');
  async function loadAdminComments() {
    commentRows.innerHTML = renderSkeletonRows(7, 4);
    try {
      const list = await api('/api/admin/comments');
      if (!list || list.length === 0) {
        commentRows.innerHTML = renderEmptyState(7, { title: 'Chưa có bình luận', desc: 'Không có nhận xét nào cần kiểm duyệt.' });
        return;
      }

      commentRows.innerHTML = list.map(c => `
        <tr>
          <td><b style="font-family:'Orbitron',monospace; color:var(--text-muted);">#${c.id}</b></td>
          <td><b style="font-family:'Orbitron',monospace; color:#38bdf8;">Ván #${c.gameId}</b></td>
          <td><b>${esc(c.userFullName || c.username)}</b></td>
          <td><span class="comment-rating-tag">${c.rating} ĐIỂM</span></td>
          <td style="max-width:320px; font-size:0.9rem;">${esc(c.content)}</td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${fmtDate(c.createdAt)}</td>
          <td style="text-align: right;">
            <button class="btn small danger btn-del-comment" data-id="${c.id}" type="button">Xóa</button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-del-comment').forEach(b => {
        b.onclick = async () => {
          const confirmed = await showConfirm({
            title: 'XÓA BÌNH LUẬN',
            message: 'Bạn có chắc chắn muốn gỡ bỏ bình luận này khỏi hệ thống?',
            confirmText: 'GỠ BỎ',
            cancelText: 'HỦY',
            isDanger: true
          });
          if (!confirmed) return;

          try {
            await api(`/api/admin/comments/${b.dataset.id}`, { method: 'DELETE' });
            showToast('Đã xóa bình luận vi phạm!', 'success');
            loadAdminComments();
          } catch (err) {
            showToast(errText(err), 'error');
          }
        };
      });
    } catch (e) {
      commentRows.innerHTML = renderErrorState(7, { desc: errText(e), retryId: 'btnRetryAdminComments' });
      const retry = $('btnRetryAdminComments');
      if (retry) retry.onclick = loadAdminComments;
    }
  }

  // =========================================================
  // TAB 6: ALL GAMES REPLAY
  // =========================================================
  const gameRows = $('gameRows');
  const gameFilter = $('gameResultFilter');
  $('btnReloadGames').onclick = loadGames;
  gameFilter.onchange = loadGames;

  async function loadGames() {
    gameRows.innerHTML = renderSkeletonRows(7, 5);
    try {
      const games = await api('/api/admin/games');
      const filterVal = gameFilter.value;
      const filtered = (filterVal === 'ALL') ? games : games.filter(g => g.winner === filterVal);

      if (!filtered || filtered.length === 0) {
        gameRows.innerHTML = renderEmptyState(7, { title: 'Không có ván đấu' });
        return;
      }

      gameRows.innerHTML = filtered.map(g => `
        <tr>
          <td><b style="font-family:'Orbitron',monospace; color:var(--text-muted);">#${g.id}</b></td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${fmtDate(g.startedAt)}</td>
          <td><b>${esc(g.username)}</b></td>
          <td><span style="color:var(--x-color); font-weight:600;">${esc(g.playerX)}</span></td>
          <td><span style="color:var(--o-color); font-weight:600;">${esc(g.playerO)}</span></td>
          <td><span class="badge ${g.winner}">${esc(resultText(g))}</span></td>
          <td style="text-align: right;">
            <button class="btn small light btn-view-game" data-id="${g.id}" type="button">Xem Lại</button>
            <button class="btn small danger btn-del-game" data-id="${g.id}" type="button">Xóa</button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-view-game').forEach(b => {
        b.onclick = () => openReplay(b.dataset.id);
      });

      document.querySelectorAll('.btn-del-game').forEach(b => {
        b.onclick = async () => {
          const confirmed = await showConfirm({
            title: 'XÓA VÁN CỜ #' + b.dataset.id,
            message: 'Bạn có chắc chắn muốn xóa ván đấu này khỏi hệ thống?',
            confirmText: 'XÓA',
            cancelText: 'HỦY',
            isDanger: true
          });
          if (!confirmed) return;

          try {
            await api('/api/games/' + b.dataset.id, { method: 'DELETE' });
            showToast('Đã xóa ván cờ thành công!', 'success');
            loadGames();
            loadDashboard();
          } catch (err) {
            showToast(errText(err), 'error');
          }
        };
      });
    } catch (e) {
      gameRows.innerHTML = renderErrorState(7, { desc: errText(e), retryId: 'btnRetryGames' });
      const retry = $('btnRetryGames');
      if (retry) retry.onclick = loadGames;
    }
  }

  // REPLAY LOGIC
  let replay = null;
  let replayCells = [];

  function detectSizeFromMoves(moves) {
    if (!moves || moves.length === 0) return 3;
    let max = 0;
    for (const m of moves) max = Math.max(max, Math.max(m.row, m.col));
    if (max >= 5) return 10;
    if (max >= 3) return 5;
    return 3;
  }

  function isInfiniteGame(moves, size) {
    if (size !== 3 || !moves) return false;
    if (moves.length > 9) return true;
    const seen = new Set();
    for (const m of moves) {
      const key = `${m.row},${m.col}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }

  function buildReplayBoard(size) {
    const boardEl = $('mBoard');
    boardEl.innerHTML = '';
    boardEl.className = `board mini board-${size}`;
    replayCells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const d = document.createElement('div');
        d.className = 'cell';
        boardEl.appendChild(d);
        replayCells.push(d);
      }
    }
  }

  async function openReplay(id) {
    try {
      const g = await api('/api/games/' + id);
      const size = detectSizeFromMoves(g.moves);
      buildReplayBoard(size);
      replay = { game: g, step: g.moves.length, size };
      $('mTitle').textContent = `Ván #${g.id} (${size}x${size}): ${g.playerX} (X) vs ${g.playerO} (O)`;
      drawReplay();
      $('modalBg').classList.add('show');
    } catch (e) {
      showToast(errText(e), 'error');
    }
  }

  function drawReplay() {
    const { game, step, size } = replay;
    const isInfinite = isInfiniteGame(game.moves, size);
    const board = Array.from({ length: size }, () => Array(size).fill(''));
    const qX = [];
    const qO = [];

    for (let i = 0; i < step; i++) {
      const m = game.moves[i];
      if (isInfinite) {
        const q = (m.symbol === 'X') ? qX : qO;
        if (q.length >= 3) {
          const rm = q.shift();
          board[rm[0]][rm[1]] = '';
        }
        board[m.row][m.col] = m.symbol;
        q.push([m.row, m.col]);
      } else {
        board[m.row][m.col] = m.symbol;
      }
    }

    let dyingCoord = null;
    if (isInfinite && step < game.moves.length) {
      const nextMove = game.moves[step];
      const activeQueue = (nextMove.symbol === 'X') ? qX : qO;
      if (activeQueue.length >= 3) dyingCoord = activeQueue[0];
    }

    replayCells.forEach((c, idx) => {
      const r = Math.floor(idx / size);
      const col = idx % size;
      const val = board[r][col];
      c.textContent = val;
      let cls = 'cell';
      if (val) cls += ' ' + val;
      if (dyingCoord && dyingCoord[0] === r && dyingCoord[1] === col) cls += ' piece-dying';
      c.className = cls;
    });

    $('mInfo').textContent = `Bàn ${size}x${size} • Nước đi: ${step} / ${game.moves.length}${isInfinite ? ' • [Luật Vô Tận]' : ''}`;
    $('mFirst').disabled = step === 0;
    $('mPrev').disabled = step === 0;
    $('mNext').disabled = step === game.moves.length;
    $('mLast').disabled = step === game.moves.length;
  }

  $('mFirst').onclick = () => { replay.step = 0; drawReplay(); };
  $('mPrev').onclick = () => { if (replay.step > 0) { replay.step--; drawReplay(); } };
  $('mNext').onclick = () => { if (replay.step < replay.game.moves.length) { replay.step++; drawReplay(); } };
  $('mLast').onclick = () => { replay.step = replay.game.moves.length; drawReplay(); };
  $('mClose').onclick = () => $('modalBg').classList.remove('show');
  $('modalBg').onclick = (e) => { if (e.target === $('modalBg')) $('modalBg').classList.remove('show'); };

  // Khoi tao tab Dashboard dau tien
  loadDashboard();
})();
