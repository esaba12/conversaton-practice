import Link from "next/link";
import { Wordmark } from "./wordmark";

const steps = [
  { step: "01 / Prepare", title: "Make space for the words.", body: "Describe an everyday situation and choose what you want to practice." },
  { step: "02 / Practice", title: "Have a first try.", body: "Talk with a fictional counterpart in a live video call. End whenever you need." },
  { step: "03 / Close", title: "Leave when you’re ready.", body: "End the call, skip or take a short reflection, and save a person only if you choose to." },
];

const assurances = [
  "You review and edit the character before the call starts.",
  "Private preparation notes never reach the counterpart.",
  "A saved person knows only the facts you choose to share.",
  "Ending the call releases your microphone, and your camera if you turned it on.",
];

export function PublicLanding() {
  return (
    <>
      <header className="site-header">
        <Wordmark />
        <Link className="text-link" href="/auth/sign-in">Sign in <span aria-hidden="true">→</span></Link>
      </header>
      <main id="main" className="landing">
        <div className="hero">
          <div>
            <div className="eyebrow"><span className="status-dot" /> A little room to practice</div>
            <h1>Find your words.<br /><span>Then take them with you.</span></h1>
            <p className="intro">Some conversations are easier after a first try. Rehearse with a fictional AI counterpart, at your own pace.</p>
            <Link className="button" href="/auth/sign-in">Start with a conversation <span aria-hidden="true">↗</span></Link>
            <p className="fine-print">Private preparation. A fresh start every time.</p>
          </div>
          <aside className="stage" aria-label="Illustration of a practice call">
            <p className="stage-kicker">Practice call</p>
            <div className="stage-person">
              <span className="monogram" aria-hidden="true">A</span>
              <div>
                <p className="stage-name">Alex</p>
                <p className="stage-role">Fictional counterpart</p>
              </div>
            </div>
            <p className="stage-line">“Hey — got a minute? I wanted to talk about the kitchen.”</p>
            <p className="stage-note">Illustration only. A real practice uses a live video call after you sign in.</p>
          </aside>
        </div>

        <section className="preview-grid" aria-label="How practice works">
          {steps.map((item) => (
            <article key={item.step}>
              <span className="step">{item.step}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className="assurance" aria-labelledby="assurance-title">
          <h2 id="assurance-title">What stays in your hands</h2>
          <ul>
            {assurances.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <div className="landing-close">
          <p>Ready for a first try? Sign in, then describe the conversation in your own words.</p>
          <Link className="button secondary" href="/auth/sign-in">Sign in to practice</Link>
        </div>
        <p className="disclosure">Prototype in development. A practice tool, not therapy or a prediction of anyone’s response.</p>
      </main>
    </>
  );
}
