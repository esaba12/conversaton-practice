import { notFound } from "next/navigation";
import { PracticePreview } from "@/components/presentation/practice-preview";

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <PracticePreview />;
}
