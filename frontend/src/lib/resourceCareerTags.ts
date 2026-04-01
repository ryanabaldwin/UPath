import {
  PARTICIPANT_INTEREST_OPTIONS,
  type ParticipantCareerArea,
} from "@/constants/participantInterests";

const validAreaSet = new Set<string>(PARTICIPANT_INTEREST_OPTIONS.map((o) => o.value));

/** Tags derived from API `industry` and/or mock `career_areas` (must match participant interest labels). */
export function resourceCareerTags(resource: {
  industry?: string | null;
  career_areas?: ParticipantCareerArea[];
}): ParticipantCareerArea[] {
  const tags: ParticipantCareerArea[] = [];
  const push = (raw: string) => {
    const t = raw.trim();
    if (!validAreaSet.has(t)) return;
    const area = t as ParticipantCareerArea;
    if (!tags.includes(area)) tags.push(area);
  };
  if (resource.industry) push(resource.industry);
  if (resource.career_areas?.length) {
    for (const a of resource.career_areas) push(a);
  }
  return tags;
}

/** No selection => show all. With selection => untagged resources still show; else any overlapping tag matches. */
export function resourceMatchesCareerFilter(
  resource: { industry?: string | null; career_areas?: ParticipantCareerArea[] },
  selectedAreas: ParticipantCareerArea[]
): boolean {
  if (selectedAreas.length === 0) return true;
  const tags = resourceCareerTags(resource);
  if (tags.length === 0) return true;
  return tags.some((t) => selectedAreas.includes(t));
}
