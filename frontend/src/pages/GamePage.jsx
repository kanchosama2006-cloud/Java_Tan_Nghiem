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

  // Game Board State
  const [board, setBoard] = useState(Array.from({ length: 3 }, () => Array(3).fill('')));
  const [turn, setTurn] = useState('X');
  const [moves, setMoves] = useState([]);
  const [queueX, setQueueX] = useState([]);
  const [queueO, setQueueO] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winningLine, setWinningLine] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Lượt đi: Kỳ thủ X (X)');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [stats, setStats] = useState({ gamesPlayed: 0, xWins: 0, oWins: 0, draws: 0 });

  // Online Multiplayer State
  const [waitingRooms, setWaitingRooms] = useState([]);
  const [isLobbyLoading, setIsLobbyLoading] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [currentOnlineRoom, setCurrentOnlineRoom] = useState(null);
  const [myOnlineSymbol, setMyOnlineSymbol] = useState(null);
  const pollingIntervalRef = useRef(null);

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
    setBoard(Array.from({ length: size }, () => Array(size).fill('')));
    setTurn('X');
    setMoves([]);
    setQueueX([]);
    setQueueO([]);
    setIsGameOver(false);
    setWinningLine(null);
    setIsAiThinking(false);
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

  // Local Move Execution
  const executeLocalMove = (r, c, currentSymbol) => {
    let nextBoard = board.map((row) => [...row]);
    let nextQueueX = [...queueX];
    let nextQueueO = [...queueO];
    const isInfinite = boardSize === 3 && ruleMode === 'infinite';

    if (isInfinite) {
      const activeQueue = currentSymbol === 'X' ? nextQueueX : nextQueueO;
      if (activeQueue.length >= 3) {
        const oldest = activeQueue.shift();
        nextBoard[oldest[0]][oldest[1]] = '';
      }
      nextBoard[r][c] = currentSymbol;
      activeQueue.push([r, c]);
    } else {
      nextBoard[r][c] = currentSymbol;
    }

    const nextMoves = [...moves, { row: r, col: c, symbol: currentSymbol }];
    setBoard(nextBoard);
    setMoves(nextMoves);
    setQueueX(nextQueueX);
    setQueueO(nextQueueO);

    // Check Win
    const winning = checkWinCondition(nextBoard, r, c, currentSymbol, boardSize);
    if (winning) {
      setIsGameOver(true);
      setWinningLine(winning);
      const winnerName = currentSymbol === 'X' ? playerXName : playerOName;
      setStatusMessage(`${winnerName} (${currentSymbol}) CHIẾN THẮNG!`);
      showToast(`Chúc mừng ${winnerName} (${currentSymbol}) đã chiến thắng!`, 'success');
      finishLocalGame(currentSymbol, nextMoves);
    } else if (
      nextMoves.length >= boardSize * boardSize &&
      !(boardSize === 3 && ruleMode === 'infinite')
    ) {
      setIsGameOver(true);
      setStatusMessage('Trận đấu Hòa!');
      showToast('Trận đấu kết thúc với kết quả Hòa!', 'info');
      finishLocalGame('DRAW', nextMoves);
    } else {
      const nextTurn = currentSymbol === 'X' ? 'O' : 'X';
      setTurn(nextTurn);
      const nextName = nextTurn === 'X' ? playerXName : playerOName;
      setStatusMessage(`Lượt đi: ${nextName} (${nextTurn})`);
      return { nextBoard, nextMoves, nextTurn };
    }
    return null;
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
  const triggerBotTurn = async (currentMoves) => {
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
        moves: currentMoves,
      });

      if (botRes.row >= 0 && botRes.col >= 0) {
        setTimeout(() => {
          setIsAiThinking(false);
          executeLocalMove(botRes.row, botRes.col, 'O');
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

    const res = executeLocalMove(r, c, turn);
    if (res && isBotMatch && res.nextTurn === 'O') {
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

    setBoard(nextBoard);
    setMoves(room.moves || []);
    setQueueX(qX);
    setQueueO(qO);

    if (room.status === 'FINISHED') {
      setIsGameOver(true);
      stopOnlinePolling();
      if (room.winner === 'DRAW') {
        setStatusMessage('Trận đấu Hòa!');
      } else {
        const wName = room.winner === 'X' ? room.playerX : room.playerO;
        setStatusMessage(`${wName} (${room.winner}) CHIẾN THẮNG!`);
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

  const handleLeaveRoom = () => {
    stopOnlinePolling();
    setCurrentOnlineRoom(null);
    setMyOnlineSymbol(null);
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
              onClick={() => resetLocalGame()}
              disabled={opponentType === 'ONLINE' && !!currentOnlineRoom}
            >
              Bắt Đầu Ván Mới
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
          isLockedTurn={isOnlineLocked}
          isMyTurn={opponentType === 'ONLINE' && !isOnlineLocked && !isGameOver}
        />
      </main>
    </div>
  );
}

export default GamePage;
