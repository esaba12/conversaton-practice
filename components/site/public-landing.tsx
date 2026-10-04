import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, EyeOff, FileX2, Lock, MicOff, PenLine, Play, ShieldCheck, Sparkles } from "lucide-react";
import { CountUp } from "./landing/count-up";
import { HeroCall } from "./landing/hero-call";
import { SituationMarquee } from "./landing/marquee";
import { Reveal } from "./landing/reveal";
import styles from "./landing/landing.module.css";
import { MeetCardDemo } from "./meet-card-demo";
import { LogoMark } from "./logo";
import { Wordmark } from "./wordmark";

const BRAVELY = "https://learn.workbravely.com/cost-of-the-conversation-gap";
const BMC = "https://link.springer.com/article/10.1186/s12909-025-07996-w";

const steps = [
  { title: "Say what’s going on.", body: "Describe an everyday conversation in your own words. We draft a fictional character and a goal you can edit before you call." },
  { title: "Have a first try.", body: "Talk with the character on a live video call. Three minutes by default, and you can end whenever you need." },
  { title: "Take what helps.", body: "Skip or take a short reflection, and save the person only if you choose to." },
];

const assurances = [
  { icon: Lock, title: "Private notes stay private", body: "What you’re nervous about helps you prepare. It never reaches the character." },
  { icon: ShieldCheck, title: "People know only what you share", body: "A saved person sees just the About-me facts you hand them, one by one." },
  { icon: FileX2, title: "No transcripts kept by default", body: "Only what you approve is saved. Every practice starts fresh." },
  { icon: EyeOff, title: "Your camera is optional", body: "It’s off until you turn it on, stays a local preview, and the character can’t see it." },
  { icon: MicOff, title: "Ending really ends it", body: "Hanging up releases your microphone, and your camera if you turned it on." },
];

export function PublicLanding() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Wordmark />
          <nav className={styles.nav} aria-label="Landing">
            <a className={styles.navLink} href="#how">How it works</a>
            <a className={styles.navLink} href="#privacy">Privacy</a>
            <Link className={styles.headerCta} href="/auth/sign-in">Sign in</Link>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrowPill}><span className={styles.pulseDot} aria-hidden="true" /> Live video practice with fictional AI characters</p>
              <h1 id="hero-title" className={styles.title}>
                Have the hard conversation <em>once</em> before it counts.
              </h1>
              <p className={styles.lede}>
                Describe what’s going on, then talk it through face to face with a fictional character built from your words. Walk in knowing what you want to say.
              </p>
              <div className={styles.ctaRow}>
                <Link className={styles.ctaPrimary} href="/auth/sign-in">
                  Start with a conversation <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
                <a className={styles.ctaGhost} href="#try">Try a quick moment <ArrowRight size={16} aria-hidden="true" /></a>
              </div>
              <ul className={styles.heroFacts}>
                <li><Check size={14} aria-hidden="true" /> 3-minute calls</li>
                <li><Check size={14} aria-hidden="true" /> Character you can edit</li>
                <li><Check size={14} aria-hidden="true" /> A fresh start every time</li>
              </ul>
            </div>
            <HeroCall />
          </div>
        </section>

        <SituationMarquee />

        <section className={styles.stats} aria-labelledby="stats-title">
          <div className={styles.container}>
            <Reveal className={styles.sectionHead}>
              <p className={styles.kicker}>Why practice</p>
              <h2 id="stats-title" className={styles.h2}>Hard conversations get put off. <em>Rehearsal helps.</em></h2>
            </Reveal>
            <div className={styles.statGrid}>
              <Reveal className={styles.stat}>
                <p className={styles.statNumber}><CountUp value={7} /><span className={styles.statUnit}> in 10</span></p>
                <p className={styles.statText}>U.S. full-time employees say they avoid difficult conversations at work.</p>
                <p className={styles.source}>Bravely, <a href={BRAVELY} target="_blank" rel="noreferrer">Cost of the Conversation Gap</a> (2019, 500+ employees)</p>
              </Reveal>
              <Reveal className={styles.stat} delay={0.08}>
                <p className={styles.statNumber}><CountUp value={34} suffix="%" /></p>
                <p className={styles.statText}>stayed silent for more than a month. 25% waited more than a year.</p>
                <p className={styles.source}>Crucial Conversations authors’ 2009 study, as reported by <a href={BRAVELY} target="_blank" rel="noreferrer">Bravely</a></p>
              </Reveal>
              <Reveal className={`${styles.stat} ${styles.statFeature}`} delay={0.16}>
                <p className={styles.statNumber}><CountUp value={55.7} decimals={1} suffix="%" /></p>
                <p className={styles.statText}>rise in nursing students’ self-efficacy after role-play practice, versus 0.8% after traditional lectures.</p>
                <p className={styles.source}><a href={BMC} target="_blank" rel="noreferrer">BMC Medical Education</a> (2025)</p>
              </Reveal>
            </div>
            <dl className={styles.facts}>
              <div><dt>Starter characters</dt><dd><CountUp value={4} /></dd></div>
              <div><dt>Minutes per call, 5 if you like</dt><dd><CountUp value={3} /></dd></div>
              <div><dt>Call transcripts saved by default</dt><dd>0</dd></div>
            </dl>
          </div>
        </section>

        <section className={styles.features} aria-labelledby="features-title">
          <div className={styles.container}>
            <Reveal className={styles.sectionHead}>
              <p className={styles.kicker}>What you get</p>
              <h2 id="features-title" className={styles.h2}>A real-feeling first try, <em>on your terms.</em></h2>
            </Reveal>
            <div className={styles.bento}>
              <Reveal className={`${styles.tile} ${styles.tileHero}`}>
                <div className={styles.tileCopy}>
                  <h3 className={styles.h3}>A face-to-face call, not a chat box</h3>
                  <p>Talk out loud with a fictional character on a live video call. They listen and answer as you speak, so you practice the pauses too.</p>
                </div>
                <div className={styles.miniCall} aria-hidden="true">
                  <p className={styles.miniYou}><span>You</span>Can we split the dishes by day?</p>
                  <div className={styles.miniFace}><span>A</span></div>
                  <div className={styles.miniBars}>{Array.from({ length: 28 }, (_, i) => <span key={i} style={{ animationDelay: `${(i * 113) % 900}ms` }} />)}</div>
                  <p className={styles.miniLine}>“Okay, fair. I get home late, though. Can mornings count?”</p>
                  <p className={styles.miniMeta}><span className={styles.liveDot} /> Alex · fictional roommate · live</p>
                </div>
              </Reveal>

              <Reveal className={styles.tile} delay={0.05}>
                <div className={styles.tileIcon} aria-hidden="true"><PenLine size={18} /></div>
                <h3 className={styles.h3}>Built from your words</h3>
                <p>Describe the situation. Get an editable character and goal, not a script.</p>
                <div className={styles.buildVisual} aria-hidden="true">
                  <span className={styles.prompt}>“My professor is strict about deadlines…”</span>
                  <span className={styles.traits}><i>Direct</i><i>Busy</i><i>Fair</i></span>
                </div>
              </Reveal>

              <Reveal className={styles.tile} delay={0.1}>
                <div className={styles.tileIcon} aria-hidden="true"><ShieldCheck size={18} /></div>
                <h3 className={styles.h3}>They only know what you share</h3>
                <p>Drag About-me facts to each saved person. Everything else stays with you.</p>
                <div className={styles.shareVisual} aria-hidden="true">
                  <span className={styles.shared}><Check size={12} /> Studies biology</span>
                  <span className={styles.shared}><Check size={12} /> Works weekends</span>
                  <span className={styles.locked}><Lock size={12} /> Private note</span>
                </div>
              </Reveal>

              <Reveal className={styles.tile} delay={0.05}>
                <div className={styles.tileIcon} aria-hidden="true"><Play size={18} /></div>
                <h3 className={styles.h3}>Show me first</h3>
                <p>Not ready to talk? Watch a stand-in take the first try, then it’s your turn.</p>
              </Reveal>

              <Reveal className={styles.tile} delay={0.1}>
                <div className={styles.tileIcon} aria-hidden="true"><Sparkles size={18} /></div>
                <h3 className={styles.h3}>A reflection, if you want one</h3>
                <p>What you did, in your own words, and one small thing to try next. No scores. Or skip it.</p>
              </Reveal>

              <Reveal className={`${styles.tile} ${styles.tileTimer}`} delay={0.15}>
                <div className={styles.timerRing} aria-hidden="true">
                  <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" /><circle cx="32" cy="32" r="27" /></svg>
                  <span>3:00</span>
                </div>
                <h3 className={styles.h3}>Three-minute calls</h3>
                <p>Short enough to start today. Five minutes if you want more room.</p>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="how" className={styles.how} aria-labelledby="how-title">
          <div className={styles.container}>
            <Reveal className={styles.sectionHead}>
              <p className={styles.kicker}>How it works</p>
              <h2 id="how-title" className={styles.h2}>Three steps. <em>One short call.</em></h2>
            </Reveal>
            <ol className={styles.steps}>
              {steps.map((item, index) => (
                <li key={item.title} className={styles.step}>
                  <Reveal delay={index * 0.08}>
                    <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
                    <h3 className={styles.h3}>{item.title}</h3>
                    <p>{item.body}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="try" className={styles.tryIt} aria-labelledby="try-title">
          <div className={`${styles.container} ${styles.trySplit}`}>
            <Reveal className={styles.tryCopy}>
              <p className={styles.kicker}>Try it</p>
              <h2 id="try-title" className={styles.h2}>Pick a reply. <em>See where it goes.</em></h2>
              <p className={styles.bodyText}>A scripted taste of a practice with Alex, a fictional roommate. Flip between before, during, and after the call.</p>
            </Reveal>
            <MeetCardDemo />
          </div>
        </section>

        <section id="privacy" className={styles.privacy} aria-labelledby="privacy-title">
          <div className={styles.container}>
            <div className={styles.privacyHead}>
              <p className={styles.kickerNight}>Privacy by default</p>
              <h2 id="privacy-title" className={styles.h2Night}>What stays in your hands</h2>
              <p className={styles.privacyLede}>Your notes never reach the character. Calls aren’t saved unless you choose.</p>
            </div>
            <ul className={styles.assurances}>
              {assurances.map(({ icon: Icon, title, body }) => (
                <li key={title} className={styles.assurance}>
                  <span className={styles.assuranceIcon} aria-hidden="true"><Icon size={18} /></span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.container}>
            <div className={styles.closingBand}>
              <LogoMark className={styles.closingMark} size={64} />
              <h2 id="closing-title" className={styles.closingTitle}>Your words, <em>ready before you need them.</em></h2>
              <p>Sign in with email, describe what’s on your mind, and have your first try.</p>
              <Link className={styles.ctaLight} href="/auth/sign-in">Sign in to practice <ArrowUpRight size={18} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <Wordmark />
          <p className={styles.disclosure}>A practice tool with fictional AI characters. It doesn’t predict how anyone will respond.</p>
        </div>
      </footer>
    </div>
  );
}
