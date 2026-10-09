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

// Student Pages
import { TodayPage } from './pages/student/TodayPage';
import { AnnouncementsPage } from './pages/student/AnnouncementsPage';
import { CalendarPage } from './pages/student/CalendarPage';
import { DeadlinesPage } from './pages/student/DeadlinesPage';
import { LibraryPage } from './pages/student/LibraryPage';
import { LostFoundPage } from './pages/student/LostFoundPage';
import { ConnectPage } from './pages/student/ConnectPage';
import { AttendancePage } from './pages/student/AttendancePage';
import { PlaceholderPage } from './pages/student/PlaceholderPage';

// Other Dashboards
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ClubDashboard } from './pages/club/ClubDashboard';

// Lucide icons for remaining placeholders
import {
  Flag,
  Zap,
  Award,
  Users,
  Sparkles,
} from 'lucide-react';

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
                path="/attendance"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <AttendancePage />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />

              {/* Remaining Placeholders */}
              <Route
                path="/campus-issues"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <PlaceholderPage title="Campus Issues & Facility Reports" icon={Flag} description="Report Wi-Fi, classroom, and electrical faults with transparent admin resolution timelines." />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/opportunities"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <PlaceholderPage title="Opportunities & Fellowships" icon={Zap} description="Verified internships, research fellowships, and hackathons tailored by year and department." />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/scholarships"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <PlaceholderPage title="Scholarships & Grants" icon={Award} description="Institutional and merit scholarships linked with available senior mentors." />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/clubs"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <PlaceholderPage title="Student Clubs & Societies" icon={Users} description="Explore technical and cultural societies, team recruitment notices, and upcoming meets." />
                    </StudentLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/ai"
                element={
                  <RoleProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout>
                      <PlaceholderPage title="CampusSync AI" icon={Sparkles} phase="Phase 5" description="Conversational campus assistant grounded in live university database records." />
                    </StudentLayout>
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
