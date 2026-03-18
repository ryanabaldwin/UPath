const PATH_CATALOG = [
  {
    title: "Software Development",
    emoji: "💻",
    tags: ["coding", "software", "javascript", "build", "problem", "logic"],
    tradeoffs: "Great growth and pay potential, but requires steady practice and project work.",
    education: "Bootcamp, associate, or bachelor's",
    time_to_entry: "6 months - 4 years",
    salary_range: "$70K - $150K+",
  },
  {
    title: "Healthcare",
    emoji: "🩺",
    tags: ["health", "care", "people", "biology", "service"],
    tradeoffs: "Strong job demand and impact, but training/licensing can take time.",
    education: "Certificate, associate, or bachelor's",
    time_to_entry: "1 - 6 years",
    salary_range: "$45K - $120K+",
  },
  {
    title: "Business & Entrepreneurship",
    emoji: "🚀",
    tags: ["business", "marketing", "sales", "leadership", "startup"],
    tradeoffs: "High upside and flexibility, but income can vary early on.",
    education: "Self-taught, associate, or bachelor's",
    time_to_entry: "Anytime",
    salary_range: "$50K - $130K+",
  },
  {
    title: "Computer Engineering",
    emoji: "🛠️",
    tags: ["hardware", "engineering", "build", "systems", "electronics"],
    tradeoffs: "Hands-on technical path with strong demand, but math depth is important.",
    education: "Associate or bachelor's",
    time_to_entry: "2 - 4 years",
    salary_range: "$65K - $140K+",
  },
  {
    title: "Product Management",
    emoji: "📈",
    tags: ["leadership", "strategy", "communication", "product", "planning"],
    tradeoffs: "Cross-functional influence and growth, but requires communication and ownership.",
    education: "Varies by company",
    time_to_entry: "1 - 4 years",
    salary_range: "$60K - $150K+",
  },
];

function scorePath(profile, path, intent = "default") {
  const interests = profile?.interests ?? [];
  const values = profile?.values ?? [];
  const constraints = profile?.constraints ?? [];
  const preferences = profile?.preferences ?? {};

  let score = 45;
  const matchedTags = [];

  for (const interest of interests) {
    const hit = path.tags.find((tag) => interest.includes(tag) || tag.includes(interest));
    if (hit) {
      score += 10;
      matchedTags.push(hit);
    }
  }

  if (values.includes("service") && path.title === "Healthcare") score += 12;
  if (values.includes("creation") && ["Software Development", "Computer Engineering"].includes(path.title)) score += 10;
  if (preferences.income_pace === "fast" && path.title === "Business & Entrepreneurship") score += 8;
  if (constraints.includes("cost_sensitive")) score -= 4;

  if (intent === "surprise") score += Math.floor(Math.random() * 10);
  if (intent === "more-like-this" && path.title === "Software Development") score += 8;
  if (intent === "less-like-this" && path.title === "Software Development") score -= 15;

  const bounded = Math.max(35, Math.min(score, 98));
  return {
    score: bounded,
    reasons: [
      matchedTags.length ? `Matches your interests in ${matchedTags.slice(0, 3).join(", ")}` : "Matches your exploration profile",
      `Education path: ${path.education}`,
    ],
    what_to_verify: [
      "Local training options near you",
      "Real entry-level requirements in current job postings",
      "Cost and aid options for this pathway",
    ],
  };
}

export function buildRecommendations(profile, intent = "default") {
  const ranked = PATH_CATALOG.map((path) => {
    const scored = scorePath(profile, path, intent);
    return {
      path_title: path.title,
      emoji: path.emoji,
      confidence: scored.score,
      reasons: scored.reasons,
      tradeoffs: path.tradeoffs,
      what_to_verify: scored.what_to_verify,
      stats: {
        salary_range: path.salary_range,
        education: path.education,
        time_to_entry: path.time_to_entry,
      },
    };
  }).sort((a, b) => b.confidence - a.confidence);

  return ranked;
}
