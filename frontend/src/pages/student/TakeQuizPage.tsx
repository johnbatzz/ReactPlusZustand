import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchStudentQuiz,
  startQuiz,
  submitQuiz,
  fetchQuizResults,
  type QuizDetail,
  type QuizResult,
} from '../../api/studentQuizzes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock, ArrowLeft, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TakeQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const data = await fetchStudentQuiz(parseInt(quizId!));
        setQuiz(data);

        if (data.attempt?.submittedAt) {
          // Quiz already submitted, show results
          const resultsData = await fetchQuizResults(parseInt(quizId!));
          setResults(resultsData);
        }
      } catch (err) {
        setError('Failed to load quiz');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuiz();
  }, [quizId]);

  const handleStartQuiz = async () => {
    try {
      await startQuiz(parseInt(quizId!));
      // Reload quiz to get attempt info
      const data = await fetchStudentQuiz(parseInt(quizId!));
      setQuiz(data);
    } catch (err) {
      setError('Failed to start quiz');
      console.error(err);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      if (!window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
      }));
      await submitQuiz(parseInt(quizId!), answersArray);
      const resultsData = await fetchQuizResults(parseInt(quizId!));
      setResults(resultsData);
    } catch (err) {
      setError('Failed to submit quiz');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate('/student/quizzes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    );
  }

  // Show results if quiz is completed
  if (results) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{results.quizName} - Results</CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <div className="text-center">
                {results.finalScore !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">{results.finalScore}</span>
                    <span className="text-xl text-muted-foreground">/ {results.maxScore}</span>
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-lg py-1 px-3">
                    <Clock className="h-4 w-4 mr-1" />
                    Pending Grade
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Submitted: {new Date(results.submittedAt).toLocaleString()}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {results.results.map((result, index) => (
            <Card
              key={result.question.id}
              className={cn(
                'border-l-4',
                result.isCorrect === true && 'border-l-green-500 bg-green-50/50',
                result.isCorrect === false && 'border-l-red-500 bg-red-50/50',
                result.isCorrect === null && 'border-l-yellow-500 bg-yellow-50/50'
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      {result.isCorrect === true && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {result.isCorrect === false && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {result.isCorrect === null && (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <p className="font-medium mb-4">{result.question.text}</p>

                    {result.question.type === 'multiple_choice' && result.question.options && (
                      <div className="space-y-2">
                        {result.question.options.map((opt, i) => (
                          <div
                            key={i}
                            className={cn(
                              'p-3 rounded-md border',
                              result.studentAnswer === String(i) && 'bg-primary/10 border-primary',
                              result.question.correctAnswer === String(i) && 'bg-green-100 border-green-500'
                            )}
                          >
                            {opt}
                            {result.question.correctAnswer === String(i) && (
                              <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {result.question.type === 'true_false' && (
                      <div className="space-y-2 text-sm">
                        <p><strong>Your answer:</strong> {result.studentAnswer === 'true' ? 'True' : 'False'}</p>
                        <p><strong>Correct answer:</strong> {result.question.correctAnswer === 'true' ? 'True' : 'False'}</p>
                      </div>
                    )}

                    {result.question.type === 'short_answer' && (
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Your answer:</strong></p>
                        <p className="p-3 bg-muted rounded-md">{result.studentAnswer || '(No answer)'}</p>
                        {result.feedback && (
                          <>
                            <p className="text-sm"><strong>Feedback:</strong></p>
                            <p className="p-3 bg-blue-50 rounded-md text-blue-800">{result.feedback}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <Badge variant={result.pointsEarned !== null ? 'default' : 'secondary'}>
                      {result.pointsEarned !== null ? (
                        <>{result.pointsEarned} / {result.question.points} pts</>
                      ) : (
                        'Pending'
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" onClick={() => navigate('/student/quizzes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
    );
  }

  // Show start screen if not started
  if (!quiz.attempt) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{quiz.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Questions</span>
                <span className="font-medium">{quiz.questions.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Points</span>
                <span className="font-medium">{quiz.maxScore}</span>
              </div>
              {quiz.dueDate && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium text-orange-600">
                    {new Date(quiz.dueDate).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleStartQuiz}>
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Quiz
              </Button>
              <Button variant="ghost" onClick={() => navigate('/student/quizzes')}>
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show quiz questions
  const progressPercent = (Object.keys(answers).length / quiz.questions.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{quiz.name}</CardTitle>
            <Badge variant="secondary">
              {Object.keys(answers).length} / {quiz.questions.length} answered
            </Badge>
          </div>
          <Progress value={progressPercent} className="mt-2" />
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {quiz.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Question {index + 1}</Badge>
                <Badge>{question.points} pts</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-medium mb-4">{question.text}</p>

              {question.type === 'multiple_choice' && question.options && (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                >
                  {question.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-accent">
                      <RadioGroupItem value={String(i)} id={`q${question.id}-opt${i}`} />
                      <Label htmlFor={`q${question.id}-opt${i}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === 'true_false' && (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 rounded-md border hover:bg-accent flex-1">
                    <RadioGroupItem value="true" id={`q${question.id}-true`} />
                    <Label htmlFor={`q${question.id}-true`} className="cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-md border hover:bg-accent flex-1">
                    <RadioGroupItem value="false" id={`q${question.id}-false`} />
                    <Label htmlFor={`q${question.id}-false`} className="cursor-pointer">False</Label>
                  </div>
                </RadioGroup>
              )}

              {question.type === 'short_answer' && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  rows={4}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
}
