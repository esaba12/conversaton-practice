import type { SessionPreset } from "@/lib/schemas/situation";

// The four stock faces and premade voices. Names only; the server maps each id.
export const LOOKS: { id: SessionPreset; name: string; label: string }[] = [
  { id: "roommate", name: "Alex", label: "Alex’s look and voice" },
  { id: "professor", name: "Ellis", label: "Ellis’s look and voice" },
  { id: "decline", name: "Sam", label: "Sam’s look and voice" },
  { id: "manager", name: "Jordan", label: "Jordan’s look and voice" },
];
