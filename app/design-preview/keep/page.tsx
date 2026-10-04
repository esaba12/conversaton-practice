import { notFound } from "next/navigation";
import { KeepGallery } from "./keep-gallery";
import styles from "../gallery.module.css";

// Separate route so these controls never collide with the presentation preview's browser checks.
export default function KeepPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <section className={styles.gallery} aria-labelledby="keep-preview-heading">
      <h1 id="keep-preview-heading" className={styles.galleryTitle}>Keep it states</h1>
      <KeepGallery />
    </section>
  );
}
