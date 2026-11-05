// ===== Logic Caro Đa Kích Thước (3x3, 5x5, 10x10), Vô Tận, Đấu Máy AI & Online 2 Thiết Bị =====
(async function () {
  const initData = await initPage('game');
  const currentUser = initData.user;
  const equipped = initData.equipped || {};

  const boardEl = $('board');
  const statusEl = $('status');
  const msgEl = $('msg');
  const modeTipEl = $('modeTip');
  const ruleModeWrap = $('ruleModeWrap');
  const btnModeInfinite = $('btnModeInfinite');
  const btnModeClassic = $('btnModeClassic');
  const boardSizeSelect = $('boardSizeSelect');
  const opponentType = $('opponentType');
  const playerXInput = $('playerX');
  const playerOInput = $('playerO');
  const playerInputsRow = $('playerInputsRow');
  const btnNew = $('btnNew');

  // Các phần tử Sảnh Online
  const onlineLobby = $('onlineLobby');
  const lobbyActions = $('lobbyActions');
  const activeRoomInfo = $('activeRoomInfo');
  const btnCreateOnlineRoom = $('btnCreateOnlineRoom');
  const joinRoomInput = $('joinRoomInput');
  const btnJoinRoomCode = $('btnJoinRoomCode');
  const btnRefreshWaitingRooms = $('btnRefreshWaitingRooms');
  const waitingRoomRows = $('waitingRoomRows');
  const activeRoomCodeEl = $('activeRoomCode');
  const btnCopyRoomCode = $('btnCopyRoomCode');
  const btnLeaveRoom = $('btnLeaveRoom');
  const myRoleText = $('myRoleText');
  const roomStatusBadge = $('roomStatusBadge');

  let boardSize = 3;            // 3, 5, hoac 10
  let winCondition = 3;         // 3, 4, hoac 5
  let currentMode = 'infinite'; // 'infinite' hoac 'classic'
  let board = [];               // Mang 2 chieu [r][c]
  let turn = 'X';               // 'X' hoac 'O'
  let moves = [];               // Danh sach [{row, col, symbol}]
  let over = false;
  let winLine = null;           // Danh sach toa do cac o thang
  let isAiThinking = false;
  let isSavingGame = false;

  // Biến dành cho Online Multiplayer
  let currentOnlineRoom = null; // Đối tượng phòng đang tham gia
  let onlinePollingInterval = null;
  let myOnlineSymbol = null;    // 'X' (chủ phòng) hoặc 'O' (khách)

  // Queue luu quan cho luat Vo tan ban 3x3
  let queueX = [];
  let queueO = [];
  let cells = []; // Mang luu cac phan tu button o co

  const nameX = () => playerXInput.value.trim() || 'Người chơi X';
  const nameO = () => playerOInput.value.trim() || 'Người chơi O';

  // Chuyển đổi chế độ đối thủ
  opponentType.onchange = () => {
    const val = opponentType.value;
    stopOnlinePolling();

    if (val === 'ONLINE') {
      onlineLobby.style.display = 'block';
      playerInputsRow.style.display = 'none';
      btnNew.style.display = 'none';
      loadWaitingRooms();
    } else {
      onlineLobby.style.display = 'none';
      playerInputsRow.style.display = 'flex';
      btnNew.style.display = 'inline-flex';
      currentOnlineRoom = null;
      myOnlineSymbol = null;

      if (val === 'PVP') {
        playerXInput.value = currentUser.fullName || 'Người chơi X';
        playerOInput.value = 'Người chơi O';
        playerOInput.readOnly = false;
      } else if (val === 'BOT_EASY') {
        playerXInput.value = currentUser.fullName || 'Người chơi X';
        playerOInput.value = 'AI Tân Thủ (Dễ)';
        playerOInput.readOnly = true;
      } else if (val === 'BOT_MEDIUM') {
        playerXInput.value = currentUser.fullName || 'Người chơi X';
        playerOInput.value = 'AI Chiến Binh (Vừa)';
        playerOInput.readOnly = true;
      } else if (val === 'BOT_HARD') {
        playerXInput.value = currentUser.fullName || 'Người chơi X';
        playerOInput.value = 'AI Đại Kiện Tướng (Khó)';
        playerOInput.readOnly = true;
      }
      newGame();
    }
  };

  // Thay đổi kích thước bàn cờ
  boardSizeSelect.onchange = () => {
    if (currentOnlineRoom) {
      showToast('Đang ở trong phòng Online, không thể đổi kích thước!', 'info');
      boardSizeSelect.value = currentOnlineRoom.boardSize;
      return;
    }
    boardSize = parseInt(boardSizeSelect.value, 10);
    winCondition = (boardSize === 3) ? 3 : (boardSize === 5 ? 4 : 5);

    if (boardSize === 3) {
      ruleModeWrap.style.display = 'flex';
      switchMode(currentMode, false);
    } else {
      ruleModeWrap.style.display = 'none';
      modeTipEl.innerHTML = `<b>Bàn cờ ${boardSize}x${boardSize}:</b> Cần <b>${winCondition} quân liên tiếp</b> theo hàng ngang, dọc hoặc chéo để chiến thắng!`;
    }
    newGame();
  };

  function switchMode(mode, restart = true) {
    if (currentOnlineRoom) {
      showToast('Đang ở trong phòng Online, không thể đổi luật!', 'info');
      return;
    }
    currentMode = mode;
    if (boardSize !== 3) return;

    if (currentMode === 'infinite') {
      btnModeInfinite.classList.add('active');
      btnModeClassic.classList.remove('active');
      modeTipEl.innerHTML = '<b>Luật Vô Tận:</b> Mỗi bên chỉ giữ tối đa 3 quân trên bàn. Khi đánh quân thứ 4, quân thứ 1 sẽ tự động biến mất!';
      showToast('Đã kích hoạt chế độ Vô Tận (Tối đa 3 quân - Không Hòa)', 'info');
    } else {
      btnModeClassic.classList.add('active');
      btnModeInfinite.classList.remove('active');
      modeTipEl.innerHTML = '<b>Luật Cổ Điển:</b> Đánh luân phiên trên bàn cờ. Đạt 3 quân thẳng hàng để giành chiến thắng.';
      showToast('Đã chuyển sang chế độ Cổ Điển', 'info');
    }
    if (restart) newGame();
  }

  btnModeInfinite.onclick = () => switchMode('infinite');
  btnModeClassic.onclick = () => switchMode('classic');

  // =========================================================
  // ONLINE MULTIPLAYER ROOMS LOGIC
  // =========================================================
  async function loadWaitingRooms() {
    try {
      const list = await api('/api/rooms');
      if (!list || list.length === 0) {
        waitingRoomRows.innerHTML = '<tr><td colspan="6" class="empty">Chưa có phòng nào đang chờ. Hãy bấm "Tạo Phòng Mới"!</td></tr>';
        return;
      }
      waitingRoomRows.innerHTML = list.map(r => `
        <tr>
          <td><b style="font-family:'Orbitron',monospace; color:#38bdf8;">${esc(r.roomCode)}</b></td>
          <td>${esc(r.playerX)}</td>
          <td>${r.boardSize}x${r.boardSize}</td>
          <td>${r.gameMode === 'INFINITE' ? 'Vô Tận' : 'Cổ Điển'}</td>
          <td>${fmtDate(r.createdAt)}</td>
          <td style="text-align: right;">
            <button class="btn small" onclick="joinOnlineRoom('${r.roomCode}')">Tham gia ngay</button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      waitingRoomRows.innerHTML = `<tr><td colspan="6" class="empty" style="color:#f87171;">Lỗi tải phòng: ${esc(errText(e))}</td></tr>`;
    }
  }

  btnRefreshWaitingRooms.onclick = loadWaitingRooms;

  btnCreateOnlineRoom.onclick = async () => {
    try {
      setButtonLoading(btnCreateOnlineRoom, true, 'Đang tạo phòng...');
      const req = {
        boardSize: parseInt(boardSizeSelect.value, 10),
        gameMode: (boardSizeSelect.value === '3' && currentMode === 'infinite') ? 'INFINITE' : 'CLASSIC'
      };
      const room = await api('/api/rooms', { method: 'POST', body: req });
      enterRoomView(room, 'X');
      showToast(`Đã tạo phòng ${room.roomCode}! Đang chờ đối thủ...`, 'success');
    } catch (e) {
      showToast(errText(e), 'error');
    } finally {
      setButtonLoading(btnCreateOnlineRoom, false);
    }
  };

  btnJoinRoomCode.onclick = async () => {
    const code = joinRoomInput.value.trim().toUpperCase();
    if (!code) {
      showToast('Vui lòng nhập mã phòng 6 ký tự!', 'error');
      return;
    }
    joinOnlineRoom(code);
  };

  window.joinOnlineRoom = async function (roomCode) {
    try {
      const room = await api(`/api/rooms/${roomCode}/join`, { method: 'POST' });
      const symbol = (room.hostUserId === currentUser.id) ? 'X' : 'O';
      enterRoomView(room, symbol);
      showToast(`Đã tham gia phòng ${room.roomCode}!`, 'success');
    } catch (e) {
      showToast(errText(e), 'error');
    }
  };

  btnCopyRoomCode.onclick = () => {
    if (!currentOnlineRoom) return;
    navigator.clipboard.writeText(currentOnlineRoom.roomCode);
    showToast(`Đã sao chép mã phòng: ${currentOnlineRoom.roomCode}`, 'success');
  };

  btnLeaveRoom.onclick = () => {
    stopOnlinePolling();
    currentOnlineRoom = null;
    myOnlineSymbol = null;
    lobbyActions.style.display = 'block';
    activeRoomInfo.style.display = 'none';
    loadWaitingRooms();
    newGame();
    showToast('Đã rời khỏi phòng Online', 'info');
  };

  function enterRoomView(room, symbol) {
    currentOnlineRoom = room;
    myOnlineSymbol = symbol;

    lobbyActions.style.display = 'none';
    activeRoomInfo.style.display = 'block';
    activeRoomCodeEl.textContent = room.roomCode;

    // Thiết lập bàn cờ theo thông số phòng
    boardSize = room.boardSize;
    boardSizeSelect.value = room.boardSize;
    winCondition = (boardSize === 3) ? 3 : (boardSize === 5 ? 4 : 5);
    currentMode = room.gameMode.toLowerCase();

    playerXInput.value = room.playerX;
    playerOInput.value = room.playerO || 'Đang chờ đối thủ...';

    ruleModeWrap.style.display = (boardSize === 3) ? 'flex' : 'none';
    if (boardSize === 3) {
      btnModeInfinite.className = 'mode-btn ' + (room.gameMode === 'INFINITE' ? 'active' : '');
      btnModeClassic.className = 'mode-btn ' + (room.gameMode === 'CLASSIC' ? 'active' : '');
    }

    startOnlinePolling(room.roomCode);
    syncOnlineGameState(room);
  }

  function startOnlinePolling(roomCode) {
    stopOnlinePolling();
    onlinePollingInterval = setInterval(async () => {
      try {
        const updated = await api(`/api/rooms/${roomCode}`);
        currentOnlineRoom = updated;
        syncOnlineGameState(updated);
      } catch (e) {
        // Phòng có thể đã bị xóa hoặc ngắt kết nối
      }
    }, 1000);
  }

  function stopOnlinePolling() {
    if (onlinePollingInterval) {
      clearInterval(onlinePollingInterval);
      onlinePollingInterval = null;
    }
  }

  function syncOnlineGameState(room) {
    playerXInput.value = room.playerX;
    playerOInput.value = room.playerO || 'Đang chờ đối thủ...';

    // Cập nhật banner vai trò
    if (myOnlineSymbol === 'X') {
      myRoleText.innerHTML = `Bạn là: <b style="color:var(--x-color);">Người chơi X (Đi trước)</b>`;
    } else {
      myRoleText.innerHTML = `Bạn là: <b style="color:var(--o-color);">Người chơi O (Đi sau)</b>`;
    }

    // Cập nhật trạng thái phòng
    if (room.status === 'WAITING') {
      roomStatusBadge.className = 'badge warning';
      roomStatusBadge.innerHTML = '<span class="waiting-pulse-dot"></span> Đang chờ đối thủ...';
    } else if (room.status === 'PLAYING') {
      roomStatusBadge.className = 'badge success';
      roomStatusBadge.textContent = 'Đang thi đấu';
    } else {
      roomStatusBadge.className = 'badge';
      roomStatusBadge.textContent = 'Đã kết thúc';
    }

    // Tái hiện bàn cờ theo danh sách moves của phòng
    rebuildBoardFromOnlineMoves(room);
  }

  function rebuildBoardFromOnlineMoves(room) {
    board = Array.from({ length: room.boardSize }, () => Array(room.boardSize).fill(''));
    moves = room.moves || [];
    queueX = [];
    queueO = [];
    turn = room.currentTurn;
    over = (room.status === 'FINISHED');

    const isInfinite = (room.boardSize === 3 && room.gameMode === 'INFINITE');

    moves.forEach(m => {
      if (isInfinite) {
        const q = (m.symbol === 'X') ? queueX : queueO;
        if (q.length >= 3) {
          const removed = q.shift();
          board[removed[0]][removed[1]] = '';
        }
        board[m.row][m.col] = m.symbol;
        q.push([m.row, m.col]);
      } else {
        board[m.row][m.col] = m.symbol;
      }
    });

    if (cells.length !== room.boardSize * room.boardSize) {
      createBoardGrid();
    }

    // Xử lý thông báo kết thúc hoặc lượt đi
    if (over) {
      if (room.winner === 'DRAW') {
        statusEl.innerHTML = '<span style="color:var(--draw-color)">Trận đấu Hòa!</span>';
      } else {
        const wName = (room.winner === 'X') ? room.playerX : room.playerO;
        statusEl.innerHTML = `<span class="${room.winner.toLowerCase()}">${esc(wName)} (${room.winner}) CHIẾN THẮNG!</span>`;
      }
      stopOnlinePolling(); // Dừng polling khi đã kết thúc
      loadStats();
    } else if (room.status === 'WAITING') {
      statusEl.innerHTML = `<span style="color:#fbbf24;"><span class="waiting-pulse-dot"></span> Đang chờ người chơi thứ 2 tham gia phòng...</span>`;
    } else {
      const isMyTurn = (turn === myOnlineSymbol);
      if (isMyTurn) {
        statusEl.innerHTML = `<span style="color:#34d399; font-size:1.4rem; font-weight:800;">Đến lượt bạn đánh! (${turn})</span>`;
      } else {
        const turnName = (turn === 'X') ? room.playerX : room.playerO;
        statusEl.innerHTML = `<span style="color:var(--text-muted);">Đang chờ ${esc(turnName)} (${turn}) đánh...</span>`;
      }
    }

    render();
  }

  // =========================================================
  // LOGIC BÀN CỜ & RENDER
  // =========================================================
  function createBoardGrid() {
    boardEl.innerHTML = '';
    boardEl.className = `board board-${boardSize}`;
    const boardTheme = equipped.boardThemeClass || equipped.boardTheme;
    const pieceSkin = equipped.pieceSkinClass || equipped.pieceSkin;
    if (boardTheme) {
      boardEl.classList.add(boardTheme);
    }
    if (pieceSkin) {
      boardEl.classList.add(pieceSkin);
    }
    cells = [];
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(''));

    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        btn.dataset.r = r;
        btn.dataset.c = c;
        btn.addEventListener('click', () => handleCellClick(r, c));
        boardEl.appendChild(btn);
        cells.push(btn);
      }
    }
  }

  function newGame() {
    boardSize = parseInt(boardSizeSelect.value, 10);
    winCondition = (boardSize === 3) ? 3 : (boardSize === 5 ? 4 : 5);
    turn = 'X';
    moves = [];
    queueX = [];
    queueO = [];
    over = false;
    winLine = null;
    isAiThinking = false;
    isSavingGame = false;
    hideAlert(msgEl);

    createBoardGrid();
    render();
  }

  function checkWin(r, c, symbol) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dr, dc] of directions) {
      const line = [[r, c]];

      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === symbol) {
          line.push([nr, nc]);
          step++;
        } else {
          break;
        }
      }

      step = 1;
      while (true) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === symbol) {
          line.push([nr, nc]);
          step++;
        } else {
          break;
        }
      }

      if (line.length >= winCondition) {
        return line;
      }
    }
    return null;
  }

  async function handleCellClick(r, c) {
    if (over || board[r][c] || isAiThinking || isSavingGame) return;

    // 1. Chế độ Online 2 thiết bị
    if (opponentType.value === 'ONLINE') {
      if (!currentOnlineRoom || currentOnlineRoom.status !== 'PLAYING') {
        showToast('Phòng chưa sẵn sàng thi đấu!', 'info');
        return;
      }
      if (turn !== myOnlineSymbol) {
        showToast('Chưa đến lượt của bạn! Đang chờ đối thủ...', 'info');
        return;
      }

      try {
        const updated = await api(`/api/rooms/${currentOnlineRoom.roomCode}/move`, {
          method: 'POST',
          body: { row: r, col: c, symbol: myOnlineSymbol }
        });
        currentOnlineRoom = updated;
        syncOnlineGameState(updated);
      } catch (e) {
        showToast(errText(e), 'error');
      }
      return;
    }

    // 2. Chế độ Đấu với Máy (Bot)
    const isBotMatch = opponentType.value.startsWith('BOT');
    if (isBotMatch && turn !== 'X') return;

    executeMove(r, c, turn);

    if (!over && isBotMatch && turn === 'O') {
      triggerBotMove();
    }
  }

  function executeMove(r, c, symbol) {
    if (boardSize === 3 && currentMode === 'infinite') {
      const queue = (symbol === 'X') ? queueX : queueO;
      if (queue.length >= 3) {
        const oldest = queue.shift();
        board[oldest[0]][oldest[1]] = '';
      }
      board[r][c] = symbol;
      queue.push([r, c]);
    } else {
      board[r][c] = symbol;
    }

    moves.push({ row: r, col: c, symbol });

    const winningLine = checkWin(r, c, symbol);
    if (winningLine) {
      finish(symbol, winningLine);
    } else if (moves.length >= boardSize * boardSize && !(boardSize === 3 && currentMode === 'infinite')) {
      finish('DRAW', null);
    } else {
      turn = (turn === 'X') ? 'O' : 'X';
      render();
    }
  }

  async function triggerBotMove() {
    isAiThinking = true;
    statusEl.innerHTML = `<span style="color:var(--o-color);">Máy (${esc(nameO())}) đang suy nghĩ nước đi...</span>`;

    const val = opponentType.value;
    let difficulty = 'MEDIUM';
    if (val === 'BOT_EASY') difficulty = 'EASY';
    if (val === 'BOT_HARD') difficulty = 'HARD';

    try {
      const botRes = await api('/api/games/bot-move', {
        method: 'POST',
        body: {
          boardSize,
          mode: (boardSize === 3 && currentMode === 'infinite') ? 'INFINITE' : 'CLASSIC',
          difficulty,
          moves
        }
      });

      if (botRes.row >= 0 && botRes.col >= 0) {
        setTimeout(() => {
          isAiThinking = false;
          executeMove(botRes.row, botRes.col, 'O');
        }, 220);
      } else {
        isAiThinking = false;
      }
    } catch (e) {
      isAiThinking = false;
      showToast('Lỗi khi máy tính nước đi: ' + errText(e), 'error');
    }
  }

  async function finish(result, line) {
    over = true;
    winLine = line;
    render();

    if (result === 'DRAW') {
      statusEl.innerHTML = '<span style="color:var(--draw-color)">Trận đấu Hòa!</span>';
      showToast('Trận đấu kết thúc với kết quả Hòa!', 'info');
    } else {
      const winnerName = (result === 'X') ? nameX() : nameO();
      statusEl.innerHTML = `<span class="${result.toLowerCase()}">${esc(winnerName)} (${result}) CHIẾN THẮNG!</span>`;
      showToast(`Chúc mừng ${winnerName} (${result}) đã giành chiến thắng!`, 'success');
    }

    try {
      isSavingGame = true;
      const saveRes = await api('/api/games', {
        method: 'POST',
        body: { playerX: nameX(), playerO: nameO(), moves }
      });
      showToast('Đã lưu kết quả ván cờ vào hệ thống!', 'success');
      loadStats();
      // Cap nhat lai xu va thanh tuu neu co thuong
      try {
        const u = await api('/api/auth/me');
        updateNavCoins(u.coins);
      } catch (err) {}
    } catch (e) {
      showAlert(msgEl, 'error', 'Không lưu được ván cờ: ' + errText(e));
      showToast('Lỗi lưu ván cờ: ' + errText(e), 'error');
    } finally {
      isSavingGame = false;
    }
  }

  function render() {
    let dyingCoord = null;
    if (boardSize === 3 && currentMode === 'infinite' && !over) {
      const activeQueue = (turn === 'X') ? queueX : queueO;
      if (activeQueue.length >= 3) {
        dyingCoord = activeQueue[0];
      }
    }

    const isOnline = (opponentType.value === 'ONLINE');
    const isLocked = isOnline && (turn !== myOnlineSymbol || !currentOnlineRoom || currentOnlineRoom.status !== 'PLAYING');

    if (isOnline) {
      boardEl.classList.toggle('locked-turn', isLocked);
      boardEl.classList.toggle('my-turn', !isLocked && !over);
    } else {
      boardEl.classList.remove('locked-turn', 'my-turn');
    }

    cells.forEach((btn) => {
      const r = parseInt(btn.dataset.r, 10);
      const c = parseInt(btn.dataset.c, 10);
      const val = board[r][c];

      btn.textContent = val;
      let cls = 'cell';
      if (val) cls += ' ' + val;

      if (winLine && winLine.some(([wr, wc]) => wr === r && wc === c)) {
        cls += ' win';
      } else if (dyingCoord && dyingCoord[0] === r && dyingCoord[1] === c) {
        cls += ' piece-dying';
      }

      btn.className = cls;
      btn.disabled = over || !!val || isAiThinking || (isOnline && isLocked);
    });

    if (!over && !isAiThinking && !isOnline) {
      const currentName = (turn === 'X') ? nameX() : nameO();
      let statusHtml = `Lượt đi: <span class="${turn.toLowerCase()}" style="margin-left:8px;">${esc(currentName)} (${turn})</span>`;
      if (dyingCoord) {
        statusHtml += ` <span style="font-size:0.9rem; color:#fca5a5; margin-left:12px;">(1 quân cũ nhất sắp biến mất)</span>`;
      }
      statusEl.innerHTML = statusHtml;
    }
  }

  async function loadStats() {
    try {
      const s = await api('/api/scores/me');
      $('sTotal').textContent = s.gamesPlayed;
      $('sX').textContent = s.xWins;
      $('sO').textContent = s.oWins;
      $('sDraw').textContent = s.draws;
    } catch (e) {
      // Bo qua neu chua co diem
    }
  }

  btnNew.onclick = newGame;

  // Khởi tạo ván mặc định
  playerXInput.value = currentUser.fullName || 'Người chơi X';
  newGame();
  loadStats();
})();
