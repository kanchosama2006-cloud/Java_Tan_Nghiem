document.addEventListener('DOMContentLoaded', async () => {
  await initPage('achievements');
  loadAchievements();
});

async function loadAchievements() {
  const container = $('achievementsGrid');
  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <span class="btn-spinner"></span> Đang tải hệ thống danh hiệu...
    </div>
  `;

  try {
    const list = await api('/api/achievements');
    renderAchievements(list);
  } catch (e) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <div class="error-crest"></div>
        <p style="color: #ef4444; margin-bottom: 12px;">${esc(e.message || 'Không thể tải danh sách thành tựu')}</p>
        <button id="btnRetryAch" class="btn small" type="button">Thử Lại</button>
      </div>
    `;
    const btnRetry = $('btnRetryAch');
    if (btnRetry) btnRetry.onclick = loadAchievements;
  }
}

function renderAchievements(list) {
  const container = $('achievementsGrid');
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
        <div class="empty-crest"></div>
        <h3 style="color: #fff; margin-bottom: 6px;">Chưa Có Thành Tựu</h3>
        <p style="color: var(--text-muted);">Hệ thống danh hiệu đang được cập nhật.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const isUnlocked = item.unlocked;
    const current = item.currentProgress || 0;
    const target = item.targetValue || 1;
    const percent = Math.min(100, Math.round((current / target) * 100));

    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-top">
          <div class="achievement-crest"></div>
          <div class="achievement-reward">+${item.rewardCoins} XU</div>
        </div>
        <div class="achievement-title">${esc(item.title)}</div>
        <div class="achievement-desc">${esc(item.description)}</div>
        
        <div class="achievement-progress-bar">
          <div class="achievement-progress-fill" style="width: ${percent}%;"></div>
        </div>
        <div class="achievement-progress-text">
          <span>${isUnlocked ? 'ĐÃ HOÀN THÀNH' : 'TIẾN ĐỘ'}</span>
          <span>${current} / ${target} (${percent}%)</span>
        </div>
      </div>
    `;
  }).join('');
}
