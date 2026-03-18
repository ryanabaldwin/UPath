function buildStep(label, weekOffset, hours, cost, proof) {
  return {
    id: `step-${weekOffset}-${Math.random().toString(36).slice(2, 7)}`,
    week: `Week ${weekOffset}`,
    label,
    estimated_hours: hours,
    estimated_cost_usd: cost,
    proof_of_completion: proof,
  };
}

export function buildGoalPath(selectedPath, profile) {
  const title = selectedPath || "Career Path";
  const longTermGoal = `In 1-3 years, begin your path in ${title} with a portfolio/resume that proves your readiness.`;
  const shortTermGoals = [
    `Complete one beginner training milestone in ${title}`,
    "Create one real-world project or experience example",
    "Prepare and submit 2 relevant applications",
  ];

  const weeklySteps = [
    buildStep(`Research local and online ${title} programs`, 1, 2, 0, "Saved list of 3 program options"),
    buildStep("Pick one track and build your weekly schedule", 2, 2, 0, "Weekly calendar screenshot"),
    buildStep("Complete first module and take notes", 3, 4, 0, "Certificate/progress screenshot"),
    buildStep("Create one small project aligned to this path", 4, 5, 20, "Project link or photo"),
    buildStep("Draft resume and ask mentor/adult for review", 5, 3, 0, "Resume v1 + feedback notes"),
    buildStep("Submit first application and reflect", 6, 2, 0, "Application confirmation"),
  ];

  const constraints = profile?.constraints ?? [];
  const barrierSupports = [];
  if (constraints.includes("cost_sensitive")) {
    barrierSupports.push("Prioritize free/low-cost programs and scholarship-first search.");
  }
  if (constraints.includes("limited_time")) {
    barrierSupports.push("Use 3 x 30-minute sessions weekly instead of long sessions.");
  }
  if (barrierSupports.length === 0) {
    barrierSupports.push("Keep a realistic weekly cadence and ask a mentor for accountability.");
  }

  return {
    selected_path: title,
    long_term_goal: longTermGoal,
    short_term_goals: shortTermGoals,
    weekly_steps: weeklySteps,
    alternates: {
      fast_entry: `Start with entry roles in ${title} after short training while building experience.`,
      higher_ceiling: `Pursue deeper credentials in ${title} for long-term growth and leadership.`,
    },
    barrier_supports: barrierSupports,
  };
}

export function deriveNextStep(goalPath) {
  const first = goalPath?.weekly_steps?.[0];
  if (!first) return null;
  return {
    label: first.label,
    week: first.week,
    estimated_hours: first.estimated_hours,
    estimated_cost_usd: first.estimated_cost_usd,
  };
}
