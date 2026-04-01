import {
  PARTICIPANT_INTEREST_OPTIONS,
  type ParticipantCareerArea,
} from "@/constants/participantInterests";

const validAreaSet = new Set<string>(PARTICIPANT_INTEREST_OPTIONS.map((o) => o.value));

/** Extract onboarding / Resources career-area tokens from the stored interests string. */
export function parseCareerAreasFromInterests(interests: string | null | undefined): ParticipantCareerArea[] {
  if (!interests?.trim()) return [];
  const out: ParticipantCareerArea[] = [];
  for (const raw of interests.split(",")) {
    const t = raw.trim();
    if (validAreaSet.has(t)) out.push(t as ParticipantCareerArea);
  }
  return out;
}

/**
 * Replace structured career-area tokens in `interests` with `careerAreas` (ordered like onboarding options),
 * and preserve non-area tokens (e.g. Explore free-text segments).
 */
export function mergeInterestsWithCareerAreas(
  careerAreas: ParticipantCareerArea[],
  existingInterests: string | null | undefined
): string {
  const seen = new Set<string>();
  const otherTokens: string[] = [];
  if (existingInterests?.trim()) {
    for (const raw of existingInterests.split(",")) {
      const t = raw.trim();
      if (!t) continue;
      if (validAreaSet.has(t)) continue;
      if (!seen.has(t)) {
        seen.add(t);
        otherTokens.push(t);
      }
    }
  }
  const orderedAreas = PARTICIPANT_INTEREST_OPTIONS.map((o) => o.value).filter((v) =>
    careerAreas.includes(v as ParticipantCareerArea)
  ) as ParticipantCareerArea[];
  return [...orderedAreas, ...otherTokens].join(", ");
}
