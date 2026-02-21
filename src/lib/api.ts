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

export function fetchUser(id: string) {
  return getJson<User>(`/api/users/${id}`);
}

export interface UserProgressWithGoal {
  id: string;
  goal_id: string;
  goal_title: string | null;
  milestone1: string | null;
  milestone2: string | null;
  milestone_n: string | null;
  milestone1_is_complete: boolean;
  milestone2_is_complete: boolean;
  milestone_n_is_complete: boolean;
}

export function fetchUserProgress(userId: string) {
  return getJson<UserProgressWithGoal[]>(`/api/users/${userId}/progress`);
}

export interface Meeting {
  mentor_id: number;
  mentee_id: string;
  time: string;
  meetingstatus: string;
  mentor_first: string;
  mentor_last: string;
  specialty: string | null;
}

export function fetchUserMeetings(userId: string) {
  return getJson<Meeting[]>(`/api/users/${userId}/meetings`);
}

export function patchUserGoal(userId: string, goalId: number) {
  return patchJson<{ id: string; goal_id: number }>(`/api/users/${userId}/goal`, { goal_id: goalId });
}

export function createUserProgress(userId: string, goalId: number) {
  return postJson<ProgressStatus>(`/api/users/${userId}/progress`, { goal_id: goalId });
}

export interface ProgressUpdate {
  milestone1_is_complete?: boolean;
  milestone2_is_complete?: boolean;
  milestone_n_is_complete?: boolean;
}

export function patchProgress(userId: string, goalId: number, body: ProgressUpdate) {
  return patchJson<ProgressStatus>(`/api/progress/${userId}/${goalId}`, body);
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
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

export function fetchMentors() {
  return getJson<Mentor[]>("/api/mentors");
}

export function bookMentor(mentorId: number, menteeId: string): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>(`/api/mentors/${mentorId}/book`, {
    mentee_id: menteeId,
  });
}

export interface StudentPreferences {
  user_id: string;
  interests: string | null;
  selected_career_paths: string[];
  updated_at: string | null;
}

export function fetchUserPreferences(userId: string) {
  return getJson<StudentPreferences>(`/api/users/${userId}/preferences`);
}

export function putUserPreferences(
  userId: string,
  data: { interests?: string | null; selected_career_paths?: string[] }
) {
  return fetch(`${API_BASE_URL}/api/users/${userId}/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(async (r) => {
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error((data as { error?: string })?.error ?? `Request failed: ${r.status}`);
    }
    return r.json() as Promise<StudentPreferences>;
  });
}

export interface Resource {
  resource_id: number;
  title: string;
  description: string | null;
  category: string;
  link: string | null;
}

export function fetchResources(category?: string) {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  return getJson<Resource[]>(`/api/resources${q}`);
}

export function fetchUserBookmarks(userId: string) {
  return getJson<Resource[]>(`/api/users/${userId}/bookmarks`);
}

export function addBookmark(userId: string, resourceId: number) {
  return postJson<{ ok: boolean }>(`/api/users/${userId}/bookmarks`, { resource_id: resourceId });
}

export async function removeBookmark(userId: string, resourceId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/bookmarks/${resourceId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? `Request failed: ${response.status}`);
  }
}

export async function unbookMentor(mentorId: number, menteeId: string): Promise<{ ok: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/mentors/${mentorId}/book`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mentee_id: menteeId }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string })?.error ?? `API request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<{ ok: boolean }>;
}
