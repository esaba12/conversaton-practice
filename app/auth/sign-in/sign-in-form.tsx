"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/lib/auth/browser";
export function SignInForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!configured || busy) return;
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const client = createBrowserAuthClient();
      const result = mode === "sign-in" ? await client.auth.signInWithPassword({ email, password }) : await client.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      if (result.error) { setMessage(mode === "sign-in" ? "Could not sign in. Check your details and confirm your email if you just created an account." : "Could not create your account. Try again later or ask the demo host to check email delivery."); return; }
      if (!result.data.session) { setMessage("Check your email to confirm your account, then sign in here."); return; }
      router.push("/practice"); router.refresh();
    } catch { setMessage("Could not reach sign-in. Please try again."); } finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit}>
    {!configured && <p className="notice">Sign-in configuration is pending. Practice is unavailable until it is connected.</p>}
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
    <label>Password<input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={8} maxLength={128} /></label>
    <button className="button" disabled={!configured || busy}>{busy ? "One moment…" : mode === "sign-in" ? "Sign in" : "Create account"}</button>
    <button className="button secondary" type="button" disabled={busy} onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>{mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
    <p role="status" aria-live="polite">{message}</p>
  </form>;
}
