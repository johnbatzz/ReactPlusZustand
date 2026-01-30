import { getAuthHeaders } from './auth';
import type { GradeWeight } from './classes';

const API_BASE = '/api/grades';

export interface StudentGrade {
  studentId: number;
  studentName: string;
  studentNumber: string;
  attendanceGrade: number;
  quizGrade: number;
  examGrade: number;
  activityGrade: number;
  finalGrade: number;
  letterGrade: string;
  details: {
    attendanceRecords: number;
    quizzesCompleted: number;
    examsCompleted: number;
    activitiesCompleted: number;
  };
}

export interface ClassGrades {
  className: string;
  section: string | null;
  weights: GradeWeight;
  grades: StudentGrade[];
}

export interface StudentDetailedGrade {
  student: {
    id: number;
    studentId: string;
    name: string;
    email: string | null;
  };
  class: {
    id: number;
    name: string;
    section: string | null;
  };
  weights: GradeWeight;
  attendance: {
    grade: number;
    total: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
  };
  quizzes: {
    grade: number;
    details: {
      name: string;
      score: number;
      maxScore: number;
      percentage: number;
      date: string;
    }[];
  };
  exams: {
    grade: number;
    details: {
      name: string;
      score: number;
      maxScore: number;
      percentage: number;
      date: string;
    }[];
  };
  finalGrade: number;
  letterGrade: string;
}

export async function fetchClassGrades(classId: number): Promise<ClassGrades> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch grades');
  return response.json();
}

export async function fetchStudentGrades(studentId: number): Promise<StudentDetailedGrade> {
  const response = await fetch(`${API_BASE}/student/${studentId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch student grades');
  return response.json();
}

export interface WeightValues {
  attendanceWeight: number;
  quizWeight: number;
  examWeight: number;
  activityWeight: number;
}

export interface ClassGradeWeights {
  classId: number;
  className: string;
  section: string | null;
  weights: WeightValues;
}

export async function fetchClassWeights(classId: number): Promise<ClassGradeWeights> {
  const response = await fetch(`${API_BASE}/class/${classId}/weights`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch grade weights');
  return response.json();
}

export async function updateClassWeights(
  classId: number,
  weights: WeightValues
): Promise<{ message: string; weights: WeightValues }> {
  const response = await fetch(`${API_BASE}/class/${classId}/weights`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(weights),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update grade weights');
  }
  return response.json();
}
