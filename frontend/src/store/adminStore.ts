import { create } from 'zustand';
import * as api from '../api/admin';
import type {
  TeacherInfo,
  StudentInfo,
  ClassInfo,
  DashboardStats,
  AuditLog,
  CreateTeacherData,
  UpdateTeacherData
} from '../api/admin';

interface AdminState {
  // Teachers
  teachers: TeacherInfo[];
  teachersLoading: boolean;
  fetchTeachers: () => Promise<void>;
  createTeacher: (data: CreateTeacherData) => Promise<void>;
  updateTeacher: (id: number, data: UpdateTeacherData) => Promise<void>;
  toggleTeacherStatus: (id: number) => Promise<void>;
  deleteTeacher: (id: number) => Promise<void>;

  // Students
  students: StudentInfo[];
  studentsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  studentsLoading: boolean;
  fetchStudents: (params?: {
    search?: string;
    classId?: number;
    teacherId?: number;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  updateStudent: (id: number, data: Partial<StudentInfo>) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
  resetStudentPassword: (id: number) => Promise<void>;

  // Classes
  classes: ClassInfo[];
  classesLoading: boolean;
  fetchClasses: (teacherId?: number) => Promise<void>;

  // Dashboard
  stats: DashboardStats | null;
  statsLoading: boolean;
  fetchStats: () => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  auditLogsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  auditLogsLoading: boolean;
  fetchAuditLogs: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
  }) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Teachers
  teachers: [],
  teachersLoading: false,

  fetchTeachers: async () => {
    set({ teachersLoading: true });
    try {
      const teachers = await api.getTeachers();
      set({ teachers, teachersLoading: false });
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      set({ teachersLoading: false });
      throw error;
    }
  },

  createTeacher: async (data) => {
    const teacher = await api.createTeacher(data);
    set({ teachers: [teacher, ...get().teachers] });
  },

  updateTeacher: async (id, data) => {
    const updated = await api.updateTeacher(id, data);
    set({
      teachers: get().teachers.map(t => t.id === id ? { ...t, ...updated } : t)
    });
  },

  toggleTeacherStatus: async (id) => {
    const updated = await api.toggleTeacherStatus(id);
    set({
      teachers: get().teachers.map(t => t.id === id ? { ...t, ...updated } : t)
    });
  },

  deleteTeacher: async (id) => {
    await api.deleteTeacher(id);
    set({ teachers: get().teachers.filter(t => t.id !== id) });
  },

  // Students
  students: [],
  studentsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  studentsLoading: false,

  fetchStudents: async (params) => {
    set({ studentsLoading: true });
    try {
      const response = await api.getStudents(params);
      set({
        students: response.students,
        studentsPagination: response.pagination,
        studentsLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch students:', error);
      set({ studentsLoading: false });
      throw error;
    }
  },

  updateStudent: async (id, data) => {
    const updated = await api.updateStudent(id, data);
    set({
      students: get().students.map(s => s.id === id ? { ...s, ...updated } : s)
    });
  },

  deleteStudent: async (id) => {
    await api.deleteStudent(id);
    set({ students: get().students.filter(s => s.id !== id) });
  },

  resetStudentPassword: async (id) => {
    await api.resetStudentPassword(id);
    set({
      students: get().students.map(s =>
        s.id === id ? { ...s, hasPassword: false } : s
      )
    });
  },

  // Classes
  classes: [],
  classesLoading: false,

  fetchClasses: async (teacherId) => {
    set({ classesLoading: true });
    try {
      const classes = await api.getClasses(teacherId);
      set({ classes, classesLoading: false });
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      set({ classesLoading: false });
      throw error;
    }
  },

  // Dashboard
  stats: null,
  statsLoading: false,

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const stats = await api.getDashboardStats();
      set({ stats, statsLoading: false });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      set({ statsLoading: false });
      throw error;
    }
  },

  // Audit Logs
  auditLogs: [],
  auditLogsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  auditLogsLoading: false,

  fetchAuditLogs: async (params) => {
    set({ auditLogsLoading: true });
    try {
      const response = await api.getAuditLogs(params);
      set({
        auditLogs: response.logs,
        auditLogsPagination: response.pagination,
        auditLogsLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      set({ auditLogsLoading: false });
      throw error;
    }
  },
}));
