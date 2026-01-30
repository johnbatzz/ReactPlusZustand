import { getAuthHeaders } from './auth';

const API_BASE = '/api/students';

export interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string | null;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  classId: number;
}

export interface StudentInput {
  studentId: string;
  name: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export async function fetchStudents(classId: number): Promise<Student[]> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
}

export async function fetchStudent(id: number): Promise<Student> {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch student');
  return response.json();
}

export async function createStudent(classId: number, data: StudentInput): Promise<Student> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create student');
  return response.json();
}

export async function updateStudent(id: number, data: Partial<StudentInput>): Promise<Student> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update student');
  return response.json();
}

export async function deleteStudent(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to delete student');
}
