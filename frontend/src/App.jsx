import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import GamePage from './pages/GamePage';
import ShopPage from './pages/ShopPage';
import AchievementsPage from './pages/AchievementsPage';
import HistoryPage from './pages/HistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import { LoadingState } from './components/UiStates';

// Protected Route Wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Đang xác thực thông tin kỳ thủ..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/game" replace />;
  }

  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public Route: Login / Register */}
      <Route
        path="/login"
        element={user && !loading ? <Navigate to="/game" replace /> : <LoginPage />}
      />

      {/* Main Layout Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/game" replace />} />
        <Route path="game" element={<GamePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Admin Route */}
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/game" replace />} />
    </Routes>
  );
}
