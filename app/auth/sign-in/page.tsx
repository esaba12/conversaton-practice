import Link from "next/link";
import { authConfigured } from "@/lib/auth/config";
import { Wordmark } from "@/components/site/wordmark";
import { SignInForm } from "./sign-in-form";

const notices: Record<string, string> = {
  google: "Google sign-in didn’t finish. You can try again or use email.",
  callback: "Sign-in didn’t finish. You can try again.",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const error = firstParam((await searchParams).error);
  return (
    <>
      <header className="site-header">
        <Wordmark />
      </header>
      <main id="main" className="auth-shell">
        <span className="eyebrow">Your own space to practice</span>
        <h1>Welcome in.</h1>
        <p>Sign in before preparing or starting a conversation. Each practice starts fresh.</p>
        <SignInForm configured={authConfigured()} notice={error ? notices[error] ?? "" : ""} />
        <p className="disclosure">Practice with fictional AI counterparts. Not therapy or a prediction of a real person’s response.</p>
      </main>
    </>
  );
}
