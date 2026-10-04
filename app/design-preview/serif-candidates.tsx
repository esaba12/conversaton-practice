import { Fraunces, Newsreader, Source_Serif_4 } from "next/font/google";
import styles from "./gallery.module.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], axes: ["opsz"], display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], axes: ["opsz"], display: "swap" });

const candidates = [
  { name: "Fraunces", font: fraunces },
  { name: "Newsreader", font: newsreader, chosen: true },
  { name: "Source Serif 4", font: sourceSerif },
];

export function SerifCandidates() {
  return (
    <section id="serif-candidates" className={styles.section} aria-labelledby="serif-heading">
      <h2 id="serif-heading" className={styles.sectionTitle}>Display serif candidates</h2>
      <p className={styles.sectionNote}>Each candidate at 56 px and 20 px, weight 500, letter-spacing −0.02em. The chosen serif is loaded in the root layout as <code>--font-serif</code>.</p>
      <div className={styles.serifGrid}>
        {candidates.map(({ name, font, chosen }) => (
          <article key={name} className={styles.serifCard} data-chosen={chosen || undefined}>
            <p className={styles.serifLabel}>{name}{chosen ? " · chosen" : ""}</p>
            <p className={styles.serif56} style={{ fontFamily: font.style.fontFamily }}>Jordan</p>
            <p className={styles.serif56} style={{ fontFamily: font.style.fontFamily }}>Alex &amp; Ellis</p>
            <p className={styles.serif20} style={{ fontFamily: font.style.fontFamily }}>Jordan, your manager. Alex, your roommate. Ellis, a friend from school.</p>
            <p className={styles.serifUi}>Practice with <span style={{ fontFamily: font.style.fontFamily }} className={styles.serifInline}>Jordan</span> · 3 minutes</p>
          </article>
        ))}
      </div>
    </section>
  );
}
