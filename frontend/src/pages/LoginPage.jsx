import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Login form state
  const [lUser, setLUser] = useState('');
  const [lPass, setLPass] = useState('');
  const [lErrors, setLErrors] = useState({});

  // Register form state
  const [rName, setRName] = useState('');
  const [rUser, setRUser] = useState('');
  const [rPass, setRPass] = useState('');
  const [rErrors, setRErrors] = useState({});

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!lUser.trim()) errors.user = 'Tên đăng nhập không được để trống';
    if (!lPass) errors.pass = 'Mật khẩu không được để trống';
    if (Object.keys(errors).length > 0) {
      setLErrors(errors);
      return;
    }
    setLErrors({});
    setLoading(true);

    try {
      await login(lUser.trim(), lPass);
      showToast('Đăng nhập thành công! Chào mừng kỳ thủ.', 'success');
      navigate('/game');
    } catch (err) {
      showToast(err.message || 'Đăng nhập thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!rName.trim()) errors.name = 'Họ và tên không được để trống';
    if (!rUser.trim()) errors.user = 'Tên đăng nhập không được để trống';
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(rUser.trim())) {
      errors.user = 'Tên đăng nhập từ 3-20 ký tự (chữ, số hoặc _)';
    }
    if (!rPass) errors.pass = 'Mật khẩu không được để trống';
    else if (rPass.length < 6) errors.pass = 'Mật khẩu tối thiểu 6 ký tự';

    if (Object.keys(errors).length > 0) {
      setRErrors(errors);
      return;
    }
    setRErrors({});
    setLoading(true);

    try {
      await register(rUser.trim(), rPass, rName.trim());
      showToast('Đăng ký tài khoản thành công! Hãy đăng nhập.', 'success');
      setIsLoginTab(true);
      setLUser(rUser.trim());
      setLPass('');
    } catch (err) {
      if (err.fieldErrors) {
        setRErrors(err.fieldErrors);
      }
      showToast(err.message || 'Đăng ký thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-header">
        <div className="confirm-crest" style={{ marginBottom: '12px' }}></div>
        <h1 style={{ letterSpacing: '2px' }}>GRANDMASTER ARENA</h1>
        <p className="sub">Đấu Trường Trí Tuệ & Cờ Caro Nghệ Thuật</p>
      </div>

      <div className="card">
        <div className="tabs">
          <button
            type="button"
            className={isLoginTab ? 'active' : ''}
            onClick={() => {
              setIsLoginTab(true);
              setLErrors({});
            }}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            className={!isLoginTab ? 'active' : ''}
            onClick={() => {
              setIsLoginTab(false);
              setRErrors({});
            }}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        {isLoginTab ? (
          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="lUser">Tên đăng nhập</label>
              <input
                id="lUser"
                type="text"
                autoComplete="username"
                placeholder="Nhập username..."
                className={lErrors.user ? 'is-invalid' : ''}
                value={lUser}
                onChange={(e) => setLUser(e.target.value)}
              />
              {lErrors.user && <div className="field-error show">{lErrors.user}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="lPass">Mật khẩu</label>
              <input
                id="lPass"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu..."
                className={lErrors.pass ? 'is-invalid' : ''}
                value={lPass}
                onChange={(e) => setLPass(e.target.value)}
              />
              {lErrors.pass && <div className="field-error show">{lErrors.pass}</div>}
            </div>

            <button
              className="btn"
              style={{ width: '100%', marginTop: '16px' }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span> Đang xử lý...
                </>
              ) : (
                'Đăng Nhập Ngay'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="rName">Họ và tên</label>
              <input
                id="rName"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                className={rErrors.name || rErrors.fullName ? 'is-invalid' : ''}
                value={rName}
                onChange={(e) => setRName(e.target.value)}
              />
              {(rErrors.name || rErrors.fullName) && (
                <div className="field-error show">
                  {rErrors.name || rErrors.fullName}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="rUser">Tên đăng nhập</label>
              <input
                id="rUser"
                type="text"
                autoComplete="username"
                placeholder="Chỉ chứa chữ, số hoặc _"
                className={rErrors.user || rErrors.username ? 'is-invalid' : ''}
                value={rUser}
                onChange={(e) => setRUser(e.target.value)}
              />
              {(rErrors.user || rErrors.username) && (
                <div className="field-error show">
                  {rErrors.user || rErrors.username}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="rPass">Mật khẩu (từ 6 ký tự)</label>
              <input
                id="rPass"
                type="password"
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
                className={rErrors.pass || rErrors.password ? 'is-invalid' : ''}
                value={rPass}
                onChange={(e) => setRPass(e.target.value)}
              />
              {(rErrors.pass || rErrors.password) && (
                <div className="field-error show">
                  {rErrors.pass || rErrors.password}
                </div>
              )}
            </div>

            <button
              className="btn"
              style={{ width: '100%', marginTop: '16px' }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span> Đang tạo tài khoản...
                </>
              ) : (
                'Tạo Tài Khoản Mới'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
