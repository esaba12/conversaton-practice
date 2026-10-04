"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/lib/auth/browser";

export function SignInForm({ configured, notice = "" }: { configured: boolean; notice?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [pending, setPending] = useState<"google" | "email" | null>(null);
  const [message, setMessage] = useState(notice);
  const busy = pending !== null;

  async function continueWithGoogle() {
    if (!configured || busy) return;
    setPending("google");
    setMessage("");
    try {
      const client = createBrowserAuthClient();
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error || !data.url) {
        setMessage("Could not start Google sign-in. You can try again or use email.");
        setPending(null);
      }
    } catch {
      setMessage("Could not reach sign-in. Please try again.");
      setPending(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || busy) return;
    setPending("email");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const client = createBrowserAuthClient();
      const result = mode === "sign-in"
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      if (result.error) {
        setMessage(mode === "sign-in"
          ? "Could not sign in. Check your details and confirm your email if you just created an account."
          : "Could not create your account. Try again later or ask the demo host to check email delivery.");
        return;
      }
      if (!result.data.session) {
        setMessage("Check your email to confirm your account, then sign in here.");
        return;
      }
      router.push("/practice");
      router.refresh();
    } catch {
      setMessage("Could not reach sign-in. Please try again.");
    } finally {
      setPending(null);
    }
  }

  const calm = message.startsWith("Check your email");

  return (
    <form className="auth-form" onSubmit={submit}>
      {!configured && <p className="notice">Sign-in configuration is pending. Practice is unavailable until it is connected.</p>}
      <div className="auth-google">
        <button type="button" className="button google" disabled={!configured || busy} aria-describedby="google-note" onClick={() => void continueWithGoogle()}>
          {pending === "google" ? "One moment…" : "Continue with Google"}
        </button>
        <p id="google-note" className="auth-note">Uses your Google account only to sign you in. Practice stays in this app.</p>
      </div>
      <div className="auth-divider"><span>or</span></div>
      <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required minLength={8} maxLength={128} /></label>
      <button className="button" disabled={!configured || busy}>{pending === "email" ? "One moment…" : mode === "sign-in" ? "Sign in" : "Create account"}</button>
      <button className="button secondary" type="button" disabled={busy} onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>
        {mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
      {message && <p role={calm ? "status" : "alert"} aria-live="polite">{message}</p>}
    </form>
  );
}
