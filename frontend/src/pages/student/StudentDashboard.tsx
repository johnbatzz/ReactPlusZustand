import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudentAuthStore } from '../../store/studentAuthStore';
import { fetchStudentQuizzes, type QuizListItem } from '../../api/studentQuizzes';
import { fetchStudentExams, type ExamListItem } from '../../api/studentExams';
import { fetchStudentGrades, type StudentGrades } from '../../api/studentGrades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileQuestion, FileText, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const { student } = useStudentAuthStore();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [grades, setGrades] = useState<StudentGrades | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quizzesData, examsData, gradesData] = await Promise.all([
          fetchStudentQuizzes(),
          fetchStudentExams(),
          fetchStudentGrades(),
        ]);
        setQuizzes(quizzesData);
        setExams(examsData);
        setGrades(gradesData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const pendingQuizzes = quizzes.filter(q => q.status !== 'completed');
  const pendingExams = exams.filter(e => e.status !== 'completed');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Welcome, {student?.name}!</h1>
        <p className="text-slate-500 mt-1">Here's your academic overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Current Grade</CardTitle>
          </CardHeader>
          <CardContent>
            {grades ? (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{grades.letterGrade}</span>
                <span className="text-xl opacity-90">{grades.finalGrade.toFixed(1)}%</span>
              </div>
            ) : (
              <p className="opacity-75">No grades available</p>
            )}
            <Button variant="secondary" size="sm" className="mt-4" asChild>
              <Link to="/student/grades">View Details</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quizzes Completed</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.filter(q => q.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground">of {quizzes.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exams Completed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.filter(e => e.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground">of {exams.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades?.attendance.grade.toFixed(0) || 0}%</div>
            <p className="text-xs text-muted-foreground">{grades?.attendance.present || 0} of {grades?.attendance.total || 0} days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Pending Quizzes
            </CardTitle>
            {pendingQuizzes.length > 0 && (
              <Badge variant="secondary">{pendingQuizzes.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {pendingQuizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-muted-foreground">No pending quizzes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingQuizzes.slice(0, 3).map(quiz => (
                  <Link
                    key={quiz.id}
                    to={`/student/quizzes/${quiz.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <span className="font-medium">{quiz.name}</span>
                    <Badge variant={quiz.status === 'in_progress' ? 'default' : 'secondary'}>
                      {quiz.status === 'in_progress' ? (
                        <><Clock className="h-3 w-3 mr-1" />In Progress</>
                      ) : (
                        'Not Started'
                      )}
                    </Badge>
                  </Link>
                ))}
                {pendingQuizzes.length > 3 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/student/quizzes">
                      View all ({pendingQuizzes.length})
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Exams
            </CardTitle>
            {pendingExams.length > 0 && (
              <Badge variant="secondary">{pendingExams.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {pendingExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-muted-foreground">No pending exams</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingExams.slice(0, 3).map(exam => (
                  <Link
                    key={exam.id}
                    to={`/student/exams/${exam.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <span className="font-medium">{exam.name}</span>
                    <Badge variant={exam.status === 'in_progress' ? 'default' : 'secondary'}>
                      {exam.status === 'in_progress' ? (
                        <><Clock className="h-3 w-3 mr-1" />In Progress</>
                      ) : (
                        'Not Started'
                      )}
                    </Badge>
                  </Link>
                ))}
                {pendingExams.length > 3 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/student/exams">
                      View all ({pendingExams.length})
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
