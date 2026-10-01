import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth';

interface RoleProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-campus-bg">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-campus-jade-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-campus-textMuted font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login preserving intended location
  if (!user || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role not allowed -> redirect to user's proper home dashboard
  if (!allowedRoles.includes(role)) {
    if (role === 'STUDENT') {
      return <Navigate to="/today" replace />;
    } else if (role === 'FACULTY') {
      return <Navigate to="/faculty" replace />;
    } else if (role === 'ADMINISTRATOR') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'CLUB_CORE') {
      return <Navigate to="/club/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
