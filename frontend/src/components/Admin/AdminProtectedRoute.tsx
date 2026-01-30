import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/adminAuthStore';

export default function AdminProtectedRoute() {
  const { token, admin, isLoading, checkAuth } = useAdminAuthStore();

  useEffect(() => {
    if (token && !admin) {
      checkAuth();
    }
  }, [token, admin, checkAuth]);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
