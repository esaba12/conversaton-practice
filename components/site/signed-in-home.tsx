import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
import { Wordmark } from "./wordmark";

const destinations = [
  {
    href: "/practice",
    kicker: "Start",
    title: "Practice a conversation",
    body: "Describe a situation in your own words, or practice with someone you’ve already saved.",
    primary: true,
  },
  {
    href: "/practice/about-me",
    kicker: "You",
    title: "About me",
    body: "Keep facts about yourself, then choose what each saved person is allowed to know.",
    primary: false,
  },
  {
    href: "/practice/data",
    kicker: "Account",
    title: "Your data",
    body: "See what this app stores, and delete your practice data when you want it gone.",
    primary: false,
  },
];

const flow = [
  "Describe the situation. Private notes stay on your side of the screen.",
  "Review the fictional character and edit anything that doesn’t fit.",
  "Talk on a live video call. End whenever you need; that releases your microphone.",
  "Save or update the person only if you choose to. Otherwise nothing is kept from the call.",
];

export function SignedInHome() {
  return (
    <>
      <header className="site-header">
        <Wordmark />
        <SignOutButton />
      </header>
      <main id="main" className="landing">
        <div className="eyebrow"><span className="status-dot" /> You’re signed in</div>
        <h1>What do you want<br /><span>to practice?</span></h1>
        <p className="intro">Each conversation starts fresh. Nothing from the last call is carried into the next one.</p>
        <div className="home-grid">
          {destinations.map((item) => (
            <Link key={item.href} className={item.primary ? "home-card primary" : "home-card"} href={item.href}>
              <span className="step">{item.kicker}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </Link>
          ))}
        </div>
        <section className="flow" aria-labelledby="flow-title">
          <h2 id="flow-title">Once you start</h2>
          <ol>
            {flow.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>
        <p className="disclosure">Practice with fictional AI counterparts. Not therapy or a prediction of a real person’s response.</p>
      </main>
    </>
  );
}
