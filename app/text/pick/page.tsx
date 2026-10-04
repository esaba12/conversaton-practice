import { TextPicker } from "@/components/practice/text-picker";

export default async function TextPickPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <TextPicker token={token} />;
}
