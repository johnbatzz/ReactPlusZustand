import { getStudentAuthHeaders } from './studentAuth';

const API_BASE = '/api/student';

export interface StudentGrades {
  className: string;
  section: string | null;
  weights: {
    attendanceWeight: number;
    quizWeight: number;
    examWeight: number;
  };
  attendance: {
    grade: number;
    total: number;
    present: number;
  };
  quizzes: {
    grade: number;
    details: {
      name: string;
      score: number;
      maxScore: number;
      percentage: number;
    }[];
  };
  exams: {
    grade: number;
    details: {
      name: string;
      score: number;
      maxScore: number;
      percentage: number;
    }[];
  };
  finalGrade: number;
  letterGrade: string;
}

export async function fetchStudentGrades(): Promise<StudentGrades> {
  const response = await fetch(`${API_BASE}/grades`, {
    headers: { ...getStudentAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch grades');
  return response.json();
}
