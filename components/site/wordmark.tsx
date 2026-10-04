import Link from "next/link";
import { LogoMark } from "./logo";

export function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="SpeakEasy home">
      <LogoMark className="wordmark-mark" size={30} />
      <span>Speak<span className="wordmark-accent">Easy</span></span>
    </Link>
  );
}
