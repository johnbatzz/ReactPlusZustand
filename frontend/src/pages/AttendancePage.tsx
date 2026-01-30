import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClassStore } from '../store/classStore';
import * as api from '../api/attendance';
import type { StudentWithAttendance, AttendanceStatus, AttendanceRecord } from '../api/attendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AttendancePage() {
  const { classId } = useParams<{ classId: string }>();
  const { currentClass, fetchClass } = useClassStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [records, setRecords] = useState<Map<number, AttendanceStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClass(parseInt(classId));
    }
  }, [classId, fetchClass]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!classId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.fetchAttendance(parseInt(classId), date);
        setStudents(data);
        const newRecords = new Map<number, AttendanceStatus>();
        data.forEach((s) => {
          if (s.attendance) {
            newRecords.set(s.id, s.attendance.status as AttendanceStatus);
          }
        });
        setRecords(newRecords);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttendance();
  }, [classId, date]);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setRecords((prev) => new Map(prev).set(studentId, status));
    setSuccess(false);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newRecords = new Map<number, AttendanceStatus>();
    students.forEach((s) => newRecords.set(s.id, status));
    setRecords(newRecords);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!classId) return;
    setIsSaving(true);
    setError(null);
    try {
      const attendanceRecords: AttendanceRecord[] = Array.from(records.entries()).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      await api.saveAttendance(parseInt(classId), date, attendanceRecords);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: { value: AttendanceStatus; label: string; bgColor: string; textColor: string }[] = [
    { value: 'present', label: 'Present', bgColor: 'bg-green-500', textColor: 'text-green-700' },
    { value: 'absent', label: 'Absent', bgColor: 'bg-red-500', textColor: 'text-red-700' },
    { value: 'late', label: 'Late', bgColor: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { value: 'excused', label: 'Excused', bgColor: 'bg-blue-500', textColor: 'text-blue-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Attendance</h1>
          {currentClass && (
            <p className="text-slate-500 mt-1">
              {currentClass.name} {currentClass.section && `- ${currentClass.section}`}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mark all:</span>
              {statusOptions.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  className={cn(opt.bgColor, 'text-white hover:opacity-90')}
                  onClick={() => handleMarkAll(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">Attendance saved successfully!</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No students in this class.</p>
            <p className="text-sm text-muted-foreground">Add students first to take attendance.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {statusOptions.map((opt) => {
                          const isActive = records.get(student.id) === opt.value;
                          return (
                            <Button
                              key={opt.value}
                              type="button"
                              size="sm"
                              variant={isActive ? 'default' : 'outline'}
                              className={cn(
                                isActive && opt.bgColor,
                                isActive && 'text-white',
                                !isActive && opt.textColor,
                                !isActive && 'border-current'
                              )}
                              onClick={() => handleStatusChange(student.id, opt.value)}
                            >
                              {opt.label}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex justify-center">
            <Button size="lg" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
