import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClassStore } from '../store/classStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, X, Eye, Settings, Trash2, GraduationCap } from 'lucide-react';

export function ClassesPage() {
  const { classes, fetchClasses, createClass, deleteClass, isLoading, error } = useClassStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClass(name, section || undefined);
      setName('');
      setSection('');
      setShowForm(false);
    } catch {
      // Error handled in store
    }
  };

  const handleDelete = async (id: number, className: string) => {
    if (window.confirm(`Are you sure you want to delete "${className}"? This will also delete all students, attendance records, quizzes, and exams.`)) {
      await deleteClass(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Classes</h1>
          <p className="text-slate-500 mt-1">Manage your classes and students.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="h-4 w-4 mr-2" />Cancel</> : <><Plus className="h-4 w-4 mr-2" />Add Class</>}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name *</Label>
                  <Input
                    id="className"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Math 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g., Section A"
                  />
                </div>
              </div>
              <Button type="submit">Create Class</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">You haven't created any classes yet.</p>
            <p className="text-sm text-muted-foreground">Click "Add Class" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Grade Weights</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>
                    <Link to={`/classes/${cls.id}/students`} className="font-medium text-primary hover:underline">
                      {cls.name}
                    </Link>
                  </TableCell>
                  <TableCell>{cls.section || '-'}</TableCell>
                  <TableCell>{cls._count?.students || 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cls.gradeWeights
                      ? `A:${cls.gradeWeights.attendanceWeight}% Q:${cls.gradeWeights.quizWeight}% E:${cls.gradeWeights.examWeight}%`
                      : 'Default'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/classes/${cls.id}/students`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/classes/${cls.id}/settings`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(cls.id, cls.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
