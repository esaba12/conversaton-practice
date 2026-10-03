"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PracticeSetup } from "@/components/presentation/practice";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import { roommate } from "@/fixtures/roommate";

export function WorkspacePreview() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function signOut() {
    setBusy(true); setMessage("");
    try {
      const { error } = await createBrowserAuthClient().auth.signOut();
      if (error) { setMessage("Could not sign out. Please try again."); return; }
      router.replace("/auth/sign-in"); router.refresh();
    } catch { setMessage("Could not sign out. Please try again."); } finally { setBusy(false); }
  }
  return <><header className="site-header"><Link className="wordmark" href="/">Conversation practice<span className="mark" aria-hidden="true">↗</span></Link><button className="button secondary" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button></header>
    <main id="main">{message && <p role="status" className="notice">{message}</p>}<PracticeSetup counterpartName={roommate.name} role={roommate.role} publicContext={roommate.publicContext} goal="Make a clear request about sharing kitchen chores." onStart={() => undefined} disabled statusMessage="Foundation preview: live calls are not enabled yet." /></main></>;
}
