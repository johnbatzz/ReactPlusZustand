import { getStudentAuthHeaders } from './studentAuth';

const API_BASE = '/api/student';

export interface QuizListItem {
  id: number;
  name: string;
  date: string;
  dueDate: string | null;
  maxScore: number;
  questionCount: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
}

export interface Question {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  text: string;
  points: number;
  order: number;
  options: string[] | null;
}

export interface QuizDetail {
  id: number;
  name: string;
  date: string;
  dueDate: string | null;
  maxScore: number;
  questions: Question[];
  attempt: {
    startedAt: string;
    submittedAt: string | null;
    finalScore: number | null;
  } | null;
}

export interface QuizResult {
  quizName: string;
  submittedAt: string;
  autoScore: number | null;
  finalScore: number | null;
  maxScore: number;
  results: {
    question: Question & { correctAnswer: string | null };
    studentAnswer: string | null;
    isCorrect: boolean | null;
    pointsEarned: number | null;
    feedback: string | null;
  }[];
}

export interface SubmitResponse {
  message: string;
  autoScore: number;
  finalScore: number | null;
  needsManualGrading: boolean;
}

export async function fetchStudentQuizzes(): Promise<QuizListItem[]> {
  const response = await fetch(`${API_BASE}/quizzes`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch quizzes');
  return response.json();
}

export async function fetchStudentQuiz(quizId: number): Promise<QuizDetail> {
  const response = await fetch(`${API_BASE}/quizzes/${quizId}`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch quiz');
  return response.json();
}

export async function startQuiz(quizId: number): Promise<{ message: string; attempt: unknown }> {
  const response = await fetch(`${API_BASE}/quizzes/${quizId}/start`, {
    method: 'POST',
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to start quiz');
  return response.json();
}

export async function submitQuiz(
  quizId: number,
  answers: { questionId: number; answer: string }[]
): Promise<SubmitResponse> {
  const response = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getStudentAuthHeaders() },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) throw new Error('Failed to submit quiz');
  return response.json();
}

export async function fetchQuizResults(quizId: number): Promise<QuizResult> {
  const response = await fetch(`${API_BASE}/quizzes/${quizId}/results`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
}
