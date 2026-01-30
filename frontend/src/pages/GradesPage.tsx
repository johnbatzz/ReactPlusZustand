import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClassStore } from '../store/classStore';
import * as api from '../api/grades';
import type { ClassGrades } from '../api/grades';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings2, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GradesPage() {
  const { classId } = useParams<{ classId: string }>();
  const { currentClass, fetchClass } = useClassStore();
  const [grades, setGrades] = useState<ClassGrades | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchClass(parseInt(classId));
      loadGrades();
    }
  }, [classId, fetchClass]);

  const loadGrades = async () => {
    if (!classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchClassGrades(parseInt(classId));
      setGrades(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Grades</h1>
          {currentClass && (
            <p className="text-slate-500 mt-1">
              {currentClass.name} {currentClass.section && `- ${currentClass.section}`}
            </p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link to={`/classes/${classId}/settings`}>
            <Settings2 className="h-4 w-4 mr-2" />
            Grade Weights
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {grades && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-6 text-sm">
              <strong>Current Weights:</strong>
              <span>Attendance {grades.weights.attendanceWeight}%</span>
              <span>Quizzes {grades.weights.quizWeight}%</span>
              <span>Exams {grades.weights.examWeight}%</span>
              <span>Activities {grades.weights.activityWeight}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : !grades || grades.grades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No students or grades to display.</p>
            <p className="text-sm text-muted-foreground">Add students and record attendance, quizzes, and exams to see grades.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead>Exams</TableHead>
                <TableHead>Activities</TableHead>
                <TableHead>Final Grade</TableHead>
                <TableHead>Letter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.grades.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>
                    <div>
                      <Link to={`/students/${student.studentId}`} className="text-primary hover:underline font-medium">
                        {student.studentName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{student.studentNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{student.attendanceGrade.toFixed(1)}%</span>
                      <p className="text-xs text-muted-foreground">{student.details.attendanceRecords} records</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{student.quizGrade.toFixed(1)}%</span>
                      <p className="text-xs text-muted-foreground">{student.details.quizzesCompleted} quizzes</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{student.examGrade.toFixed(1)}%</span>
                      <p className="text-xs text-muted-foreground">{student.details.examsCompleted} exams</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{student.activityGrade.toFixed(1)}%</span>
                      <p className="text-xs text-muted-foreground">{student.details.activitiesCompleted} activities</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-bold">{student.finalGrade.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(getGradeColor(student.letterGrade), 'text-white text-lg px-3 py-1')}>
                      {student.letterGrade}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
