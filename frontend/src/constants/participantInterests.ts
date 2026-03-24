/** Matches onboarding step "What fields interest you?" — keep in sync with API schema. */
export const PARTICIPANT_INTEREST_OPTIONS = [
  { value: "Technology", label: "Technology", icon: "💻" },
  { value: "Healthcare", label: "Healthcare", icon: "🏥" },
  { value: "Business & Finance", label: "Business & Finance", icon: "📈" },
  { value: "Arts & Creative", label: "Arts & Creative", icon: "🎨" },
  { value: "Science & Research", label: "Science & Research", icon: "🔬" },
  { value: "Education", label: "Education", icon: "📚" },
  { value: "Social Impact", label: "Social Impact", icon: "🌍" },
  { value: "Engineering", label: "Engineering", icon: "⚙️" },
] as const;

export type ParticipantCareerArea = (typeof PARTICIPANT_INTEREST_OPTIONS)[number]["value"];
