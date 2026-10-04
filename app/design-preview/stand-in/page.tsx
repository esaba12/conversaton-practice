import { notFound } from "next/navigation";
import { StandInGallery } from "../stand-in-gallery";
import styles from "../gallery.module.css";

// Separate from /design-preview so the stand-in's call controls never collide with the presentation preview's browser checks.
export default function StandInPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <section className={styles.gallery} aria-labelledby="stand-in-preview-heading">
      <h1 id="stand-in-preview-heading" className={styles.galleryTitle}>Show me first states</h1>
      <StandInGallery />
    </section>
  );
}
