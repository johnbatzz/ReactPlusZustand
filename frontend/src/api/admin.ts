const API_BASE = '/api';

// Helper for API calls with admin auth
async function adminFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth types
export interface AdminInfo {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminInfo;
}

// Teacher types
export interface TeacherInfo {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  classCount?: number;
  studentCount?: number;
}

export interface CreateTeacherData {
  email: string;
  password: string;
  name: string;
}

export interface UpdateTeacherData {
  email?: string;
  password?: string;
  name?: string;
  isActive?: boolean;
}

// Student types
export interface StudentInfo {
  id: number;
  studentId: string;
  name: string;
  email: string | null;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  hasPassword: boolean;
  lastLoginAt: string | null;
  class: {
    id: number;
    name: string;
    section: string | null;
    teacher: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface StudentListResponse {
  students: StudentInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Class types
export interface ClassInfo {
  id: number;
  name: string;
  section: string | null;
  createdAt: string;
  teacher: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
  };
  studentCount: number;
  quizCount: number;
  examCount: number;
}

// Dashboard types
export interface DashboardStats {
  teachers: {
    total: number;
    active: number;
    inactive: number;
  };
  students: {
    total: number;
    recentLogins: number;
  };
  classes: number;
  quizzes: number;
  exams: number;
}

// Audit log types
export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AuditLogResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth API
export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return adminFetch(`${API_BASE}/admin-auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getAdminMe(): Promise<AdminInfo> {
  return adminFetch(`${API_BASE}/admin-auth/me`);
}

// Teachers API
export async function getTeachers(): Promise<TeacherInfo[]> {
  return adminFetch(`${API_BASE}/admin/teachers`);
}

export async function createTeacher(data: CreateTeacherData): Promise<TeacherInfo> {
  return adminFetch(`${API_BASE}/admin/teachers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTeacher(id: number, data: UpdateTeacherData): Promise<TeacherInfo> {
  return adminFetch(`${API_BASE}/admin/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleTeacherStatus(id: number): Promise<TeacherInfo> {
  return adminFetch(`${API_BASE}/admin/teachers/${id}/toggle-status`, {
    method: 'PATCH',
  });
}

export async function deleteTeacher(id: number): Promise<{ message: string }> {
  return adminFetch(`${API_BASE}/admin/teachers/${id}`, {
    method: 'DELETE',
  });
}

// Students API
export async function getStudents(params?: {
  search?: string;
  classId?: number;
  teacherId?: number;
  page?: number;
  limit?: number;
}): Promise<StudentListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.classId) searchParams.set('classId', params.classId.toString());
  if (params?.teacherId) searchParams.set('teacherId', params.teacherId.toString());
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const query = searchParams.toString();
  return adminFetch(`${API_BASE}/admin/students${query ? `?${query}` : ''}`);
}

export async function updateStudent(id: number, data: Partial<StudentInfo>): Promise<StudentInfo> {
  return adminFetch(`${API_BASE}/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: number): Promise<{ message: string }> {
  return adminFetch(`${API_BASE}/admin/students/${id}`, {
    method: 'DELETE',
  });
}

export async function resetStudentPassword(id: number): Promise<{ message: string }> {
  return adminFetch(`${API_BASE}/admin/students/${id}/reset-password`, {
    method: 'POST',
  });
}

// Classes API
export async function getClasses(teacherId?: number): Promise<ClassInfo[]> {
  const query = teacherId ? `?teacherId=${teacherId}` : '';
  return adminFetch(`${API_BASE}/admin/classes${query}`);
}

// Dashboard API
export async function getDashboardStats(): Promise<DashboardStats> {
  return adminFetch(`${API_BASE}/admin/dashboard/stats`);
}

export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  adminId?: number;
}): Promise<AuditLogResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.action) searchParams.set('action', params.action);
  if (params?.entityType) searchParams.set('entityType', params.entityType);
  if (params?.adminId) searchParams.set('adminId', params.adminId.toString());

  const query = searchParams.toString();
  return adminFetch(`${API_BASE}/admin/dashboard/audit-logs${query ? `?${query}` : ''}`);
}
