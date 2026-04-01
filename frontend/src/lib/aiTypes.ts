export interface StudentProfileJson {
  exploration_mode?: string;
  values?: string[];
  interests?: string[];
  strengths?: string[];
  constraints?: string[];
  preferences?: Record<string, string>;
  summary?: string;
}

export interface AiProfileResponse {
  profile_json: StudentProfileJson;
  completeness: number;
  thread_id: string | null;
  has_profile?: boolean;
}

export interface AiThreadCreateResponse {
  thread_id: string;
  exploration_mode: string;
  created_at: string;
}

export interface AiMilestoneActions {
  show_milestones?: boolean;
  generated_count?: number;
  macro_id?: number;
  show_mentors?: boolean;
  mentor_ids?: number[];
}

export interface AiThreadMessageResponse {
  thread_id: string;
  assistant_message: string;
  updated_profile_json: StudentProfileJson;
  completeness: number;
  blocked: boolean;
  actions?: AiMilestoneActions;
}

export interface RecommendationMatch {
  path_title: string;
  emoji: string;
  confidence: number;
  reasons: string[];
  tradeoffs: string;
  what_to_verify: string[];
  stats: {
    salary_range: string;
    education: string;
    time_to_entry: string;
  };
}

export interface RecommendationsResponse {
  run_id: string;
  matches: RecommendationMatch[];
}

export interface GoalPathStep {
  id: string;
  week: string;
  label: string;
  estimated_hours: number;
  estimated_cost_usd: number;
  proof_of_completion: string;
}

export interface GoalPath {
  selected_path: string;
  long_term_goal: string;
  short_term_goals: string[];
  weekly_steps: GoalPathStep[];
  alternates: {
    fast_entry: string;
    higher_ceiling: string;
  };
  barrier_supports: string[];
}

export type MilestoneTier = "macro" | "checkpoint" | "domain" | "daily";
export type MilestoneCategory = "school" | "work" | "life" | "finance";
export type MilestoneStatus = "pending" | "in_progress" | "complete" | "skipped";

export interface MilestoneNode {
  id: number;
  user_id: string;
  parent_id: number | null;
  title: string;
  description: string | null;
  tier: MilestoneTier;
  category: MilestoneCategory | null;
  status: MilestoneStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  children: MilestoneNode[];
}

export type MilestoneTree = MilestoneNode[];

/** Server-computed rollups from GET /api/users/:id/milestones/tree */
export interface MilestoneTreeSummary {
  estimatedCompletionDate: string | null;
  estimatedTimeRemainingDays: number | null;
  planProgressPercent: number;
  totalDailySteps: number;
  completedDailySteps: number;
  currentQuarter: {
    label: string;
    dueDate: string | null;
    progressPercent: number;
    completedSteps: number;
    totalSteps: number;
    daysRemainingInQuarter: number | null;
  } | null;
  quarterRollups: Array<{
    label: string;
    dueDate: string | null;
    progressPercent: number;
    completedSteps: number;
    totalSteps: number;
  }>;
}

export interface NorthStarFields {
  north_star_vision?: string;
  definition_of_success?: string;
  current_grade_level?: string;
}

export interface ResourceSearchFilters {
  industry?: string;
  education_level?: string;
  format?: string;
  location?: string;
}

export interface GroundedResourceRecommendation {
  resource_id: number;
  title: string;
  description: string | null;
  category: string;
  link: string | null;
  why_this_helps: string;
  helps_step_number: number;
  eligibility: {
    education_level?: string | null;
    location?: string | null;
    estimated_cost_usd?: number | null;
    deadline_date?: string | null;
  };
}
