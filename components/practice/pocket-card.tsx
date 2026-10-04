"use client";

import { useId, useState } from "react";
import { Download, Printer } from "lucide-react";
import { pocketCardFileName, pocketCardPng, printPocketCard, saveBlob } from "@/lib/pocket-card/export";
import { OPEN_WITH_MAX, buildPocketCard, pocketCardLines, type PocketCardContent } from "@/lib/pocket-card/model";
import styles from "./keep.module.css";

// L2: a card the user can carry into the real conversation. Everything happens in the browser;
// nothing here sends or stores anything. A day only persists if the host saves it through B1.
export type PocketCardProps = {
  name: string;
  // Defaults the "Open with" line; the user can edit it.
  goal: string;
  hardMomentLine?: string;
  // The saved real-conversation day, YYYY-MM-DD, when there is one.
  plannedOn?: string | null;
  // YYYY-MM-DD
  practicedOn: string;
  // Called when the user picks a day on the card, so a host can offer to save it. Optional.
  onDayChange?: (day: string) => void;
};

export function PocketCardPreview({ card }: { card: PocketCardContent }) {
  const lines = pocketCardLines(card);
  const footer = lines[lines.length - 1];
  return (
    <article className={styles.card} data-pocket-card-print aria-label={`Pocket card for ${card.name}`}>
      {lines.slice(0, -1).map((line, index) => line.kind === "name" ? <h3 key={index} className={styles.cardName}>{line.text}</h3>
        : <p key={index} className={line.kind === "label" ? styles.cardLabel : line.kind === "body" ? styles.cardBody : styles.cardSmall}>{line.text}</p>)}
      <p className={styles.cardFoot}>{footer.text}</p>
    </article>
  );
}

export function PocketCard({ name, goal, hardMomentLine = "", plannedOn = null, practicedOn, onDayChange }: PocketCardProps) {
  const id = useId();
  const [openWith, setOpenWith] = useState(goal);
  const [day, setDay] = useState(plannedOn ?? "");
  const [pickingDay, setPickingDay] = useState(false);
  const [state, setState] = useState<{ status?: string; error?: string }>({});
  const card = buildPocketCard({ name, openWith, hardMoment: hardMomentLine, plannedOn: day || null, practicedOn });

  async function save() {
    setState({});
    try {
      saveBlob(await pocketCardPng(card), pocketCardFileName(card.name));
      setState({ status: "Saved to your device. Nothing was sent anywhere." });
    } catch { setState({ error: "We couldn’t make the picture. You can still print the card." }); }
  }

  return (
    <section className={styles.stack} aria-labelledby={`${id}-title`}>
      <div className={styles.field}>
        <div className={styles.row}>
          <label htmlFor={`${id}-open`}>Open with</label>
          <span className={styles.count}>{openWith.length} / {OPEN_WITH_MAX}</span>
        </div>
        <textarea id={`${id}-open`} rows={2} maxLength={OPEN_WITH_MAX} value={openWith} onChange={(event) => setOpenWith(event.target.value)} />
      </div>
      <div className={styles.cardWrap}>
        <h2 id={`${id}-title`} className={styles.title}>Your pocket card</h2>
        <PocketCardPreview card={card} />
        {!day && !pickingDay && <button type="button" className={styles.quiet} onClick={() => setPickingDay(true)}>Add a day (optional)</button>}
        {(day || pickingDay) && (
          <div className={styles.field}>
            <label htmlFor={`${id}-day`}>The day you’ll talk for real</label>
            <input id={`${id}-day`} type="date" value={day} onChange={(event) => { setDay(event.target.value); if (event.target.value) onDayChange?.(event.target.value); }} />
          </div>
        )}
        <div className={styles.row}>
          <button type="button" className={styles.secondary} onClick={() => void save()}><Download size={18} strokeWidth={1.75} aria-hidden="true" />Save as picture</button>
          <button type="button" className={styles.secondary} onClick={() => printPocketCard()}><Printer size={18} strokeWidth={1.75} aria-hidden="true" />Print</button>
        </div>
        {state.status && <p className={styles.message} role="status">{state.status}</p>}
        {state.error && <p className={`${styles.message} ${styles.error}`} role="alert">{state.error}</p>}
      </div>
    </section>
  );
}
