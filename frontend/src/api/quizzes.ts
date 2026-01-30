import { getAuthHeaders } from './auth';

const API_BASE = '/api/quizzes';

export interface Quiz {
  id: number;
  name: string;
  classId: number;
  maxScore: number;
  date: string;
  isPublished?: boolean;
  dueDate?: string | null;
  _count?: { scores: number; questions: number };
}

export interface Question {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  text: string;
  points: number;
  order: number;
  options: string[] | null;
  correctAnswer: string | null;
}

export interface QuizWithScores extends Quiz {
  questions?: Question[];
  studentsWithScores: {
    id: number;
    name: string;
    studentId: string;
    score: number | null;
  }[];
}

export interface ScoreInput {
  studentId: number;
  score: number;
}

export interface QuestionInput {
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  text: string;
  points?: number;
  options?: string[];
  correctAnswer?: string;
}

export interface Attempt {
  id: number;
  quizId: number;
  studentId: number;
  startedAt: string;
  submittedAt: string | null;
  autoScore: number | null;
  finalScore: number | null;
  student: {
    id: number;
    name: string;
    studentId: string;
  };
}

export async function fetchQuizzes(classId: number): Promise<Quiz[]> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch quizzes');
  return response.json();
}

export async function fetchQuiz(id: number): Promise<QuizWithScores> {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch quiz');
  return response.json();
}

export async function createQuiz(
  classId: number,
  data: { name: string; maxScore?: number; date?: string; dueDate?: string }
): Promise<Quiz> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create quiz');
  return response.json();
}

export async function updateQuiz(
  id: number,
  data: { name?: string; maxScore?: number; date?: string; dueDate?: string; isPublished?: boolean }
): Promise<Quiz> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update quiz');
  return response.json();
}

export async function deleteQuiz(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to delete quiz');
}

export async function saveQuizScores(quizId: number, scores: ScoreInput[]): Promise<void> {
  const response = await fetch(`${API_BASE}/${quizId}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ scores }),
  });
  if (!response.ok) throw new Error('Failed to save quiz scores');
}

// Question Management
export async function addQuestion(quizId: number, question: QuestionInput): Promise<Question> {
  const response = await fetch(`${API_BASE}/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(question),
  });
  if (!response.ok) throw new Error('Failed to add question');
  return response.json();
}

export async function updateQuestion(
  quizId: number,
  questionId: number,
  question: Partial<QuestionInput>
): Promise<Question> {
  const response = await fetch(`${API_BASE}/${quizId}/questions/${questionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(question),
  });
  if (!response.ok) throw new Error('Failed to update question');
  return response.json();
}

export async function deleteQuestion(quizId: number, questionId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${quizId}/questions/${questionId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to delete question');
}

export async function publishQuiz(quizId: number, publish: boolean = true): Promise<Quiz> {
  const response = await fetch(`${API_BASE}/${quizId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ publish }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to publish quiz');
  }
  return response.json();
}

export async function fetchAttempts(quizId: number): Promise<Attempt[]> {
  const response = await fetch(`${API_BASE}/${quizId}/attempts`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch attempts');
  return response.json();
}

export async function fetchStudentAttempt(quizId: number, studentId: number): Promise<{
  attempt: Attempt;
  questionsWithAnswers: {
    question: Question;
    studentAnswer: string | null;
    isCorrect: boolean | null;
    pointsEarned: number | null;
    feedback: string | null;
  }[];
}> {
  const response = await fetch(`${API_BASE}/${quizId}/attempts/${studentId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch student attempt');
  return response.json();
}

export async function gradeQuiz(
  quizId: number,
  studentId: number,
  grades: { questionId: number; pointsEarned: number; feedback?: string }[]
): Promise<{ message: string; finalScore: number }> {
  const response = await fetch(`${API_BASE}/${quizId}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ studentId, grades }),
  });
  if (!response.ok) throw new Error('Failed to grade quiz');
  return response.json();
}
