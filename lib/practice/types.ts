// Types the workspace shell and the stage components share. Moved out of
// app/practice/practice-workspace.tsx unchanged (W1).

import type { Person } from "@/lib/schemas/people";
import type { Reflection } from "@/lib/schemas/reflection";
import type { RoleContext } from "@/lib/schemas/role-context";
import type { EndReason, PracticeSession } from "@/lib/schemas/session";

export type Cleanup = { state: "closing" } | { state: "closed"; cleanup: PracticeSession["cleanup"] } | { state: "unreachable" };
export type CleanupTarget = { id: string; reason: EndReason };

// What the call started from, so End can offer an explicit save. Never includes goal or private notes.
export type CallOrigin = { kind: "role"; role: RoleContext } | { kind: "person"; person: Person };

export type SaveOffer = { open: boolean; saving: boolean; saved: { id: string; name: string; updated: boolean } | null; error: string };
export const closedOffer: SaveOffer = { open: false, saving: false, saved: null, error: "" };

export const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

// Reflection is per attempt and in memory only. goal is the user's reviewed goal; saved-person calls have none.
export type ReflectState = { sessionId: string | null; goal: string; selfReflection: string; pending: boolean; reflection: Reflection | null; error: { message: string; retry: boolean } | null };
export const closedReflect: ReflectState = { sessionId: null, goal: "", selfReflection: "", pending: false, reflection: null, error: null };
