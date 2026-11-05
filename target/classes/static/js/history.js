// ===== Trang lich su: danh sach, xem lai, sua ten, xoa, danh gia & binh luan (Artistic Grandmaster Arena) =====
(async function () {
  const initData = await initPage('history');
  const user = initData.user;
  const isAdmin = user.role === 'ADMIN';
  const alertBox = $('alert');
  if (isAdmin) $('thUser').style.display = '';

  const colCount = isAdmin ? 7 : 6;
  const rowsEl = $('rows');

  let activeGameId = null;

  // ---------- Danh sach ----------
  async function load() {
    hideAlert(alertBox);
    rowsEl.innerHTML = renderSkeletonRows(colCount, 5);

    try {
      const games = await api('/api/games');

      if (!games || games.length === 0) {
        rowsEl.innerHTML = renderEmptyState(colCount, {
          title: 'Chưa Có Ván Cờ Nào',
          desc: 'Bạn chưa tham gia ván đấu nào. Hãy vào game và tạo nên chiến thắng đầu tiên!',
          actionText: 'Bắt Đầu Ván Mới Ngay',
          actionHref: 'game.html'
        });
        return;
      }

      rowsEl.innerHTML = games.map((g) => `
        <tr id="gameRow-${g.id}">
          <td><b style="font-family:'Orbitron',monospace; color:var(--text-muted)">#${g.id}</b></td>
          <td>${esc(fmtDate(g.startedAt))}</td>
          ${isAdmin ? `<td><b>${esc(g.username)}</b></td>` : ''}
          <td><span id="pX-${g.id}" style="color:var(--x-color); font-weight:600;">${esc(g.playerX)}</span></td>
          <td><span id="pO-${g.id}" style="color:var(--o-color); font-weight:600;">${esc(g.playerO)}</span></td>
          <td><span class="badge ${g.winner}">${esc(resultText(g))}</span></td>
          <td style="text-align: right;">
            <div class="table-actions" style="justify-content: flex-end;">
              <button class="btn small light" data-act="view" data-id="${g.id}">Xem Lại</button>
              <button class="btn small light" data-act="edit" data-id="${g.id}">Đổi Tên</button>
              <button class="btn small danger" data-act="del" data-id="${g.id}">Xóa</button>
            </div>
          </td>
        </tr>`).join('');
    } catch (e) {
      showToast(errText(e), 'error');
      rowsEl.innerHTML = renderErrorState(colCount, {
        title: 'Lỗi Tải Lịch Sử',
        desc: errText(e),
        retryId: 'btnRetryHistory'
      });
      const retryBtn = $('btnRetryHistory');
      if (retryBtn) retryBtn.onclick = load;
    }
  }

  rowsEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === 'view') openReplay(id);
    if (btn.dataset.act === 'edit') editNames(id);
    if (btn.dataset.act === 'del') removeGame(id);
  });

  async function editNames(id) {
    try {
      const g = await api('/api/games/' + id);
      const x = prompt('Nhập tên mới cho kỳ thủ X:', g.playerX);
      if (x === null) return;
      const o = prompt('Nhập tên mới cho kỳ thủ O:', g.playerO);
      if (o === null) return;

      await api('/api/games/' + id, { method: 'PUT', body: { playerX: x, playerO: o } });
      showToast('Đã cập nhật tên kỳ thủ thành công!', 'success');

      const elX = $('pX-' + id);
      const elO = $('pO-' + id);
      if (elX) elX.textContent = x.trim() || 'Kỳ thủ X';
      if (elO) elO.textContent = o.trim() || 'Kỳ thủ O';
    } catch (e) {
      showToast(errText(e), 'error');
    }
  }

  async function removeGame(id) {
    const confirmed = await showConfirm({
      title: 'XÓA VÁN CỜ #' + id,
      message: 'Bạn có chắc chắn muốn xóa ván đấu này? Điểm số tích lũy của bạn sẽ được tự động trừ đi tương ứng.',
      confirmText: 'XÁC NHẬN XÓA',
      cancelText: 'HỦY',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      await api('/api/games/' + id, { method: 'DELETE' });
      showToast('Đã xóa ván cờ thành công!', 'success');

      const row = $('gameRow-' + id);
      if (row) {
        row.classList.add('row-fade-out');
        setTimeout(() => {
          row.remove();
          if (rowsEl.querySelectorAll('tr').length === 0) {
            load();
          }
        }, 350);
      }
    } catch (e) {
      showToast(errText(e), 'error');
    }
  }

  // ---------- Xem lai van ----------
  let replay = null;
  let replaySize = 3;
  let replayCells = [];

  function detectSizeFromMoves(moves) {
    if (!moves || moves.length === 0) return 3;
    let max = 0;
    for (const m of moves) {
      max = Math.max(max, Math.max(m.row, m.col));
    }
    if (max >= 5) return 10;
    if (max >= 3) return 5;
    return 3;
  }

  function isInfiniteGame(moves, size) {
    if (size !== 3) return false;
    if (!moves) return false;
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
        d.dataset.r = r;
        d.dataset.c = c;
        boardEl.appendChild(d);
        replayCells.push(d);
      }
    }
  }

  async function openReplay(id) {
    activeGameId = id;
    try {
      const g = await api('/api/games/' + id);
      replaySize = detectSizeFromMoves(g.moves);
      buildReplayBoard(replaySize);

      replay = { game: g, step: g.moves.length, size: replaySize };
      $('mTitle').textContent = `Ván #${g.id} (${replaySize}x${replaySize}): ${g.playerX} (X) vs ${g.playerO} (O)`;
      drawReplay();
      $('modalBg').classList.add('show');

      // Load Comments for this game
      loadComments(id);
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
        const queue = (m.symbol === 'X') ? qX : qO;
        if (queue.length >= 3) {
          const removed = queue.shift();
          board[removed[0]][removed[1]] = '';
        }
        board[m.row][m.col] = m.symbol;
        queue.push([m.row, m.col]);
      } else {
        board[m.row][m.col] = m.symbol;
      }
    }

    let dyingCoord = null;
    if (isInfinite && step < game.moves.length) {
      const nextMove = game.moves[step];
      const activeQueue = (nextMove.symbol === 'X') ? qX : qO;
      if (activeQueue.length >= 3) {
        dyingCoord = activeQueue[0];
      }
    }

    replayCells.forEach((c) => {
      const r = parseInt(c.dataset.r, 10);
      const col = parseInt(c.dataset.c, 10);
      const val = board[r][col];

      c.textContent = val;
      let classes = 'cell';
      if (val) classes += ' ' + val;
      if (dyingCoord && dyingCoord[0] === r && dyingCoord[1] === col) {
        classes += ' piece-dying';
      }
      c.className = classes;
    });

    let infoText = `Bàn ${size}x${size} • Nước đi: ${step} / ${game.moves.length}`;
    if (isInfinite) {
      infoText += ` • [Luật Vô Tận]`;
    }
    $('mInfo').textContent = infoText;

    $('mFirst').disabled = step === 0;
    $('mPrev').disabled = step === 0;
    $('mNext').disabled = step === game.moves.length;
    $('mLast').disabled = step === game.moves.length;
  }

  // Bind controls
  $('mFirst').onclick = () => { replay.step = 0; drawReplay(); };
  $('mPrev').onclick = () => { if (replay.step > 0) { replay.step--; drawReplay(); } };
  $('mNext').onclick = () => { if (replay.step < replay.game.moves.length) { replay.step++; drawReplay(); } };
  $('mLast').onclick = () => { replay.step = replay.game.moves.length; drawReplay(); };
  
  const closeModal = () => $('modalBg').classList.remove('show');
  if ($('mCloseTop')) $('mCloseTop').onclick = closeModal;
  $('modalBg').onclick = (e) => { if (e.target === $('modalBg')) closeModal(); };

  // =========================================================
  // COMMENTS & RATINGS
  // =========================================================
  const starBtns = document.querySelectorAll('#starRatingSelector .star-point');
  const ratingInput = $('ratingInput');
  starBtns.forEach(btn => {
    btn.onclick = () => {
      starBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      ratingInput.value = btn.dataset.star;
    };
  });

  async function loadComments(gameId) {
    const listEl = $('commentList');
    const summaryEl = $('commentSummaryScore');
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 12px;">Đang tải bình luận...</div>`;

    try {
      const summary = await api(`/api/games/${gameId}/comments`);
      summaryEl.textContent = `${summary.averageRating.toFixed(1)} / 5 (${summary.totalComments} ĐÁNH GIÁ)`;

      if (!summary.comments || summary.comments.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 16px;">Chưa có bình luận nào cho ván đấu này. Hãy là người đầu tiên để lại nhận xét!</div>`;
        return;
      }

      listEl.innerHTML = summary.comments.map(c => {
        const frameClass = c.avatarFrame ? esc(c.avatarFrame) : '';
        const initial = (c.userFullName || c.username || 'U').charAt(0).toUpperCase();
        return `
          <div class="comment-item">
            <div class="comment-author-row">
              <div class="nav-avatar-mini ${frameClass}" style="width: 28px; height: 28px; font-size: 0.8rem;">
                <span class="nav-avatar-char">${esc(initial)}</span>
              </div>
              <b style="color: #fff; font-size: 0.88rem;">${esc(c.userFullName)}</b>
              <span class="comment-rating-tag">${c.rating} ĐIỂM</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">${fmtDate(c.createdAt)}</span>
            </div>
            <div class="comment-text">${esc(c.content)}</div>
          </div>
        `;
      }).join('');
    } catch (e) {
      listEl.innerHTML = `<div style="color: #ef4444; padding: 12px; text-align: center;">${esc(e.message)}</div>`;
    }
  }

  const commentForm = $('commentForm');
  commentForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!activeGameId) return;

    const rating = parseInt(ratingInput.value, 10) || 5;
    const content = $('commentContentInput').value.trim();
    if (!content) {
      showToast('Vui lòng nhập nội dung nhận xét!', 'error');
      return;
    }

    const submitBtn = $('btnSubmitComment');
    setButtonLoading(submitBtn, true, 'Đang gửi...');

    try {
      await api(`/api/games/${activeGameId}/comments`, {
        method: 'POST',
        body: { rating, content }
      });
      showToast('Đã đăng nhận xét thành công!', 'success');
      $('commentContentInput').value = '';
      loadComments(activeGameId);
    } catch (err) {
      showToast(errText(err), 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  };

  load();
})();
