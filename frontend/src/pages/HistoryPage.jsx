import React, { useState, useEffect } from 'react';
import { gameApi } from '../services/gameApi';
import { commentApi } from '../services/userApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import CaroBoard from '../components/CaroBoard';
import ConfirmModal from '../components/ConfirmModal';
import { LoadingState, EmptyState, ErrorState } from '../components/UiStates';

export default function HistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [filterMode, setFilterMode] = useState('ALL');

  // Replay Modal State
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);

  // Rating & Comment State
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await gameApi.getMyGames();
      setGames(res.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử đấu.');
    } finally {
      setLoading(false);
    }
  };

  // Replay navigation
  const moves = selectedGame?.movesList || [];

  const boardAtStep = React.useMemo(() => {
    if (!selectedGame) return [];
    const size = selectedGame.boardSize || 3;
    const isInfinite = selectedGame.gameMode === 'INFINITE' || selectedGame.isInfinite;
    const maxMoves = isInfinite ? (size === 3 ? 3 : 5) : 999;

    const board = Array(size).fill(null).map(() => Array(size).fill(''));
    const xQueue = [];
    const oQueue = [];

    const activeMoves = moves.slice(0, currentStep);
    activeMoves.forEach((m) => {
      const { row, col, player } = m;
      if (row >= 0 && row < size && col >= 0 && col < size) {
        if (isInfinite) {
          const q = player === 'X' ? xQueue : oQueue;
          if (q.length >= maxMoves) {
            const oldest = q.shift();
            board[oldest.row][oldest.col] = '';
          }
          q.push({ row, col });
        }
        board[row][col] = player;
      }
    });

    return board;
  }, [selectedGame, currentStep, moves]);

  // Auto-play timer
  useEffect(() => {
    let timer = null;
    if (isPlayingAuto && selectedGame) {
      if (currentStep < moves.length) {
        timer = setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, 800);
      } else {
        setIsPlayingAuto(false);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlayingAuto, currentStep, moves.length, selectedGame]);

  const openReplay = async (game) => {
    // Parse moves list if needed
    let parsedMoves = [];
    try {
      if (Array.isArray(game.movesList)) {
        parsedMoves = game.movesList;
      } else if (typeof game.movesJson === 'string') {
        parsedMoves = JSON.parse(game.movesJson);
      }
    } catch (e) {
      parsedMoves = [];
    }

    const gameObj = { ...game, movesList: parsedMoves };
    setSelectedGame(gameObj);
    setCurrentStep(parsedMoves.length);
    setIsPlayingAuto(false);

    // Load comments
    loadComments(game.id);
  };

  const closeReplay = () => {
    setSelectedGame(null);
    setIsPlayingAuto(false);
    setComments([]);
    setNewComment('');
  };

  const loadComments = async (gameId) => {
    try {
      setCommentsLoading(true);
      const res = await commentApi.getByGame(gameId);
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedGame) return;

    try {
      setSubmittingComment(true);
      await commentApi.addComment({
        gameId: selectedGame.id,
        content: newComment.trim(),
        rating: selectedRating,
      });
      showToast('Đã gửi bình luận & đánh giá.', 'success');
      setNewComment('');
      loadComments(selectedGame.id);
    } catch (err) {
      showToast(err.message || 'Không thể gửi bình luận.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await gameApi.deleteGame(deleteId);
      showToast('Đã xóa ván đấu khỏi lịch sử.', 'success');
      setGames((prev) => prev.filter((g) => g.id !== deleteId));
      if (selectedGame?.id === deleteId) {
        closeReplay();
      }
    } catch (err) {
      showToast(err.message || 'Không thể xóa ván đấu.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredGames = games.filter((g) => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'BOT') return g.opponentType === 'BOT';
    if (filterMode === 'PVP') return g.opponentType === 'PVP' || g.opponentType === 'ONLINE';
    if (filterMode === 'WIN') return g.winner === 'X';
    return true;
  });

  return (
    <div className="history-page-container">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '1.5px', margin: 0 }}>
            LỊCH SỬ THI ĐẤU
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Xem lại diễn biến các kỳ đài, phân tích nước đi và chia sẻ chiến thuật.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'BOT', label: 'Đấu AI' },
            { id: 'PVP', label: 'Đấu người' },
            { id: 'WIN', label: 'Thắng lợi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`btn btn-secondary ${filterMode === tab.id ? 'active' : ''}`}
              style={{
                fontSize: '0.82rem',
                padding: '6px 14px',
                borderColor: filterMode === tab.id ? 'var(--gold-primary)' : 'var(--border-subtle)',
                color: filterMode === tab.id ? 'var(--gold-primary)' : 'var(--text-muted)',
                background: filterMode === tab.id ? 'var(--gold-surface)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 UI States */}
      {loading && <LoadingState message="Đang tải lịch sử thi đấu..." />}
      {error && !loading && <ErrorState message={error} onRetry={loadGames} />}
      {!loading && !error && filteredGames.length === 0 && (
        <EmptyState
          title="CHƯA CÓ VÁN ĐẤU"
          message="Bạn chưa hoàn thành ván cờ nào hoặc không khớp bộ lọc đã chọn."
          actionLabel="VÀO ĐẤU TRƯỜNG NGAY"
          onAction={() => window.location.href = '/game'}
        />
      )}

      {/* Games Table/List */}
      {!loading && !error && filteredGames.length > 0 && (
        <div className="panel" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '14px 18px' }}>Mã #</th>
                <th style={{ padding: '14px 18px' }}>Đối thủ</th>
                <th style={{ padding: '14px 18px' }}>Bàn cờ</th>
                <th style={{ padding: '14px 18px' }}>Chế độ</th>
                <th style={{ padding: '14px 18px' }}>Kết quả</th>
                <th style={{ padding: '14px 18px' }}>Thời gian</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((g) => {
                const isWin = g.winner === 'X';
                const isDraw = g.winner === 'DRAW';
                const outcomeLabel = isDraw ? 'HÒA' : isWin ? 'CHIẾN THẮNG' : 'THẤT BẠI';
                const outcomeColor = isDraw ? 'var(--text-muted)' : isWin ? 'var(--color-win)' : 'var(--color-loss)';

                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      #{g.id}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                      {g.playerOName || (g.opponentType === 'BOT' ? 'AI Bot' : 'Đối thủ')}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                        {g.opponentType === 'BOT' ? `Bot (${g.botDifficulty || 'NORMAL'})` : 'PvP'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {g.boardSize || 3}x{g.boardSize || 3}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className="badge" style={{ fontSize: '0.75rem' }}>
                        {g.gameMode === 'INFINITE' ? 'VÔ TẬN' : 'CỔ ĐIỂN'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ color: outcomeColor, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                        {outcomeLabel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {g.createdAt ? new Date(g.createdAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => openReplay(g)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', marginRight: '8px' }}
                      >
                        XEM LẠI
                      </button>
                      <button
                        onClick={() => setDeleteId(g.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        XÓA
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REPLAY & COMMENTS MODAL */}
      {selectedGame && (
        <div className="modal-overlay" onClick={closeReplay}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '960px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', color: 'var(--gold-primary)' }}>
                  PHÂN TÍCH VÁN ĐẤU #{selectedGame.id}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Bàn {selectedGame.boardSize}x{selectedGame.boardSize} • {selectedGame.gameMode === 'INFINITE' ? 'Luật Vô Tận' : 'Luật Cổ Điển'}
                </span>
              </div>
              <button onClick={closeReplay} className="btn btn-secondary" style={{ padding: '4px 12px' }}>
                ĐÓNG
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1fr)', gap: '24px' }}>
              {/* Left Column: Replay Board */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center', marginBottom: '8px' }}>
                  <CaroBoard
                    size={selectedGame.boardSize || 3}
                    board={boardAtStep}
                    onCellClick={() => {}}
                    disabled={true}
                    boardThemeClass={selectedGame.boardThemeClass || ''}
                    pieceSkinClass={selectedGame.pieceSkinClass || ''}
                  />
                </div>

                {/* Step Controls */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => { setCurrentStep(0); setIsPlayingAuto(false); }}
                    disabled={currentStep === 0}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    |&lt; Đầu
                  </button>
                  <button
                    onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlayingAuto(false); }}
                    disabled={currentStep === 0}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    &lt; Lùi
                  </button>
                  <button
                    onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    {isPlayingAuto ? 'TẠM DỪNG' : 'TỰ ĐỘNG'}
                  </button>
                  <button
                    onClick={() => { setCurrentStep((p) => Math.min(moves.length, p + 1)); setIsPlayingAuto(false); }}
                    disabled={currentStep >= moves.length}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Tiến &gt;
                  </button>
                  <button
                    onClick={() => { setCurrentStep(moves.length); setIsPlayingAuto(false); }}
                    disabled={currentStep >= moves.length}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Cuối &gt;|
                  </button>
                </div>

                <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Nước đi: <strong style={{ color: 'var(--gold-primary)' }}>{currentStep}</strong> / {moves.length}
                </div>
              </div>

              {/* Right Column: Rating & Discussion */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', letterSpacing: '0.5px' }}>
                  ĐÁNH GIÁ & BÌNH LUẬN
                </h4>

                {/* Add Comment Box */}
                <form onSubmit={handleAddComment} style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chất lượng trận:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setSelectedRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: star <= selectedRating ? 'var(--gold-primary)' : 'var(--border-subtle)',
                            fontSize: '1.2rem',
                          }}
                        >
                          ◆
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Viết nhận xét chiến thuật..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={submittingComment}
                      style={{ fontSize: '0.88rem' }}
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      {submittingComment ? 'GỬI...' : 'GỬI'}
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {commentsLoading && <LoadingState message="Đang tải bình luận..." />}
                  {!commentsLoading && comments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Chưa có đánh giá nào cho ván cờ này. Hãy là người đầu tiên!
                    </div>
                  )}
                  {!commentsLoading && comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gold-primary)' }}>
                          {c.username || 'Kỳ thủ'}
                        </span>
                        <span style={{ color: 'var(--gold-primary)', fontSize: '0.8rem' }}>
                          {'◆'.repeat(c.rating || 5)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {c.content}
                      </p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="XÁC NHẬN XÓA VÁN ĐẤU"
        message="Hành động này sẽ xóa vĩnh viễn ván đấu này khỏi hồ sơ của bạn. Bạn có chắc chắn muốn xóa không?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmLabel="XÓA VĨNH VIỄN"
        cancelLabel="HỦY BỎ"
        isDanger={true}
      />
    </div>
  );
}
