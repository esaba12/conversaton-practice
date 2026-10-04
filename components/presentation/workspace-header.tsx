"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import styles from "./people.module.css";

export type WorkspacePage = "practice" | "about-me" | "data";

export function WorkspaceHeader({ page, onSignOut, signingOut = false, quiet = false }: { page: WorkspacePage; onSignOut?: () => void; signingOut?: boolean; quiet?: boolean }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const busy = signingOut || leaving;

  async function signOut() {
    if (onSignOut) { onSignOut(); return; }
    if (leaving) return;
    setLeaving(true);
    const { error } = await createBrowserAuthClient().auth.signOut();
    if (error) { setLeaving(false); return; }
    router.replace("/auth/sign-in");
    router.refresh();
  }

  return (
    <header className="site-header">
      <Link className="wordmark" href="/">SpeakEasy<span className="mark" aria-hidden="true">↗</span></Link>
      {quiet
        ? <button type="button" className="button secondary" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button>
        : <nav className={styles.nav} aria-label="Practice">
          <Link className={styles.navLink} href="/practice" aria-current={page === "practice" ? "page" : undefined}>Practice</Link>
          <Link className={styles.navLink} href="/practice/about-me" aria-current={page === "about-me" ? "page" : undefined}>About me</Link>
          <Link className={styles.navLink} href="/practice/data" aria-current={page === "data" ? "page" : undefined}>Your data</Link>
          <button type="button" className="button secondary" disabled={busy} onClick={() => void signOut()}>{busy ? "Signing out…" : "Sign out"}</button>
        </nav>}
    </header>
  );
}
