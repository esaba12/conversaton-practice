import styles from "./landing.module.css";

const situations = [
  "Asking your manager to move a project",
  "Talking to a roommate about the dishes",
  "Asking a professor for an extension",
  "Saying no to a classmate’s favor",
  "Telling a friend you can’t make it",
  "Asking for clearer feedback",
  "Splitting rent more fairly",
  "Following up after no reply",
  "Turning down an extra shift",
  "Asking a teammate to pull their weight",
];

export function SituationMarquee() {
  return (
    <section className={styles.marquee} aria-labelledby="situations-title">
      <h2 id="situations-title" className={styles.marqueeTitle}>Everyday conversations you could rehearse</h2>
      <div className={styles.marqueeViewport}>
        <ul className={styles.marqueeTrack}>
          {situations.map((item) => <li key={item} className={styles.marqueeItem}>{item}</li>)}
          {situations.map((item) => <li key={`copy-${item}`} className={`${styles.marqueeItem} ${styles.marqueeCopy}`} aria-hidden="true">{item}</li>)}
        </ul>
      </div>
    </section>
  );
}
