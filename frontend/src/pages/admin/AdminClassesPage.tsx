import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function AdminClassesPage() {
  const {
    classes,
    classesLoading,
    fetchClasses,
    teachers,
    fetchTeachers
  } = useAdminStore();

  const [teacherFilter, setTeacherFilter] = useState<string>('');

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchClasses(teacherFilter ? parseInt(teacherFilter) : undefined);
  }, [teacherFilter, fetchClasses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Classes</h1>
        <p className="text-slate-600 mt-1">View all classes across the system</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={teacherFilter || "all"} onValueChange={(val) => setTeacherFilter(val === "all" ? "" : val)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Teachers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {classesLoading && classes.length === 0 ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Teacher Status</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead>Exams</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.section || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cls.teacher.name}</p>
                        <p className="text-sm text-slate-500">{cls.teacher.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cls.teacher.isActive ? 'default' : 'secondary'}>
                        {cls.teacher.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{cls.studentCount}</TableCell>
                    <TableCell>{cls.quizCount}</TableCell>
                    <TableCell>{cls.examCount}</TableCell>
                    <TableCell>{new Date(cls.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
