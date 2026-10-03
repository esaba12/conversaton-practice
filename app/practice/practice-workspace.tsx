"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PracticeCall, PracticeSetup, type PracticeCallProps } from "@/components/presentation/practice";
import { roommate } from "@/fixtures/roommate";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import { createDailyController } from "@/lib/media/daily-controller";
import type { MediaController, MediaEvent } from "@/lib/schemas/media";
import type { EndReason, PracticeSession } from "@/lib/schemas/session";
import { SessionClientError, endSession, markConnected, startSession } from "@/lib/session/api-client";

const DURATION_SECONDS = 180;
const GOAL = "Make a clear request about sharing kitchen chores.";

type Phase = PracticeCallProps["phase"];
type Cleanup = { state: "closing" } | { state: "closed"; cleanup: PracticeSession["cleanup"] } | { state: "unreachable" };
type CleanupTarget = { id: string; reason: EndReason };

const failureMessages: Record<Extract<MediaEvent, { type: "failed" }>["reason"], string> = {
  join: "We couldn’t join the call.",
  credential_expired: "The call link expired before it connected.",
  video_lost: "The counterpart’s video stopped, so the call was ended.",
  provider_error: "The call provider had a problem, so the call was ended.",
  microphone_denied: "Microphone access is needed to practice. Allow it in your browser settings, then start again.",
};

function cleanupMessage(cleanup: Cleanup | null) {
  if (!cleanup) return "";
  if (cleanup.state === "closing") return "Closing the practice session…";
  if (cleanup.state === "unreachable") return "We couldn’t reach the server to close the practice session.";
  if (cleanup.cleanup === "confirmed") return "The call provider confirmed the session is closed.";
  if (cleanup.cleanup === "pending") return "Closing the remote call session is still pending.";
  if (cleanup.cleanup === "unresolved") return "We couldn’t confirm the remote call session closed.";
  return "Remote call cleanup has not started yet.";
}

function StreamVideo({ stream, muted = false }: { stream: MediaStream; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.srcObject = stream;
    return () => { element.srcObject = null; };
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} />;
}

export function PracticeWorkspace() {
  const router = useRouter();
  const [view, setView] = useState<"setup" | "call">("setup");
  const [phase, setPhaseState] = useState<Phase>("connecting");
  const [starting, setStarting] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [previousSessionId, setPreviousSessionId] = useState<string | null>(null);
  const [endingPrevious, setEndingPrevious] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraNote, setCameraNote] = useState("");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [callMessage, setCallMessage] = useState("");
  const [cleanup, setCleanup] = useState<Cleanup | null>(null);
  const [cleanupTarget, setCleanupTarget] = useState<CleanupTarget | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [headerMessage, setHeaderMessage] = useState("");

  // Refs carry the authoritative call state so media/auth callbacks never act on stale renders.
  const controllerRef = useRef<MediaController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const attemptRef = useRef(0);
  const startingRef = useRef(false);
  const phaseRef = useRef<Phase | null>(null);
  const connectedRef = useRef(false);
  const startedAtRef = useRef(0);
  const authLostRef = useRef(false);

  function setPhase(next: Phase | null) {
    phaseRef.current = next;
    if (next) setPhaseState(next);
  }

  // Releases local media without waiting on any network request; later events from this attempt are ignored.
  function releaseMedia() {
    attemptRef.current++;
    const controller = controllerRef.current;
    controllerRef.current = null;
    if (controller) void controller.end().catch(() => undefined);
    setRemoteStream(null);
    setLocalStream(null);
    setCameraEnabled(false);
  }

  function takeSessionId() {
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    return id;
  }

  function closeRemote(id: string, reason: EndReason) {
    setCleanupTarget({ id, reason });
    setCleanup({ state: "closing" });
    endSession(id, reason).then(
      (session) => { if (!authLostRef.current) setCleanup({ state: "closed", cleanup: session.cleanup }); },
      () => { if (!authLostRef.current) setCleanup({ state: "unreachable" }); },
    );
  }

  function finish(reason: "user" | "time_limit") {
    const current = phaseRef.current;
    if (!current || current === "ended") return;
    releaseMedia();
    setPhase("ended");
    if (reason === "time_limit") setCallMessage("Time’s up. The practice reached its planned length.");
    else setCallMessage(current === "interrupted" ? "The call was interrupted before it ended." : "");
    const id = takeSessionId();
    if (id) closeRemote(id, reason);
  }

  function interrupt(message: string) {
    const current = phaseRef.current;
    if (!current || current === "ended" || current === "interrupted") return;
    releaseMedia();
    setPhase("interrupted");
    setCallMessage(`${message} You can end practice and start again.`);
    const id = takeSessionId();
    if (id) closeRemote(id, "connection_failure");
  }

  // Unmount, page hide, and auth loss: release media first, then fire-and-forget the server end.
  function abandon(reason: EndReason) {
    releaseMedia();
    const id = takeSessionId();
    if (id) void endSession(id, reason, { keepalive: true }).catch(() => undefined);
  }

  function handleMediaEvent(attempt: number, event: MediaEvent) {
    if (attempt !== attemptRef.current) return;
    switch (event.type) {
      case "remote-stream": setRemoteStream(event.stream); return;
      case "local-preview": setLocalStream(event.stream); if (!event.stream) setCameraEnabled(false); return;
      case "remote-left": interrupt("The counterpart left the call."); return;
      case "failed": interrupt(failureMessages[event.reason]); return;
      case "ready": {
        if (connectedRef.current || phaseRef.current !== "connecting") return;
        connectedRef.current = true;
        startedAtRef.current = Date.now();
        setPhase("live");
        const id = sessionIdRef.current;
        if (id) markConnected(id).catch((error) => {
          if (attempt === attemptRef.current && error instanceof SessionClientError && error.code === "SESSION_EXPIRED") interrupt("This practice session expired.");
        });
      }
    }
  }

  function routeToSignIn() {
    router.replace("/auth/sign-in");
    router.refresh();
  }

  function handleAuthLoss() {
    if (authLostRef.current) return;
    authLostRef.current = true;
    abandon("auth_loss");
    setPhase(null);
    setView("setup");
    setCallMessage(""); setSetupMessage(""); setCleanup(null); setCleanupTarget(null); setPreviousSessionId(null);
    routeToSignIn();
  }

  async function start() {
    if (startingRef.current || controllerRef.current || sessionIdRef.current || authLostRef.current) return;
    startingRef.current = true;
    const attempt = ++attemptRef.current;
    setStarting(true); setSetupMessage(""); setPreviousSessionId(null);
    let joined = false;
    try {
      const { session, credential } = await startSession(DURATION_SECONDS, crypto.randomUUID());
      if (attempt !== attemptRef.current) {
        void endSession(session.id, authLostRef.current ? "auth_loss" : "navigation", { keepalive: true }).catch(() => undefined);
        return;
      }
      sessionIdRef.current = session.id;
      connectedRef.current = false;
      setMutedState(false); setCameraEnabled(false); setCameraNote(""); setElapsedSeconds(0); setCallMessage(""); setCleanup(null); setCleanupTarget(null);
      setPhase("connecting");
      setView("call");
      const controller = createDailyController((event) => handleMediaEvent(attempt, event));
      controllerRef.current = controller;
      joined = true;
      await controller.connect(credential);
    } catch (error) {
      if (attempt !== attemptRef.current) return;
      if (joined) { interrupt(failureMessages.join); return; }
      if (error instanceof SessionClientError) {
        if (error.code === "UNAUTHENTICATED") { handleAuthLoss(); return; }
        if (error.code === "SESSION_ACTIVE" && error.sessionId) {
          setPreviousSessionId(error.sessionId);
          setSetupMessage("A previous practice is still open. End it before starting a new one.");
          return;
        }
        setSetupMessage(error.code === "NETWORK" || error.code === "MALFORMED_RESPONSE" ? "Practice couldn’t start. Please try again." : error.message);
        return;
      }
      setSetupMessage("Practice couldn’t start. Please try again.");
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  async function endPrevious() {
    const id = previousSessionId;
    if (!id || endingPrevious) return;
    setEndingPrevious(true);
    try {
      const session = await endSession(id, "user");
      setPreviousSessionId(null);
      setSetupMessage(session.cleanup === "confirmed" ? "The previous practice is closed. You can start again." : `The previous practice was ended. ${cleanupMessage({ state: "closed", cleanup: session.cleanup })} You can try starting again.`);
    } catch (error) {
      if (error instanceof SessionClientError && error.code === "UNAUTHENTICATED") { handleAuthLoss(); return; }
      setSetupMessage("We couldn’t end the previous practice. Please try again.");
    } finally {
      setEndingPrevious(false);
    }
  }

  function toggleMute() {
    const next = !muted;
    controllerRef.current?.setMuted(next);
    setMutedState(next);
  }

  async function toggleCamera() {
    const controller = controllerRef.current;
    if (!controller) return;
    const next = !cameraEnabled;
    setCameraNote("");
    const enabled = await controller.setCamera(next);
    if (controller !== controllerRef.current) return;
    setCameraEnabled(next && enabled);
    if (next && !enabled) setCameraNote("Your camera isn’t available or permission was denied. Practice continues without a self-view.");
  }

  function backToSetup() {
    setPhase(null);
    setView("setup");
    setCallMessage(""); setCleanup(null); setCleanupTarget(null); setSetupMessage("");
  }

  async function signOut() {
    setSigningOut(true); setHeaderMessage("");
    authLostRef.current = true;
    releaseMedia();
    const id = takeSessionId();
    if (id) await endSession(id, "auth_loss").catch(() => undefined);
    try {
      const { error } = await createBrowserAuthClient().auth.signOut();
      if (error) { authLostRef.current = false; setPhase(null); setView("setup"); setHeaderMessage("Could not sign out. Please try again."); return; }
      routeToSignIn();
    } catch {
      authLostRef.current = false; setPhase(null); setView("setup"); setHeaderMessage("Could not sign out. Please try again.");
    } finally { setSigningOut(false); }
  }

  useEffect(() => {
    if (phase !== "live") return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(Math.min(elapsed, DURATION_SECONDS));
      if (elapsed >= DURATION_SECONDS) finish("time_limit");
    }, 250);
    return () => window.clearInterval(timer);
    // finish only touches refs and state setters, so the first-render closure is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    const onPageHide = () => {
      if (!controllerRef.current && !sessionIdRef.current) return;
      abandon("navigation");
      if (phaseRef.current && phaseRef.current !== "ended") setPhase("ended");
    };
    window.addEventListener("pagehide", onPageHide);
    const { data } = createBrowserAuthClient().auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") handleAuthLoss(); });
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      data.subscription.unsubscribe();
      abandon("navigation");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMessage = [callMessage, cameraNote, phase === "ended" || phase === "interrupted" ? cleanupMessage(cleanup) : ""].filter(Boolean).join(" ");
  const canRetryCleanup = !!cleanupTarget && !!cleanup && cleanup.state !== "closing" && !(cleanup.state === "closed" && cleanup.cleanup === "confirmed");

  return <><header className="site-header"><Link className="wordmark" href="/">Conversation practice<span className="mark" aria-hidden="true">↗</span></Link><button type="button" className="button secondary" disabled={signingOut} onClick={() => void signOut()}>{signingOut ? "Signing out…" : "Sign out"}</button></header>
    <main id="main">
      {headerMessage && <p role="status" className="notice">{headerMessage}</p>}
      {view === "setup" ? <>
        {previousSessionId && <div className="actions"><button type="button" className="button secondary" disabled={endingPrevious} onClick={() => void endPrevious()}>{endingPrevious ? "Ending previous practice…" : "End previous practice"}</button></div>}
        <PracticeSetup counterpartName={roommate.name} role={roommate.role} publicContext={roommate.publicContext} goal={GOAL} onStart={() => void start()} disabled={starting || endingPrevious || signingOut || !!previousSessionId} statusMessage={starting ? "Starting your practice…" : setupMessage || undefined} />
      </> : <>
        <PracticeCall counterpartName={roommate.name} goal={GOAL} phase={phase} muted={muted} cameraEnabled={cameraEnabled} elapsedSeconds={elapsedSeconds} durationSeconds={DURATION_SECONDS}
          remoteMedia={remoteStream ? <StreamVideo stream={remoteStream} /> : null}
          localPreview={localStream ? <StreamVideo stream={localStream} muted /> : undefined}
          onMuteToggle={toggleMute} onCameraToggle={() => void toggleCamera()} onEnd={() => finish("user")} statusMessage={statusMessage || undefined} />
        {(phase === "ended" || phase === "interrupted") && <div className="actions">
          {canRetryCleanup && <button type="button" className="button secondary" onClick={() => cleanupTarget && closeRemote(cleanupTarget.id, cleanupTarget.reason)}>Retry closing session</button>}
          {phase === "ended" && <button type="button" className="button" onClick={backToSetup}>Back to setup</button>}
        </div>}
      </>}
    </main></>;
}
