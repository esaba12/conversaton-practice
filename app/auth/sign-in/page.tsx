import Link from "next/link";
import { authConfigured } from "@/lib/auth/config";
import { SignInForm } from "./sign-in-form";
export default function SignInPage() {
  return <><header className="site-header"><Link className="wordmark" href="/">Conversation practice<span className="mark" aria-hidden="true">↗</span></Link></header><main id="main" className="auth-shell"><span className="eyebrow">Your own space to practice</span><h1>Welcome in.</h1><p>Sign in before preparing or starting a conversation. Each practice starts fresh.</p><SignInForm configured={authConfigured()} /><p className="disclosure">Practice with fictional AI counterparts. Not therapy or a prediction of a real person’s response.</p></main></>;
}
