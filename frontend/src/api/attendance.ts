import { getAuthHeaders } from './auth';
import type { Student } from './students';

const API_BASE = '/api/attendance';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id: number;
  studentId: number;
  date: string;
  status: AttendanceStatus;
}

export interface StudentWithAttendance extends Student {
  attendance: Attendance | null;
}

export interface AttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
}

export interface AttendanceSummary {
  studentId: number;
  studentName: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export async function fetchAttendance(classId: number, date: string): Promise<StudentWithAttendance[]> {
  const response = await fetch(`${API_BASE}/class/${classId}?date=${date}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch attendance');
  return response.json();
}

export async function saveAttendance(classId: number, date: string, records: AttendanceRecord[]): Promise<Attendance[]> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ date, records }),
  });
  if (!response.ok) throw new Error('Failed to save attendance');
  return response.json();
}

export async function fetchAttendanceSummary(classId: number): Promise<AttendanceSummary[]> {
  const response = await fetch(`${API_BASE}/class/${classId}/summary`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch attendance summary');
  return response.json();
}
