const API_BASE = '/api/auth';

export interface Teacher {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  teacher: Teacher;
  token: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  return response.json();
}

export async function getMe(): Promise<Teacher> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Not authenticated');
  return response.json();
}

export { getAuthHeaders };
