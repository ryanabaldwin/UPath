import { coachReply } from "./profile.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
const PROVIDER = (process.env.AI_COACH_PROVIDER || "heuristic").toLowerCase();
const REQUEST_TIMEOUT_MS = Math.max(1000, Number(process.env.AI_COACH_TIMEOUT_MS || 12000));
const MAX_RETRIES = Math.max(0, Number(process.env.AI_COACH_MAX_RETRIES || 1));

// Tool definitions passed to OpenRouter for structured action detection.
const COACH_TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_milestones",
      description:
        "Call this when the student commits to a career path and wants a step-by-step plan generated for their dashboard.",
      parameters: {
        type: "object",
        properties: {
          career_path: {
            type: "string",
            description: "The career or field the student has chosen (e.g. 'Software Development', 'Nursing').",
          },
          urgency: {
            type: "string",
            enum: ["fast", "steady", "long_term"],
            description: "How quickly the student wants to start.",
          },
        },
        required: ["career_path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_mentors",
      description:
        "Call this when the student asks to connect with a mentor or find someone in a specific field.",
      parameters: {
        type: "object",
        properties: {
          specialty_hint: {
            type: "string",
            description: "A keyword or specialty to filter mentors (e.g. 'nursing', 'engineering', 'finance').",
          },
        },
        required: [],
      },
    },
  },
];

// Keyword patterns for heuristic action detection (used when AI provider is not OpenRouter).
const MILESTONE_INTENT_PATTERN =
  /\b(make|build|create|generate|set up|give me|show me|start|begin)\s+(my\s+)?(plan|roadmap|goals?|milestones?|steps?|path)\b/i;
const COMMIT_TO_PATH_PATTERN =
  /\b(i want to be|i choose|let's go with|i'll do|i'm going with|sign me up for|create a plan for)\b/i;
const MENTOR_INTENT_PATTERN =
  /\b(find|show|get|connect with|i need|looking for|want to meet)\s+(a\s+)?(mentor|coach|advisor|someone in)\b/i;

/**
 * Detect action intent from a student message without LLM (heuristic mode).
 * Returns null or an actions object.
 */
function detectHeuristicActions(message) {
  const wantsPath = MILESTONE_INTENT_PATTERN.test(message) || COMMIT_TO_PATH_PATTERN.test(message);
  const wantsMentor = MENTOR_INTENT_PATTERN.test(message);

  if (!wantsPath && !wantsMentor) return null;

  const actions = {};
  if (wantsPath) {
    // Extract a rough career keyword from the message
    const careerMatch = message.match(/(?:for|in|about|doing|become|as a|as an)\s+([a-zA-Z\s]{3,40}?)(?:\?|$|\.|\s+and\s|\s+or\s)/i);
    actions.generate_milestones = {
      career_path: careerMatch?.[1]?.trim() ?? "",
      urgency: /fast|soon|quickly|asap|right now/i.test(message) ? "fast" : "steady",
    };
  }
  if (wantsMentor) {
    const specialtyMatch = message.match(/(?:mentor|coach|advisor|someone)\s+(?:in|for|who does|who knows)\s+([a-zA-Z\s]{3,40}?)(?:\?|$|\.)/i);
    actions.show_mentors = {
      specialty_hint: specialtyMatch?.[1]?.trim() ?? "",
    };
  }
  return actions;
}

function extractAssistantContent(payload) {
  const messageContent = payload?.choices?.[0]?.message?.content;
  if (typeof messageContent === "string") {
    return messageContent.trim();
  }
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((chunk) => (typeof chunk?.text === "string" ? chunk.text : ""))
      .join(" ")
      .trim();
  }
  return "";
}

function extractToolCallActions(payload) {
  const toolCalls = payload?.choices?.[0]?.message?.tool_calls;
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;
  const actions = {};
  for (const tc of toolCalls) {
    const name = tc?.function?.name;
    let args = {};
    try {
      args = JSON.parse(tc?.function?.arguments ?? "{}");
    } catch {
      args = {};
    }
    if (name === "generate_milestones" || name === "show_mentors") {
      actions[name] = args;
    }
  }
  return Object.keys(actions).length > 0 ? actions : null;
}

async function callOpenRouter(messages, useTools = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const body = {
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages,
    };
    if (useTools) {
      body.tools = COACH_TOOLS;
      body.tool_choice = "auto";
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`OpenRouter ${response.status}: ${errBody.slice(0, 140)}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generate a coach reply for a student message.
 *
 * Returns: { assistantMessage, actions, meta }
 *   actions: { generate_milestones?: { career_path, urgency }, show_mentors?: { specialty_hint } } | null
 */
export async function generateCoachReply(profile, studentMessage) {
  const startedAt = Date.now();
  const shouldUseOpenRouter = PROVIDER === "openrouter" && Boolean(process.env.OPENROUTER_API_KEY);

  if (!shouldUseOpenRouter) {
    const actions = detectHeuristicActions(studentMessage);
    return {
      assistantMessage: coachReply(profile),
      actions,
      meta: {
        provider: "heuristic",
        model: "ruleset-v1",
        retries: 0,
        fallback_used: false,
        latency_ms: Date.now() - startedAt,
      },
    };
  }

  const systemPrompt =
    "You are a trauma-informed, empathetic career exploration coach for first-generation students. " +
    "Ask one focused follow-up question per turn, keep tone supportive, and avoid definitive promises. " +
    "When the student clearly commits to a specific career path and wants a plan, call generate_milestones. " +
    "When the student asks to find or connect with a mentor, call show_mentors.";
  const userPrompt = `Student profile JSON: ${JSON.stringify(profile)}\n\nLatest student message: ${studentMessage}`;
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const payload = await callOpenRouter(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        true
      );

      const toolActions = extractToolCallActions(payload);
      const assistantMessage = extractAssistantContent(payload) || coachReply(profile);

      return {
        assistantMessage,
        actions: toolActions,
        meta: {
          provider: "openrouter",
          model: DEFAULT_MODEL,
          retries,
          fallback_used: false,
          latency_ms: Date.now() - startedAt,
        },
      };
    } catch (error) {
      retries += 1;
      if (retries > MAX_RETRIES) {
        const actions = detectHeuristicActions(studentMessage);
        return {
          assistantMessage: coachReply(profile),
          actions,
          meta: {
            provider: "openrouter",
            model: DEFAULT_MODEL,
            retries: retries - 1,
            fallback_used: true,
            fallback_reason: String(error?.message || "unknown_error"),
            latency_ms: Date.now() - startedAt,
          },
        };
      }
    }
  }

  return {
    assistantMessage: coachReply(profile),
    actions: detectHeuristicActions(studentMessage),
    meta: {
      provider: "heuristic",
      model: "ruleset-v1",
      retries: 0,
      fallback_used: true,
      fallback_reason: "unexpected_retry_state",
      latency_ms: Date.now() - startedAt,
    },
  };
}
