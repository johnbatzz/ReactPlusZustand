const API_BASE = '/api/student-auth';

export interface StudentInfo {
  id: number;
  studentId: string;
  name: string;
  email: string | null;
  class: {
    id: number;
    name: string;
    section: string | null;
  };
}

export interface LoginResponse {
  token: string;
  student: StudentInfo;
}

export function getStudentAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('studentToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function studentLogin(studentId: string, password: string, classId?: number): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, password, classId }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Login failed');
  }
  return response.json();
}

export async function setStudentPassword(studentId: string, classId: number, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, classId, password }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to set password');
  }
  return response.json();
}

export async function getStudentMe(): Promise<StudentInfo> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to get student info');
  return response.json();
}
