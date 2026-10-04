// Browser-memory holder for the parts of a practice that are the user's alone
// (docs/next/04-NEW-SPECS.md W1 and W4, docs/30 step 1).
//
// Nothing here is persisted, logged, or added to a request body: not the draft body,
// not any start body, not reflection. The counterpart never receives any of it.
// One `clear()` is called on a new setup, sign-out, auth loss and page hide.

export type PrivateState = {
  // What the user wants to walk out with. Reflection metadata only.
  goal: string;
  // docs/30: the one line the user plans for the hard moment.
  hardMomentLine: string;
  // W4: what the user is worried the counterpart will say.
  prediction: string;
  // W4: 0–100, the user's own numbers. Null until they answer.
  likelihoodBefore: number | null;
  likelihoodAfter: number | null;
};

const empty: PrivateState = {
  goal: "",
  hardMomentLine: "",
  prediction: "",
  likelihoodBefore: null,
  likelihoodAfter: null,
};

let current: PrivateState = { ...empty };
const listeners = new Set<() => void>();

function announce() {
  for (const listener of [...listeners]) listener();
}

export function readPrivateState(): Readonly<PrivateState> {
  return current;
}

export function updatePrivateState(patch: Partial<PrivateState>): Readonly<PrivateState> {
  const next = { ...current, ...patch };
  const unchanged = (Object.keys(next) as (keyof PrivateState)[]).every((key) => next[key] === current[key]);
  if (unchanged) return current;
  current = next;
  announce();
  return current;
}

export function clearPrivateState() {
  const wasEmpty = (Object.keys(empty) as (keyof PrivateState)[]).every((key) => current[key] === empty[key]);
  current = { ...empty };
  if (!wasEmpty) announce();
}

// For `useSyncExternalStore` in the stage components that will own these fields.
export function subscribePrivateState(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
