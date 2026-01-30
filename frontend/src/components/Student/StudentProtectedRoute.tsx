import { Navigate, Outlet } from 'react-router-dom';
import { useStudentAuthStore } from '../../store/studentAuthStore';

export default function StudentProtectedRoute() {
  const { token, isLoading } = useStudentAuthStore();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/student/login" replace />;
  }

  return <Outlet />;
}
