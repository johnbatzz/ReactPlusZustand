import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStudentAuthStore } from '../../store/studentAuthStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileQuestion, FileText, Award, LogOut } from 'lucide-react';

export default function StudentLayout() {
  const { student, logout } = useStudentAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-100 rounded-md transition-colors',
      isActive && 'text-primary bg-primary/10'
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-800">Student Portal</h1>
              {student && (
                <span className="text-sm text-slate-500">
                  {student.class.name}
                  {student.class.section && ` - ${student.class.section}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {student && (
                <span className="text-sm text-slate-600 font-medium">{student.name}</span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-2">
            <NavLink to="/student/dashboard" className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/student/quizzes" className={navLinkClass}>
              <FileQuestion className="h-4 w-4" />
              Quizzes
            </NavLink>
            <NavLink to="/student/exams" className={navLinkClass}>
              <FileText className="h-4 w-4" />
              Exams
            </NavLink>
            <NavLink to="/student/grades" className={navLinkClass}>
              <Award className="h-4 w-4" />
              My Grades
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
