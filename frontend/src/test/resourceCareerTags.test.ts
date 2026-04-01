import { describe, it, expect } from "vitest";
import { resourceCareerTags, resourceMatchesCareerFilter } from "@/lib/resourceCareerTags";

describe("resourceCareerTags", () => {
  it("collects industry and career_areas when they match known labels", () => {
    expect(resourceCareerTags({ industry: "Technology" })).toEqual(["Technology"]);
    expect(resourceCareerTags({ career_areas: ["Healthcare", "Education"] })).toEqual(["Healthcare", "Education"]);
    expect(resourceCareerTags({ industry: "Technology", career_areas: ["Technology"] })).toEqual(["Technology"]);
  });

  it("ignores unknown strings", () => {
    expect(resourceCareerTags({ industry: "Unknown sector" })).toEqual([]);
  });
});

describe("resourceMatchesCareerFilter", () => {
  it("shows all when nothing selected", () => {
    expect(resourceMatchesCareerFilter({ industry: "Healthcare" }, [])).toBe(true);
  });

  it("matches industry to selection", () => {
    expect(resourceMatchesCareerFilter({ industry: "Healthcare" }, ["Healthcare"])).toBe(true);
    expect(resourceMatchesCareerFilter({ industry: "Healthcare" }, ["Technology"])).toBe(false);
  });

  it("treats untagged resources as visible when filtering", () => {
    expect(resourceMatchesCareerFilter({ industry: null }, ["Technology"])).toBe(true);
  });

  it("filters mock-style career_areas", () => {
    expect(
      resourceMatchesCareerFilter({ career_areas: ["Business & Finance", "Social Impact"] }, ["Social Impact"])
    ).toBe(true);
  });
});
