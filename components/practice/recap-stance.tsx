import { challengeLabel } from "./meet-knowledge";
import type { RoleContext } from "@/lib/schemas/role-context";
import styles from "./recap.module.css";

// Q2: how the counterpart was played, read from the role the user reviewed before the call.
// Chips only — no prose, no inferred thoughts, nothing new stored — and collapsed by default.
export const STANCE_FICTION_NOTE = "Fiction, set before the call";

export type StanceChip = { label: string; value: string };

export function stanceChips(role: Pick<RoleContext, "wants" | "holdsBackBecause" | "softensWhen" | "challenge">): StanceChip[] {
  return [
    ...(role.wants ? [{ label: "Wants", value: role.wants }] : []),
    ...(role.holdsBackBecause ? [{ label: "Holds back because", value: role.holdsBackBecause }] : []),
    ...(role.softensWhen ? [{ label: "Softens when", value: role.softensWhen }] : []),
    { label: "How they react", value: challengeLabel[role.challenge] },
  ];
}

export function RecapStance({ counterpartName, role }: { counterpartName: string; role: Pick<RoleContext, "wants" | "holdsBackBecause" | "softensWhen" | "challenge"> }) {
  const chips = stanceChips(role);
  return (
    <details className={styles.stance}>
      <summary className={styles.stanceSummary}>How {counterpartName} was played</summary>
      <ul className={styles.chipList}>
        {chips.map((chip) => (
          <li key={chip.label} className={styles.chip}><span className={styles.chipLabel}>{chip.label}</span> {chip.value}</li>
        ))}
      </ul>
      <p className={styles.quiet}>{STANCE_FICTION_NOTE}</p>
    </details>
  );
}
