const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export interface Goal {
  goal_id: string;
  title: string;
  milestone1: string | null;
  milestone2: string | null;
  milestone_n: string | null;
  image1_src: string | null;
  image_n_src: string | null;
}

export interface User {
  id: string;
  user_first: string;
  user_last: string;
  user_region: string | null;
  goal_id: string | null;
  user_img_src: string | null;
  goal_title: string | null;
}

export interface ProgressStatus {
  id: string;
  goal_id: string;
  milestone1_is_complete: boolean;
  milestone2_is_complete: boolean;
  milestone_n_is_complete: boolean;
}

export interface Mentor {
  mentor_id: number;
  mentor_first: string;
  mentor_last: string;
  mentor_region: string | null;
  mentor_img_src: string | null;
  specialty: string | null;
  description: string | null;
  is_available: boolean;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string })?.error ?? `API request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchHealth() {
  return getJson<{ ok: boolean; service: string; dbTime: string }>("/api/health");
}

export function fetchUsers() {
  return getJson<User[]>("/api/users");
}

export function fetchGoals() {
  return getJson<Goal[]>("/api/goals");
}

export function fetchProgress() {
  return getJson<ProgressStatus[]>("/api/progress");
}

export function fetchMentors() {
  return getJson<Mentor[]>("/api/mentors");
}

export function bookMentor(mentorId: number, menteeId?: string): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>(`/api/mentors/${mentorId}/book`, {
    mentee_id: menteeId ?? undefined,
  });
}

export async function unbookMentor(mentorId: number, menteeId?: string): Promise<{ ok: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/mentors/${mentorId}/book`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mentee_id: menteeId ?? undefined }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string })?.error ?? `API request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<{ ok: boolean }>;
}
