import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  FileText,
  LogOut,
  Shield
} from 'lucide-react';

export default function AdminLayout() {
  const { admin, logout } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors',
      isActive && 'text-white bg-slate-700'
    );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold">Admin Portal</h1>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/admin/dashboard" className={navLinkClass}>
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </NavLink>
          <NavLink to="/admin/teachers" className={navLinkClass}>
            <Users className="h-5 w-5" />
            Teachers
          </NavLink>
          <NavLink to="/admin/students" className={navLinkClass}>
            <GraduationCap className="h-5 w-5" />
            Students
          </NavLink>
          <NavLink to="/admin/classes" className={navLinkClass}>
            <School className="h-5 w-5" />
            Classes
          </NavLink>
          <NavLink to="/admin/audit-logs" className={navLinkClass}>
            <FileText className="h-5 w-5" />
            Audit Logs
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-700">
          {admin && (
            <div className="mb-3 px-4">
              <p className="text-sm font-medium text-white">{admin.name}</p>
              <p className="text-xs text-slate-400">{admin.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
