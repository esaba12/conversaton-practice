import { useId, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { privateCardTitle } from "./labels";
import styles from "./private-card.module.css";

export type PrivateCardProps = {
  children: ReactNode;
  /** One plain sentence under the title, e.g. "Jordan never sees your goal." */
  note?: string;
  className?: string;
};

export function PrivateCard({ children, note, className }: PrivateCardProps) {
  const titleId = useId();
  return (
    <section className={[styles.card, className].filter(Boolean).join(" ")} aria-labelledby={titleId}>
      <header className={styles.header}>
        <Lock className={styles.lock} size={16} strokeWidth={1.75} aria-hidden="true" />
        <h3 id={titleId} className={styles.title}>{privateCardTitle}</h3>
      </header>
      {note ? <p className={styles.note}>{note}</p> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
