import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';
import shopApi from '../services/shopApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [equipped, setEquipped] = useState({
    boardThemeClass: '',
    pieceSkinClass: '',
    avatarFrameClass: '',
    boardThemeGradient: '',
    pieceSkinGradient: '',
    avatarFrameGradient: '',
  });
  const [loading, setLoading] = useState(true);

  const refreshAuthAndEquipped = useCallback(async () => {
    try {
      const u = await authApi.getMe();
      setUser(u);
      try {
        const eq = await shopApi.getMyEquipped();
        setEquipped({
          boardThemeClass: eq.boardThemeClass || '',
          pieceSkinClass: eq.pieceSkinClass || '',
          avatarFrameClass: eq.avatarFrameClass || '',
          boardThemeGradient: eq.boardThemeGradient || '',
          pieceSkinGradient: eq.pieceSkinGradient || '',
          avatarFrameGradient: eq.avatarFrameGradient || '',
        });
        if (eq.coins !== undefined && eq.coins !== null) {
          setUser((prev) => (prev ? { ...prev, coins: eq.coins } : prev));
        }
      } catch (err) {
        // Có thể chưa có đồ trang bị
      }
      return u;
    } catch (e) {
      setUser(null);
      setEquipped({
        boardThemeClass: '',
        pieceSkinClass: '',
        avatarFrameClass: '',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuthAndEquipped();
  }, [refreshAuthAndEquipped]);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    await refreshAuthAndEquipped();
    return res;
  };

  const loginWithGoogle = async (idToken) => {
    const res = await authApi.loginGoogle(idToken);
    await refreshAuthAndEquipped();
    return res;
  };

  const register = async (username, password, fullName) => {
    return await authApi.register(username, password, fullName);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // bỏ qua lỗi nếu đã hết hạn
    }
    setUser(null);
    setEquipped({
      boardThemeClass: '',
      pieceSkinClass: '',
      avatarFrameClass: '',
    });
  };

  const updateCoins = (newCoins) => {
    setUser((prev) => (prev ? { ...prev, coins: newCoins } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        equipped,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshAuthAndEquipped,
        updateCoins,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
