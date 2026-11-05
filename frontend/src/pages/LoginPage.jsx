import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  // Login form state
  const [lUser, setLUser] = useState('');
  const [lPass, setLPass] = useState('');
  const [lErrors, setLErrors] = useState({});

  // Register form state
  const [rName, setRName] = useState('');
  const [rUser, setRUser] = useState('');
  const [rPass, setRPass] = useState('');
  const [rErrors, setRErrors] = useState({});

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      showToast('Không nhận được token xác thực từ Google.', 'warning');
      return;
    }
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      showToast('Đăng nhập Google thành công! Chào mừng kỳ thủ.', 'success');
      navigate('/game');
    } catch (err) {
      showToast(err.message || 'Đăng nhập Google thất bại.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return;
    }

    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: 'signin_with',
              shape: 'pill',
              width: '100%',
              locale: 'vi',
            });
          }
        } catch (e) {
          console.warn('Lỗi khởi tạo Google GSI button:', e);
        }
      }
    };

    // Kiểm tra xem script gsi đã tải chưa, nếu chưa thì chèn script động
    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleGsi;
      document.body.appendChild(script);
    } else {
      initGoogleGsi();
    }
  }, [isLoginTab]);

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
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span> Đang xử lý...
                </>
              ) : (
                'Đăng Nhập Ngay'
              )}
            </button>

            {/* PHẦN ĐĂNG NHẬP GOOGLE OAUTH */}
            <div style={{ marginTop: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }}></div>
                <span>Hoặc đăng nhập với</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }}></div>
              </div>

              {googleLoading && (
                <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.88rem', color: 'var(--gold-primary)' }}>
                  <span className="btn-spinner" style={{ marginRight: '8px' }}></span> Đang xác thực với Google...
                </div>
              )}

              {/* Nút chính thức của Google GIS SDK */}
              <div
                ref={googleBtnRef}
                style={{
                  display: googleLoading ? 'none' : 'flex',
                  justifyContent: 'center',
                  minHeight: '44px',
                }}
              ></div>

              {/* Nút dự phòng nếu chưa cấu hình VITE_GOOGLE_CLIENT_ID */}
              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && !googleLoading && (
                <button
                  type="button"
                  onClick={() => {
                    showToast('Hệ thống chưa thiết lập VITE_GOOGLE_CLIENT_ID trong file .env', 'warning');
                  }}
                  className="btn ghost"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '0.9rem',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Đăng nhập bằng Google
                </button>
              )}
            </div>
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
