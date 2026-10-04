"use client";
import { useEffect, useState } from "react";
import { deletedResponseSchema } from "@/lib/schemas/people";
import { textLinkBeginSchema, textLinkStatusSchema } from "@/lib/schemas/text";
import { requestJson, SessionClientError } from "@/lib/session/api-client";

type LinkState = { linked: boolean; phoneLast4?: string; line: string };

export function TextStart({ disabled, onStart }: { disabled: boolean; onStart: () => Promise<void> }) {
  const [link, setLink] = useState<LinkState | null>(null);
  const [adding, setAdding] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<{ code: string; line: string } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    requestJson("GET", "/api/text/link", undefined, textLinkStatusSchema)
      .then((status) => { setLink(status); setMessage(""); if (status.linked) setCode(null); })
      .catch((error: unknown) => setMessage(error instanceof SessionClientError && error.code === "NOT_CONFIGURED" ? "" : "Text practice could not be checked."));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!code) return undefined;
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [code]);

  async function addNumber() {
    setBusy(true);
    setMessage("");
    try {
      const started = await requestJson("POST", "/api/text/link", { phone }, textLinkBeginSchema);
      setCode({ code: started.code, line: started.line });
      setAdding(false);
    } catch (error) {
      setMessage(error instanceof SessionClientError ? error.message : "That number could not be saved.");
    } finally { setBusy(false); }
  }

  async function removeNumber() {
    setBusy(true);
    try {
      await requestJson("DELETE", "/api/text/link", undefined, deletedResponseSchema);
      setLink(null);
      load();
    } catch (error) {
      setMessage(error instanceof SessionClientError ? error.message : "The number could not be removed.");
    } finally { setBusy(false); }
  }

  if (!link && !message) return null;
  if (!link?.linked) {
    return <div>
      {!adding && !code && <button type="button" className="button secondary" disabled={disabled} onClick={() => setAdding(true)}>Add your number</button>}
      {adding && <form onSubmit={(event) => { event.preventDefault(); void addNumber(); }}>
        <label htmlFor="text-phone">Mobile number</label>
        <input id="text-phone" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" />
        <button type="submit" className="button secondary" disabled={busy || phone.trim().length < 7}>Send a code</button>
      </form>}
      {code && <p role="status">Text {code.code} alone to {code.line}. This page updates when that text arrives.</p>}
      {message && <p role="status">{message}</p>}
    </div>;
  }

  return <div>
    <button type="button" className="button secondary" disabled={disabled || busy} onClick={() => { setBusy(true); void onStart().finally(() => setBusy(false)); }}>Text</button>
    <button type="button" className="button secondary" disabled={busy} onClick={() => void removeNumber()}>Remove ····{link.phoneLast4}</button>
    {message && <p role="status">{message}</p>}
  </div>;
}

export function TextLive({ name, onEnd }: { name: string; onEnd: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return <main id="main">
    <h1>Texting {name}</h1>
    <p>The conversation is in your messages. End it here when you are done.</p>
    <button type="button" className="button" disabled={busy} onClick={() => { setBusy(true); void onEnd(); }}>End</button>
  </main>;
}
