"use client";

import { useState, type ReactNode } from "react";
import { Phone } from "lucide-react";
import { Chip, Portrait, PrimaryButton, PrivateCard, portraitSizes } from "@/components/ui";
import styles from "./gallery.module.css";

const states = ["Default", "Hover", "Focus-visible", "Active", "Disabled with reason", "Loading"] as const;
const skills = ["Ask for what you need", "Stay calm", "Say no kindly"];

function StateRow({ title, cells }: { title: string; cells: ReactNode[] }) {
  return (
    <div className={styles.stateRow} role="group" aria-label={`${title} states`}>
      <h3 className={styles.rowTitle}>{title}</h3>
      <div className={styles.stateGrid}>
        {cells.map((cell, index) => (
          <div key={states[index]} className={styles.stateCell}>
            <span className={styles.stateLabel}>{states[index]}</span>
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrimitivesGallery() {
  const [picked, setPicked] = useState<string[]>([skills[0]]);
  const toggle = (skill: string, on: boolean) => setPicked((current) => (on ? [...current, skill] : current.filter((item) => item !== skill)));

  return (
    <section id="primitives" className={styles.section} aria-labelledby="primitives-heading">
      <h2 id="primitives-heading" className={styles.sectionTitle}>Primitives</h2>
      <p className={styles.sectionNote}>Hover, focus-visible and active are forced here with <code>data-preview-state</code> so they can be compared side by side. Synthetic examples only; nothing here starts a call.</p>

      <StateRow
        title="Primary button"
        cells={[
          <PrimaryButton key="d" label="Call Jordan" icon={Phone} />,
          <PrimaryButton key="h" label="Call Jordan" icon={Phone} data-preview-state="hover" />,
          <PrimaryButton key="f" label="Call Jordan" icon={Phone} data-preview-state="focus" />,
          <PrimaryButton key="a" label="Call Jordan" icon={Phone} data-preview-state="active" />,
          <PrimaryButton key="x" label="Call Jordan" icon={Phone} disabled disabledReason="Allow the microphone first so Jordan can hear you." />,
          <PrimaryButton key="l" label="Call Jordan" icon={Phone} loading loadingLabel="Calling Jordan…" />,
        ]}
      />

      <StateRow
        title="Chip (unselected)"
        cells={[
          <Chip key="d" label="Stay calm" selected={false} />,
          <Chip key="h" label="Stay calm" selected={false} data-preview-state="hover" />,
          <Chip key="f" label="Stay calm" selected={false} data-preview-state="focus" />,
          <Chip key="a" label="Stay calm" selected={false} data-preview-state="active" />,
          <Chip key="x" label="Stay calm" selected={false} disabled disabledReason="Pick up to two skills." />,
          <Chip key="l" label="Stay calm" selected={false} loading />,
        ]}
      />

      <StateRow
        title="Chip (selected)"
        cells={[
          <Chip key="d" label="Say no kindly" selected />,
          <Chip key="h" label="Say no kindly" selected data-preview-state="hover" />,
          <Chip key="f" label="Say no kindly" selected data-preview-state="focus" />,
          <Chip key="a" label="Say no kindly" selected data-preview-state="active" />,
          <Chip key="x" label="Say no kindly" selected disabled disabledReason="Saved skills can't change during a call." />,
          <Chip key="l" label="Say no kindly" selected loading />,
        ]}
      />

      <div className={styles.stateRow}>
        <h3 className={styles.rowTitle}>Chip (try it: click, or Tab then Space)</h3>
        <div className={styles.chipRow} role="group" aria-label="Skills to practice">
          {skills.map((skill) => <Chip key={skill} label={skill} selected={picked.includes(skill)} onSelectedChange={(on) => toggle(skill, on)} />)}
        </div>
      </div>

      <div className={styles.stateRow}>
        <h3 className={styles.rowTitle}>Portrait (not interactive; monogram fallback)</h3>
        <div className={styles.portraitRow}>
          {portraitSizes.map((size) => (
            <figure key={size} className={styles.portraitFigure}>
              <Portrait name="Jordan" size={size} />
              <figcaption className={styles.stateLabel}>{size} px</figcaption>
            </figure>
          ))}
          <figure className={styles.portraitFigure}>
            <Portrait name="Alex Rivera" size={120} />
            <figcaption className={styles.stateLabel}>Two words</figcaption>
          </figure>
          <figure className={styles.portraitFigure}>
            <Portrait name="Ellis" size={120} src="/design-preview-missing-face.jpg" />
            <figcaption className={styles.stateLabel}>Image failed to load</figcaption>
          </figure>
        </div>
      </div>

      <div className={styles.stateRow}>
        <h3 className={styles.rowTitle}>Private card (not interactive)</h3>
        <div className={styles.privateRow}>
          <PrivateCard note="Jordan never sees this.">
            <p><strong>Goal:</strong> Ask for a clear answer about the deadline.</p>
            <p><strong>Hard moment:</strong> If Jordan changes the subject, I’ll bring it back once.</p>
          </PrivateCard>
          <PrivateCard>
            <p>Ask for a fairer way to share the cleaning.</p>
          </PrivateCard>
        </div>
      </div>
    </section>
  );
}
