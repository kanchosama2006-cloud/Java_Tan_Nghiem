import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import gameApi from '../services/gameApi';
import roomApi from '../services/roomApi';
import CaroBoard from '../components/CaroBoard';

export function GamePage() {
  const { user, equipped, refreshAuthAndEquipped } = useAuth();
  const { showToast } = useToast();

  // Settings
  const [opponentType, setOpponentType] = useState('PVP'); // PVP, BOT_EASY, BOT_MEDIUM, BOT_HARD, ONLINE
  const [boardSize, setBoardSize] = useState(3); // 3, 5, 10
  const [ruleMode, setRuleMode] = useState('infinite'); // infinite, classic
  const [playerXName, setPlayerXName] = useState(user?.fullName || 'Kỳ thủ X');
  const [playerOName, setPlayerOName] = useState('Kỳ thủ O');

  // Core Game Moves State (MUST be declared before derived useMemo)
  const [moves, setMoves] = useState([]);

  // Calculate derived board matrix & queues directly from moves
  const { board, queueX, queueO } = React.useMemo(() => {
    const size = boardSize || 3;
    const isInfinite = size === 3 && ruleMode === 'infinite';
    const matrix = Array.from({ length: size }, () => Array(size).fill(''));
    const qX = [];
    const qO = [];

    (moves || []).forEach((m) => {
      const r = m.row != null ? m.row : m.rowIdx;
      const c = m.col != null ? m.col : m.colIdx;
      const sym = m.symbol;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        if (isInfinite) {
          const q = sym === 'X' ? qX : qO;
          if (q.length >= 3) {
            const oldest = q.shift();
            matrix[oldest[0]][oldest[1]] = '';
          }
          matrix[r][c] = sym;
          q.push([r, c]);
        } else {
          matrix[r][c] = sym;
        }
      }
    });

    return { board: matrix, queueX: qX, queueO: qO };
  }, [moves, boardSize, ruleMode]);

  const [turn, setTurn] = useState('X');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winningLine, setWinningLine] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Lượt đi: Kỳ thủ X (X)');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [stats, setStats] = useState({ gamesPlayed: 0, xWins: 0, oWins: 0, draws: 0 });

  // Game End Modal State (Result Banner)
  const [endGameModal, setEndGameModal] = useState(null); // { type: 'WIN' | 'DEFEAT' | 'DRAW', title: '', subtitle: '', winnerSymbol: '' }

  // Online Multiplayer State
  const [waitingRooms, setWaitingRooms] = useState([]);
  const [isLobbyLoading, setIsLobbyLoading] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [currentOnlineRoom, setCurrentOnlineRoom] = useState(null);
  const [myOnlineSymbol, setMyOnlineSymbol] = useState(null);
  const pollingIntervalRef = useRef(null);
  const previousGuestRef = useRef(null); // Giám sát khi có player 2 vào phòng
  const [countdown, setCountdown] = useState(null); // Đếm ngược 3s bắt đầu trận
  const countdownIntervalRef = useRef(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false); // Modal xác nhận rời phòng bị xử thua

  // Load My Stats
  const loadStats = async () => {
    try {
      const res = await gameApi.getMyScore();
      setStats({
        gamesPlayed: res.gamesPlayed || 0,
        xWins: res.xWins || 0,
        oWins: res.oWins || 0,
        draws: res.draws || 0,
      });
    } catch (err) {}
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (user?.fullName) {
      setPlayerXName(user.fullName);
    }
  }, [user]);

  // Load Waiting Rooms when in ONLINE mode
  const fetchWaitingRooms = async () => {
    if (opponentType !== 'ONLINE') return;
    setIsLobbyLoading(true);
    try {
      const list = await roomApi.getWaitingRooms();
      setWaitingRooms(list || []);
    } catch (err) {
      showToast('Không tải được danh sách phòng chờ', 'error');
    } finally {
      setIsLobbyLoading(false);
    }
  };

  useEffect(() => {
    if (opponentType === 'ONLINE' && !currentOnlineRoom) {
      fetchWaitingRooms();
    }
  }, [opponentType, currentOnlineRoom]);

  // Initialize new local game
  const resetLocalGame = (size = boardSize, mode = ruleMode) => {
    setTurn('X');
    setMoves([]);
    setIsGameOver(false);
    setWinningLine(null);
    setIsAiThinking(false);
    setEndGameModal(null);
    setStatusMessage(`Lượt đi: ${playerXName} (X)`);
  };

  const handleOpponentTypeChange = (type) => {
    setOpponentType(type);
    if (type.startsWith('BOT')) {
      const botNames = {
        BOT_EASY: 'AI Tân Thủ',
        BOT_MEDIUM: 'AI Chiến Binh',
        BOT_HARD: 'AI Đại Kiện Tướng',
      };
      setPlayerOName(botNames[type] || 'AI Bot');
    } else if (type === 'PVP') {
      setPlayerOName('Kỳ thủ O');
    }
    if (type !== 'ONLINE') {
      stopOnlinePolling();
      setCurrentOnlineRoom(null);
      setMyOnlineSymbol(null);
      resetLocalGame();
    }
  };

  const handleBoardSizeChange = (newSize) => {
    const sizeNum = parseInt(newSize, 10);
    setBoardSize(sizeNum);
    resetLocalGame(sizeNum, ruleMode);
  };

  const handleRuleModeChange = (mode) => {
    setRuleMode(mode);
    resetLocalGame(boardSize, mode);
  };

  // Win checker function
  const checkWinCondition = (currentBoard, r, c, symbol, size) => {
    const winCondition = size === 3 ? 3 : size === 5 ? 4 : 5;
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (const [dr, dc] of directions) {
      const line = [[r, c]];

      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && currentBoard[nr][nc] === symbol) {
          line.push([nr, nc]);
          step++;
        } else break;
      }

      step = 1;
      while (true) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && currentBoard[nr][nc] === symbol) {
          line.push([nr, nc]);
          step++;
        } else break;
      }

      if (line.length >= winCondition) {
        return line;
      }
    }
    return null;
  };

  // Rebuild a board matrix from a moves list to check win/draw accurately
  const buildBoardFromMoves = (movesList, size, isInfinite) => {
    const matrix = Array.from({ length: size }, () => Array(size).fill(''));
    const qX = [];
    const qO = [];
    movesList.forEach((m) => {
      const r = m.row != null ? m.row : m.rowIdx;
      const c = m.col != null ? m.col : m.colIdx;
      const sym = m.symbol;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        if (isInfinite) {
          const q = sym === 'X' ? qX : qO;
          if (q.length >= 3) {
            const oldest = q.shift();
            matrix[oldest[0]][oldest[1]] = '';
          }
          matrix[r][c] = sym;
          q.push([r, c]);
        } else {
          matrix[r][c] = sym;
        }
      }
    });
    return matrix;
  };

  // Local Move Execution
  const executeLocalMove = (r, c, currentSymbol, currentMovesList) => {
    const isInfinite = boardSize === 3 && ruleMode === 'infinite';
    const baseMoves = currentMovesList || moves;

    const newMove = {
      rowIdx: r,
      colIdx: c,
      row: r,
      col: c,
      symbol: currentSymbol,
      moveOrder: baseMoves.length + 1,
    };

    const nextMoves = [...baseMoves, newMove];
    setMoves(nextMoves);

    // Compute updated board to check win
    const nextBoard = buildBoardFromMoves(nextMoves, boardSize, isInfinite);

    // Check Win
    const winning = checkWinCondition(nextBoard, r, c, currentSymbol, boardSize);
    if (winning) {
      setIsGameOver(true);
      setWinningLine(winning);
      const winnerName = currentSymbol === 'X' ? playerXName : playerOName;
      setStatusMessage(`${winnerName} (${currentSymbol}) CHIẾN THẮNG!`);
      showToast(`Chúc mừng ${winnerName} (${currentSymbol}) đã chiến thắng!`, 'success');
      finishLocalGame(currentSymbol, nextMoves);

      // Determine Win/Defeat modal
      const isBotMatch = opponentType.startsWith('BOT');
      if (isBotMatch) {
        if (currentSymbol === 'X') {
          setEndGameModal({
            type: 'WIN',
            title: 'KHẢI HOÀN ĐẠI THẮNG!',
            subtitle: `Bạn đã xuất sắc đánh bại ${playerOName}!`,
            winnerSymbol: 'X',
          });
        } else {
          setEndGameModal({
            type: 'DEFEAT',
            title: 'KỲ THỦ BẠI TRẬN!',
            subtitle: `${playerOName} đã chiến thắng ván cờ này. Hãy phục thù ở ván tiếp theo!`,
            winnerSymbol: 'O',
          });
        }
      } else {
        setEndGameModal({
          type: 'WIN',
          title: `${winnerName.toUpperCase()} CHIẾN THẮNG!`,
          subtitle: `Chiến thắng thuyết phục bằng chuỗi quân ${currentSymbol}!`,
          winnerSymbol: currentSymbol,
        });
      }

      return { nextMoves, isOver: true };
    } else if (
      nextMoves.length >= boardSize * boardSize &&
      !isInfinite
    ) {
      setIsGameOver(true);
      setStatusMessage('Trận đấu Hòa!');
      showToast('Trận đấu kết thúc với kết quả Hòa!', 'info');
      finishLocalGame('DRAW', nextMoves);

      setEndGameModal({
        type: 'DRAW',
        title: 'BẤT PHÂN THẮNG BẠI!',
        subtitle: 'Cả hai kỳ thủ đều thủ thế hoàn hảo, kết thúc với kết quả Hòa.',
        winnerSymbol: null,
      });

      return { nextMoves, isOver: true };
    } else {
      const nextTurn = currentSymbol === 'X' ? 'O' : 'X';
      setTurn(nextTurn);
      const nextName = nextTurn === 'X' ? playerXName : playerOName;
      setStatusMessage(`Lượt đi: ${nextName} (${nextTurn})`);
      return { nextMoves, nextTurn, isOver: false };
    }
  };

  // Save completed game & rewards
  const finishLocalGame = async (winner, finishedMoves) => {
    try {
      await gameApi.saveGame({
        playerX: playerXName,
        playerO: playerOName,
        moves: finishedMoves,
      });
      showToast('Đã lưu ván đấu và nhận Xu thưởng thành công!', 'success');
      loadStats();
      refreshAuthAndEquipped();
    } catch (err) {
      showToast('Lỗi lưu ván đấu: ' + err.message, 'error');
    }
  };

  // Trigger Bot Move
  const triggerBotTurn = async (movesAfterHuman) => {
    setIsAiThinking(true);
    setStatusMessage(`Máy (${playerOName}) đang phân tích nước đi...`);

    let difficulty = 'MEDIUM';
    if (opponentType === 'BOT_EASY') difficulty = 'EASY';
    if (opponentType === 'BOT_HARD') difficulty = 'HARD';

    try {
      const botRes = await gameApi.getBotMove({
        boardSize,
        mode: boardSize === 3 && ruleMode === 'infinite' ? 'INFINITE' : 'CLASSIC',
        difficulty,
        moves: movesAfterHuman.map((m) => ({
          row: m.row != null ? m.row : m.rowIdx,
          col: m.col != null ? m.col : m.colIdx,
          symbol: m.symbol,
        })),
      });

      if (botRes && botRes.row >= 0 && botRes.col >= 0) {
        setTimeout(() => {
          setIsAiThinking(false);
          executeLocalMove(botRes.row, botRes.col, 'O', movesAfterHuman);
        }, 220);
      } else {
        setIsAiThinking(false);
      }
    } catch (err) {
      setIsAiThinking(false);
      showToast('Lỗi khi Bot tính toán: ' + err.message, 'error');
    }
  };

  // Cell Click Handler
  const handleCellClick = (r, c) => {
    if (isGameOver || board[r][c] || isAiThinking) return;

    if (opponentType === 'ONLINE') {
      if (!currentOnlineRoom || currentOnlineRoom.status !== 'PLAYING') {
        showToast('Phòng chưa sẵn sàng thi đấu!', 'info');
        return;
      }
      if (turn !== myOnlineSymbol) {
        showToast('Chưa đến lượt của bạn! Đang chờ đối thủ...', 'info');
        return;
      }
      sendOnlineMove(r, c);
      return;
    }

    const isBotMatch = opponentType.startsWith('BOT');
    if (isBotMatch && turn !== 'X') return;

    const res = executeLocalMove(r, c, turn, moves);
    if (res && !res.isOver && isBotMatch && res.nextTurn === 'O') {
      triggerBotTurn(res.nextMoves);
    }
  };

  // =========================================================
  // ONLINE MULTIPLAYER LOGIC
  // =========================================================
  const stopOnlinePolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const syncOnlineRoomState = (room) => {
    setCurrentOnlineRoom(room);
    setBoardSize(room.boardSize);
    setRuleMode(room.gameMode === 'INFINITE' ? 'infinite' : 'classic');
    setTurn(room.currentTurn);
    setPlayerXName(room.playerX);
    setPlayerOName(room.playerO || 'Đang chờ đối thủ...');

    const size = room.boardSize;
    const isInfinite = size === 3 && room.gameMode === 'INFINITE';
    const nextBoard = Array.from({ length: size }, () => Array(size).fill(''));
    const qX = [];
    const qO = [];

    (room.moves || []).forEach((m) => {
      if (isInfinite) {
        const q = m.symbol === 'X' ? qX : qO;
        if (q.length >= 3) {
          const removed = q.shift();
          nextBoard[removed[0]][removed[1]] = '';
        }
        nextBoard[m.row][m.col] = m.symbol;
        q.push([m.row, m.col]);
      } else {
        nextBoard[m.row][m.col] = m.symbol;
      }
    });

    setMoves(room.moves || []);

    // Thông báo khi có Player 2 vào phòng
    if (room.guestUserId && !previousGuestRef.current) {
      previousGuestRef.current = room.guestUserId;
      showToast(`Kỳ thủ ${room.playerO || 'Người chơi 2'} đã tham gia phòng!`, 'success');
    } else if (!room.guestUserId) {
      previousGuestRef.current = null;
    }

    // Kiểm tra khi cả hai bên đều Sẵn Sàng / Đồng ý khiêu chiến -> Tự động kích hoạt đếm ngược 3 giây
    if (room.readyX && room.readyO && !countdownTriggeredRef.current) {
      countdownTriggeredRef.current = true;
      startCountdownSequence();
    } else if (!room.readyX || !room.readyO) {
      countdownTriggeredRef.current = false;
    }

    // Nếu phòng đang PLAYING và chưa kết thúc, đảm bảo đóng modal kết quả cũ và tiếp tục polling
    if (room.status === 'PLAYING') {
      setIsGameOver(false);
      setEndGameModal(null);
      if (!pollingIntervalRef.current && room.roomCode) {
        startOnlinePolling(room.roomCode);
      }
    }

    if (room.status === 'FINISHED') {
      setIsGameOver(true);
      // Giữ polling chạy nhẹ để nhận tín hiệu Tái Đấu Ván Mới từ đối thủ!
      if (room.winner === 'DRAW') {
        setStatusMessage('Trận đấu Hòa!');
        setEndGameModal({
          type: 'DRAW',
          title: 'BẤT PHÂN THẮNG BẠI!',
          subtitle: 'Hai kỳ thủ đã cầm hòa sau những nước cờ cân não!',
          winnerSymbol: null,
        });
      } else {
        const wName = room.winner === 'X' ? room.playerX : room.playerO;
        setStatusMessage(`${wName} (${room.winner}) CHIẾN THẮNG!`);

        const isMeWinner = room.winner === myOnlineSymbol;
        if (isMeWinner) {
          setEndGameModal({
            type: 'WIN',
            title: 'KHẢI HOÀN ĐẠI THẮNG!',
            subtitle: `Chúc mừng bạn đã giành chiến thắng trước ${room.winner === 'X' ? room.playerO : room.playerX}!`,
            winnerSymbol: room.winner,
          });
        } else {
          setEndGameModal({
            type: 'DEFEAT',
            title: 'KỲ THỦ BẠI TRẬN!',
            subtitle: `${wName} đã chiến thắng ván cờ trực tuyến này. Hãy tái đấu để phục thù!`,
            winnerSymbol: room.winner,
          });
        }
      }
      loadStats();
      refreshAuthAndEquipped();
    } else if (room.status === 'WAITING') {
      setIsGameOver(false);
      setStatusMessage('Đang chờ đối thủ tham gia phòng...');
    } else {
      setIsGameOver(false);
      if (room.currentTurn === myOnlineSymbol) {
        setStatusMessage(`Đến lượt bạn đánh! (${room.currentTurn})`);
      } else {
        const turnName = room.currentTurn === 'X' ? room.playerX : room.playerO;
        setStatusMessage(`Đang chờ ${turnName} (${room.currentTurn}) đánh...`);
      }
    }
  };

  const startOnlinePolling = (code) => {
    stopOnlinePolling();
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updated = await roomApi.getRoom(code);
        syncOnlineRoomState(updated);
      } catch (err) {}
    }, 1000);
  };

  const handleCreateOnlineRoom = async () => {
    try {
      const room = await roomApi.createRoom({
        boardSize,
        gameMode: boardSize === 3 && ruleMode === 'infinite' ? 'INFINITE' : 'CLASSIC',
      });
      setMyOnlineSymbol('X');
      syncOnlineRoomState(room);
      startOnlinePolling(room.roomCode);
      showToast(`Đã tạo phòng ${room.roomCode}! Đang chờ đối thủ...`, 'success');
    } catch (err) {
      showToast(err.message || 'Không thể tạo phòng', 'error');
    }
  };

  const handleJoinOnlineRoom = async (codeToJoin) => {
    const code = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!code) {
      showToast('Vui lòng nhập mã phòng 6 ký tự', 'error');
      return;
    }
    try {
      const room = await roomApi.joinRoom(code);
      const symbol = room.hostUserId === user?.id ? 'X' : 'O';
      setMyOnlineSymbol(symbol);
      syncOnlineRoomState(room);
      startOnlinePolling(room.roomCode);
      showToast(`Đã tham gia phòng ${room.roomCode}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Không thể vào phòng', 'error');
    }
  };

  const sendOnlineMove = async (r, c) => {
    try {
      const updated = await roomApi.makeMove(currentOnlineRoom.roomCode, {
        row: r,
        col: c,
        symbol: myOnlineSymbol,
      });
      syncOnlineRoomState(updated);
    } catch (err) {
      showToast(err.message || 'Lỗi gửi nước đi', 'error');
    }
  };

  const countdownTriggeredRef = useRef(false);

  const startCountdownSequence = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    let sec = 3;
    setCountdown(sec);

    countdownIntervalRef.current = setInterval(() => {
      sec -= 1;
      if (sec > 0) {
        setCountdown(sec);
      } else if (sec === 0) {
        setCountdown('CHIẾN!');
      } else {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(null);
        showToast('Trận đấu chính thức bắt đầu!', 'success');
      }
    }, 1000);
  };

  const handleStartOnlineMatch = async () => {
    if (!currentOnlineRoom) return;
    try {
      const updated = await roomApi.setReady(currentOnlineRoom.roomCode, true);
      syncOnlineRoomState(updated);
      showToast('Đã gửi lời khiêu chiến! Đang chờ đối thủ đồng ý...', 'info');
    } catch (err) {
      showToast(err.message || 'Lỗi gửi yêu cầu vào trận', 'error');
    }
  };

  const handleAcceptChallenge = async () => {
    if (!currentOnlineRoom) return;
    try {
      const updated = await roomApi.setReady(currentOnlineRoom.roomCode, true);
      syncOnlineRoomState(updated);
      showToast('Đã chấp nhận khiêu chiến!', 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi chấp nhận khiêu chiến', 'error');
    }
  };

  const handleLeaveRoom = () => {
    // Nếu phòng đang ở trạng thái PLAYING (đang trong trận đấu), mở hộp thoại cảnh báo xử thua!
    if (currentOnlineRoom && currentOnlineRoom.status === 'PLAYING') {
      setConfirmLeaveOpen(true);
    } else {
      executeLeaveRoom();
    }
  };

  const executeLeaveRoom = async () => {
    try {
      if (currentOnlineRoom) {
        await roomApi.leaveRoom(currentOnlineRoom.roomCode);
      }
    } catch (e) {}

    stopOnlinePolling();
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);
    setCurrentOnlineRoom(null);
    setMyOnlineSymbol(null);
    previousGuestRef.current = null;
    setConfirmLeaveOpen(false);
    resetLocalGame();
    fetchWaitingRooms();
    showToast('Đã rời khỏi phòng Online', 'info');
  };

  // Calculate Dying Coordinate (FIFO indicator on 3x3 infinite)
  let dyingCoord = null;
  if (boardSize === 3 && ruleMode === 'infinite' && !isGameOver) {
    const activeQ = turn === 'X' ? queueX : queueO;
    if (activeQ.length >= 3) {
      dyingCoord = activeQ[0];
    }
  }

  const isOnlineLocked =
    opponentType === 'ONLINE' &&
    (!currentOnlineRoom ||
      currentOnlineRoom.status !== 'PLAYING' ||
      turn !== myOnlineSymbol);

  return (
    <div className="arena-split-container">
      {/* LEFT COLUMN: CONTROLS & PLAYER BANNERS */}
      <aside className="arena-controls-panel">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="arena-section-title">CHẾ ĐỘ ĐỐI THỦ</div>
          <div style={{ marginBottom: '16px' }}>
            <select
              value={opponentType}
              onChange={(e) => handleOpponentTypeChange(e.target.value)}
              disabled={!!currentOnlineRoom}
            >
              <option value="PVP">2 Người (Chung máy)</option>
              <option value="BOT_EASY">Đấu với Máy: AI Tân Thủ (Dễ)</option>
              <option value="BOT_MEDIUM">Đấu với Máy: AI Chiến Binh (Vừa)</option>
              <option value="BOT_HARD">Đấu với Máy: AI Đại Kiện Tướng (Khó)</option>
              <option value="ONLINE">Chơi Online (2 Thiết bị)</option>
            </select>
          </div>

          <div className="arena-section-title">QUY MÔ BÀN CỜ</div>
          <div style={{ marginBottom: '16px' }}>
            <select
              value={boardSize}
              onChange={(e) => handleBoardSizeChange(e.target.value)}
              disabled={!!currentOnlineRoom}
            >
              <option value="3">Bàn Cờ 3x3 (3 quân liên tiếp)</option>
              <option value="5">Bàn Cờ 5x5 (4 quân liên tiếp)</option>
              <option value="10">Bàn Cờ 10x10 (5 quân - Chuẩn Caro)</option>
            </select>
          </div>

          {/* ONLINE LOBBY SECTION */}
          {opponentType === 'ONLINE' && (
            <div className="online-lobby-card" style={{ marginTop: '14px' }}>
              <div className="arena-section-title" style={{ color: '#38bdf8' }}>
                PHÒNG THI ĐẤU TRỰC TUYẾN
              </div>

              {!currentOnlineRoom ? (
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <button
                      className="btn"
                      type="button"
                      style={{ width: '100%' }}
                      onClick={handleCreateOnlineRoom}
                    >
                      Tạo Phòng Mới
                    </button>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Nhập mã phòng 6 ký tự:</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="CARO88"
                        style={{ textTransform: 'uppercase', marginBottom: 0 }}
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                      />
                      <button
                        className="btn light small"
                        type="button"
                        onClick={() => handleJoinOnlineRoom()}
                      >
                        Vào
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                      }}
                    >
                      Phòng đang chờ:
                    </span>
                    <button
                      className="btn ghost small"
                      type="button"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={fetchWaitingRooms}
                    >
                      Làm mới
                    </button>
                  </div>

                  <div className="table-wrap" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Mã</th>
                          <th>Chủ</th>
                          <th>Bàn</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLobbyLoading ? (
                          <tr>
                            <td colSpan={4} className="empty">
                              Đang tải danh sách phòng...
                            </td>
                          </tr>
                        ) : waitingRooms.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="empty">
                              Chưa có phòng nào đang chờ.
                            </td>
                          </tr>
                        ) : (
                          waitingRooms.map((rm) => (
                            <tr key={rm.roomCode}>
                              <td>
                                <b style={{ fontFamily: 'Orbitron, monospace', color: '#38bdf8' }}>
                                  {rm.roomCode}
                                </b>
                              </td>
                              <td>{rm.playerX}</td>
                              <td>{rm.boardSize}x{rm.boardSize}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn small light"
                                  type="button"
                                  onClick={() => handleJoinOnlineRoom(rm.roomCode)}
                                >
                                  Vào
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Mã phòng:
                      </span>
                      <div
                        style={{
                          fontFamily: 'Orbitron, monospace',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: '#38bdf8',
                        }}
                      >
                        {currentOnlineRoom.roomCode}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn small ghost"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentOnlineRoom.roomCode);
                          showToast(`Đã chép mã phòng: ${currentOnlineRoom.roomCode}`, 'success');
                        }}
                      >
                        Sao Chép
                      </button>
                      <button
                        className="btn small danger"
                        type="button"
                        onClick={handleLeaveRoom}
                      >
                        Rời
                      </button>
                    </div>
                  </div>

                  <div
                    className="online-role-banner"
                    style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                  >
                    <span>Bạn cầm quân: <b>{myOnlineSymbol}</b></span>
                    <span className="badge">
                      {currentOnlineRoom.status === 'WAITING'
                        ? 'Đang chờ'
                        : currentOnlineRoom.status === 'PLAYING'
                        ? 'Đang thi đấu'
                        : 'Kết thúc'}
                    </span>
                  </div>

                  {/* THÔNG BÁO KHIÊU CHIẾN & NÚT SẴN SÀNG HAI BÊN */}
                  {currentOnlineRoom && moves.length === 0 && (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Trạng thái sẵn sàng hiển thị cho cả 2 bên */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>
                          {currentOnlineRoom.playerX}: {currentOnlineRoom.readyX ? <b style={{ color: '#10b981' }}>ĐÃ SẴN SÀNG</b> : <span style={{ color: '#f59e0b' }}>Chưa sẵn sàng</span>}
                        </span>
                        <span>
                          {currentOnlineRoom.playerO || 'Khách'}: {currentOnlineRoom.readyO ? <b style={{ color: '#10b981' }}>ĐÃ SẴN SÀNG</b> : <span style={{ color: '#f59e0b' }}>Chưa sẵn sàng</span>}
                        </span>
                      </div>

                      {/* Nếu đối phương đã bấm sẵn sàng mà mình chưa bấm -> Hiện banner khiêu chiến */}
                      {((myOnlineSymbol === 'X' && currentOnlineRoom.readyO && !currentOnlineRoom.readyX) ||
                        (myOnlineSymbol === 'O' && currentOnlineRoom.readyX && !currentOnlineRoom.readyO)) && (
                        <div
                          style={{
                            padding: '10px',
                            background: 'rgba(212, 175, 55, 0.15)',
                            border: '1px solid var(--gold-primary)',
                            borderRadius: '8px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '6px' }}>
                            ĐỐI THỦ ĐANG KHIÊU CHIẾN BẠN!
                          </div>
                          <button
                            type="button"
                            className="btn"
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#fff',
                            }}
                            onClick={handleAcceptChallenge}
                          >
                            CHẤP NHẬN KHIÊU CHIẾN
                          </button>
                        </div>
                      )}

                      {/* Nút gửi khiêu chiến / Sẵn sàng nếu mình chưa bấm */}
                      {((myOnlineSymbol === 'X' && !currentOnlineRoom.readyX && !currentOnlineRoom.readyO) ||
                        (myOnlineSymbol === 'O' && !currentOnlineRoom.readyO && !currentOnlineRoom.readyX)) && (
                        <button
                          className="btn"
                          type="button"
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                          }}
                          onClick={handleStartOnlineMatch}
                        >
                          GỬI LỜI KHIÊU CHIẾN
                        </button>
                      )}

                      {/* Nếu mình đã sẵn sàng mà đối thủ chưa bấm */}
                      {((myOnlineSymbol === 'X' && currentOnlineRoom.readyX && !currentOnlineRoom.readyO) ||
                        (myOnlineSymbol === 'O' && currentOnlineRoom.readyO && !currentOnlineRoom.readyX)) && (
                        <div style={{ fontSize: '0.82rem', color: '#38bdf8', textAlign: 'center', padding: '6px' }}>
                          Đã gửi khiêu chiến! Đang chờ đối thủ chấp nhận...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PLAYER NAMES */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem' }}>Kỳ Thủ X (Đi trước)</label>
              <input
                type="text"
                maxLength={50}
                value={playerXName}
                onChange={(e) => setPlayerXName(e.target.value)}
                disabled={opponentType === 'ONLINE'}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem' }}>Kỳ Thủ O (Đi sau)</label>
              <input
                type="text"
                maxLength={50}
                value={playerOName}
                onChange={(e) => setPlayerOName(e.target.value)}
                disabled={opponentType.startsWith('BOT') || opponentType === 'ONLINE'}
              />
            </div>
          </div>

          {/* 3X3 RULE SELECTOR */}
          {boardSize === 3 && (
            <div style={{ marginTop: '16px' }}>
              <div className="arena-section-title">QUY TẮC BÀN 3X3</div>
              <div className="segmented-group">
                <button
                  type="button"
                  className={`segmented-btn ${ruleMode === 'infinite' ? 'active' : ''}`}
                  onClick={() => handleRuleModeChange('infinite')}
                  disabled={!!currentOnlineRoom}
                >
                  Vô Tận (3 Quân)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${ruleMode === 'classic' ? 'active' : ''}`}
                  onClick={() => handleRuleModeChange('classic')}
                  disabled={!!currentOnlineRoom}
                >
                  Cổ Điển
                </button>
              </div>
              <div className="mode-tip" style={{ marginTop: '8px', fontSize: '0.82rem' }}>
                <b>Luật Vô Tận:</b> Mỗi bên giữ tối đa 3 quân. Đánh quân thứ 4, quân thứ 1 biến mất!
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button
              className="btn"
              type="button"
              style={{ width: '100%' }}
              onClick={() => {
                if (opponentType === 'ONLINE' && currentOnlineRoom) {
                  handleStartOnlineMatch();
                } else {
                  resetLocalGame();
                }
              }}
              disabled={opponentType === 'ONLINE' && countdown !== null}
            >
              {opponentType === 'ONLINE' && currentOnlineRoom
                ? (countdown !== null ? `ĐANG KHỞI TRANH (${countdown})...` : 'BẮT ĐẦU VÀO TRẬN')
                : 'Bắt Đầu Ván Mới'}
            </button>
          </div>
        </div>

        {/* CAREER STATS MINI CARD */}
        <div className="card" style={{ marginBottom: 0, marginTop: '20px' }}>
          <div className="arena-section-title">THỐNG KÊ SỰ NGHIỆP</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(15,23,42,0.6)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                TỔNG VÁN
              </div>
              <div
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {stats.gamesPlayed}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15,23,42,0.6)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700 }}>
                X THẮNG
              </div>
              <div
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#f43f5e',
                }}
              >
                {stats.xWins}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15,23,42,0.6)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700 }}>
                O THẮNG
              </div>
              <div
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#06b6d4',
                }}
              >
                {stats.oWins}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15,23,42,0.6)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                HÒA
              </div>
              <div
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#fbbf24',
                }}
              >
                {stats.draws}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: ARENA BOARD STAGE */}
      <main className="arena-board-stage">
        <div
          className="status"
          style={{ marginBottom: '24px' }}
        >
          {statusMessage}
          {dyingCoord && (
            <span style={{ fontSize: '0.88rem', color: '#fca5a5', marginLeft: '12px' }}>
              (1 quân cũ nhất sắp biến mất)
            </span>
          )}
        </div>

        <CaroBoard
          boardSize={boardSize}
          board={board}
          winningLine={winningLine}
          dyingCoord={dyingCoord}
          onCellClick={handleCellClick}
          disabled={isGameOver || isAiThinking || isOnlineLocked}
          boardThemeClass={equipped?.boardThemeClass}
          pieceSkinClass={equipped?.pieceSkinClass}
          boardThemeGradient={equipped?.boardThemeGradient}
          pieceSkinGradient={equipped?.pieceSkinGradient}
          isLockedTurn={isOnlineLocked}
          isMyTurn={opponentType === 'ONLINE' && !isOnlineLocked && !isGameOver}
        />

        {/* ĐẾM NGƯỢC 3S KHỞI TRANH TRẬN ĐẤU ONLINE */}
        {countdown !== null && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 7, 15, 0.9)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: typeof countdown === 'number' ? '6rem' : '4rem',
                fontWeight: 900,
                color: typeof countdown === 'number' ? 'var(--gold-primary, #FFD700)' : '#10B981',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
                animation: 'pulse 0.8s infinite alternate',
              }}
            >
              {countdown}
            </div>
            <div
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '1.2rem',
                letterSpacing: '2px',
                color: 'var(--text-main, #E2E8F0)',
                marginTop: '16px',
                textTransform: 'uppercase',
              }}
            >
              {typeof countdown === 'number' ? 'Chuẩn bị bước vào đấu trường...' : 'Trận đấu chính thức bắt đầu!'}
            </div>
          </div>
        )}

        {/* MODAL / BANNER CHÚC MỪNG CHIẾN THẮNG HOẶC CHIA BUỒN BẠI TRẬN */}
        {endGameModal && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 7, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              animation: 'fadeIn 0.3s ease',
            }}
            onClick={() => setEndGameModal(null)}
          >
            <div
              className="modal-content"
              style={{
                width: '90%',
                maxWidth: '460px',
                textAlign: 'center',
                padding: '36px 28px',
                borderRadius: '16px',
                background:
                  endGameModal.type === 'WIN'
                    ? 'linear-gradient(145deg, rgba(20, 24, 38, 0.98), rgba(12, 16, 26, 0.98))'
                    : endGameModal.type === 'DEFEAT'
                    ? 'linear-gradient(145deg, rgba(35, 15, 20, 0.98), rgba(18, 10, 14, 0.98))'
                    : 'linear-gradient(145deg, rgba(25, 25, 32, 0.98), rgba(15, 15, 20, 0.98))',
                border:
                  endGameModal.type === 'WIN'
                    ? '1px solid rgba(212, 175, 55, 0.5)'
                    : endGameModal.type === 'DEFEAT'
                    ? '1px solid rgba(244, 63, 94, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.3)',
                boxShadow:
                  endGameModal.type === 'WIN'
                    ? '0 0 40px rgba(212, 175, 55, 0.25), inset 0 0 20px rgba(212, 175, 55, 0.1)'
                    : endGameModal.type === 'DEFEAT'
                    ? '0 0 40px rgba(244, 63, 94, 0.2), inset 0 0 20px rgba(244, 63, 94, 0.08)'
                    : '0 0 30px rgba(148, 163, 184, 0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grandmaster Diamond Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  transform: 'rotate(45deg)',
                  margin: '0 auto 24px',
                  background:
                    endGameModal.type === 'WIN'
                      ? 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)'
                      : endGameModal.type === 'DEFEAT'
                      ? 'linear-gradient(135deg, #F43F5E 0%, #9F1239 100%)'
                      : 'linear-gradient(135deg, #94A3B8 0%, #475569 100%)',
                  boxShadow:
                    endGameModal.type === 'WIN'
                      ? '0 0 25px rgba(255, 215, 0, 0.6)'
                      : endGameModal.type === 'DEFEAT'
                      ? '0 0 20px rgba(244, 63, 94, 0.5)'
                      : '0 0 15px rgba(148, 163, 184, 0.4)',
                }}
              >
                <span
                  style={{
                    transform: 'rotate(-45deg)',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: '#0D0E12',
                  }}
                >
                  {endGameModal.winnerSymbol || '—'}
                </span>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '1.45rem',
                  letterSpacing: '2px',
                  margin: '0 0 10px',
                  color:
                    endGameModal.type === 'WIN'
                      ? 'var(--gold-primary, #FFD700)'
                      : endGameModal.type === 'DEFEAT'
                      ? '#F43F5E'
                      : '#E2E8F0',
                  textShadow:
                    endGameModal.type === 'WIN'
                      ? '0 0 15px rgba(255, 215, 0, 0.4)'
                      : endGameModal.type === 'DEFEAT'
                      ? '0 0 15px rgba(244, 63, 94, 0.4)'
                      : 'none',
                }}
              >
                {endGameModal.title}
              </h2>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  color: 'var(--text-muted, #94a3b8)',
                  margin: '0 0 28px',
                }}
              >
                {endGameModal.subtitle}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: '10px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background:
                      endGameModal.type === 'WIN'
                        ? 'linear-gradient(135deg, #d4af37, #b8860b)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#0d0e12',
                  }}
                  onClick={async () => {
                    setEndGameModal(null);
                    if (opponentType === 'ONLINE' && currentOnlineRoom) {
                      try {
                        const updated = await roomApi.setReady(currentOnlineRoom.roomCode, true);
                        syncOnlineRoomState(updated);
                        startOnlinePolling(currentOnlineRoom.roomCode);
                        showToast('Đã gửi lời mời tái đấu ván mới! Đang chờ đối thủ đồng ý...', 'info');
                      } catch (e) {
                        showToast('Không thể gửi yêu cầu tái đấu', 'error');
                      }
                    } else {
                      resetLocalGame();
                    }
                  }}
                >
                  {opponentType === 'ONLINE' ? 'TÁI ĐẤU VÁN MỚI' : 'Ván Mới'}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                  onClick={() => setEndGameModal(null)}
                >
                  Xem Bàn Cờ
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODAL XÁC NHẬN RỜI PHÒNG KHI ĐANG THI ĐẤU (XỬ THUA) */}
        {confirmLeaveOpen && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 7, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
            onClick={() => setConfirmLeaveOpen(false)}
          >
            <div
              className="modal-content"
              style={{
                width: '90%',
                maxWidth: '440px',
                textAlign: 'center',
                padding: '30px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(145deg, rgba(30, 15, 20, 0.98), rgba(18, 10, 14, 0.98))',
                border: '1px solid rgba(244, 63, 94, 0.5)',
                boxShadow: '0 0 40px rgba(244, 63, 94, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  transform: 'rotate(45deg)',
                  margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #F43F5E 0%, #9F1239 100%)',
                  boxShadow: '0 0 20px rgba(244, 63, 94, 0.6)',
                }}
              >
                <span
                  style={{
                    transform: 'rotate(-45deg)',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    color: '#fff',
                  }}
                >
                  !
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '1.25rem',
                  letterSpacing: '1px',
                  color: '#F43F5E',
                  margin: '0 0 12px',
                }}
              >
                CẢNH BÁO BỎ CUỘC
              </h3>

              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  color: 'var(--text-muted, #94a3b8)',
                  margin: '0 0 24px',
                }}
              >
                Trận đấu đang diễn ra! Nếu bạn rời phòng bây giờ, bạn sẽ bị <b style={{ color: '#F43F5E' }}>XỬ THUA NGAY LẬP TỨC</b> và đối thủ sẽ được tính là chiến thắng. Bạn có chắc chắn muốn rời phòng?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                  onClick={() => setConfirmLeaveOpen(false)}
                >
                  Ở Lại Thi Đấu
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: '8px 22px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#fff',
                  }}
                  onClick={executeLeaveRoom}
                >
                  Chấp Nhận Xử Thua & Rời
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default GamePage;
