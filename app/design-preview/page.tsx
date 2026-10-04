import { notFound } from "next/navigation";
import { PracticePreview } from "@/components/presentation/practice-preview";
import { PrimitivesGallery } from "./primitives-gallery";
import { SerifCandidates } from "./serif-candidates";
import styles from "./gallery.module.css";

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <>
      <PracticePreview />
      <section className={styles.gallery} aria-labelledby="design-system-heading">
        <h2 id="design-system-heading" className={styles.galleryTitle}>Design system</h2>
        <SerifCandidates />
        <PrimitivesGallery />
      </section>
    </>
  );
}
