import React from 'react';

export function LoadingState({ message = 'Đang tải dữ liệu...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <span className="btn-spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }}></span>
      <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{message}</p>
    </div>
  );
}

export function SkeletonRows({ cols = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div
                className="skeleton-bar"
                style={{ width: c === 0 ? '40%' : c === 1 ? '70%' : '55%' }}
              ></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmptyState({
  title = 'Không Có Dữ Liệu',
  message = 'Hiện tại chưa ghi nhận bản ghi nào trong hệ thống.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-crest"></div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{message}</div>
      {actionLabel && onAction && (
        <button className="btn small" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Lỗi Tải Dữ Liệu',
  message = 'Không thể kết nối hoặc máy chủ phản hồi lỗi.',
  onRetry,
}) {
  return (
    <div className="error-state">
      <div className="error-crest"></div>
      <div className="error-state-title">{title}</div>
      <div className="error-state-desc">{message}</div>
      {onRetry && (
        <button
          className="btn small light"
          type="button"
          onClick={onRetry}
          style={{ marginTop: '12px' }}
        >
          Thử Lại (Retry)
        </button>
      )}
    </div>
  );
}
