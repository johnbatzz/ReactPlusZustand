import { getAuthHeaders } from './auth';

const API_BASE = '/api/exams';

export interface Exam {
  id: number;
  name: string;
  classId: number;
  maxScore: number;
  date: string;
  _count?: { scores: number };
}

export interface ExamWithScores extends Exam {
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

export async function fetchExams(classId: number): Promise<Exam[]> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch exams');
  return response.json();
}

export async function fetchExam(id: number): Promise<ExamWithScores> {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch exam');
  return response.json();
}

export async function createExam(classId: number, data: { name: string; maxScore: number; date?: string }): Promise<Exam> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create exam');
  return response.json();
}

export async function updateExam(id: number, data: { name?: string; maxScore?: number; date?: string }): Promise<Exam> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update exam');
  return response.json();
}

export async function deleteExam(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to delete exam');
}

export async function saveExamScores(examId: number, scores: ScoreInput[]): Promise<void> {
  const response = await fetch(`${API_BASE}/${examId}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ scores }),
  });
  if (!response.ok) throw new Error('Failed to save exam scores');
}
