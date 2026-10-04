// R1 skills shelf (docs/32): chips in the briefing that fill the situation text with a short
// template naming the person, and suggest a goal. Filling never starts a draft or a call.

export const skillIds = ["ask", "say-no", "boundary", "feedback", "apologize", "repair", "share"] as const;
export type SkillId = (typeof skillIds)[number];

type SkillTemplate = {
  label: string;
  situation: (name: string) => string;
  goal: (name: string) => string;
};

export const skillTemplates: Record<SkillId, SkillTemplate> = {
  ask: {
    label: "Ask for something",
    situation: (name) => `I want to ask ${name} for ___ because ___.`,
    goal: () => "Make one clear request.",
  },
  "say-no": {
    label: "Say no",
    situation: (name) => `I need to say no to ${name} when they ask me to ___.`,
    goal: () => "Say no clearly, without over-explaining.",
  },
  boundary: {
    label: "Set a boundary",
    situation: (name) => `I want ${name} to stop ___. It matters to me because ___.`,
    goal: () => "Name the boundary and what I'll do.",
  },
  feedback: {
    label: "Give feedback",
    situation: (name) => `I want to tell ${name} that ___ isn't working for me, and ask for ___ instead.`,
    goal: () => "Describe one thing and ask for one change.",
  },
  apologize: {
    label: "Apologize",
    situation: (name) => `I want to apologize to ${name} for ___.`,
    goal: () => "Own what I did without making excuses.",
  },
  repair: {
    label: "Repair after a fight",
    situation: (name) => `${name} and I argued about ___. I want to reconnect and talk about it calmly.`,
    goal: () => "Reopen the conversation and listen first.",
  },
  share: {
    label: "Share something personal",
    situation: (name) => `I want to tell ${name} that ___.`,
    goal: () => "Say it plainly and give them room to respond.",
  },
};

// The person's name, or a neutral stand-in for someone new without one.
export function skillSubject(name: string | undefined): string {
  return name?.trim() || "them";
}

export function skillSituation(id: SkillId, name: string | undefined): string {
  const text = skillTemplates[id].situation(skillSubject(name));
  // "them and I argued…" reads badly; capitalize only the stand-in at the start of a sentence.
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

// What a skill chip does: fills the situation, and suggests a goal only when the user has none.
// Pure: the caller decides where each value goes (situation to the briefing draft, goal to private state).
export function applySkill(id: SkillId, name: string | undefined, currentGoal: string): { situation: string; goal: string } {
  return {
    situation: skillSituation(id, name),
    goal: currentGoal.trim() ? currentGoal : skillTemplates[id].goal(skillSubject(name)),
  };
}
