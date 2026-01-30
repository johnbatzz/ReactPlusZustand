import { getStudentAuthHeaders } from './studentAuth';

const API_BASE = '/api/student';

export interface ExamListItem {
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

export interface ExamDetail {
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

export interface ExamResult {
  examName: string;
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

export async function fetchStudentExams(): Promise<ExamListItem[]> {
  const response = await fetch(`${API_BASE}/exams`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch exams');
  return response.json();
}

export async function fetchStudentExam(examId: number): Promise<ExamDetail> {
  const response = await fetch(`${API_BASE}/exams/${examId}`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch exam');
  return response.json();
}

export async function startExam(examId: number): Promise<{ message: string; attempt: unknown }> {
  const response = await fetch(`${API_BASE}/exams/${examId}/start`, {
    method: 'POST',
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to start exam');
  return response.json();
}

export async function submitExam(
  examId: number,
  answers: { questionId: number; answer: string }[]
): Promise<SubmitResponse> {
  const response = await fetch(`${API_BASE}/exams/${examId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getStudentAuthHeaders() },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) throw new Error('Failed to submit exam');
  return response.json();
}

export async function fetchExamResults(examId: number): Promise<ExamResult> {
  const response = await fetch(`${API_BASE}/exams/${examId}/results`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
}
