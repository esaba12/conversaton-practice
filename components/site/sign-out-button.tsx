"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/lib/auth/browser";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createBrowserAuthClient().auth.signOut();
      if (error) {
        setMessage("Could not sign out. Please try again.");
        setBusy(false);
        return;
      }
      router.replace("/auth/sign-in");
      router.refresh();
    } catch {
      setMessage("Could not sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="header-action">
      <button type="button" className="button secondary" disabled={busy} onClick={() => void signOut()}>
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {message && <p className="header-action-note" role="alert">{message}</p>}
    </div>
  );
}
