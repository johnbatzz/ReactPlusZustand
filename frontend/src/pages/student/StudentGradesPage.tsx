import { useEffect, useState } from 'react';
import { fetchStudentGrades, type StudentGrades } from '../../api/studentGrades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileQuestion, FileText } from 'lucide-react';

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<StudentGrades | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGrades = async () => {
      try {
        const data = await fetchStudentGrades();
        setGrades(data);
      } catch (error) {
        console.error('Failed to load grades:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGrades();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading grades...</p>
      </div>
    );
  }

  if (!grades) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Failed to load grades</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">My Grades</h1>
        <p className="text-slate-500 mt-1">View your academic performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white md:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl font-bold">{grades.letterGrade}</div>
            <div className="text-2xl opacity-90 mt-2">{grades.finalGrade.toFixed(1)}%</div>
            <div className="text-sm opacity-75 mt-1">Final Grade</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Grade Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Attendance ({grades.weights.attendanceWeight}%)
                </span>
                <span className="font-medium">{grades.attendance.grade.toFixed(1)}%</span>
              </div>
              <Progress value={grades.attendance.grade} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4" />
                  Quizzes ({grades.weights.quizWeight}%)
                </span>
                <span className="font-medium">{grades.quizzes.grade.toFixed(1)}%</span>
              </div>
              <Progress value={grades.quizzes.grade} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exams ({grades.weights.examWeight}%)
                </span>
                <span className="font-medium">{grades.exams.grade.toFixed(1)}%</span>
              </div>
              <Progress value={grades.exams.grade} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{grades.attendance.present}</div>
                <div className="text-xs text-muted-foreground">Present</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{grades.attendance.total - grades.attendance.present}</div>
                <div className="text-xs text-muted-foreground">Absent/Late</div>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <div className="text-2xl font-bold text-slate-600">{grades.attendance.total}</div>
                <div className="text-xs text-muted-foreground">Total Days</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Quiz Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grades.quizzes.details.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No quiz scores yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.quizzes.details.map((quiz, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{quiz.name}</TableCell>
                      <TableCell>{quiz.score} / {quiz.maxScore}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={quiz.percentage >= 70 ? 'default' : 'destructive'}>
                          {quiz.percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exam Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grades.exams.details.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No exam scores yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.exams.details.map((exam, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.score} / {exam.maxScore}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={exam.percentage >= 70 ? 'default' : 'destructive'}>
                          {exam.percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
