import { describe, it, expect } from "vitest";
import {
  getPatterns,
  getAgeContent,
  getEthnicityContent,
  getEnvParagraph,
  getHistoryParagraph,
  getAgeInsight,
  getEthnicityInsight,
} from "./report-content";

describe("getPatterns", () => {
  it("returns the skinny pattern set for 'Skinny'", () => {
    const p = getPatterns("Skinny");
    expect(p.p1t).toMatch(/Training harder/i);
    expect(p.p2t).toMatch(/clothes/i);
  });

  it("returns the skinny-fat set for 'Skinny-fat'", () => {
    const p = getPatterns("Skinny-fat");
    expect(p.p1t).toMatch(/gaining fat and losing muscle/i);
    expect(p.p2t).toMatch(/waist/i);
  });

  it("returns the overweight set for 'Overweight'", () => {
    const p = getPatterns("Overweight");
    expect(p.p1t).toMatch(/Where fat sits/i);
    expect(p.p2t).toMatch(/Visceral fat/i);
  });

  it("falls back to the 'Average' set for unknown morphology", () => {
    const p = getPatterns("anything else");
    expect(p.p1t).toMatch(/Average is invisible/i);
  });

  it("is case-insensitive on the morphology key", () => {
    expect(getPatterns("skinny").p1t).toBe(getPatterns("SKINNY").p1t);
    expect(getPatterns("Skinny-Fat").p1t).toBe(getPatterns("skinny-fat").p1t);
  });

  it("always returns all 8 pattern fields populated", () => {
    for (const m of ["Skinny", "Skinny-fat", "Overweight", "Average", ""]) {
      const p = getPatterns(m);
      for (const k of ["p1t", "p1b", "p2t", "p2b", "p3t", "p3b", "p4t", "p4b"] as const) {
        expect(p[k]).toBeTruthy();
        expect(p[k].length).toBeGreaterThan(20);
      }
    }
  });
});

describe("getAgeContent / getAgeInsight", () => {
  it("returns content for each canonical age bracket", () => {
    for (const b of ["20–29", "30–39", "40–49", "50+"]) {
      const c = getAgeContent(b);
      expect(c).not.toBeNull();
      expect(c!.title.length).toBeGreaterThan(10);
      expect(c!.body.length).toBeGreaterThan(50);
    }
  });

  it("returns null for unknown bracket", () => {
    expect(getAgeContent("60+")).toBeNull();
    expect(getAgeContent("")).toBeNull();
  });

  it("getAgeInsight wraps content in HTML for known bracket, '' for unknown", () => {
    expect(getAgeInsight("30–39")).toContain('class="insight"');
    expect(getAgeInsight("30–39")).toContain('class="insight-title"');
    expect(getAgeInsight("unknown")).toBe("");
  });
});

describe("getEthnicityContent / getEthnicityInsight", () => {
  it("returns content for all 6 canonical ethnicities", () => {
    const eths = ["Caucasian", "Black", "Asian (East / SE)", "South Asian", "Hispanic-Latino", "MENA"];
    for (const e of eths) {
      const c = getEthnicityContent(e);
      expect(c).not.toBeNull();
      expect(c!.title.length).toBeGreaterThan(10);
    }
  });

  it("returns null for unknown ethnicity", () => {
    expect(getEthnicityContent("Other")).toBeNull();
    expect(getEthnicityContent("Prefer not to say")).toBeNull();
  });

  it("getEthnicityInsight returns HTML for known, '' for unknown", () => {
    expect(getEthnicityInsight("Black")).toContain('class="insight"');
    expect(getEthnicityInsight("Other")).toBe("");
  });
});

describe("getEnvParagraph", () => {
  it("returns environment-specific paragraph for each canonical env", () => {
    const envs = [
      "Corporate", "Entrepreneur / Startup", "Manual / Trade work",
      "Student", "Creative / Freelance", "Medical / Healthcare",
    ];
    const seen = new Set<string>();
    for (const e of envs) {
      const p = getEnvParagraph(e);
      expect(p.length).toBeGreaterThan(80);
      seen.add(p);
    }
    // All 6 canonical envs should produce distinct text.
    expect(seen.size).toBe(envs.length);
  });

  it("returns a fallback paragraph for unknown env", () => {
    const fallback = getEnvParagraph("Other");
    expect(fallback).toMatch(/Your environment/i);
    expect(fallback.length).toBeGreaterThan(80);
  });
});

describe("getHistoryParagraph", () => {
  it("matches the 'nothing' case for string input", () => {
    expect(getHistoryParagraph("Nothing yet")).toMatch(/Starting from zero/i);
  });

  it("matches the 'personal trainer' case", () => {
    expect(getHistoryParagraph("Personal trainer")).toMatch(/trainer certifications/i);
  });

  it("matches the 'youtube' case", () => {
    expect(getHistoryParagraph("YouTube advice")).toMatch(/YouTube is optimized/i);
  });

  it("matches the 'diet' case", () => {
    expect(getHistoryParagraph("A strict diet")).toMatch(/Diets produce weight changes/i);
  });

  it("matches the 'surgery' case", () => {
    expect(getHistoryParagraph("Surgery or medical procedures")).toMatch(/Medical interventions/i);
  });

  it("returns generic fallback for empty / unknown input", () => {
    expect(getHistoryParagraph("")).toMatch(/What you've tried/i);
    expect(getHistoryParagraph("something obscure")).toMatch(/What you've tried/i);
  });

  it("accepts array input and matches the first applicable case", () => {
    // priority order in the code: nothing > pt > youtube > diet > surgery
    expect(getHistoryParagraph(["YouTube advice", "A strict diet"])).toMatch(/YouTube is optimized/i);
    expect(getHistoryParagraph(["A strict diet"])).toMatch(/Diets produce weight changes/i);
    expect(getHistoryParagraph(["Nothing yet", "Personal trainer"])).toMatch(/Starting from zero/i);
  });

  it("handles null/undefined input safely", () => {
    expect(getHistoryParagraph(null)).toMatch(/What you've tried/i);
    expect(getHistoryParagraph(undefined)).toMatch(/What you've tried/i);
  });
});
