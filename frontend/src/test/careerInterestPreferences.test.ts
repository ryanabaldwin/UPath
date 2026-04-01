import { describe, it, expect } from "vitest";
import {
  mergeInterestsWithCareerAreas,
  parseCareerAreasFromInterests,
} from "@/lib/careerInterestPreferences";

describe("careerInterestPreferences", () => {
  it("parseCareerAreasFromInterests keeps only known area labels", () => {
    expect(parseCareerAreasFromInterests(null)).toEqual([]);
    expect(parseCareerAreasFromInterests("")).toEqual([]);
    expect(parseCareerAreasFromInterests("Technology, Healthcare")).toEqual(["Technology", "Healthcare"]);
    expect(parseCareerAreasFromInterests("Technology, I love marine biology")).toEqual(["Technology"]);
  });

  it("mergeInterestsWithCareerAreas orders areas like onboarding and preserves free-text tokens", () => {
    expect(
      mergeInterestsWithCareerAreas(["Healthcare", "Technology"], "Technology, I love marine biology")
    ).toBe("Technology, Healthcare, I love marine biology");

    expect(mergeInterestsWithCareerAreas([], "Arts & Creative, note here")).toBe("note here");

    expect(mergeInterestsWithCareerAreas(["Education"], null)).toBe("Education");
  });
});
