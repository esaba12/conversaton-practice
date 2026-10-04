import { notFound } from "next/navigation";
import { CallGallery } from "../call-gallery";
import styles from "../gallery.module.css";

// Separate from /design-preview so its many call controls never collide with the presentation preview's browser checks.
export default function CallPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <section className={styles.gallery} aria-labelledby="call-preview-heading">
      <h1 id="call-preview-heading" className={styles.galleryTitle}>Call screen states</h1>
      <CallGallery />
    </section>
  );
}
