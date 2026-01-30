import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentQuizzes, type QuizListItem } from '../../api/studentQuizzes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileQuestion, Clock, CheckCircle2, PlayCircle } from 'lucide-react';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await fetchStudentQuizzes();
        setQuizzes(data);
      } catch (error) {
        console.error('Failed to load quizzes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuizzes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading quizzes...</p>
      </div>
    );
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    if (filter === 'pending') return quiz.status !== 'completed';
    if (filter === 'completed') return quiz.status === 'completed';
    return true;
  });

  const pendingCount = quizzes.filter(q => q.status !== 'completed').length;
  const completedCount = quizzes.filter(q => q.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quizzes</h1>
          <p className="text-slate-500 mt-1">View and take your assigned quizzes.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({quizzes.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </Button>
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quizzes found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map(quiz => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{quiz.name}</CardTitle>
                  <Badge variant={
                    quiz.status === 'completed' ? 'default' :
                    quiz.status === 'in_progress' ? 'secondary' : 'outline'
                  }>
                    {quiz.status === 'completed' ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" />Completed</>
                    ) : quiz.status === 'in_progress' ? (
                      <><Clock className="h-3 w-3 mr-1" />In Progress</>
                    ) : (
                      'Not Started'
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 text-sm text-muted-foreground flex-1">
                  <p>{quiz.questionCount} questions · {quiz.maxScore} points</p>
                  <p>Date: {new Date(quiz.date).toLocaleDateString()}</p>
                  {quiz.dueDate && (
                    <p className="text-orange-600">
                      Due: {new Date(quiz.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  {quiz.status === 'completed' && quiz.score !== null && (
                    <p className="text-lg font-semibold text-foreground mt-2">
                      Score: {quiz.score} / {quiz.maxScore}
                    </p>
                  )}
                </div>
                <Button
                  className="w-full mt-4"
                  variant={quiz.status === 'completed' ? 'outline' : 'default'}
                  asChild
                >
                  <Link to={`/student/quizzes/${quiz.id}`}>
                    {quiz.status === 'completed' ? (
                      'View Results'
                    ) : quiz.status === 'in_progress' ? (
                      <><PlayCircle className="h-4 w-4 mr-2" />Continue</>
                    ) : (
                      <><PlayCircle className="h-4 w-4 mr-2" />Start Quiz</>
                    )}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
