const SENSITIVE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN-like
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // email
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // phone
];

const BLOCKED_PATTERNS = [
  /\bhow to (?:make|build)\s+(?:a\s+)?bomb\b/i,
  /\bsuicide method\b/i,
];

export function redactSensitiveContent(content) {
  if (!content) return "";
  let redacted = content;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

export function moderateContent(content) {
  const text = String(content ?? "");
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: "This topic is unsafe for this student app.",
        safeResponse:
          "I can’t help with harmful requests. If you are feeling unsafe or overwhelmed, talk to a trusted adult, counselor, or emergency services right now.",
      };
    }
  }
  return { allowed: true };
}
