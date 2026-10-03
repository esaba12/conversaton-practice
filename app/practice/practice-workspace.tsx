"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MyPeople } from "@/components/presentation/people-list";
import { SaveAfterEnd } from "@/components/presentation/people-save";
import { SavedPersonStart } from "@/components/presentation/people-start";
import peopleStyles from "@/components/presentation/people.module.css";
import { PracticeCall, type PracticeCallProps } from "@/components/presentation/practice";
import { ReflectionPanel } from "@/components/presentation/reflection-panel";
import { SetupDescribe, type SetupDescribeError } from "@/components/presentation/setup-describe";
import { SetupReview, emptyRole, parseReviewedRole, type SetupMode } from "@/components/presentation/setup-review";
import { roommate } from "@/fixtures/roommate";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import { createDailyController } from "@/lib/media/daily-controller";
import { createPerson, getPerson, listPeople, updatePerson } from "@/lib/people/api-client";
import { requestReflection } from "@/lib/reflection/api-client";
import type { DraftRequest } from "@/lib/schemas/draft";
import type { MediaController, MediaEvent } from "@/lib/schemas/media";
import { roleToPersonFields, type Person } from "@/lib/schemas/people";
import { appendTurn, type Reflection, type TranscriptTurn } from "@/lib/schemas/reflection";
import type { RoleContext } from "@/lib/schemas/role-context";
import type { EndReason, PracticeSession, StartResponse } from "@/lib/schemas/session";
import { SessionClientError, endSession, generateDraft, markConnected, startSavedPersonSession, startSession } from "@/lib/session/api-client";

const DURATION_SECONDS = 180;
const EXAMPLE_GOAL = "Make a clear request about sharing kitchen chores.";
const FALLBACK_GOAL = "Say what matters to you.";
const GENERATION_FAILED = "We couldn’t generate a setup right now.";

type Phase = PracticeCallProps["phase"];
type Cleanup = { state: "closing" } | { state: "closed"; cleanup: PracticeSession["cleanup"] } | { state: "unreachable" };
type CleanupTarget = { id: string; reason: EndReason };
// What the call started from, so End can offer an explicit save. Never includes goal or private notes.
type CallOrigin = { kind: "role"; role: RoleContext } | { kind: "person"; person: Person };
type SaveOffer = { open: boolean; saving: boolean; saved: { id: string; name: string; updated: boolean } | null; error: string };
const closedOffer: SaveOffer = { open: false, saving: false, saved: null, error: "" };
const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
// Reflection is per attempt and in memory only. goal is the user's reviewed goal; saved-person calls have none.
type ReflectState = { sessionId: string | null; goal: string; selfReflection: string; pending: boolean; reflection: Reflection | null; error: { message: string; retry: boolean } | null };
const closedReflect: ReflectState = { sessionId: null, goal: "", selfReflection: "", pending: false, reflection: null, error: null };
const REFLECTION_FAILED = "The reflection couldn’t be generated. Your own notes still count.";

function reflectionError(error: unknown, closeFailed: boolean): { message: string; retry: boolean } {
  const code = error instanceof SessionClientError ? error.code : null;
  if (code === "USAGE_LIMIT") return { message: "You’ve reached the reflection limit for this practice. Your own notes still count.", retry: false };
  if (code === "SESSION_ACTIVE") return closeFailed
    ? { message: "The practice session isn’t closed yet. Use Retry closing session, then try again.", retry: true }
    : { message: "The call is still closing. Try again in a moment.", retry: true };
  if (code === "NOT_FOUND") return { message: "This practice is no longer available to reflect on.", retry: false };
  if (code === "NOT_CONFIGURED" || code === "VALIDATION_ERROR") return { message: REFLECTION_FAILED, retry: false };
  return { message: REFLECTION_FAILED, retry: true };
}

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
  const searchParams = useSearchParams();
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
  // Setup content is transient: never persisted, and private notes go only to generateDraft.
  const [step, setStep] = useState<"describe" | "review" | "person">("describe");
  const [moveFocus, setMoveFocus] = useState(false);
  const [situation, setSituation] = useState("");
  const [intent, setIntent] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [reviewRole, setReviewRole] = useState<RoleContext>(emptyRole);
  const [reviewGoal, setReviewGoal] = useState("");
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [setupMode, setSetupMode] = useState<SetupMode>("manual");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<SetupDescribeError | null>(null);
  const [callInfo, setCallInfo] = useState({ name: "", goal: "" });
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleStatus, setPeopleStatus] = useState<"loading" | "ready" | "error">("loading");
  const [savedPerson, setSavedPerson] = useState<Person | null>(null);
  const [callOrigin, setCallOrigin] = useState<CallOrigin | null>(null);
  const [saveOffer, setSaveOffer] = useState<SaveOffer>(closedOffer);
  // The provider transcript for the current attempt only; never logged or persisted.
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [reflect, setReflect] = useState<ReflectState>(closedReflect);
  const reflectGenerationRef = useRef(0);
  const reflectingRef = useRef(false);
  const generationRef = useRef(0);

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
      case "utterance": setTurns((current) => appendTurn(current, event.speaker, event.text)); return;
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

  function clearReflection() {
    reflectGenerationRef.current++;
    reflectingRef.current = false;
    setTurns([]); setReflect(closedReflect);
  }

  function clearPrivateSetup() {
    clearReflection();
    generationRef.current++;
    setStep("describe"); setSituation(""); setIntent(""); setPrivateNotes("");
    setReviewRole(emptyRole); setReviewGoal(""); setAssumptions([]); setSetupMode("manual");
    setGenerating(false); setGenerateError(null); setCallInfo({ name: "", goal: "" });
    setSavedPerson(null); setCallOrigin(null); setSaveOffer(closedOffer);
  }

  function isAuthError(error: unknown) { return error instanceof SessionClientError && error.code === "UNAUTHENTICATED"; }

  async function loadPeople() {
    setPeopleStatus("loading");
    try {
      const list = await listPeople();
      if (authLostRef.current) return null;
      setPeople(list); setPeopleStatus("ready");
      return list;
    } catch (error) {
      if (isAuthError(error)) handleAuthLoss(); else setPeopleStatus("error");
      return null;
    }
  }

  function choosePerson(person: Person, notice = "") {
    setSavedPerson(person);
    setStep("person"); setMoveFocus(true);
    setSetupMessage(notice); setPreviousSessionId(null); setHeaderMessage("");
  }

  async function openPerson(personId: string, notice = "") {
    try {
      choosePerson(await getPerson(personId), notice);
    } catch (error) {
      if (isAuthError(error)) { handleAuthLoss(); return; }
      setSavedPerson(null); setStep("describe");
      setHeaderMessage(error instanceof SessionClientError && error.code === "NOT_FOUND" ? "That saved person wasn’t found." : "We couldn’t load that person. Please try again.");
      void loadPeople();
    }
  }

  function leavePerson() {
    setSavedPerson(null); setSetupMessage("");
    showStep("describe");
    if (searchParams.get("person")) router.replace("/practice", { scroll: false });
  }

  function handleAuthLoss() {
    if (authLostRef.current) return;
    authLostRef.current = true;
    abandon("auth_loss");
    clearPrivateSetup();
    setPeople([]);
    setPhase(null);
    setView("setup");
    setCallMessage(""); setSetupMessage(""); setCleanup(null); setCleanupTarget(null); setPreviousSessionId(null);
    routeToSignIn();
  }

  function showStep(next: "describe" | "review" | "person") {
    setStep(next);
    setMoveFocus(true);
    setSetupMessage("");
  }

  async function generate() {
    if (generating || authLostRef.current || !situation.trim()) return;
    const generation = ++generationRef.current;
    const request: DraftRequest = { situation: situation.trim() };
    if (intent.trim()) request.goal = intent.trim();
    if (privateNotes.trim()) request.privateNotes = privateNotes.trim();
    setGenerating(true); setGenerateError(null); setSetupMessage("");
    try {
      const draft = await generateDraft(request);
      if (generation !== generationRef.current) return;
      setReviewRole(draft.role); setReviewGoal(draft.goal); setAssumptions(draft.assumptions); setSetupMode("generated");
      showStep("review");
    } catch (error) {
      if (generation !== generationRef.current) return;
      if (error instanceof SessionClientError && error.code === "UNAUTHENTICATED") { handleAuthLoss(); return; }
      if (error instanceof SessionClientError && error.code === "OUT_OF_SCOPE") setGenerateError({ message: error.message, outOfScope: true });
      else setGenerateError({ message: GENERATION_FAILED, outOfScope: false });
    } finally {
      if (generation === generationRef.current) setGenerating(false);
    }
  }

  function setUpManually() {
    if (generating) return;
    setReviewRole(emptyRole); setReviewGoal(intent.trim()); setAssumptions([]); setSetupMode("manual"); setGenerateError(null);
    showStep("review");
  }

  function applyExample() {
    if (generating) return;
    setReviewRole(roommate); setReviewGoal(EXAMPLE_GOAL); setAssumptions([]); setSetupMode("example"); setGenerateError(null);
    showStep("review");
  }

  function backToDescribe() {
    if (generating) return;
    setGenerateError(null);
    showStep("describe");
  }

  function start() {
    const role = parseReviewedRole(reviewRole);
    if (!role) return;
    void launch({ kind: "role", role }, reviewGoal.trim() || FALLBACK_GOAL, (idempotencyKey) => startSession({ role, durationSeconds: DURATION_SECONDS, idempotencyKey }));
  }

  // Sends only the person's ID and version; private notes and goal stay in the browser.
  function startPerson() {
    const person = savedPerson;
    if (!person) return;
    void launch({ kind: "person", person }, FALLBACK_GOAL, (idempotencyKey) => startSavedPersonSession({ personId: person.id, expectedVersion: person.version, durationSeconds: DURATION_SECONDS, idempotencyKey }));
  }

  async function launch(origin: CallOrigin, goal: string, request: (idempotencyKey: string) => Promise<StartResponse>) {
    if (startingRef.current || controllerRef.current || sessionIdRef.current || authLostRef.current || generating) return;
    startingRef.current = true;
    const attempt = ++attemptRef.current;
    const reflectGoal = origin.kind === "role" ? reviewGoal.trim() : "";
    clearReflection();
    setStarting(true); setSetupMessage(""); setPreviousSessionId(null); setGenerateError(null);
    let joined = false;
    try {
      const { session, credential } = await request(crypto.randomUUID());
      if (attempt !== attemptRef.current) {
        void endSession(session.id, authLostRef.current ? "auth_loss" : "navigation", { keepalive: true }).catch(() => undefined);
        return;
      }
      sessionIdRef.current = session.id;
      connectedRef.current = false;
      setCallInfo({ name: origin.kind === "role" ? origin.role.name : origin.person.name, goal });
      setCallOrigin(origin); setSaveOffer({ ...closedOffer, open: true });
      setReflect({ ...closedReflect, sessionId: session.id, goal: reflectGoal });
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
        if (origin.kind === "person" && error.code === "VERSION_CONFLICT") { void openPerson(origin.person.id, `${origin.person.name} changed since you opened this page. This is the latest version; start again when you’re ready.`); return; }
        if (origin.kind === "person" && error.code === "NOT_FOUND") { void openPerson(origin.person.id); return; }
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
    const origin = callOrigin;
    setPhase(null);
    setView("setup");
    setCallMessage(""); setCleanup(null); setCleanupTarget(null); setSetupMessage("");
    setCallOrigin(null); setSaveOffer(closedOffer);
    clearReflection();
    if (origin?.kind === "person") { void openPerson(origin.person.id); return; }
    setStep("review"); setMoveFocus(true);
  }

  // One request at a time; a newer attempt or a clear drops a late result.
  async function requestReflectionNow() {
    const { sessionId, goal, selfReflection, reflection } = reflect;
    if (!sessionId || reflection || reflectingRef.current || authLostRef.current) return;
    reflectingRef.current = true;
    const generation = reflectGenerationRef.current;
    setReflect((state) => ({ ...state, pending: true, error: null }));
    try {
      const result = await requestReflection(sessionId, { turns, goal: goal || undefined, selfReflection: selfReflection.trim() || undefined });
      if (generation !== reflectGenerationRef.current) return;
      setReflect((state) => ({ ...state, pending: false, reflection: result }));
    } catch (error) {
      if (generation !== reflectGenerationRef.current) return;
      if (isAuthError(error)) { handleAuthLoss(); return; }
      setReflect((state) => ({ ...state, pending: false, error: reflectionError(error, cleanup?.state === "unreachable") }));
    } finally {
      if (generation === reflectGenerationRef.current) reflectingRef.current = false;
    }
  }

  // Explicit only: a generated/manual role becomes a new person, or updates a same-named one keeping its chips and shared facts.
  async function saveFromCall() {
    if (callOrigin?.kind !== "role" || saveOffer.saving || saveOffer.saved) return;
    const match = people.find((person) => sameName(person.name, callOrigin.role.name));
    setSaveOffer({ ...saveOffer, saving: true, error: "" });
    try {
      const fields = roleToPersonFields(callOrigin.role, match?.traits);
      const person = match ? await updatePerson(match.id, fields, match.version) : await createPerson(fields);
      setSaveOffer({ open: true, saving: false, saved: { id: person.id, name: person.name, updated: !!match }, error: "" });
      void loadPeople();
    } catch (error) {
      if (isAuthError(error)) { handleAuthLoss(); return; }
      const code = error instanceof SessionClientError ? error.code : null;
      const message = code === "VERSION_CONFLICT" ? `${match?.name ?? "This person"} changed somewhere else, so nothing was saved. We loaded the latest version; choose Update again to apply this call’s setup.`
        : code === "NOT_FOUND" ? "That saved person no longer exists, so nothing was updated. You can save this as a new person."
        : code === "USAGE_LIMIT" && error instanceof SessionClientError ? error.message
        : "We couldn’t save this person. Please try again.";
      setSaveOffer((offer) => ({ ...offer, saving: false, error: message }));
      if (code === "VERSION_CONFLICT" || code === "NOT_FOUND") void loadPeople();
    }
  }

  async function signOut() {
    setSigningOut(true); setHeaderMessage("");
    authLostRef.current = true;
    releaseMedia();
    clearPrivateSetup();
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

  // The people list backs both the home cards and the same-name check after End.
  useEffect(() => {
    if (view === "setup" && step !== "describe") return;
    if (view === "call" && phase !== "ended") return;
    void loadPeople();
    // loadPeople only touches refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, step, phase]);

  useEffect(() => {
    const personId = searchParams.get("person");
    if (personId) void openPerson(personId);
    // Read once on arrival from a person page; later selections happen in state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPageHide = () => {
      clearReflection();
      if (!controllerRef.current && !sessionIdRef.current) return;
      abandon("navigation");
      if (phaseRef.current && phaseRef.current !== "ended") setPhase("ended");
    };
    // A back/forward-cache restore may follow a sign-out elsewhere; never resurface private setup text.
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) clearPrivateSetup(); };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    const { data } = createBrowserAuthClient().auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") handleAuthLoss(); });
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      data.subscription.unsubscribe();
      abandon("navigation");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMessage = [callMessage, cameraNote, phase === "ended" || phase === "interrupted" ? cleanupMessage(cleanup) : ""].filter(Boolean).join(" ");
  const canRetryCleanup = !!cleanupTarget && !!cleanup && cleanup.state !== "closing" && !(cleanup.state === "closed" && cleanup.cleanup === "confirmed");

  return <><header className="site-header"><Link className="wordmark" href="/">Conversation practice<span className="mark" aria-hidden="true">↗</span></Link>
    <div className="actions"><Link className={peopleStyles.textLink} href="/practice/data">Your data</Link><button type="button" className="button secondary" disabled={signingOut} onClick={() => void signOut()}>{signingOut ? "Signing out…" : "Sign out"}</button></div></header>
    <main id="main">
      {headerMessage && <p role="status" className="notice">{headerMessage}</p>}
      {view === "setup" ? (step === "describe"
        ? <><MyPeople people={people} status={peopleStatus} onPractice={(person) => choosePerson(person)} onRetry={() => void loadPeople()} disabled={signingOut || generating} />
          <SetupDescribe situation={situation} goal={intent} privateNotes={privateNotes} onSituationChange={setSituation} onGoalChange={setIntent} onPrivateNotesChange={setPrivateNotes}
            onGenerate={() => void generate()} onManual={setUpManually} onUseExample={applyExample} generating={generating} disabled={signingOut} error={generateError} focusHeading={moveFocus} /></>
        : step === "person" && savedPerson
        ? <SavedPersonStart person={savedPerson} onStart={startPerson} onBack={leavePerson} disabled={starting || signingOut} startDisabled={endingPrevious || !!previousSessionId} focusHeading={moveFocus}
            statusMessage={starting ? "Starting your practice…" : setupMessage || undefined}
            actions={previousSessionId ? <div className="actions"><button type="button" className="button secondary" disabled={endingPrevious} onClick={() => void endPrevious()}>{endingPrevious ? "Ending previous practice…" : "End previous practice"}</button></div> : undefined} />
        : <SetupReview mode={setupMode} role={reviewRole} goal={reviewGoal} assumptions={assumptions} onRoleChange={setReviewRole} onGoalChange={setReviewGoal}
            onBack={backToDescribe} onRegenerate={situation.trim() ? () => void generate() : undefined} onStart={() => void start()} regenerating={generating}
            disabled={starting || signingOut} startDisabled={endingPrevious || !!previousSessionId} focusHeading={moveFocus}
            statusMessage={starting ? "Starting your practice…" : setupMessage || undefined}
            errorMessage={generateError ? (generateError.outOfScope ? `${generateError.message} Try describing an everyday conversation instead.` : `${generateError.message} Your current setup is unchanged.`) : undefined}
            actions={previousSessionId ? <div className="actions"><button type="button" className="button secondary" disabled={endingPrevious} onClick={() => void endPrevious()}>{endingPrevious ? "Ending previous practice…" : "End previous practice"}</button></div> : undefined} />
      ) : <>
        <PracticeCall counterpartName={callInfo.name} goal={callInfo.goal} phase={phase} muted={muted} cameraEnabled={cameraEnabled} elapsedSeconds={elapsedSeconds} durationSeconds={DURATION_SECONDS}
          remoteMedia={remoteStream ? <StreamVideo stream={remoteStream} /> : null}
          localPreview={localStream ? <StreamVideo stream={localStream} muted /> : undefined}
          onMuteToggle={toggleMute} onCameraToggle={() => void toggleCamera()} onEnd={() => finish("user")} statusMessage={statusMessage || undefined} />
        {phase === "ended" && callOrigin && saveOffer.open && (() => {
          const match = callOrigin.kind === "role" ? people.find((person) => sameName(person.name, callOrigin.role.name)) : undefined;
          return callOrigin.kind === "person"
            ? <SaveAfterEnd mode="saved" name={callOrigin.person.name} personId={callOrigin.person.id} onSave={() => undefined} onDismiss={() => setSaveOffer(closedOffer)} />
            : <SaveAfterEnd mode={match && !saveOffer.saved ? "update" : "new"} name={match && !saveOffer.saved ? match.name : callOrigin.role.name} onSave={() => void saveFromCall()} onDismiss={() => setSaveOffer(closedOffer)}
                saving={saveOffer.saving} ready={peopleStatus !== "loading"} saved={saveOffer.saved} errorMessage={saveOffer.error || undefined} />;
        })()}
        {(phase === "ended" || phase === "interrupted") && reflect.sessionId && <ReflectionPanel selfReflection={reflect.selfReflection}
          onSelfReflectionChange={(selfReflection) => setReflect((state) => ({ ...state, selfReflection }))} onReflect={() => void requestReflectionNow()} onDone={clearReflection}
          pending={reflect.pending} reflection={reflect.reflection} error={reflect.error} noSpeech={!turns.some((turn) => turn.speaker === "user")} />}
        {(phase === "ended" || phase === "interrupted") && <div className="actions">
          {canRetryCleanup && <button type="button" className="button secondary" onClick={() => cleanupTarget && closeRemote(cleanupTarget.id, cleanupTarget.reason)}>Retry closing session</button>}
          {phase === "ended" && <button type="button" className="button" onClick={backToSetup}>Back to setup</button>}
        </div>}
      </>}
    </main></>;
}
