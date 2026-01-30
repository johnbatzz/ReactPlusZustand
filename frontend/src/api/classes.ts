import { getAuthHeaders } from './auth';

const API_BASE = '/api/classes';

export interface GradeWeight {
  id: number;
  classId: number;
  attendanceWeight: number;
  quizWeight: number;
  examWeight: number;
  activityWeight: number;
}

export interface Class {
  id: number;
  name: string;
  section: string | null;
  teacherId: number;
  createdAt: string;
  gradeWeights: GradeWeight | null;
  _count?: { students: number; quizzes?: number; exams?: number };
}

export async function fetchClasses(): Promise<Class[]> {
  const response = await fetch(API_BASE, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch classes');
  return response.json();
}

export async function fetchClass(id: number): Promise<Class> {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch class');
  return response.json();
}

export async function createClass(name: string, section?: string): Promise<Class> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ name, section }),
  });
  if (!response.ok) throw new Error('Failed to create class');
  return response.json();
}

export async function updateClass(id: number, data: { name?: string; section?: string }): Promise<Class> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update class');
  return response.json();
}

export async function deleteClass(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to delete class');
}

export async function updateGradeWeights(
  classId: number,
  weights: { attendanceWeight: number; quizWeight: number; examWeight: number; activityWeight: number }
): Promise<GradeWeight> {
  const response = await fetch(`${API_BASE}/${classId}/weights`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(weights),
  });
  if (!response.ok) throw new Error('Failed to update grade weights');
  return response.json();
}
