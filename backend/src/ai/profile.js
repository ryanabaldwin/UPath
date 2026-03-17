const MODE_PROMPTS = {
  "money-soon": "You want to start earning income soon.",
  "helping-people": "You are motivated by helping people directly.",
  building: "You enjoy building and creating things.",
  "not-sure": "You are still figuring out what fits you.",
};

function normalizeTags(text) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 4)
    )
  ).slice(0, 8);
}

export function buildInitialProfile(mode) {
  return {
    exploration_mode: mode,
    values: [],
    interests: [],
    strengths: [],
    constraints: [],
    preferences: {},
    summary: MODE_PROMPTS[mode] ?? MODE_PROMPTS["not-sure"],
  };
}

export function mergeProfileFromMessage(profile, message) {
  const next = profile ? { ...profile } : buildInitialProfile("not-sure");
  const tags = normalizeTags(message);

  if (tags.length > 0) {
    next.interests = Array.from(new Set([...(next.interests ?? []), ...tags])).slice(0, 12);
  }

  if (/\bhelp|care|people|community\b/i.test(message)) {
    next.values = Array.from(new Set([...(next.values ?? []), "service"]));
  }
  if (/\bbuild|make|design|create\b/i.test(message)) {
    next.values = Array.from(new Set([...(next.values ?? []), "creation"]));
  }
  if (/\bmoney|income|job soon|quick\b/i.test(message)) {
    next.preferences = { ...(next.preferences ?? {}), income_pace: "fast" };
  }
  if (/\bbusy|work|caregiving|family|time\b/i.test(message)) {
    next.constraints = Array.from(new Set([...(next.constraints ?? []), "limited_time"]));
  }
  if (/\bcost|expensive|tuition|afford\b/i.test(message)) {
    next.constraints = Array.from(new Set([...(next.constraints ?? []), "cost_sensitive"]));
  }

  next.summary = `You are exploring ${next.interests?.slice(0, 4).join(", ") || "new options"} with priorities around ${next.values?.join(", ") || "fit and growth"}.`;
  return next;
}

export function estimateCompleteness(profile) {
  if (!profile) return 0;
  const buckets = [
    (profile.interests?.length ?? 0) > 0,
    (profile.values?.length ?? 0) > 0,
    (profile.constraints?.length ?? 0) > 0,
    !!profile.exploration_mode,
    !!profile.summary,
  ];
  return Math.round((buckets.filter(Boolean).length / buckets.length) * 100);
}

export function coachReply(profile) {
  const mode = profile?.exploration_mode ?? "not-sure";
  const modeNudge =
    mode === "money-soon"
      ? "Would you prefer quickest entry options, even if starting pay is lower at first?"
      : mode === "helping-people"
        ? "Do you prefer one-on-one support roles or larger community impact roles?"
        : mode === "building"
          ? "Do you enjoy coding/software, hands-on hardware, or designing visual experiences?"
          : "What activities make you lose track of time when you do them?";

  return `Thanks for sharing. ${modeNudge}`;
}
