import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClassStore } from '../store/classStore';
import * as api from '../api/exams';
import type { Exam, ExamWithScores, ScoreInput } from '../api/exams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExamsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { currentClass, fetchClass } = useClassStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamWithScores | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [scores, setScores] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (classId) {
      fetchClass(parseInt(classId));
      loadExams();
    }
  }, [classId, fetchClass]);

  const loadExams = async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const data = await api.fetchExams(parseInt(classId));
      setExams(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    try {
      await api.createExam(parseInt(classId), { name, maxScore: parseFloat(maxScore), date });
      setName('');
      setMaxScore('100');
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      setSuccess('Exam created successfully!');
      loadExams();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSelectExam = async (examId: number) => {
    try {
      const exam = await api.fetchExam(examId);
      setSelectedExam(exam);
      const newScores = new Map<number, string>();
      exam.studentsWithScores.forEach((s) => {
        if (s.score !== null) {
          newScores.set(s.id, s.score.toString());
        }
      });
      setScores(newScores);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleScoreChange = (studentId: number, value: string) => {
    setScores((prev) => new Map(prev).set(studentId, value));
    setSuccess(null);
  };

  const handleSaveScores = async () => {
    if (!selectedExam) return;
    try {
      const scoreInputs: ScoreInput[] = Array.from(scores.entries())
        .filter(([_, value]) => value !== '')
        .map(([studentId, value]) => ({ studentId, score: parseFloat(value) }));
      await api.saveExamScores(selectedExam.id, scoreInputs);
      setSuccess('Scores saved successfully!');
      handleSelectExam(selectedExam.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.deleteExam(id);
      setExams(exams.filter((e) => e.id !== id));
      if (selectedExam?.id === id) setSelectedExam(null);
      setSuccess('Exam deleted successfully!');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Exams</h1>
          {currentClass && (
            <p className="text-slate-500 mt-1">
              {currentClass.name} {currentClass.section && `- ${currentClass.section}`}
            </p>
          )}
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="h-4 w-4 mr-2" />Cancel</> : <><Plus className="h-4 w-4 mr-2" />Add Exam</>}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Exam</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="examName">Exam Name *</Label>
                  <Input
                    id="examName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Midterm Exam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Max Score *</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examDate">Date</Label>
                  <Input id="examDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <Button type="submit">Create Exam</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : exams.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No exams yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedExam?.id === exam.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    )}
                    onClick={() => handleSelectExam(exam.id)}
                  >
                    <div>
                      <p className="font-medium">{exam.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">Max: {exam.maxScore}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(exam.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExam(exam.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Enter Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedExam ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an exam to enter scores.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">{selectedExam.name}</p>
                  <p className="text-sm text-muted-foreground">Max Score: {selectedExam.maxScore}</p>
                </div>

                <div className="space-y-2">
                  {selectedExam.studentsWithScores.map((student) => (
                    <div key={student.id} className="flex items-center gap-3">
                      <span className="flex-1">{student.name}</span>
                      <Input
                        type="number"
                        value={scores.get(student.id) || ''}
                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        placeholder="-"
                        min="0"
                        max={selectedExam.maxScore}
                        step="0.5"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">/ {selectedExam.maxScore}</span>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSaveScores}>Save Scores</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
