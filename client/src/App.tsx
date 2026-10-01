import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { ClubLoginPage } from './pages/auth/ClubLoginPage';

// Dashboard Pages
import { TodayPage } from './pages/student/TodayPage';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ClubDashboard } from './pages/club/ClubDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/club-login" element={<ClubLoginPage />} />

              {/* Student Role Routes */}
              <Route
                path="/"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <TodayPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/today"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <TodayPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Faculty Role Routes */}
              <Route
                path="/faculty"
                element={
                  <RoleProtectedRoute allowedRoles={['FACULTY']}>
                    <FacultyDashboard />
                  </RoleProtectedRoute>
                }
              />

              {/* Administrator Role Routes */}
              <Route
                path="/admin"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                    <AdminDashboard />
                  </RoleProtectedRoute>
                }
              />

              {/* Club Core Role Routes */}
              <Route
                path="/club/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['CLUB_CORE']}>
                    <ClubDashboard />
                  </RoleProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
