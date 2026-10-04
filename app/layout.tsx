import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";
const displaySerif = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], display: "swap", variable: "--font-display-serif" });
export const metadata: Metadata = { title: "SpeakEasy", description: "A little practice for the conversations that matter." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={displaySerif.variable}><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
