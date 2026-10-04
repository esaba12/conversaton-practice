import Link from "next/link";
import { MeetCardDemo } from "./meet-card-demo";
import { Wordmark } from "./wordmark";

const steps = [
  { step: "01 / Before", title: "Say what’s going on.", body: "Describe an everyday conversation in your own words, then review the fictional character before you call." },
  { step: "02 / Call", title: "Have a first try.", body: "Talk with a fictional AI character in a live video call. End whenever you need." },
  { step: "03 / After", title: "Take what helps.", body: "Skip or take a short reflection, and save the person only if you choose to." },
];

const assurances = [
  "You review and edit the character before the call starts.",
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
            <p className="intro">Some conversations are easier after a first try. Rehearse with a fictional AI character, at your own pace.</p>
            <Link className="button" href="/auth/sign-in">Start with a conversation <span aria-hidden="true">↗</span></Link>
            <p className="fine-print">A fresh start every time.</p>
          </div>
          <MeetCardDemo />
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

        <p className="text-aside">You can also rehearse by text message with the same fictional character. After you sign in, add your number and text a one-time code to the practice line, then press Text or pick a saved person or an example from a card in the thread. Text does not start a video call. End on the site, or END or STOP in the thread, closes it.</p>

        <section className="assurance" aria-labelledby="assurance-title">
          <h2 id="assurance-title">What stays in your hands</h2>
          <div>
            <p className="intro">Your notes never reach the character. Calls aren’t saved unless you choose.</p>
            <ul>
              {assurances.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>

        <p className="disclosure">Prototype in development. A practice tool with fictional AI characters. It doesn’t predict how anyone will respond.</p>
      </main>
    </>
  );
}
