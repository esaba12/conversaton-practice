"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AboutMeEditor } from "@/components/presentation/people-about-me";
import { PeopleHeader } from "@/components/presentation/people-list";
import styles from "@/components/presentation/people.module.css";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import { SessionClientError, createFact, deleteFact, listFacts, updateFact } from "@/lib/people/api-client";
import type { AboutMeFact } from "@/lib/schemas/people";

const codeOf = (error: unknown) => (error instanceof SessionClientError ? error.code : null);

export function AboutMeWorkspace() {
  const router = useRouter();
  const [facts, setFacts] = useState<AboutMeFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ status?: string; error?: string }>({});

  function authLost() { setFacts([]); router.replace("/auth/sign-in"); router.refresh(); }

  useEffect(() => {
    let live = true;
    listFacts().then(
      (list) => { if (live) { setFacts(list); setLoading(false); } },
      (error) => { if (!live) return; if (codeOf(error) === "UNAUTHENTICATED") authLost(); else { setLoading(false); setMessage({ error: "We couldn’t load your facts. Reload the page to try again." }); } },
    );
    const { data } = createBrowserAuthClient().auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") authLost(); });
    return () => { live = false; data.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: () => Promise<void>, failure: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true); setMessage({});
    try { await action(); return true; }
    catch (error) {
      const code = codeOf(error);
      if (code === "UNAUTHENTICATED") { authLost(); return false; }
      if (code === "NOT_FOUND") { setMessage({ error: "That fact no longer exists." }); void listFacts().then(setFacts, () => undefined); }
      else if ((code === "USAGE_LIMIT" || code === "VALIDATION_ERROR") && error instanceof SessionClientError) setMessage({ error: error.message });
      else setMessage({ error: failure });
      return false;
    } finally { setBusy(false); }
  }

  const add = (text: string) => run(async () => { const fact = await createFact(text); setFacts((list) => [...list, fact]); setMessage({ status: "Fact added. It isn’t shared with anyone yet." }); }, "We couldn’t add that fact. Please try again.");
  const edit = (factId: string, text: string) => run(async () => { const fact = await updateFact(factId, text); setFacts((list) => list.map((item) => (item.id === factId ? fact : item))); setMessage({ status: "Fact updated. People you shared it with see the new wording next time." }); }, "We couldn’t update that fact. Please try again.");
  const remove = (factId: string) => void run(async () => { await deleteFact(factId); setFacts((list) => list.filter((item) => item.id !== factId)); setMessage({ status: "Fact deleted. No one knows it anymore." }); }, "We couldn’t delete that fact. Please try again.");

  return <><PeopleHeader />
    <main id="main"><div className={styles.page}>
      <AboutMeEditor facts={facts} loading={loading} busy={busy} onAdd={add} onEdit={edit} onDelete={remove} statusMessage={message.status} errorMessage={message.error} />
    </div></main></>;
}
