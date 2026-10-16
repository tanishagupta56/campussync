import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';
import { StudentLayout } from './components/layout/StudentLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { ClubLoginPage } from './pages/auth/ClubLoginPage';

// Built Student Pages
import { TodayPage } from './pages/student/TodayPage';
import { AnnouncementsPage } from './pages/student/AnnouncementsPage';
import { CalendarPage } from './pages/student/CalendarPage';
import { DeadlinesPage } from './pages/student/DeadlinesPage';
import { LibraryPage } from './pages/student/LibraryPage';
import { LostFoundPage } from './pages/student/LostFoundPage';
import { ConnectPage } from './pages/student/ConnectPage';
import { AttendancePage } from './pages/student/AttendancePage';
import { ScholarshipsPage } from './pages/student/ScholarshipsPage';
import { OpportunitiesPage } from './pages/student/OpportunitiesPage';
import { ClubsPage } from './pages/student/ClubsPage';

// Admin Dashboard
import { AdminDashboard } from './pages/admin/AdminDashboard';

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
              {/* Public Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/club-login" element={<ClubLoginPage />} />

              {/* Student Built Routes */}
              <Route
                path="/"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <TodayPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/today"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <TodayPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/announcements"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <AnnouncementsPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <CalendarPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/deadlines"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <DeadlinesPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <AttendancePage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <LibraryPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/lost-found"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <LostFoundPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/connect"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <ConnectPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/scholarships"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <ScholarshipsPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/opportunities"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <OpportunitiesPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/clubs"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <ClubsPage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />

              {/* Administrator Route */}
              <Route
                path="/admin"
                element={
                  <RoleProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                    <AdminDashboard />
                  </RoleProtectedRoute>
                }
              />

              {/* Faculty Route */}
              <Route
                path="/faculty"
                element={
                  <RoleProtectedRoute allowedRoles={['FACULTY']}>
                    <FacultyDashboard />
                  </RoleProtectedRoute>
                }
              />

              {/* Club Core Route */}
              <Route
                path="/club"
                element={
                  <RoleProtectedRoute allowedRoles={['CLUB_CORE', 'ADMINISTRATOR']}>
                    <ClubDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/club/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={['CLUB_CORE', 'ADMINISTRATOR']}>
                    <ClubDashboard />
                  </RoleProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
