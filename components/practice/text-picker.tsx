"use client";
import { useEffect, useState } from "react";
import { textPickCatalogSchema, textStartedSchema } from "@/lib/schemas/text";
import { requestJson, SessionClientError } from "@/lib/session/api-client";
import type { z } from "zod";

type Catalog = z.infer<typeof textPickCatalogSchema>;

export function TextPicker({ token }: { token: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [message, setMessage] = useState(token.length < 20 ? "This link expired. Text again to get a new one." : "Loading…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (token.length < 20) return;
    let gone = false;
    requestJson("GET", `/api/text/pick?token=${encodeURIComponent(token)}`, undefined, textPickCatalogSchema)
      .then((data) => { if (!gone) { setCatalog(data); setMessage(""); } })
      .catch(() => { if (!gone) setMessage("This link expired. Text again to get a new one."); });
    return () => { gone = true; };
  }, [token]);

  async function choose(body: { personId: string; expectedVersion: number; situationId?: string } | { preset: Catalog["examples"][number]["preset"] }) {
    setBusy(true);
    setMessage("");
    try {
      await requestJson("POST", "/api/text/pick", { token, ...body }, textStartedSchema);
      setCatalog(null);
      setMessage("You're texting. Go back to the conversation.");
    } catch (error) {
      setMessage(error instanceof SessionClientError ? error.message : "That practice could not start.");
      setBusy(false);
    }
  }

  return <main id="main">
    <h1>Who are you practicing with?</h1>
    {message && <p role="status">{message}</p>}
    {catalog && <>
      {catalog.people.length === 0 && <p>No saved people yet. Pick an example, or save someone on the website first.</p>}
      <ul>
        {catalog.people.map((person) => <li key={person.id}>
          <button type="button" disabled={busy} onClick={() => void choose({ personId: person.id, expectedVersion: person.version })}>{person.name}</button>
          <span> {person.relationship}</span>
          {person.situations.map((situation) => <button key={situation.id} type="button" disabled={busy} onClick={() => void choose({ personId: person.id, expectedVersion: person.version, situationId: situation.id })}>{situation.label}</button>)}
        </li>)}
      </ul>
      <h2>Examples</h2>
      <ul>
        {catalog.examples.map((example) => <li key={example.preset}>
          <button type="button" disabled={busy} onClick={() => void choose({ preset: example.preset })}>{example.name}</button>
          <span> {example.relationship}</span>
        </li>)}
      </ul>
    </>}
  </main>;
}
