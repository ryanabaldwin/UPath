/**
 * Milestone generation service.
 * Builds a macro → checkpoint → domain → daily hierarchy from a career path + user profile.
 */

const VALID_TIERS = ["macro", "checkpoint", "domain", "daily"];
const VALID_CATEGORIES = ["school", "work", "life", "finance"];
const VALID_STATUSES = ["pending", "in_progress", "complete", "skipped"];

export function sanitizeMilestoneInput({ title, description, tier, category, status, due_date, parent_id }) {
  const out = {};

  if (typeof title === "string") {
    out.title = title.trim().slice(0, 255);
  }
  if (typeof description === "string") {
    out.description = description.trim().slice(0, 1000) || null;
  }
  if (typeof tier === "string" && VALID_TIERS.includes(tier)) {
    out.tier = tier;
  }
  if (category != null) {
    out.category = VALID_CATEGORIES.includes(category) ? category : null;
  }
  if (typeof status === "string" && VALID_STATUSES.includes(status)) {
    out.status = status;
  }
  if (due_date != null) {
    const d = new Date(due_date);
    out.due_date = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (parent_id != null) {
    const pid = Number(parent_id);
    out.parent_id = Number.isNaN(pid) ? null : pid;
  }

  return out;
}

/**
 * Generate a hierarchical milestone tree for a user based on career path + profile.
 * Returns an array of flat row objects ready for DB insertion (parent_id is a local index reference
 * resolved by the caller after the macro/checkpoint rows are inserted first).
 */
export function buildMilestoneSpec(selectedPath, profile, northStar) {
  const path = selectedPath || "Career Path";
  const constraints = profile?.constraints ?? [];
  const isCostSensitive = constraints.includes("cost_sensitive");
  const isTimeLimited = constraints.includes("limited_time");

  // Macro (root)
  const macro = {
    title: northStar?.north_star_vision
      ? `North Star: ${northStar.north_star_vision.slice(0, 200)}`
      : `Begin my path in ${path}`,
    description: northStar?.definition_of_success
      ? `Success to me means: ${northStar.definition_of_success.slice(0, 400)}`
      : `Build the skills, experience, and network needed to enter ${path} on your own terms.`,
    tier: "macro",
    category: "work",
    status: "in_progress",
    due_date: null,
  };

  // Checkpoints
  const checkpoints = [
    {
      title: "Learn the basics",
      description: `Complete a beginner-level training or intro course in ${path}.`,
      tier: "checkpoint",
      category: "school",
      status: "pending",
      due_date: offsetDate(30),
    },
    {
      title: "Build something real",
      description: "Create one concrete project, portfolio piece, or experience example.",
      tier: "checkpoint",
      category: "work",
      status: "pending",
      due_date: offsetDate(60),
    },
    {
      title: "Apply and connect",
      description: "Submit at least two relevant applications and reach out to a mentor or contact in the field.",
      tier: "checkpoint",
      category: "work",
      status: "pending",
      due_date: offsetDate(90),
    },
  ];

  // Daily nodes per checkpoint
  const dailySets = [
    // for "Learn the basics"
    [
      { title: `Research ${path} programs (free and paid)`, category: "school" },
      { title: "Pick one track and block weekly time on your calendar", category: "school" },
      { title: isCostSensitive ? "Find 3 free or low-cost options" : "Compare 3 program options", category: "finance" },
      { title: "Complete first module and screenshot your progress", category: "school" },
    ],
    // for "Build something real"
    [
      { title: `Design a small project related to ${path}`, category: "work" },
      {
        title: isTimeLimited
          ? "Work on your project in 3 × 30-minute sessions this week"
          : "Dedicate one focused work session to your project",
        category: "work",
      },
      { title: "Get feedback from one person (mentor, teacher, or peer)", category: "life" },
    ],
    // for "Apply and connect"
    [
      { title: "Draft or update your resume", category: "work" },
      { title: "Write a short personal statement or cover letter", category: "work" },
      { title: "Submit first application", category: "work" },
      { title: "Reach out to one mentor or professional in the field", category: "life" },
    ],
  ];

  return { macro, checkpoints, dailySets };
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Assembles flat relational rows into a nested node tree.
 * @param {Array} rows - DB rows with { id, parent_id, ... }
 * @returns {Array} roots - top-level nodes with `children` arrays
 */
export function buildMilestoneTree(rows) {
  const nodeMap = new Map();
  for (const row of rows) {
    nodeMap.set(Number(row.id), { ...row, id: Number(row.id), parent_id: row.parent_id ? Number(row.parent_id) : null, children: [] });
  }
  const roots = [];
  for (const node of nodeMap.values()) {
    if (node.parent_id == null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }
  return roots;
}
