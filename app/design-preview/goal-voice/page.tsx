import { notFound } from "next/navigation";
import { GoalVoiceGallery } from "./gallery";
import styles from "../gallery.module.css";

// Separate from /design-preview so these fake loaders never collide with the presentation preview's browser checks.
export default function GoalVoicePreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <section className={styles.gallery} aria-labelledby="goal-voice-preview-heading">
      <h1 id="goal-voice-preview-heading" className={styles.galleryTitle}>Goal light and voice preview states</h1>
      <GoalVoiceGallery />
    </section>
  );
}
