"use client";

import { useEffect, useId, useState } from "react";
import { z } from "zod";
import { Portrait } from "@/components/ui/portrait";
import { SessionClientError } from "@/lib/people/api-client";
import { sessionPresetSchema, type SessionPreset } from "@/lib/schemas/situation";
import { requestJson } from "@/lib/session/api-client";
import styles from "./people-look.module.css";
import setup from "./setup.module.css";

// Only preset names cross the API; the server maps each one to a stock face and premade voice.
const presetResponseSchema = z.strictObject({ preset: z.strictObject({ id: z.uuid(), version: z.number().int().positive(), presetId: sessionPresetSchema.nullable() }) });
export const LOOKS: { id: SessionPreset; name: string; label: string }[] = [
  { id: "roommate", name: "Alex", label: "Alex’s look and voice" },
  { id: "professor", name: "Ellis", label: "Ellis’s look and voice" },
  { id: "decline", name: "Sam", label: "Sam’s look and voice" },
  { id: "manager", name: "Jordan", label: "Jordan’s look and voice" },
];

export type PeopleLookProps = {
  personId: string;
  personName: string;
  version: number;
  /** Called with the bumped person version, which later saves must send as expectedVersion. */
  onSaved: (version: number) => void;
  onAuthLost: () => void;
  disabled?: boolean;
};

export function PeopleLook({ personId, personName, version, onSaved, onAuthLost, disabled = false }: PeopleLookProps) {
  const id = useId();
  const [current, setCurrent] = useState<SessionPreset | null | "error" | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ status?: string; error?: string }>({});

  useEffect(() => {
    let live = true;
    requestJson("GET", `/api/people/${encodeURIComponent(personId)}/preset`, undefined, presetResponseSchema).then(
      ({ preset }) => { if (live) setCurrent(preset.presetId); },
      (error) => {
        if (!live) return;
        if (error instanceof SessionClientError && error.code === "UNAUTHENTICATED") onAuthLost();
        else { setCurrent("error"); setMessage({ error: "We couldn’t load this person’s look." }); }
      },
    );
    return () => { live = false; };
    // onAuthLost only uses state setters and the router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  async function choose(presetId: SessionPreset | null) {
    if (saving || disabled || presetId === current) return;
    setSaving(true); setMessage({});
    try {
      const { preset } = await requestJson("PUT", `/api/people/${encodeURIComponent(personId)}/preset`, { presetId, expectedVersion: version }, presetResponseSchema);
      setCurrent(preset.presetId);
      onSaved(preset.version);
      setMessage({ status: preset.presetId ? `${personName} will use ${LOOKS.find((look) => look.id === preset.presetId)?.label} next time.` : `${personName} will use the default look and voice next time.` });
    } catch (error) {
      const code = error instanceof SessionClientError ? error.code : null;
      if (code === "UNAUTHENTICATED") { onAuthLost(); return; }
      setMessage({ error: code === "VERSION_CONFLICT"
        ? "This person was changed somewhere else, so the look didn’t change. Load the latest version, then choose again."
        : "We couldn’t change the look. Please try again." });
    } finally { setSaving(false); }
  }

  const options: { id: SessionPreset | null; name: string; label: string }[] = [{ id: null, name: personName, label: "Default" }, ...LOOKS];
  return (
    <section className={`${setup.card} ${styles.look}`} aria-labelledby={`${id}-title`}>
      <div className={setup.cardTop}><h2 id={`${id}-title`} className={styles.title}>Look and voice</h2><span className={setup.fictionalTag}>Fictional AI</span></div>
      <p className={setup.hint}>A stock face and premade voice for {personName}’s video calls. Changes apply to the next practice.</p>
      <div role="radiogroup" aria-labelledby={`${id}-title`} aria-busy={saving || current === undefined} className={styles.grid}>
        {options.map((option) => (
          <label key={option.id ?? "default"} className={styles.option} data-selected={current === option.id}>
            <input type="radio" name={`${id}-look`} className={styles.radio} checked={current === option.id} disabled={disabled || saving || current === undefined}
              onChange={() => void choose(option.id)} />
            <Portrait name={option.name} size={64} src={option.id ? `/api/portraits/${option.id}` : null} />
            <span className={styles.label}>{option.label}</span>
          </label>
        ))}
      </div>
      <p className={setup.status} role="status" aria-live="polite">{message.status}</p>
      {message.error && <p className={setup.status} role="alert">{message.error}</p>}
    </section>
  );
}
