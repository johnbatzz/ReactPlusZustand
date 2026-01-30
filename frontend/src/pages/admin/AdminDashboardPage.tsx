import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, School, FileQuestion, FileText, UserCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  const { stats, statsLoading, fetchStats, auditLogs, fetchAuditLogs } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchAuditLogs({ limit: 5 });
  }, [fetchStats, fetchAuditLogs]);

  if (statsLoading && !stats) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-1">System overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Teachers</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.teachers.total || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.teachers.active || 0} active, {stats?.teachers.inactive || 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
            <GraduationCap className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.students.total || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.students.recentLogins || 0} logged in this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Classes</CardTitle>
            <School className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.classes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Quizzes</CardTitle>
            <FileQuestion className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.quizzes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Exams</CardTitle>
            <FileText className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.exams || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Teachers</CardTitle>
            <UserCheck className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.teachers.active || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.teachers.total ? Math.round((stats.teachers.active / stats.teachers.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      <span className="text-blue-600">{log.admin.name}</span>
                      {' '}
                      <span className="text-slate-600">
                        {log.action.toLowerCase()}d a {log.entityType.toLowerCase()}
                      </span>
                    </p>
                    {log.details && (
                      <p className="text-xs text-slate-500 mt-1">
                        {String(log.details.email || log.details.name || log.details.studentId || '')}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
