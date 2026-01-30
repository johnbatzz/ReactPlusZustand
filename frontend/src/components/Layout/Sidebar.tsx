import { NavLink, useParams } from 'react-router-dom';
import { useClassStore } from '../../store/classStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LayoutDashboard, GraduationCap, Users, Calendar, FileQuestion, FileText, Award, LogOut, ClipboardList } from 'lucide-react';

export function Sidebar() {
  const { classId } = useParams();
  const { classes } = useClassStore();
  const { teacher, logout } = useAuthStore();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:bg-slate-700 hover:text-white',
      isActive && 'bg-primary text-white'
    );

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 pl-6 text-sm text-slate-400 transition-all hover:bg-slate-700 hover:text-white',
      isActive && 'bg-primary text-white'
    );

  return (
    <aside className="w-64 bg-slate-800 text-white p-4 flex flex-col fixed h-screen overflow-y-auto">
      <div className="mb-6 pb-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold">Teacher Portal</h2>
        <p className="text-sm text-slate-400">{teacher?.name}</p>
      </div>

      <nav className="flex-1 space-y-1">
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink to="/classes" className={navLinkClass}>
          <GraduationCap className="h-4 w-4" />
          My Classes
        </NavLink>

        {classId && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {classes.find((c) => c.id === parseInt(classId))?.name || 'Class'}
            </div>
            <NavLink to={`/classes/${classId}/students`} className={subNavLinkClass}>
              <Users className="h-4 w-4" />
              Students
            </NavLink>
            <NavLink to={`/classes/${classId}/attendance`} className={subNavLinkClass}>
              <Calendar className="h-4 w-4" />
              Attendance
            </NavLink>
            <NavLink to={`/classes/${classId}/quizzes`} className={subNavLinkClass}>
              <FileQuestion className="h-4 w-4" />
              Quizzes
            </NavLink>
            <NavLink to={`/classes/${classId}/exams`} className={subNavLinkClass}>
              <FileText className="h-4 w-4" />
              Exams
            </NavLink>
            <NavLink to={`/classes/${classId}/activities`} className={subNavLinkClass}>
              <ClipboardList className="h-4 w-4" />
              Activities
            </NavLink>
            <NavLink to={`/classes/${classId}/grades`} className={subNavLinkClass}>
              <Award className="h-4 w-4" />
              Grades
            </NavLink>
          </div>
        )}
      </nav>

      <Separator className="my-4 bg-slate-700" />

      <Button
        variant="outline"
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
        onClick={logout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </aside>
  );
}
