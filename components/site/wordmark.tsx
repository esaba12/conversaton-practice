import Link from "next/link";

export function Wordmark() {
  return (
    <Link className="wordmark" href="/">
      Conversation practice<span className="mark" aria-hidden="true">↗</span>
    </Link>
  );
}
