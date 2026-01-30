import { getAuthHeaders } from './auth';

const API_BASE = '/api/activities';

export interface Activity {
  id: number;
  name: string;
  classId: number;
  maxScore: number;
  date: string;
  createdAt: string;
  _count?: { scores: number };
}

export interface StudentWithScore {
  id: number;
  studentId: string;
  name: string;
  score: number | null;
}

export interface ActivityWithStudents {
  id: number;
  name: string;
  maxScore: number;
  date: string;
  class: {
    id: number;
    name: string;
    section: string | null;
  };
  students: StudentWithScore[];
}

export async function fetchActivities(classId: number): Promise<Activity[]> {
  const response = await fetch(`${API_BASE}/class/${classId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch activities');
  return response.json();
}

export async function fetchActivity(activityId: number): Promise<ActivityWithStudents> {
  const response = await fetch(`${API_BASE}/${activityId}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error('Failed to fetch activity');
  return response.json();
}

export async function createActivity(data: {
  classId: number;
  name: string;
  maxScore: number;
  date?: string;
}): Promise<Activity> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create activity');
  }
  return response.json();
}

export async function updateActivity(
  activityId: number,
  data: { name?: string; maxScore?: number; date?: string }
): Promise<Activity> {
  const response = await fetch(`${API_BASE}/${activityId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update activity');
  }
  return response.json();
}

export async function deleteActivity(activityId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${activityId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete activity');
  }
}

export async function saveActivityScores(
  activityId: number,
  scores: { studentId: number; score: number | null }[]
): Promise<void> {
  const response = await fetch(`${API_BASE}/${activityId}/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ scores }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save scores');
  }
}
