import React, { useState, useEffect } from 'react';
import { achievementApi } from '../services/userApi';
import { LoadingState, EmptyState, ErrorState } from '../components/UiStates';

export function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await achievementApi.getAchievements();
      setAchievements(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách thành tựu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return (
    <div className="page-container">
      <div style={{ marginBottom: '30px' }}>
        <h1 className="page-title">HUY CHƯƠNG THÀNH TỰU</h1>
        <p className="page-subtitle">
          Vinh danh các cột mốc kỳ vương và thu thập phần thưởng Xu đấu trường
        </p>
      </div>

      {loading ? (
        <LoadingState message="Đang tải hệ thống danh hiệu..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAchievements} />
      ) : achievements.length === 0 ? (
        <EmptyState
          title="Chưa Có Thành Tựu"
          message="Hệ thống danh hiệu đang được cập nhật."
        />
      ) : (
        <div className="achievements-grid">
          {achievements.map((item) => {
            const isUnlocked = item.unlocked;
            const current = item.currentProgress || 0;
            const target = item.targetValue || 1;
            const percent = Math.min(100, Math.round((current / target) * 100));

            return (
              <div
                key={item.id}
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-top">
                  <div className="achievement-crest"></div>
                  <div className="achievement-reward">+{item.rewardCoins} XU</div>
                </div>

                <div className="achievement-title">{item.title}</div>
                <div className="achievement-desc">{item.description}</div>

                <div className="achievement-progress-bar">
                  <div
                    className="achievement-progress-fill"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <div className="achievement-progress-text">
                  <span>{isUnlocked ? 'ĐÃ HOÀN THÀNH' : 'TIẾN ĐỘ'}</span>
                  <span>
                    {current} / {target} ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AchievementsPage;
