import type { RoleContext } from "@/lib/schemas/role-context";
// W2 hero starter. Stance chips are the defaults from docs/next/04-NEW-SPECS.md W2; the goal and hard-moment line are client suggestions only.
export const manager: RoleContext = {
  name: "Jordan",
  role: "Your manager",
  style: "Busy and fair. Protective of the team. Talks in short, practical sentences.",
  publicContext: "You've taken on more than you can do well and want to ask Jordan to move one project off your plate. Jordan is planning a launch and is short on people.",
  opening: "Hey, you wanted to chat? I've got about ten minutes before planning.",
  constraints: ["Keep it about this week's work.", "Do not bring up performance reviews."],
  challenge: "mild_pushback",
  pace: "conversational",
  wants: "Keep the launch on track",
  holdsBackBecause: "Worried the team falls behind",
  softensWhen: "You say what to drop",
};
