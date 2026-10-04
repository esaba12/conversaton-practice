"use client";

import { useId } from "react";
import { Portrait } from "@/components/ui/portrait";
import { LOOKS } from "@/lib/practice/looks";
import type { SessionPreset } from "@/lib/schemas/situation";
import styles from "./look-catalogue.module.css";

const options: { id: SessionPreset | null; name: string; label: string }[] = [
  { id: null, name: "Default", label: "Default look and voice" },
  ...LOOKS,
];

export type LookCatalogueProps = {
  value: SessionPreset | null;
  onChange: (look: SessionPreset | null) => void;
  disabled?: boolean;
};

/** Stock faces and premade voices. The browser sends a starter name or nothing, never a provider id. */
export function LookCatalogue({ value, onChange, disabled = false }: LookCatalogueProps) {
  const id = useId();
  return (
    <div className={styles.catalogue}>
      <p id={`${id}-label`} className={styles.heading}>Look and voice</p>
      <p id={`${id}-hint`} className={styles.hint}>A stock face and a premade voice. The character stays fictional.</p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} className={styles.grid}>
        {options.map((option) => (
          <label key={option.id ?? "default"} className={styles.option} data-selected={value === option.id}>
            <input type="radio" name={`${id}-look`} className={styles.radio} aria-label={option.label} checked={value === option.id} disabled={disabled}
              onChange={() => onChange(option.id)} />
            <span aria-hidden="true"><Portrait name={option.name} size={64} src={option.id ? `/api/portraits/${option.id}` : null} /></span>
            <span className={styles.label} aria-hidden="true">{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
