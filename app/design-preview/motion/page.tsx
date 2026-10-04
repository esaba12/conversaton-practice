import { notFound } from "next/navigation";
import styles from "../gallery.module.css";
import { MotionGallery } from "./motion-gallery";

// Separate from /design-preview so its stage buttons never collide with the presentation preview's browser checks.
export default function MotionPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <section className={styles.gallery} aria-labelledby="motion-preview-heading">
      <h1 id="motion-preview-heading" className={styles.galleryTitle}>Motion and sound</h1>
      <MotionGallery />
    </section>
  );
}
