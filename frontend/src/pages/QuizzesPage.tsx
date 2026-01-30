import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClassStore } from '../store/classStore';
import * as api from '../api/quizzes';
import type { Quiz, QuizWithScores, ScoreInput, QuestionInput } from '../api/quizzes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Trash2, FileQuestion, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'scores' | 'questions';

export function QuizzesPage() {
  const { classId } = useParams<{ classId: string }>();
  const { currentClass, fetchClass } = useClassStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithScores | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('questions');
  const [showForm, setShowForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Quiz form
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Score form
  const [scores, setScores] = useState<Map<number, string>>(new Map());

  // Question form
  const [qType, setQType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice');
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState('1');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState('0');

  useEffect(() => {
    if (classId) {
      fetchClass(parseInt(classId));
      loadQuizzes();
    }
  }, [classId, fetchClass]);

  const loadQuizzes = async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const data = await api.fetchQuizzes(parseInt(classId));
      setQuizzes(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    try {
      await api.createQuiz(parseInt(classId), {
        name,
        date,
        dueDate: dueDate || undefined,
      });
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setShowForm(false);
      setSuccess('Quiz created successfully!');
      loadQuizzes();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSelectQuiz = async (quizId: number) => {
    try {
      const quiz = await api.fetchQuiz(quizId);
      setSelectedQuiz(quiz);
      const newScores = new Map<number, string>();
      quiz.studentsWithScores.forEach((s) => {
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
    if (!selectedQuiz) return;
    try {
      const scoreInputs: ScoreInput[] = Array.from(scores.entries())
        .filter(([_, value]) => value !== '')
        .map(([studentId, value]) => ({ studentId, score: parseFloat(value) }));
      await api.saveQuizScores(selectedQuiz.id, scoreInputs);
      setSuccess('Scores saved successfully!');
      handleSelectQuiz(selectedQuiz.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.deleteQuiz(id);
      setQuizzes(quizzes.filter((q) => q.id !== id));
      if (selectedQuiz?.id === id) setSelectedQuiz(null);
      setSuccess('Quiz deleted successfully!');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;
    try {
      const question: QuestionInput = {
        type: qType,
        text: qText,
        points: parseFloat(qPoints),
      };
      if (qType === 'multiple_choice') {
        question.options = qOptions.filter(o => o.trim() !== '');
        question.correctAnswer = qCorrectAnswer;
      } else if (qType === 'true_false') {
        question.correctAnswer = qCorrectAnswer;
      }
      await api.addQuestion(selectedQuiz.id, question);
      resetQuestionForm();
      setShowQuestionForm(false);
      setSuccess('Question added!');
      handleSelectQuiz(selectedQuiz.id);
      loadQuizzes();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!selectedQuiz) return;
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.deleteQuestion(selectedQuiz.id, questionId);
      setSuccess('Question deleted!');
      handleSelectQuiz(selectedQuiz.id);
      loadQuizzes();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePublishToggle = async () => {
    if (!selectedQuiz) return;
    try {
      await api.publishQuiz(selectedQuiz.id, !selectedQuiz.isPublished);
      setSuccess(selectedQuiz.isPublished ? 'Quiz unpublished!' : 'Quiz published!');
      handleSelectQuiz(selectedQuiz.id);
      loadQuizzes();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const resetQuestionForm = () => {
    setQType('multiple_choice');
    setQText('');
    setQPoints('1');
    setQOptions(['', '', '', '']);
    setQCorrectAnswer('0');
  };

  const renderQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'short_answer': return 'Short Answer';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quizzes</h1>
          {currentClass && (
            <p className="text-slate-500 mt-1">
              {currentClass.name} {currentClass.section && `- ${currentClass.section}`}
            </p>
          )}
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="h-4 w-4 mr-2" />Cancel</> : <><Plus className="h-4 w-4 mr-2" />Add Quiz</>}
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
            <CardTitle>Create New Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quizName">Quiz Name *</Label>
                  <Input
                    id="quizName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Quiz 1: Chapter 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quizDate">Date</Label>
                  <Input id="quizDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (optional)</Label>
                  <Input id="dueDate" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <Button type="submit">Create Quiz</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : quizzes.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No quizzes yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedQuiz?.id === quiz.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    )}
                    onClick={() => handleSelectQuiz(quiz.id)}
                  >
                    <div>
                      <p className="font-medium">{quiz.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{quiz._count?.questions || 0} Q</Badge>
                        <Badge variant="outline">{quiz.maxScore} pts</Badge>
                        <Badge variant={quiz.isPublished ? 'default' : 'secondary'}>
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuiz(quiz.id);
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
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedQuiz ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a quiz to manage questions and scores.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedQuiz.name}</h3>
                  <Button
                    variant={selectedQuiz.isPublished ? 'outline' : 'default'}
                    size="sm"
                    onClick={handlePublishToggle}
                  >
                    {selectedQuiz.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="questions">Questions ({selectedQuiz.questions?.length || 0})</TabsTrigger>
                    <TabsTrigger value="scores">Manual Scores</TabsTrigger>
                  </TabsList>

                  <TabsContent value="questions" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total: {selectedQuiz.maxScore} points</span>
                      <Button size="sm" onClick={() => setShowQuestionForm(!showQuestionForm)}>
                        {showQuestionForm ? 'Cancel' : 'Add Question'}
                      </Button>
                    </div>

                    {showQuestionForm && (
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4">
                          <form onSubmit={handleAddQuestion} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Question Type</Label>
                              <Select value={qType} onValueChange={(v) => setQType(v as typeof qType)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                  <SelectItem value="true_false">True/False</SelectItem>
                                  <SelectItem value="short_answer">Short Answer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Question Text *</Label>
                              <Textarea
                                value={qText}
                                onChange={(e) => setQText(e.target.value)}
                                required
                                rows={2}
                                placeholder="Enter your question..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={qPoints}
                                onChange={(e) => setQPoints(e.target.value)}
                                min="0.5"
                                step="0.5"
                                className="w-24"
                              />
                            </div>

                            {qType === 'multiple_choice' && (
                              <>
                                <div className="space-y-2">
                                  <Label>Options</Label>
                                  {qOptions.map((opt, i) => (
                                    <Input
                                      key={i}
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...qOptions];
                                        newOpts[i] = e.target.value;
                                        setQOptions(newOpts);
                                      }}
                                      placeholder={`Option ${i + 1}`}
                                    />
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  <Label>Correct Answer</Label>
                                  <Select value={qCorrectAnswer} onValueChange={setQCorrectAnswer}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {qOptions.map((opt, i) => (
                                        <SelectItem key={i} value={String(i)} disabled={!opt.trim()}>
                                          Option {i + 1}: {opt || '(empty)'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}

                            {qType === 'true_false' && (
                              <div className="space-y-2">
                                <Label>Correct Answer</Label>
                                <Select value={qCorrectAnswer} onValueChange={setQCorrectAnswer}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">True</SelectItem>
                                    <SelectItem value="false">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <Button type="submit">Add Question</Button>
                          </form>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-3">
                      {(!selectedQuiz.questions || selectedQuiz.questions.length === 0) ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No questions yet. Add questions to make this quiz available to students.
                        </p>
                      ) : (
                        selectedQuiz.questions.map((q, index) => (
                          <div key={q.id} className="p-4 rounded-lg border border-l-4 border-l-primary bg-card">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Q{index + 1}</Badge>
                                <Badge variant="outline">{renderQuestionTypeLabel(q.type)}</Badge>
                                <span className="text-sm text-muted-foreground">{q.points} pts</span>
                              </div>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="mb-2">{q.text}</p>
                            {q.type === 'multiple_choice' && q.options && (
                              <div className="space-y-1 mt-2">
                                {q.options.map((opt, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'p-2 rounded text-sm',
                                      q.correctAnswer === String(i) ? 'bg-green-100 text-green-800' : 'bg-muted'
                                    )}
                                  >
                                    {opt} {q.correctAnswer === String(i) && '✓'}
                                  </div>
                                ))}
                              </div>
                            )}
                            {q.type === 'true_false' && (
                              <p className="text-sm text-green-700">
                                Correct: {q.correctAnswer === 'true' ? 'True' : 'False'}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="scores" className="space-y-4">
                    <p className="text-sm text-muted-foreground italic">
                      Use this to manually enter scores. If students take quizzes online, scores are calculated automatically.
                    </p>
                    <div className="space-y-2">
                      {selectedQuiz.studentsWithScores.map((student) => (
                        <div key={student.id} className="flex items-center gap-3">
                          <span className="flex-1">{student.name}</span>
                          <Input
                            type="number"
                            value={scores.get(student.id) || ''}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            placeholder="-"
                            min="0"
                            max={selectedQuiz.maxScore}
                            step="0.5"
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">/ {selectedQuiz.maxScore}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleSaveScores}>Save Scores</Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
