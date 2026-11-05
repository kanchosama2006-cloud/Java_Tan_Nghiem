import React, { useState, useEffect } from 'react';
import { leaderboardApi } from '../services/userApi';
import { LoadingState, EmptyState, ErrorState } from '../components/UiStates';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await leaderboardApi.getTop();
      setLeaders(res.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải bảng vàng danh giá.');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
            color: '#0D0E12',
            fontWeight: 800,
            fontSize: '0.85rem',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
          }}
        >
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)',
            color: '#0D0E12',
            fontWeight: 800,
            fontSize: '0.85rem',
            boxShadow: '0 0 10px rgba(226, 232, 240, 0.3)',
          }}
        >
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.85rem',
            boxShadow: '0 0 10px rgba(205, 127, 50, 0.3)',
          }}
        >
          3
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', width: '28px', textAlign: 'center', display: 'inline-block' }}>
        {rank}
      </span>
    );
  };

  return (
    <div className="leaderboard-page-container">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '1.5px', margin: 0 }}>
            BẢNG VÀNG ĐẠI KỲ THỦ
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Vinh danh những cao thủ sở hữu số trận thắng và điểm Elo cao nhất toàn đấu trường.
          </p>
        </div>
      </div>

      {loading && <LoadingState message="Đang kết nối Bảng Vàng danh vọng..." />}
      {error && !loading && <ErrorState message={error} onRetry={loadLeaderboard} />}
      {!loading && !error && leaders.length === 0 && (
        <EmptyState
          title="CHƯA CÓ DỮ LIỆU"
          message="Đấu trường hiện chưa có bảng xếp hạng. Hãy thi đấu ván đầu tiên để khắc tên mình lên bảng vàng!"
          actionLabel="THI ĐẤU NGAY"
          onAction={() => window.location.href = '/game'}
        />
      )}

      {!loading && !error && leaders.length > 0 && (
        <div className="panel" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '16px 20px', width: '70px' }}>Hạng</th>
                <th style={{ padding: '16px 20px' }}>Kỳ Thủ</th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>Số Trận Thắng</th>
                <th style={{ padding: '16px 20px', textAlign: 'center' }}>Tổng Trận</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Tỷ Lệ Thắng</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((item, idx) => {
                const rank = idx + 1;
                const winRate = item.totalGames > 0 ? Math.round((item.winCount / item.totalGames) * 100) : 0;
                return (
                  <tr
                    key={item.userId || idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: rank === 1 ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      {getRankBadge(rank)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          className={`nav-avatar-box ${item.avatarFrameClass || ''}`}
                          style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}
                        >
                          {(item.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: rank === 1 ? 'var(--gold-primary)' : 'var(--text-main)' }}>
                            {item.username}
                          </div>
                          {item.fullName && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {item.fullName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 700, color: 'var(--color-win)' }}>
                      {item.winCount || 0}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {item.totalGames || 0}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700 }}>
                      <span style={{ color: winRate >= 50 ? 'var(--gold-primary)' : 'var(--text-muted)' }}>
                        {winRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
