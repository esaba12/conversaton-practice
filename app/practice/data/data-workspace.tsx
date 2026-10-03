"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DataOverview, type DataInventory } from "@/components/presentation/data-overview";
import { WorkspaceHeader } from "@/components/presentation/workspace-header";
import styles from "@/components/presentation/people.module.css";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import { getPrivatePrep, listFacts, listPeople } from "@/lib/people/api-client";
import { SessionClientError, deletePracticeData, listSessions, retryCleanup } from "@/lib/practice-data/api-client";
import type { DeletePracticeDataResponse, SessionSummary } from "@/lib/schemas/practice-data";

const codeOf = (error: unknown) => (error instanceof SessionClientError ? error.code : null);
const emptyInventory: DataInventory = { status: "loading", facts: 0, people: [], privatePrep: false };

export function DataWorkspace() {
  const router = useRouter();
  const live = useRef(true);
  const [inventory, setInventory] = useState<DataInventory>(emptyInventory);
  const [sessions, setSessions] = useState<{ status: "loading" | "ready" | "error"; list: SessionSummary[] }>({ status: "loading", list: [] });
  const [retrying, setRetrying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<DeletePracticeDataResponse | null>(null);
  const [message, setMessage] = useState<{ status?: string; error?: string }>({});

  function clearPage() { setInventory(emptyInventory); setSessions({ status: "loading", list: [] }); setResult(null); setMessage({}); }
  function authLost() { clearPage(); router.replace("/auth/sign-in"); router.refresh(); }
  function failed(error: unknown) { if (codeOf(error) === "UNAUTHENTICATED") { authLost(); return true; } return false; }

  async function loadInventory() {
    setInventory((current) => ({ ...current, status: "loading" }));
    try {
      const [facts, people, prep] = await Promise.all([listFacts(), listPeople(), getPrivatePrep()]);
      if (live.current) setInventory({ status: "ready", facts: facts.length, people: people.map((p) => ({ id: p.id, name: p.name, knows: p.sharedFactIds.length })), privatePrep: prep.notes.length > 0 });
    } catch (error) { if (live.current && !failed(error)) setInventory((current) => ({ ...current, status: "error" })); }
  }
  async function loadSessions() {
    setSessions((current) => ({ ...current, status: "loading" }));
    try { const list = await listSessions(); if (live.current) setSessions({ status: "ready", list }); }
    catch (error) { if (live.current && !failed(error)) setSessions((current) => ({ ...current, status: "error" })); }
  }
  const reload = () => { void loadInventory(); void loadSessions(); };

  useEffect(() => {
    live.current = true;
    reload();
    const { data } = createBrowserAuthClient().auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") authLost(); });
    // A back/forward-cache restore must not show names from before a sign-out elsewhere; the reload re-checks identity.
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) { clearPage(); reload(); } };
    window.addEventListener("pageshow", onPageShow);
    return () => { live.current = false; data.subscription.unsubscribe(); window.removeEventListener("pageshow", onPageShow); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function retry(id: string) {
    if (retrying || deleting) return;
    setRetrying(id); setMessage({});
    try {
      const session = await retryCleanup(id);
      setSessions((current) => ({ ...current, list: current.list.map((item) => (item.id === id ? { ...item, status: session.status, cleanup: session.cleanup } : item)) }));
      setMessage(session.cleanup === "confirmed" ? { status: "Provider cleanup confirmed for that session." } : { error: "Provider cleanup still isn’t confirmed for that session. You can try again later." });
    } catch (error) { if (!failed(error)) setMessage({ error: "We couldn’t retry cleanup right now. Please try again." }); }
    finally { setRetrying(null); }
  }

  async function removeAll() {
    if (deleting || retrying) return false;
    setDeleting(true); setMessage({}); setResult(null);
    try {
      const response = await deletePracticeData();
      setResult(response);
      void loadInventory();
      return true;
    } catch (error) {
      if (!failed(error)) setMessage({ error: "We couldn’t finish deleting, so some of your practice data may remain. Please try again." });
      return false;
    } finally { setDeleting(false); }
  }

  return <><WorkspaceHeader page="data" />
    <main id="main"><div className={styles.page}>
      <DataOverview inventory={inventory} sessions={sessions} retrying={retrying} deleting={deleting} result={result}
        onRetryCleanup={(id) => void retry(id)} onDeleteAll={removeAll} onReload={reload} statusMessage={message.status} errorMessage={message.error} />
    </div></main></>;
}
