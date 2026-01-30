import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentExams, type ExamListItem } from '../../api/studentExams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, PlayCircle } from 'lucide-react';

export default function StudentExamsPage() {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await fetchStudentExams();
        setExams(data);
      } catch (error) {
        console.error('Failed to load exams:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExams();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading exams...</p>
      </div>
    );
  }

  const filteredExams = exams.filter(exam => {
    if (filter === 'pending') return exam.status !== 'completed';
    if (filter === 'completed') return exam.status === 'completed';
    return true;
  });

  const pendingCount = exams.filter(e => e.status !== 'completed').length;
  const completedCount = exams.filter(e => e.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Exams</h1>
          <p className="text-slate-500 mt-1">View and take your assigned exams.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({exams.length})
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

      {filteredExams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No exams found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map(exam => (
            <Card key={exam.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{exam.name}</CardTitle>
                  <Badge variant={
                    exam.status === 'completed' ? 'default' :
                    exam.status === 'in_progress' ? 'secondary' : 'outline'
                  }>
                    {exam.status === 'completed' ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" />Completed</>
                    ) : exam.status === 'in_progress' ? (
                      <><Clock className="h-3 w-3 mr-1" />In Progress</>
                    ) : (
                      'Not Started'
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 text-sm text-muted-foreground flex-1">
                  <p>{exam.questionCount} questions · {exam.maxScore} points</p>
                  <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
                  {exam.dueDate && (
                    <p className="text-orange-600">
                      Due: {new Date(exam.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  {exam.status === 'completed' && exam.score !== null && (
                    <p className="text-lg font-semibold text-foreground mt-2">
                      Score: {exam.score} / {exam.maxScore}
                    </p>
                  )}
                </div>
                <Button
                  className="w-full mt-4"
                  variant={exam.status === 'completed' ? 'outline' : 'default'}
                  asChild
                >
                  <Link to={`/student/exams/${exam.id}`}>
                    {exam.status === 'completed' ? (
                      'View Results'
                    ) : exam.status === 'in_progress' ? (
                      <><PlayCircle className="h-4 w-4 mr-2" />Continue</>
                    ) : (
                      <><PlayCircle className="h-4 w-4 mr-2" />Start Exam</>
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
