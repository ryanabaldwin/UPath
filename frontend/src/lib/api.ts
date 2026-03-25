import type {
  AiProfileResponse,
  AiThreadCreateResponse,
  AiThreadMessageResponse,
  GroundedResourceRecommendation,
  GoalPath,
  MilestoneNode,
  MilestoneStatus,
  MilestoneTier,
  MilestoneCategory,
  NorthStarFields,
  RecommendationsResponse,
  ResourceSearchFilters,
  StudentProfileJson,
} from "@/lib/aiTypes";

export type { MilestoneNode, MilestoneStatus, MilestoneTier, MilestoneCategory, NorthStarFields };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

interface ApiErrorPayload {
  error?: string | { code?: string; message?: string; details?: Record<string, unknown> };
}

export class ApiError extends Error {
  code?: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, options: { status: number; code?: string; details?: Record<string, unknown> }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

async function parseApiError(response: Response): Promise<ApiError> {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  if (typeof payload.error === "string") {
    return new ApiError(payload.error, { status: response.status });
  }
  return new ApiError(payload.error?.message ?? `API request failed: ${response.status}`, {
    status: response.status,
    code: payload.error?.code,
    details: payload.error?.details,
  });
}

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
  north_star_vision: string | null;
  definition_of_success: string | null;
  current_grade_level: string | null;
  streak_count: number;
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
    throw await parseApiError(response);
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
    throw await parseApiError(response);
  }
  return response.json() as Promise<T>;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await parseApiError(response);
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

export function fetchUser(id: string) {
  return getJson<User>(`/api/users/${id}`);
}

export function fetchMilestoneTree(userId: string) {
  return getJson<{ tree: MilestoneNode[] }>(`/api/users/${userId}/milestones/tree`);
}

export interface CreateMilestoneInput {
  title: string;
  tier: MilestoneTier;
  description?: string;
  category?: MilestoneCategory;
  status?: MilestoneStatus;
  due_date?: string;
  parent_id?: number;
}

export function createMilestone(userId: string, input: CreateMilestoneInput) {
  return postJson<MilestoneNode>(`/api/users/${userId}/milestones`, input);
}

export interface PatchMilestoneInput {
  title?: string;
  description?: string;
  status?: MilestoneStatus;
  due_date?: string | null;
  category?: MilestoneCategory;
}

export function patchMilestone(userId: string, milestoneId: number, input: PatchMilestoneInput) {
  return patchJson<MilestoneNode>(`/api/users/${userId}/milestones/${milestoneId}`, input);
}

export function deleteMilestone(userId: string, milestoneId: number) {
  return deleteJson<{ ok: boolean }>(`/api/users/${userId}/milestones/${milestoneId}`);
}

export function generateMilestones(userId: string, selectedPath: string) {
  return postJson<{ macro_id: number; generated_count: number }>(
    `/api/users/${userId}/milestones/generate`,
    { selected_path: selectedPath }
  );
}

export interface UpdateUserInput {
  user_first?: string;
  user_last?: string;
  user_region?: string | null;
  user_img_src?: string | null;
  north_star_vision?: string | null;
  definition_of_success?: string | null;
  current_grade_level?: string | null;
}

export function patchUser(userId: string, data: UpdateUserInput) {
  return patchJson<User>(`/api/users/${userId}`, data);
}

export function patchNorthStar(userId: string, fields: NorthStarFields) {
  return patchJson<{ id: string; north_star_vision: string | null; definition_of_success: string | null; current_grade_level: string | null; streak_count: number }>(
    `/api/users/${userId}/north-star`,
    fields
  );
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

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return response.json() as Promise<T>;
}

async function deleteJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  if (!response.ok) {
    throw await parseApiError(response);
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
      throw await parseApiError(r);
    }
    return r.json() as Promise<StudentPreferences>;
  });
}

export function createAiThread(userId: string, explorationMode: string) {
  return postJson<AiThreadCreateResponse>(`/api/users/${userId}/ai/threads`, {
    exploration_mode: explorationMode,
  });
}

export function sendAiThreadMessage(userId: string, threadId: string, message: string) {
  return postJson<AiThreadMessageResponse>(
    `/api/users/${userId}/ai/threads/${threadId}/messages`,
    { message }
  );
}

export function fetchUserProfile(userId: string) {
  return getJson<AiProfileResponse>(`/api/users/${userId}/profile`);
}

export function putUserProfile(userId: string, data: { profile_json: StudentProfileJson; completeness?: number }) {
  return putJson<AiProfileResponse>(`/api/users/${userId}/profile`, data);
}

export function createRecommendations(userId: string, body?: { intent?: string }) {
  return postJson<RecommendationsResponse>(`/api/users/${userId}/recommendations`, body ?? {});
}

export function createGoalPath(userId: string, selectedPath: string) {
  return postJson<{ goal_path_id: string; goal_path: GoalPath }>(`/api/users/${userId}/goal-paths`, {
    selected_path: selectedPath,
  });
}

export function fetchGoalPath(userId: string, goalPathId: string) {
  return getJson<{ goal_path: GoalPath }>(`/api/users/${userId}/goal-paths/${goalPathId}`);
}

export function convertGoalPathToGoal(userId: string, goalPathId: string) {
  return postJson<{ ok: boolean; macro_id: number; generated_count: number }>(
    `/api/users/${userId}/goal-paths/${goalPathId}/convert-to-goal`,
    {}
  );
}

export function fetchNextPlanStep(userId: string) {
  return getJson<{
    next_step: {
      label: string;
      week: string;
      estimated_hours: number;
      estimated_cost_usd: number;
    } | null;
  }>(`/api/users/${userId}/next-step`);
}

export function trackUserEvent(userId: string, name: string, metadata?: Record<string, unknown>) {
  return postJson<{ ok: boolean }>(`/api/users/${userId}/events`, { name, metadata: metadata ?? {} });
}

export interface Resource {
  resource_id: number;
  title: string;
  description: string | null;
  category: string;
  link: string | null;
  industry?: string | null;
  education_level?: string | null;
  format?: string | null;
  location?: string | null;
  deadline_date?: string | null;
  cost_usd?: number | null;
  eligibility_notes?: string | null;
}

export function fetchResources(category?: string) {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  return getJson<Resource[]>(`/api/resources${q}`);
}

export function fetchResourcesSearch(filters: ResourceSearchFilters = {}) {
  const params = new URLSearchParams();
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.education_level) params.set("education_level", filters.education_level);
  if (filters.format) params.set("format", filters.format);
  if (filters.location) params.set("location", filters.location);
  const q = params.toString();
  return getJson<Resource[]>(`/api/resources/search${q ? `?${q}` : ""}`);
}

export interface Career {
  career_id: number;
  title: string;
  description: string | null;
  category: string;
  average_salary: number | null;
}

export function fetchCareers(category?: string) {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  return getJson<Career[]>(`/api/careers${q}`);
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
    throw await parseApiError(response);
  }
}

export async function unbookMentor(mentorId: number, menteeId: string): Promise<{ ok: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/mentors/${mentorId}/book`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mentee_id: menteeId }),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return response.json() as Promise<{ ok: boolean }>;
}

export interface OnboardingData {
  background: string;
  goal: string;
  interests: string[];
  challenge: string;
  weeklyTime: string;
}

export function submitOnboarding(userId: string, data: OnboardingData) {
  return putJson<{ ok: boolean }>(`/api/users/${userId}/onboarding`, data);
}

// Auth types and functions
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
}

export interface CreateAccountRequest {
  registration: RegisterRequest;
  onboarding: OnboardingData;
}

export interface AccountResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  onboardingComplete: boolean;
}

export function login(data: LoginRequest) {
  return postJson<LoginResponse>("/api/auth/login", data);
}

export function register(data: CreateAccountRequest) {
  return postJson<AccountResponse>("/api/account/register", data);
}

export function registerSimple(data: RegisterRequest) {
  return postJson<AccountResponse>("/api/account/register-simple", data);
}

export function createResourceRecommendations(
  userId: string,
  body: { goal_path_id?: string; helps_step_number?: number; selected_path?: string; filters?: ResourceSearchFilters }
) {
  return postJson<{
    citations: number[];
    recommendations: GroundedResourceRecommendation[];
  }>(`/api/users/${userId}/resource-recommendations`, body);
}
