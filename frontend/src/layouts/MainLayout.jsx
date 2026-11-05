import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function MainLayout() {
  const { user, equipped, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast('Đã đăng xuất khỏi đấu trường', 'info');
    navigate('/login');
  };

  const initial = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();
  const frameClass = equipped?.avatarFrameClass ? equipped.avatarFrameClass : '';
  const coinsDisplay =
    user?.coins !== undefined && user?.coins !== null
      ? Number(user.coins).toLocaleString('vi-VN')
      : '0';

  const links = [
    { to: '/game', label: 'Chơi Cờ' },
    { to: '/shop', label: 'Cửa Hàng' },
    { to: '/achievements', label: 'Thành Tựu' },
    { to: '/history', label: 'Lịch Sử' },
    { to: '/leaderboard', label: 'Xếp Hạng' },
    { to: '/profile', label: 'Hồ Sơ' },
  ];

  if (user?.role === 'ADMIN') {
    links.push({ to: '/admin', label: 'Quản Trị', isAdmin: true });
  }

  return (
    <>
      <header className="nav-wrapper">
        <nav className="nav">
          <NavLink to="/game" className="brand">
            <span className="brand-crest"></span>
            <span className="brand-text">GRANDMASTER ARENA</span>
          </NavLink>

          <div className="nav-links">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${isActive ? 'active' : ''} ${link.isAdmin ? 'admin-tab' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <span className="spacer"></span>

          <div className="nav-user">
            <NavLink to="/shop" className="coin-badge" title="Ví Xu Đấu Trường">
              <span className="coin-amount">{coinsDisplay}</span>
              <span className="coin-unit">XU</span>
            </NavLink>

            <NavLink
              to="/profile"
              className="nav-avatar-mini-link"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}
              title="Xem & Chỉnh sửa Hồ Sơ"
            >
              <div className={`nav-avatar-mini ${frameClass}`}>
                <span className="nav-avatar-char">{initial}</span>
              </div>

              <span className="who">
                <b>{user?.fullName || user?.username}</b>
                <span className={`badge ${user?.role || ''}`}>{user?.role}</span>
              </span>
            </NavLink>

            <button
              id="btnLogout"
              className="btn small ghost"
              type="button"
              onClick={handleLogout}
            >
              Đăng Xuất
            </button>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}

export default MainLayout;
