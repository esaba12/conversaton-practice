import type { SessionPreset } from "@/lib/schemas/session";
import type { RoleContext } from "@/lib/schemas/role-context";
import { decline } from "./decline";
import { manager } from "./manager";
import { professor } from "./professor";
import { roommate } from "./roommate";

export const examples: Record<SessionPreset, { label: string; role: RoleContext; goal: string }> = {
  manager: { label: "Ask your manager to take something off your plate", role: manager, goal: "Ask to move one project to next sprint." },
  professor: { label: "Ask a professor for help", role: professor, goal: "Ask for help on one assignment." },
  roommate: { label: "Talk about a roommate issue", role: roommate, goal: "Make a clear request about sharing kitchen chores." },
  decline: { label: "Say no to a request", role: decline, goal: "Say no to covering their section." },
};
