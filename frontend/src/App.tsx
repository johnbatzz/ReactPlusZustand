import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useStudentAuthStore } from './store/studentAuthStore';
import { useAdminAuthStore } from './store/adminAuthStore';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ClassesPage } from './pages/ClassesPage';
import { StudentsPage } from './pages/StudentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { QuizzesPage } from './pages/QuizzesPage';
import { ExamsPage } from './pages/ExamsPage';
import { GradesPage } from './pages/GradesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
// Student imports
import StudentProtectedRoute from './components/Student/StudentProtectedRoute';
import StudentLayout from './components/Student/StudentLayout';
import StudentLoginPage from './pages/student/StudentLoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentQuizzesPage from './pages/student/StudentQuizzesPage';
import TakeQuizPage from './pages/student/TakeQuizPage';
import StudentExamsPage from './pages/student/StudentExamsPage';
import TakeExamPage from './pages/student/TakeExamPage';
import StudentGradesPage from './pages/student/StudentGradesPage';
// Admin imports
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute';
import AdminLayout from './components/Admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import TeachersPage from './pages/admin/TeachersPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminClassesPage from './pages/admin/AdminClassesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

function App() {
  const { checkAuth, token, isLoading } = useAuthStore();
  const { checkAuth: checkStudentAuth, token: studentToken, isLoading: studentLoading } = useStudentAuthStore();
  const { checkAuth: checkAdminAuth, token: adminToken, isLoading: adminLoading } = useAdminAuthStore();

  useEffect(() => {
    checkAuth();
    checkStudentAuth();
    checkAdminAuth();
  }, [checkAuth, checkStudentAuth, checkAdminAuth]);

  if (isLoading || studentLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Teacher Routes */}
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:classId/students" element={<StudentsPage />} />
          <Route path="classes/:classId/attendance" element={<AttendancePage />} />
          <Route path="classes/:classId/quizzes" element={<QuizzesPage />} />
          <Route path="classes/:classId/exams" element={<ExamsPage />} />
          <Route path="classes/:classId/grades" element={<GradesPage />} />
          <Route path="classes/:classId/activities" element={<ActivitiesPage />} />
          <Route path="classes/:classId/settings" element={<SettingsPage />} />
        </Route>

        {/* Student Routes */}
        <Route
          path="/student/login"
          element={studentToken ? <Navigate to="/student/dashboard" /> : <StudentLoginPage />}
        />
        <Route path="/student" element={<StudentProtectedRoute />}>
          <Route element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="quizzes" element={<StudentQuizzesPage />} />
            <Route path="quizzes/:quizId" element={<TakeQuizPage />} />
            <Route path="exams" element={<StudentExamsPage />} />
            <Route path="exams/:examId" element={<TakeExamPage />} />
            <Route path="grades" element={<StudentGradesPage />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/login"
          element={adminToken ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage />}
        />
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="classes" element={<AdminClassesPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
