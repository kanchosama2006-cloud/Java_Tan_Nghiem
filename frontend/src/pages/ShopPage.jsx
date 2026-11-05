import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import shopApi from '../services/shopApi';
import ConfirmModal from '../components/ConfirmModal';
import { LoadingState, EmptyState, ErrorState } from '../components/UiStates';

export function ShopPage() {
  const { user, refreshAuthAndEquipped, updateCoins } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState('ALL');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buy Confirm Modal State
  const [buyTarget, setBuyTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Transactions Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  const fetchShopItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shopApi.getItems(category);
      setItems(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách vật phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopItems();
  }, [category]);

  const handleBuyConfirm = async () => {
    if (!buyTarget) return;
    setActionLoading(true);
    try {
      const res = await shopApi.buyItem(buyTarget.id);
      showToast(res.message || 'Giao dịch thành công! Đã sở hữu vật phẩm.', 'success');
      if (res.newBalance !== undefined) {
        updateCoins(res.newBalance);
      }
      setBuyTarget(null);
      await fetchShopItems();
      await refreshAuthAndEquipped();
    } catch (err) {
      showToast(err.message || 'Mua vật phẩm thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEquip = async (itemId) => {
    try {
      const res = await shopApi.equipItem(itemId);
      showToast(res.message || 'Đã trang bị vật phẩm thành công!', 'success');
      await fetchShopItems();
      await refreshAuthAndEquipped();
    } catch (err) {
      showToast(err.message || 'Trang bị thất bại', 'error');
    }
  };

  const handleOpenTxModal = async () => {
    setShowTxModal(true);
    setTxLoading(true);
    try {
      const list = await shopApi.getTransactions();
      setTransactions(list || []);
    } catch (err) {
      showToast('Không tải được lịch sử giao dịch: ' + err.message, 'error');
    } finally {
      setTxLoading(false);
    }
  };

  const categories = [
    { key: 'ALL', label: 'TẤT CẢ VẬT PHẨM' },
    { key: 'BOARD_THEME', label: 'GIAO DIỆN BÀN CỜ' },
    { key: 'PIECE_SKIN', label: 'QUÂN CỜ NGHỆ THUẬT' },
    { key: 'AVATAR_FRAME', label: 'KHUNG VƯƠNG GIẢ' },
  ];

  return (
    <div className="page-container">
      <div className="storefront-header">
        <div>
          <h1 className="page-title">CỬA HÀNG ĐẤU TRƯỜNG</h1>
          <p className="page-subtitle">
            Sưu tập các skin cờ nghệ thuật, giao diện bàn cờ và khung vương giả
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn ghost small"
            type="button"
            onClick={handleOpenTxModal}
          >
            Lịch Sử Giao Dịch
          </button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="store-tabs" style={{ marginBottom: '24px' }}>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`store-tab-btn ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* SHOP ITEMS GRID */}
      {loading ? (
        <LoadingState message="Đang tải danh sách vật phẩm đấu trường..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchShopItems} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Không Tìm Thấy Vật Phẩm"
          message="Hiện chưa có vật phẩm nào trong phân mục này."
        />
      ) : (
        <div className="shop-grid">
          {items.map((item) => {
            let preview = null;
            if (item.category === 'BOARD_THEME') {
              preview = (
                <div
                  className={`shop-item-preview ${item.cssClass}`}
                  style={{ background: item.previewGradient }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 24px)',
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}></div>
                    <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}></div>
                    <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}></div>
                  </div>
                </div>
              );
            } else if (item.category === 'PIECE_SKIN') {
              preview = (
                <div
                  className="shop-item-preview"
                  style={{ background: item.previewGradient }}
                >
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className={`preview-cell ${item.cssClass}`}>
                      <span className="cell-x">X</span>
                    </div>
                    <div className={`preview-cell ${item.cssClass}`}>
                      <span className="cell-o">O</span>
                    </div>
                  </div>
                </div>
              );
            } else {
              preview = (
                <div
                  className="shop-item-preview"
                  style={{ background: 'rgba(15, 23, 42, 0.9)' }}
                >
                  <div
                    className={`preview-avatar ${item.cssClass}`}
                    style={{ boxShadow: '0 0 16px rgba(255,255,255,0.2)' }}
                  >
                    <span style={{ color: '#fff', fontSize: '1.2rem' }}>K</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="shop-item-card">
                {preview}
                <div className="shop-item-info">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '6px',
                    }}
                  >
                    <div className="shop-item-name">{item.name}</div>
                    {item.equipped ? (
                      <span className="shop-status-badge equipped">ĐANG DÙNG</span>
                    ) : item.owned ? (
                      <span className="shop-status-badge owned">ĐÃ CÓ</span>
                    ) : null}
                  </div>

                  <div className="shop-item-desc">{item.description}</div>

                  <div className="shop-item-meta">
                    <div className="shop-item-price">
                      {Number(item.price).toLocaleString('vi-VN')}{' '}
                      <span style={{ fontSize: '0.75rem', color: '#d4af37' }}>XU</span>
                    </div>

                    {item.owned ? (
                      item.equipped ? (
                        <button className="btn small ghost" disabled type="button">
                          Đang Dùng
                        </button>
                      ) : (
                        <button
                          className="btn small light"
                          type="button"
                          onClick={() => handleEquip(item.id)}
                        >
                          Trang Bị
                        </button>
                      )
                    ) : (
                      <button
                        className="btn small"
                        type="button"
                        onClick={() => setBuyTarget(item)}
                      >
                        Mua Ngay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM BUY MODAL */}
      <ConfirmModal
        isOpen={!!buyTarget}
        title="MUA VẬT PHẨM ĐẤU TRƯỜNG"
        message={`Bạn có muốn dùng ${Number(buyTarget?.price || 0).toLocaleString('vi-VN')} Xu để sở hữu "${buyTarget?.name}" không?`}
        confirmText={actionLoading ? 'Đang giao dịch...' : 'MUA NGAY'}
        isDanger={false}
        onConfirm={handleBuyConfirm}
        onCancel={() => setBuyTarget(null)}
      />

      {/* TRANSACTION HISTORY MODAL */}
      {showTxModal && (
        <div
          className="confirm-modal-bg show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTxModal(false);
          }}
        >
          <div
            className="confirm-card"
            style={{ maxWidth: '620px', width: '92%', textAlign: 'left' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
                LỊCH SỬ GIAO DỊCH VÍ XU
              </h3>
              <button
                className="btn ghost small"
                type="button"
                onClick={() => setShowTxModal(false)}
              >
                ĐÓNG
              </button>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Thời Gian</th>
                    <th>Biến Động</th>
                    <th>Số Dư</th>
                    <th>Nội Dung</th>
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                        <span className="btn-spinner"></span> Đang tải...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}
                      >
                        Chưa ghi nhận giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isPos = tx.amount > 0;
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td
                            style={{
                              fontWeight: 700,
                              color: isPos ? '#10b981' : '#ef4444',
                              fontFamily: 'Orbitron, monospace',
                            }}
                          >
                            {isPos ? '+' : ''}
                            {Number(tx.amount).toLocaleString('vi-VN')} XU
                          </td>
                          <td
                            style={{
                              fontWeight: 600,
                              color: '#fff',
                              fontFamily: 'Orbitron, monospace',
                            }}
                          >
                            {Number(tx.balanceAfter).toLocaleString('vi-VN')} XU
                          </td>
                          <td style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            {tx.description}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopPage;
