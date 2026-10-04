import { authConfigured } from "@/lib/auth/config";
import { LogoMark } from "@/components/site/logo";
import { Wordmark } from "@/components/site/wordmark";
import { SignInForm } from "./sign-in-form";

const notices: Record<string, string> = {
  callback: "Sign-in didn’t finish. You can try again.",
};

const promises = [
  { title: "A live video call", body: "Talk face to face with a fictional AI character." },
  { title: "Built from your words", body: "Describe the situation; review the character before you call." },
  { title: "Yours to keep or not", body: "No call transcripts are kept. Notes never reach the character." },
];

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
      <main id="main" className="auth-split">
        <section className="auth-shell">
          <span className="eyebrow"><span className="status-dot" /> Your own space to practice</span>
          <h1>Welcome in.</h1>
          <p>Sign in before preparing or starting a conversation. Each practice starts fresh.</p>
          <SignInForm configured={authConfigured()} notice={error ? notices[error] ?? "" : ""} />
          <p className="disclosure">Practice with fictional AI counterparts. It doesn’t predict how a real person will respond.</p>
        </section>
        <aside className="auth-aside" aria-label="What you get">
          <LogoMark className="auth-mark" size={52} />
          <p className="auth-quote">“Some conversations are easier after a first try.”</p>
          <ol>
            {promises.map((item, i) => (
              <li key={item.title}><span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.body}</p></div></li>
            ))}
          </ol>
          <p className="auth-stat"><strong>7 in 10</strong> U.S. employees avoid hard conversations at work. <a href="https://learn.workbravely.com/cost-of-the-conversation-gap" target="_blank" rel="noreferrer">Bravely, 2019</a></p>
        </aside>
      </main>
    </>
  );
}
