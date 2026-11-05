import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../services/adminApi';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { LoadingState, EmptyState, ErrorState } from '../components/UiStates';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function AdminPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, SHOP, USERS, COMMENTS

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(null);

  // Shop Management Data
  const [shopItems, setShopItems] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    code: '',
    name: '',
    category: 'BOARD_THEME',
    price: 100,
    cssClass: '',
    description: '',
    active: true,
  });
  const [shopSaving, setShopSaving] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Users Management Data
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [adjustCoinModal, setAdjustCoinModal] = useState(null); // { user, amount: 0, reason: '' }
  const [adjustingCoin, setAdjustingCoin] = useState(false);

  // Comments Management Data
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);

  // Chart Canvas Refs
  const outcomeChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const outcomeChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);

  // Tab switching triggers
  useEffect(() => {
    if (activeTab === 'DASHBOARD') loadDashboard();
    if (activeTab === 'SHOP') loadShopItems();
    if (activeTab === 'USERS') loadUsers();
    if (activeTab === 'COMMENTS') loadComments();
  }, [activeTab]);

  // Load Dashboard KPI & Render Charts
  const loadDashboard = async () => {
    try {
      setDashLoading(true);
      setDashError(null);
      const res = await adminApi.getOverview();
      const data = res?.data || res;
      setDashboardData(data);
    } catch (err) {
      setDashError(err.message || 'Không thể tải bảng điều khiển Admin.');
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'DASHBOARD' && dashboardData && outcomeChartRef.current && revenueChartRef.current) {
      // 1. Outcome Doughnut Chart
      if (outcomeChartInstance.current) outcomeChartInstance.current.destroy();
      const outcomeCtx = outcomeChartRef.current.getContext('2d');
      const winX = dashboardData.xWins || 0;
      const winO = dashboardData.oWins || 0;
      const draws = dashboardData.draws || 0;

      outcomeChartInstance.current = new Chart(outcomeCtx, {
        type: 'doughnut',
        data: {
          labels: ['X Thắng', 'O Thắng', 'Hòa'],
          datasets: [
            {
              data: [winX, winO, draws],
              backgroundColor: ['#D4AF37', '#9E2A2B', '#64748B'],
              borderColor: '#0D0E12',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#E2E8F0', font: { family: 'Plus Jakarta Sans' } } },
          },
        },
      });

      // 2. Revenue Bar Chart
      if (revenueChartInstance.current) revenueChartInstance.current.destroy();
      const revenueCtx = revenueChartRef.current.getContext('2d');
      const rev = dashboardData.revenueByCategory || {};
      const labels = Object.keys(rev).map((k) =>
        k === 'BOARD_THEME' ? 'Mặt Bàn Cờ' : k === 'PIECE_SKIN' ? 'Kiểu Quân' : k === 'AVATAR_FRAME' ? 'Khung Viền' : k
      );
      const values = Object.values(rev);

      revenueChartInstance.current = new Chart(revenueCtx, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['Mặt Bàn Cờ', 'Kiểu Quân', 'Khung Viền'],
          datasets: [
            {
              label: 'Doanh Thu (Xu)',
              data: values.length ? values : [0, 0, 0],
              backgroundColor: '#D4AF37',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    return () => {
      if (outcomeChartInstance.current) outcomeChartInstance.current.destroy();
      if (revenueChartInstance.current) revenueChartInstance.current.destroy();
    };
  }, [dashboardData, activeTab]);

  // Load Shop Items
  const loadShopItems = async () => {
    try {
      setShopLoading(true);
      const res = await adminApi.getShopItems();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setShopItems(list);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh mục vật phẩm.', 'error');
    } finally {
      setShopLoading(false);
    }
  };

  // Cấu hình danh mục và các màu / theme mẫu để chọn nhanh 1 cú click
  const PRESET_STYLES = {
    BOARD_THEME: [
      { name: 'Đá Núi Lửa (Obsidian)', css: 'board-theme-obsidian', code: 'BOARD_OBSIDIAN', gradient: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)' },
      { name: 'Gỗ Hoàng Đàn (Wood)', css: 'board-theme-wood', code: 'BOARD_WOOD', gradient: 'linear-gradient(135deg, #854d0e 0%, #3f2a14 100%)' },
      { name: 'Ngọc Bích (Jade)', css: 'board-theme-jade', code: 'BOARD_JADE', gradient: 'radial-gradient(circle, #065f46 0%, #022c22 100%)' },
    ],
    PIECE_SKIN: [
      { name: 'Bạch Thạch (Trắng/Đen)', css: 'piece-skin-stone', code: 'SKIN_STONE', gradient: 'linear-gradient(135deg, #f8fafc 0%, #64748b 100%)' },
      { name: 'Hổ Phách (Vàng Kim)', css: 'piece-skin-amber', code: 'SKIN_AMBER', gradient: 'radial-gradient(circle, #f59e0b 0%, #78350f 100%)' },
      { name: 'Huyết Lân (Đỏ Ruby)', css: 'piece-skin-crimson', code: 'SKIN_CRIMSON', gradient: 'radial-gradient(circle, #f43f5e 0%, #881337 100%)' },
    ],
    AVATAR_FRAME: [
      { name: 'Bạch Kim (Platinum)', css: 'frame-platinum', code: 'FRAME_PLATINUM', gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)' },
      { name: 'Hoàng Gia (Imperial Gold)', css: 'frame-imperial', code: 'FRAME_IMPERIAL', gradient: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)' },
      { name: 'Hư Không (Cosmic Violet)', css: 'frame-cosmic', code: 'FRAME_COSMIC', gradient: 'linear-gradient(135deg, #818cf8 0%, #312e81 100%)' },
    ],
  };

  // Custom Palette Generator State
  const [color1, setColor1] = useState('#1e293b');
  const [color2, setColor2] = useState('#0f172a');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [useCustomPalette, setUseCustomPalette] = useState(false);

  const applyCustomPalette = (c1, c2, angle) => {
    const newGradient = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
    setItemForm((prev) => ({
      ...prev,
      previewGradient: newGradient,
    }));
  };

  const handleSelectPreset = (preset) => {
    setUseCustomPalette(false);
    setItemForm((prev) => ({
      ...prev,
      cssClass: preset.css,
      name: prev.name || preset.name,
      code: prev.code || preset.code,
      previewGradient: preset.gradient || prev.previewGradient,
    }));
  };
  const openCreateShopItem = () => {
    setEditingItem(null);
    setColor1('#1e293b');
    setColor2('#0f172a');
    setGradientAngle(135);
    setUseCustomPalette(false);
    setItemForm({
      code: 'ITEM_' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      category: 'BOARD_THEME',
      price: 150,
      cssClass: 'board-theme-custom',
      previewGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      description: '',
      active: true,
    });
    setShopModalOpen(true);
  };

  const openEditShopItem = (item) => {
    setEditingItem(item);
    setUseCustomPalette(true);
    setItemForm({
      code: item.code,
      name: item.name,
      category: item.category,
      price: item.price,
      cssClass: item.cssClass,
      previewGradient: item.previewGradient || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      description: item.description || '',
      active: item.active !== false,
    });
    setShopModalOpen(true);
  };

  const handleSaveShopItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.code || !itemForm.cssClass) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc.', 'warning');
      return;
    }

    try {
      setShopSaving(true);
      if (editingItem) {
        await adminApi.updateShopItem(editingItem.id, itemForm);
        showToast('Đã cập nhật vật phẩm thành công.', 'success');
      } else {
        await adminApi.createShopItem(itemForm);
        showToast('Đã thêm vật phẩm mới thành công.', 'success');
      }
      setShopModalOpen(false);
      loadShopItems();
    } catch (err) {
      showToast(err.message || 'Không thể lưu vật phẩm.', 'error');
    } finally {
      setShopSaving(false);
    }
  };

  const confirmDeleteShopItem = async () => {
    if (!deleteItemId) return;
    try {
      await adminApi.deleteShopItem(deleteItemId);
      showToast('Đã xóa vật phẩm khỏi Shop.', 'success');
      setShopItems((prev) => prev.filter((i) => i.id !== deleteItemId));
    } catch (err) {
      showToast(err.message || 'Không thể xóa vật phẩm.', 'error');
    } finally {
      setDeleteItemId(null);
    }
  };

  // Load Users
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await adminApi.getUsers();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setUsers(list);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách người chơi.', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAdjustCoins = async (e) => {
    e.preventDefault();
    if (!adjustCoinModal) return;

    try {
      setAdjustingCoin(true);
      await adminApi.adjustCoins(adjustCoinModal.user.id, {
        amount: parseInt(adjustCoinModal.amount, 10),
        reason: adjustCoinModal.reason || 'Admin điều chỉnh',
      });
      showToast(`Đã điều chỉnh xu cho ${adjustCoinModal.user.username}.`, 'success');
      setAdjustCoinModal(null);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Không thể điều chỉnh xu.', 'error');
    } finally {
      setAdjustingCoin(false);
    }
  };

  // Load Comments
  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const res = await adminApi.getComments();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setComments(list);
    } catch (err) {
      showToast(err.message || 'Lỗi tải danh sách bình luận.', 'error');
    } finally {
      setCommentsLoading(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return;
    try {
      await adminApi.deleteComment(deleteCommentId);
      showToast('Đã xóa bình luận.', 'success');
      setComments((prev) => prev.filter((c) => c.id !== deleteCommentId));
    } catch (err) {
      showToast(err.message || 'Không thể xóa bình luận.', 'error');
    } finally {
      setDeleteCommentId(null);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Top Header & Admin Navigation Tabs */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '1.5px', margin: 0 }}>
            QUẢN TRỊ CAO CẤP ARENA
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Hệ thống giám sát ván đấu, doanh thu vật phẩm và quản lý người dùng.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'DASHBOARD', label: 'TỔNG QUAN' },
            { id: 'SHOP', label: 'VẬT PHẨM SHOP' },
            { id: 'USERS', label: 'NGƯỜI CHƠI' },
            { id: 'COMMENTS', label: 'BÌNH LUẬN' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-secondary ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                fontSize: '0.82rem',
                padding: '8px 16px',
                borderColor: activeTab === tab.id ? 'var(--gold-primary)' : 'var(--border-subtle)',
                color: activeTab === tab.id ? 'var(--gold-primary)' : 'var(--text-muted)',
                background: activeTab === tab.id ? 'var(--gold-surface)' : 'transparent',
                fontWeight: 700,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DASHBOARD & CHARTS */}
      {activeTab === 'DASHBOARD' && (
        <div>
          {dashLoading && <LoadingState message="Đang phân tích số liệu hệ thống..." />}
          {dashError && !dashLoading && <ErrorState message={dashError} onRetry={loadDashboard} />}
          {!dashLoading && !dashError && dashboardData && (
            <>
              {/* 4 KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                    TỔNG VÁN ĐẤU
                  </div>
                  <div style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', color: 'var(--gold-primary)', fontWeight: 800, marginTop: '8px' }}>
                    {dashboardData.totalGames || 0}
                  </div>
                </div>

                <div className="panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                    TỔNG NGƯỜI CHƠI
                  </div>
                  <div style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', color: 'var(--text-main)', fontWeight: 800, marginTop: '8px' }}>
                    {dashboardData.totalUsers || 0}
                  </div>
                </div>

                <div className="panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                    DOANH THU SHOP
                  </div>
                  <div style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', color: '#10B981', fontWeight: 800, marginTop: '8px' }}>
                    {dashboardData.totalShopRevenue || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>XU</span>
                  </div>
                </div>

                <div className="panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                    VẬT PHẨM ĐANG BÁN
                  </div>
                  <div style={{ fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', color: 'var(--gold-primary)', fontWeight: 800, marginTop: '8px' }}>
                    {dashboardData.totalActiveItems || 0}
                  </div>
                </div>
              </div>

              {/* 2 Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                <div className="panel" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                    TỶ LỆ KẾT CỤC VÁN ĐẤU
                  </h4>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <canvas ref={outcomeChartRef}></canvas>
                  </div>
                </div>

                <div className="panel" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                    DOANH THU THEO DANH MỤC
                  </h4>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <canvas ref={revenueChartRef}></canvas>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: SHOP ITEMS CRUD */}
      {activeTab === 'SHOP' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={openCreateShopItem} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              + THÊM VẬT PHẨM MỚI
            </button>
          </div>

          {shopLoading && <LoadingState message="Đang tải danh sách vật phẩm Shop..." />}
          {!shopLoading && shopItems.length === 0 && (
            <EmptyState title="CHƯA CÓ VẬT PHẨM" message="Hiện chưa có vật phẩm nào trong kho lưu trữ." />
          )}

          {!shopLoading && shopItems.length > 0 && (
            <div className="panel" style={{ overflowX: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '14px 18px' }}>Mã Code</th>
                    <th style={{ padding: '14px 18px' }}>Tên Vật Phẩm</th>
                    <th style={{ padding: '14px 18px' }}>Danh Mục</th>
                    <th style={{ padding: '14px 18px' }}>Giá</th>
                    <th style={{ padding: '14px 18px' }}>CSS Class</th>
                    <th style={{ padding: '14px 18px' }}>Trạng Thái</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {shopItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: 'var(--gold-primary)' }}>
                        {item.code}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        {item.category}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--gold-primary)' }}>
                        {item.price} Xu
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.cssClass}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${item.active !== false ? 'badge-primary' : ''}`}>
                          {item.active !== false ? 'HIỂN THỊ' : 'ẨN'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => openEditShopItem(item)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '0.8rem', marginRight: '6px' }}
                        >
                          SỬA
                        </button>
                        <button
                          onClick={() => setDeleteItemId(item.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          XÓA
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS & COIN ADJUSTMENT */}
      {activeTab === 'USERS' && (
        <div>
          {usersLoading && <LoadingState message="Đang tải danh sách người chơi..." />}
          {!usersLoading && users.length === 0 && (
            <EmptyState title="CHƯA CÓ NGƯỜI CHƠI" message="Chưa có dữ liệu người chơi." />
          )}

          {!usersLoading && users.length > 0 && (
            <div className="panel" style={{ overflowX: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '14px 18px' }}>ID</th>
                    <th style={{ padding: '14px 18px' }}>Tài Khoản</th>
                    <th style={{ padding: '14px 18px' }}>Họ Tên</th>
                    <th style={{ padding: '14px 18px' }}>Số Dư Xu</th>
                    <th style={{ padding: '14px 18px' }}>Vai Trò</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>#{u.id}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--gold-primary)' }}>{u.username}</td>
                      <td style={{ padding: '14px 18px' }}>{u.fullName || '—'}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--gold-primary)' }}>{u.coins || 0} Xu</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className="badge">{u.role}</span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setAdjustCoinModal({ user: u, amount: 100, reason: 'Thưởng sự kiện' })}
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        >
                          CỘNG / TRỪ XU
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMMENTS MODERATION */}
      {activeTab === 'COMMENTS' && (
        <div>
          {commentsLoading && <LoadingState message="Đang tải danh sách bình luận..." />}
          {!commentsLoading && comments.length === 0 && (
            <EmptyState title="CHƯA CÓ BÌNH LUẬN" message="Chưa có bình luận nào trên hệ thống." />
          )}

          {!commentsLoading && comments.length > 0 && (
            <div className="panel" style={{ overflowX: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '14px 18px' }}>ID</th>
                    <th style={{ padding: '14px 18px' }}>Ván Đấu</th>
                    <th style={{ padding: '14px 18px' }}>Kỳ Thủ</th>
                    <th style={{ padding: '14px 18px' }}>Đánh Giá</th>
                    <th style={{ padding: '14px 18px' }}>Nội Dung</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>#{c.id}</td>
                      <td style={{ padding: '14px 18px' }}>Ván #{c.gameId}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{c.username}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--gold-primary)' }}>{'◆'.repeat(c.rating || 5)}</td>
                      <td style={{ padding: '14px 18px', maxWidth: '300px' }}>{c.content}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setDeleteCommentId(c.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          XÓA
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT SHOP ITEM */}
      {shopModalOpen && (
        <div className="modal-overlay" onClick={() => setShopModalOpen(false)} style={{ overflowY: 'auto', padding: '24px 12px' }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(212, 175, 55, 0.2)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  transform: 'rotate(45deg)',
                  background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
                }}
              >
                <span
                  style={{
                    transform: 'rotate(-45deg)',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 900,
                    fontSize: '1rem',
                    color: '#0d0e12',
                  }}
                >
                  ✦
                </span>
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '1.25rem',
                    letterSpacing: '1px',
                    color: 'var(--gold-primary, #FFD700)',
                  }}
                >
                  {editingItem ? 'CHỈNH SỬA VẬT PHẨM' : 'THÊM VẬT PHẨM MỚI'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Cấu hình hiển thị và hiệu ứng CSS trong Cửa Hàng
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveShopItem} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Mã Code (Định danh)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={itemForm.code}
                    onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                    placeholder="VD: BOARD_OBSIDIAN"
                    disabled={Boolean(editingItem)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Giá Bán (Xu)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: parseInt(e.target.value, 10) || 0 })}
                    min="0"
                    placeholder="VD: 150"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tên Vật Phẩm</label>
                <input
                  type="text"
                  className="form-control"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="VD: Mặt Bàn Cờ Hắc Thạch"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Danh Mục</label>
                  <select
                    className="form-control"
                    value={itemForm.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const defaultPreset = PRESET_STYLES[newCat]?.[0];
                      setItemForm({
                        ...itemForm,
                        category: newCat,
                        cssClass: defaultPreset ? defaultPreset.css : itemForm.cssClass,
                        previewGradient: defaultPreset?.gradient || itemForm.previewGradient,
                      });
                    }}
                  >
                    <option value="BOARD_THEME">Mặt Bàn Cờ</option>
                    <option value="PIECE_SKIN">Kiểu Quân Cờ</option>
                    <option value="AVATAR_FRAME">Khung Avatar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CSS Class Kích Hoạt</label>
                  <input
                    type="text"
                    className="form-control"
                    value={itemForm.cssClass}
                    onChange={(e) => setItemForm({ ...itemForm, cssClass: e.target.value })}
                    placeholder="VD: board-theme-obsidian"
                    required
                  />
                </div>
              </div>

              {/* BỘ CHỌN MẪU MÀU / THEME CÓ SẴN (PRESETS) */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ✦ Mẫu Màu Thiết Kế Sẵn:
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseCustomPalette(!useCustomPalette)}
                    className="btn small ghost"
                    style={{ fontSize: '0.75rem', padding: '3px 8px', borderColor: useCustomPalette ? 'var(--gold-primary)' : 'rgba(255,255,255,0.2)' }}
                  >
                    {useCustomPalette ? 'Đang dùng bảng màu tùy chỉnh' : '+ Tự pha màu kéo thả'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(PRESET_STYLES[itemForm.category] || []).map((preset) => (
                    <button
                      key={preset.css}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`btn small ${!useCustomPalette && itemForm.cssClass === preset.css ? 'active' : 'ghost'}`}
                      style={{
                        fontSize: '0.78rem',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: !useCustomPalette && itemForm.cssClass === preset.css ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.15)',
                        background: !useCustomPalette && itemForm.cssClass === preset.css ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: !useCustomPalette && itemForm.cssClass === preset.css ? 'var(--gold-primary)' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: preset.gradient,
                          display: 'inline-block',
                        }}
                      />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* BẢNG KÉO THẢ PHA MÀU (COLOR PICKER & GRADIENT SLIDER) */}
              <div style={{ background: 'rgba(24, 30, 48, 0.85)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gold-primary)', letterSpacing: '0.5px' }}>
                    ✦ BẢNG KÉO MÀU & PHA GRADIENT (LIVE PALETTE)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Góc: {gradientAngle}°</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '14px', alignItems: 'center' }}>
                  {/* Color 1 */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Màu Khởi Đầu</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={color1}
                        onChange={(e) => {
                          setColor1(e.target.value);
                          setUseCustomPalette(true);
                          applyCustomPalette(e.target.value, color2, gradientAngle);
                        }}
                        style={{ width: '42px', height: '36px', padding: 0, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{color1}</span>
                    </div>
                  </div>

                  {/* Color 2 */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Màu Kết Thúc</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={color2}
                        onChange={(e) => {
                          setColor2(e.target.value);
                          setUseCustomPalette(true);
                          applyCustomPalette(color1, e.target.value, gradientAngle);
                        }}
                        style={{ width: '42px', height: '36px', padding: 0, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{color2}</span>
                    </div>
                  </div>

                  {/* Angle slider */}
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Góc Xoay Dải Màu ({gradientAngle}°)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={gradientAngle}
                      onChange={(e) => {
                        const a = parseInt(e.target.value, 10);
                        setGradientAngle(a);
                        setUseCustomPalette(true);
                        applyCustomPalette(color1, color2, a);
                      }}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--gold-primary)' }}
                    />
                  </div>
                </div>

                {/* KHUNG XEM TRƯỚC SỐNG ĐỘNG (INTERACTIVE ARENA PREVIEW) */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>XEM TRƯỚC TRỰC QUAN KHI LÊN SÀN ĐẤU:</span>
                    <span style={{ color: 'var(--gold-primary)' }}>{itemForm.category}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px', background: 'rgba(5, 7, 15, 0.6)', borderRadius: '8px', padding: '12px' }}>
                    {itemForm.category === 'BOARD_THEME' && (
                      <div
                        style={{
                          background: itemForm.previewGradient,
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 26px)',
                          gap: '4px',
                        }}
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.12)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              color: idx === 4 ? '#fbbf24' : idx === 2 ? '#60a5fa' : 'transparent',
                            }}
                          >
                            {idx === 4 ? 'X' : idx === 2 ? 'O' : ''}
                          </div>
                        ))}
                      </div>
                    )}

                    {itemForm.category === 'PIECE_SKIN' && (
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            background: itemForm.previewGradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            fontWeight: 900,
                            color: '#ffffff',
                            boxShadow: '0 0 15px rgba(255,255,255,0.3)',
                          }}
                        >
                          X
                        </div>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            background: itemForm.previewGradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            fontWeight: 900,
                            color: '#ffffff',
                            boxShadow: '0 0 15px rgba(255,255,255,0.3)',
                          }}
                        >
                          O
                        </div>
                      </div>
                    )}

                    {itemForm.category === 'AVATAR_FRAME' && (
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: itemForm.previewGradient,
                          padding: '3px',
                          boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: '#0d0e12',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: 'var(--gold-primary)',
                          }}
                        >
                          K
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô Tả Vật Phẩm</label>
                <textarea
                  className="form-control"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows="3"
                  placeholder="Mô tả chất liệu, nguồn gốc và vẻ đẹp của vật phẩm..."
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShopModalOpen(false)}
                  className="btn ghost"
                  style={{ padding: '10px 22px', fontSize: '0.9rem' }}
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={shopSaving}
                  className="btn"
                  style={{
                    padding: '10px 26px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                    color: '#0d0e12',
                    boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
                  }}
                >
                  {shopSaving ? 'ĐANG LƯU...' : editingItem ? 'CẬP NHẬT' : 'THÊM VẬT PHẨM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST USER COIN */}
      {adjustCoinModal && (
        <div className="modal-overlay" onClick={() => setAdjustCoinModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 16px', fontFamily: 'Orbitron, sans-serif', color: 'var(--gold-primary)' }}>
              ĐIỀU CHỈNH XU KỲ THỦ
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Người nhận: <strong style={{ color: 'var(--text-main)' }}>{adjustCoinModal.user.username}</strong> (Hiện có: {adjustCoinModal.user.coins} Xu)
            </p>

            <form onSubmit={handleAdjustCoins} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Số Xu (Dương để cộng, Âm để trừ)</label>
                <input
                  type="number"
                  className="form-control"
                  value={adjustCoinModal.amount}
                  onChange={(e) => setAdjustCoinModal({ ...adjustCoinModal, amount: e.target.value })}
                  placeholder="VD: 500 hoặc -200"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lý do điều chỉnh</label>
                <input
                  type="text"
                  className="form-control"
                  value={adjustCoinModal.reason}
                  onChange={(e) => setAdjustCoinModal({ ...adjustCoinModal, reason: e.target.value })}
                  placeholder="VD: Thưởng giải đấu mùa xuân"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setAdjustCoinModal(null)} className="btn btn-secondary">
                  HỦY
                </button>
                <button type="submit" disabled={adjustingCoin} className="btn btn-primary">
                  {adjustingCoin ? 'ĐANG THỰC HIỆN...' : 'XÁC NHẬN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODALS */}
      <ConfirmModal
        isOpen={Boolean(deleteItemId)}
        title="XÓA VẬT PHẨM SHOP"
        message="Hành động này sẽ xóa vĩnh viễn vật phẩm này khỏi danh mục bán. Bạn có chắc không?"
        onConfirm={confirmDeleteShopItem}
        onCancel={() => setDeleteItemId(null)}
        confirmLabel="XÓA VẬT PHẨM"
        cancelLabel="HỦY"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={Boolean(deleteCommentId)}
        title="XÓA BÌNH LUẬN"
        message="Xóa bình luận vi phạm khỏi ván đấu?"
        onConfirm={confirmDeleteComment}
        onCancel={() => setDeleteCommentId(null)}
        confirmLabel="XÓA BÌNH LUẬN"
        cancelLabel="HỦY"
        isDanger={true}
      />
    </div>
  );
}
