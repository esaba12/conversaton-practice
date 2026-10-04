import { notFound } from "next/navigation";
import { RecapGallery } from "./recap-gallery";
import styles from "../gallery.module.css";

// Separate from /design-preview so the recap's auto-starting reflection never runs inside the
// presentation preview's browser checks.
export default function RecapPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <section className={styles.gallery} aria-labelledby="recap-preview-heading">
      <h1 id="recap-preview-heading" className={styles.galleryTitle}>Recap states</h1>
      <RecapGallery />
    </section>
  );
}
