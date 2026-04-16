export interface ProtocolSections {
  actionPlan:      string;
  dailyProtocol:   string;
  nutritionPlan:   string;
  workoutPlan:     string;
  sleepingAdvices: string;
  postureAnalysis: string;
}

const SECTION_MATCHERS: Record<keyof ProtocolSections, string[]> = {
  actionPlan:      ["action plan", "action"],
  dailyProtocol:   ["daily protocol", "daily routine"],
  nutritionPlan:   ["nutrition plan", "nutrition", "diet"],
  workoutPlan:     ["workout plan", "workout", "training plan", "training"],
  sleepingAdvices: ["sleeping advices", "sleeping advice", "sleep advice", "sleep"],
  postureAnalysis: ["posture analysis", "posture"],
};

function normaliseHeading(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s*[—–-].*$/, "")
    .trim()
    .toLowerCase();
}

function extractSection(lines: string[], startIdx: number): string {
  const result: string[] = [lines[startIdx]];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) break;
    result.push(lines[i]);
  }
  return result.join("\n").trim();
}

export function parseProtocolSections(content: string): ProtocolSections {
  const lines = content.split("\n");
  const result: ProtocolSections = {
    actionPlan:      "",
    dailyProtocol:   "",
    nutritionPlan:   "",
    workoutPlan:     "",
    sleepingAdvices: "",
    postureAnalysis: "",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^#{1,3}\s/.test(line)) continue;
    const heading = normaliseHeading(line);

    for (const [key, matchers] of Object.entries(SECTION_MATCHERS) as [keyof ProtocolSections, string[]][]) {
      if (result[key]) continue; // already found
      if (matchers.some((m) => heading.startsWith(m) || heading === m)) {
        result[key] = extractSection(lines, i);
        break;
      }
    }
  }

  return result;
}
