import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/userApi';

export default function ProfilePage() {
  const { user, refreshAuthAndEquipped } = useAuth();
  const { showToast } = useToast();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  // 6-step form flow: Profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileErrors({});

    // Client validation
    const errs = {};
    if (!fullName.trim()) {
      errs.fullName = 'Họ và tên không được để trống.';
    }
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    try {
      setProfileSaving(true);
      await userApi.updateProfile({ fullName: fullName.trim() });
      showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
      await refreshAuthAndEquipped();
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật hồ sơ.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // 6-step form flow: Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwErrors({});

    const errs = {};
    if (!currentPassword) {
      errs.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    }
    if (!newPassword) {
      errs.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Mật khẩu mới phải có tối thiểu 6 ký tự.';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Xác nhận mật khẩu mới không khớp.';
    }

    if (Object.keys(errs).length > 0) {
      setPwErrors(errs);
      return;
    }

    try {
      setPwSaving(true);
      await userApi.changePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
      });
      showToast('Đổi mật khẩu thành công!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Đổi mật khẩu thất bại.', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="section-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '1.5px', margin: 0 }}>
            HỒ SƠ ĐẠI KỲ THỦ
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Quản lý thông tin định danh và bảo mật tài khoản thi đấu.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Column 1: Info & Profile Form */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              className="nav-avatar-box"
              style={{ width: '56px', height: '56px', fontSize: '1.4rem', fontWeight: 800 }}
            >
              {(user?.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Orbitron, sans-serif', color: 'var(--gold-primary)' }}>
                {user?.username}
              </h3>
              <span className="badge" style={{ marginTop: '4px', display: 'inline-block' }}>
                {user?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'KỲ THỦ ĐẠI MÔN'}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập (Bất biến)</label>
              <input
                type="text"
                className="form-control"
                value={user?.username || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Họ và tên hiển thị</label>
              <input
                type="text"
                className={`form-control ${profileErrors.fullName ? 'is-invalid' : ''}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên của bạn"
                disabled={profileSaving}
              />
              {profileErrors.fullName && (
                <div style={{ color: 'var(--color-loss)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {profileErrors.fullName}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email đăng ký</label>
              <input
                type="text"
                className="form-control"
                value={user?.email || 'Chưa cập nhật'}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileSaving}
              style={{ marginTop: '8px' }}
            >
              {profileSaving ? 'ĐANG LƯU HỒ SƠ...' : 'CẬP NHẬT HỒ SƠ'}
            </button>
          </form>
        </div>

        {/* Column 2: Password Form */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Orbitron, sans-serif', color: 'var(--text-main)' }}>
              ĐỔI MẬT KHẨU
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Mật khẩu cần tối thiểu 6 ký tự để bảo vệ tài sản và danh hiệu kỳ thủ.
            </p>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input
                type="password"
                className={`form-control ${pwErrors.currentPassword ? 'is-invalid' : ''}`}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                disabled={pwSaving}
              />
              {pwErrors.currentPassword && (
                <div style={{ color: 'var(--color-loss)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {pwErrors.currentPassword}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input
                type="password"
                className={`form-control ${pwErrors.newPassword ? 'is-invalid' : ''}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                disabled={pwSaving}
              />
              {pwErrors.newPassword && (
                <div style={{ color: 'var(--color-loss)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {pwErrors.newPassword}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className={`form-control ${pwErrors.confirmPassword ? 'is-invalid' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                disabled={pwSaving}
              />
              {pwErrors.confirmPassword && (
                <div style={{ color: 'var(--color-loss)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {pwErrors.confirmPassword}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={pwSaving}
              style={{ marginTop: '8px' }}
            >
              {pwSaving ? 'ĐANG ĐỔI MẬT KHẨU...' : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
