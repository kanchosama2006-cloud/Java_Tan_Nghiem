import React from 'react';

export function ConfirmModal({
  isOpen,
  title = 'Xác Nhận Hành Động',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  isDanger = true,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-bg show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="confirm-card">
        <div className={`confirm-crest ${isDanger ? 'error-crest' : ''}`}></div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="btn ghost small" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn small ${isDanger ? 'danger' : ''}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
