"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Briefing, briefingKey, useBriefingDrafts, type BriefingPlan, type BriefingSubject } from "@/components/practice/briefing";
import { GreenRoom } from "@/components/practice/green-room";
import { Lobby, starterPortraitPath } from "@/components/practice/lobby";
import { CallStage } from "@/components/practice/call-stage";
import { MeetCard, meetStateFromProgress, useStreamedDraft, type MeetState } from "@/components/practice/meet-card";
import { personRole, personStartSituation, situationFromRole, type MeetStart } from "@/components/practice/meet-knowledge";
import { RecapStage } from "@/components/practice/recap-stage";
import { WorkspaceHeader } from "@/components/presentation/workspace-header";
import type { PracticeDuration } from "@/components/presentation/duration-choice";
import { emptyRole, parseReviewedRole, type SetupMode } from "@/components/presentation/setup-review";
import { examples } from "@/fixtures/examples";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import { selectMediaController } from "@/lib/media/controller-factory";
import { initialLiveCallState, reduceLiveCall, type Interaction, type LiveCallState } from "@/lib/media/interactions";
import { createPerson, deletePerson, getPerson, getPracticeHistory, listFacts, listPeople, listPersonSituations, updatePerson } from "@/lib/people/api-client";
import { callPhase, createFlowState, reduceFlow, type FlowEvent, type FlowState, type Teardown } from "@/lib/practice/flow";
import { cleanupMessage, failureMessages, reflectionError, FALLBACK_GOAL, GENERATION_FAILED } from "@/lib/practice/messages";
import { clearPrivateState, readPrivateState, updatePrivateState } from "@/lib/practice/private-state";
import type { MediaHandoff } from "@/lib/practice/devices";
import { closedOffer, closedReflect, sameName, type CallOrigin, type Cleanup, type CleanupTarget, type ReflectState, type SaveOffer } from "@/lib/practice/types";
import { requestReflection } from "@/lib/reflection/api-client";
import type { DraftRequest, StanceOptions } from "@/lib/schemas/draft";
import type { MediaController, MediaEvent } from "@/lib/schemas/media";
import { roleToPersonFields, type Person, type PersonSituation } from "@/lib/schemas/people";
import { appendTurn, type TranscriptTurn } from "@/lib/schemas/reflection";
import { roleContextSchema, type RoleContext } from "@/lib/schemas/role-context";
import type { EndReason, SessionPreset, StartResponse } from "@/lib/schemas/session";
import type { Situation } from "@/lib/schemas/situation";
import { SessionClientError, endSession, markConnected, startPresetSession, startSavedPersonSession, startSession } from "@/lib/session/api-client";

// The stages live in lib/practice/flow.ts and the screens in components/practice/*; this shell
// owns the requests, the media controller and the teardown the reducer asks for.
export function PracticeWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The lobby is the first screen.
  const [flow, setFlow] = useState<FlowState>(() => createFlowState("lobby"));
  const [durationSeconds, setDurationSeconds] = useState<PracticeDuration>(180);
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
  const [moveFocus, setMoveFocus] = useState(false);
  const [subject, setSubject] = useState<BriefingSubject | null>(null);
  const briefingDrafts = useBriefingDrafts();
  const [situations, setSituations] = useState<{ status: "loading" | "ready" | "error"; items: PersonSituation[] }>({ status: "ready", items: [] });
  const [practicedPresets, setPracticedPresets] = useState<SessionPreset[]>([]);
  // Set when a draft was generated around a saved person: the start sends the person's id and the
  // reviewed situation, never identity fields.
  const [draftPerson, setDraftPerson] = useState<Person | null>(null);
  const lastDraftRef = useRef<DraftRequest | null>(null);
  const [reviewRole, setReviewRole] = useState<RoleContext>(emptyRole);
  const [stanceOptions, setStanceOptions] = useState<StanceOptions | undefined>();
  // The person's shared About-me facts as text, for the Meet card's "Knows" list only.
  const [sharedFactTexts, setSharedFactTexts] = useState<string[]>([]);
  // The green room's chosen microphone, for the call controller once it accepts a device id.
  const micHandoffRef = useRef<MediaHandoff | null>(null);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [setupMode, setSetupMode] = useState<SetupMode>("manual");
  const [examplePreset, setExamplePreset] = useState<SessionPreset | null>(null);
  const [generateError, setGenerateError] = useState<{ message: string; outOfScope: boolean } | null>(null);
  const [callInfo, setCallInfo] = useState({ name: "", goal: "" });
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleStatus, setPeopleStatus] = useState<"loading" | "ready" | "error">("loading");
  const [savedPerson, setSavedPerson] = useState<Person | null>(null);
  const [callOrigin, setCallOrigin] = useState<CallOrigin | null>(null);
  const [saveOffer, setSaveOffer] = useState<SaveOffer>(closedOffer);
  // The provider transcript for the current attempt only; never logged or persisted.
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  // Captions, speaking glow and network quality for the call screen only; never stored.
  const [liveCall, setLiveCall] = useState<LiveCallState>(initialLiveCallState);
  const [reflect, setReflect] = useState<ReflectState>(closedReflect);
  const reflectGenerationRef = useRef(0);
  const reflectingRef = useRef(false);
  const generationRef = useRef(0);
  const draftStream = useStreamedDraft({
    onDone: (draft) => { setReviewRole(draft.role); setStanceOptions(draft.stanceOptions); setAssumptions(draft.assumptions); setSetupMode("generated"); setExamplePreset(null); },
    onError: (error) => { if (error.code === "UNAUTHENTICATED") handleAuthLoss(); },
  });
  const generating = draftStream.progress.step === "reading" || draftStream.progress.step === "shaping";

  // Refs carry the authoritative call state so media/auth callbacks never act on stale renders.
  const flowRef = useRef(flow);
  const controllerRef = useRef<MediaController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const attemptRef = useRef(0);
  const startingRef = useRef(false);
  const startedAtRef = useRef(0);
  const plannedDurationRef = useRef<PracticeDuration>(180);
  const authLostRef = useRef(false);
  // Chosen once per mount, on the client only, so the test-media notice never differs from the server render.
  const mediaRef = useRef<ReturnType<typeof selectMediaController> | null>(null);
  const [testMedia, setTestMedia] = useState(false);
  const backToSetupRef = useRef<HTMLButtonElement>(null);

  // One flow event. The reducer decides the stage and what leaving it must release; the shell
  // performs the release, because a tracked close and a keepalive abandon are different requests.
  function apply(event: FlowEvent) {
    const transition = reduceFlow(flowRef.current, event);
    flowRef.current = transition.state;
    setFlow(transition.state);
    if (transition.clearPrivate) clearPrivateState();
    return transition;
  }

  // A stage change the user asked for: move focus to the new heading and drop the old notice.
  function showStage(event: FlowEvent) {
    apply(event);
    setMoveFocus(true);
    setSetupMessage("");
  }

  // Back to the briefing from the Meet card. Idempotent.
  function returnToBriefing() {
    if (flowRef.current.stage === "meet") apply({ type: "back" });
  }

  function returnToLobby() {
    returnToBriefing();
    if (flowRef.current.stage === "briefing") apply({ type: "back" });
    setSubject(null);
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
    setLiveCall(initialLiveCallState);
  }

  // Wrap-up, ask-to-wait and typed turns: fixed templates plus the reviewed name, or the user's typed turn.
  function sendInteraction(interaction: Interaction) {
    return controllerRef.current?.send?.(interaction) ?? false;
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

  // Ends the practice session when the flow says this transition owns it. The id is set in the
  // same step as the flag, and is checked too, so leaving a stage can never leak a session.
  function endForTeardown(teardown: Teardown, reason: EndReason, mode: "close" | "abandon") {
    if (!teardown.endSession && !sessionIdRef.current) return;
    const id = takeSessionId();
    if (!id) return;
    if (mode === "close") closeRemote(id, reason);
    else void endSession(id, reason, { keepalive: true }).catch(() => undefined);
  }

  function finish(reason: "user" | "time_limit") {
    const before = flowRef.current;
    const { teardown, changed } = apply({ type: "ended" });
    if (!changed) return;
    if (teardown.releaseMic) releaseMedia();
    if (reason === "time_limit") setCallMessage("Time’s up. The practice reached its planned length.");
    else setCallMessage(before.outcome === "interrupted" ? "The call was interrupted before it ended." : "");
    endForTeardown(teardown, reason, "close");
  }

  function interrupt(message: string) {
    const { teardown, changed } = apply({ type: "ended", interrupted: true });
    if (!changed) return;
    if (teardown.releaseMic) releaseMedia();
    setCallMessage(`${message} You can end practice and start again.`);
    endForTeardown(teardown, "connection_failure", "close");
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
        if (!apply({ type: "videoPlaying" }).changed) return;
        startedAtRef.current = Date.now();
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
    clearPrivateState();
    generationRef.current++;
    briefingDrafts.clear(); setSubject(null); setSituations({ status: "ready", items: [] });
    setDraftPerson(null); lastDraftRef.current = null;
    draftStream.cancel(); setStanceOptions(undefined); setSharedFactTexts([]); micHandoffRef.current = null;
    setReviewRole(emptyRole); setAssumptions([]); setSetupMode("manual");
    setGenerateError(null); setCallInfo({ name: "", goal: "" });
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

  // P3: every pick opens the briefing. Re-entering the same subject in this sitting keeps the
  // goal and hard-moment line; a different subject is a new sitting and clears them.
  function openBriefing(next: BriefingSubject, notice = "") {
    returnToLobby();
    const resume = !!subject && briefingKey(subject) === briefingKey(next);
    showStage(next.kind === "new" ? { type: "pickSomeoneNew", resume } : { type: "pickPerson", resume });
    setSubject(next); setSavedPerson(null); setDraftPerson(null);
    setGenerateError(null); setHeaderMessage(""); setPreviousSessionId(null); setSetupMessage(notice);
    setSharedFactTexts([]);
    if (next.kind !== "person") return;
    const shared = new Set(next.person.sharedFactIds);
    if (shared.size) listFacts().then((facts) => setSharedFactTexts(facts.filter((fact) => shared.has(fact.id)).map((fact) => fact.text)), () => undefined);
    setSituations({ status: "loading", items: [] });
    listPersonSituations(next.person.id).then(
      (items) => setSituations({ status: "ready", items }),
      (error) => { if (isAuthError(error)) handleAuthLoss(); else setSituations({ status: "error", items: [] }); });
  }

  async function openPerson(personId: string, notice = "") {
    try {
      openBriefing({ kind: "person", person: await getPerson(personId) }, notice);
    } catch (error) {
      if (isAuthError(error)) { handleAuthLoss(); return; }
      setSavedPerson(null); returnToLobby();
      setHeaderMessage(error instanceof SessionClientError && error.code === "NOT_FOUND" ? "That saved person wasn’t found." : "We couldn’t load that person. Please try again.");
      void loadPeople();
    }
  }

  // Meet's Back for a saved person: the briefing for the same person, with what was typed kept.
  function leavePerson() {
    setSavedPerson(null); setSetupMessage("");
    returnToBriefing();
    setMoveFocus(true);
    if (searchParams.get("person")) router.replace("/practice", { scroll: false });
  }

  function handleAuthLoss() {
    if (authLostRef.current) return;
    authLostRef.current = true;
    const { teardown } = apply({ type: "authLost" });
    // Unconditional: this also invalidates a start request that is still in flight.
    releaseMedia();
    endForTeardown(teardown, "auth_loss", "abandon");
    clearPrivateSetup();
    setPeople([]);
    setCallMessage(""); setSetupMessage(""); setCleanup(null); setCleanupTarget(null); setPreviousSessionId(null);
    routeToSignIn();
  }

  // U1: the Meet card shows at once and fills as fields stream in.
  function generate(request: DraftRequest) {
    if (generating || authLostRef.current) return;
    generationRef.current++;
    lastDraftRef.current = request;
    const person = subject?.kind === "person" && request.personId === subject.person.id ? subject.person : null;
    setGenerateError(null); setSetupMessage("");
    setReviewRole(emptyRole); setStanceOptions(undefined); setAssumptions([]); setSetupMode("generated"); setExamplePreset(null);
    setDraftPerson(person);
    draftStream.start(request);
    showStage({ type: "draftReady" });
  }

  // "Set up the scene" (P3). Only a draft plan calls the setup model.
  function setUp(plan: BriefingPlan) {
    if (generating || signingOut) return;
    switch (plan.kind) {
      case "preset": applyExample(plan.preset); return;
      case "person-default":
      case "person-situation":
        if (subject?.kind !== "person") return;
        setSavedPerson(subject.person); setDraftPerson(null); draftStream.cancel(); setStanceOptions(undefined);
       
        setReviewRole(personRole(subject.person, plan.kind === "person-situation" ? plan.situation : undefined));
        showStage({ type: "draftReady" });
        return;
      case "draft": generate(plan.request); return;
    }
  }

  function applyExample(preset: SessionPreset) {
    if (generating) return;
    const example = examples[preset];
    draftStream.cancel(); setStanceOptions(undefined);
    if (!readPrivateState().goal.trim()) updatePrivateState({ goal: example.goal });
    setReviewRole(example.role); setAssumptions([]); setSetupMode("example"); setExamplePreset(preset); setGenerateError(null);
    showStage({ type: "draftReady" });
  }

  function backToDescribe() {
    if (generating) return;
    setGenerateError(null);
    returnToBriefing();
    setMoveFocus(true); setSetupMessage("");
  }

  // Called from the green room once the microphone is released to the call.
  function start() {
    const role = parseReviewedRole(reviewRole);
    if (!role) return;
    const goal = readPrivateState().goal.trim() || FALLBACK_GOAL;
    const person = savedPerson ?? draftPerson;
    if (person) {
      // Only the person's id, version and (when changed) the scene leave the browser; identity comes from the server.
      const situation: Situation | undefined = draftPerson || personStartSituation(person, role) === "custom" ? situationFromRole(role) : undefined;
      void launch({ kind: "person", person }, goal, (idempotencyKey) => startSavedPersonSession({ personId: person.id, expectedVersion: person.version, situation, durationSeconds, idempotencyKey }));
      return;
    }
    const preset = examplePreset && setupMode === "example" && JSON.stringify(role) === JSON.stringify(roleContextSchema.parse(examples[examplePreset].role)) ? examplePreset : null;
    void launch({ kind: "role", role }, goal, (idempotencyKey) => preset
      ? startPresetSession({ preset, durationSeconds, idempotencyKey })
      : startSession({ role, durationSeconds, idempotencyKey }));
  }

  async function launch(origin: CallOrigin, goal: string, request: (idempotencyKey: string) => Promise<StartResponse>) {
    if (startingRef.current || controllerRef.current || sessionIdRef.current || authLostRef.current || generating) return;
    startingRef.current = true;
    plannedDurationRef.current = durationSeconds;
    const attempt = ++attemptRef.current;
    const reflectGoal = readPrivateState().goal.trim();
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
      setCallInfo({ name: origin.kind === "role" ? origin.role.name : origin.person.name, goal });
      setCallOrigin(origin); setSaveOffer({ ...closedOffer, open: true });
      setReflect({ ...closedReflect, sessionId: session.id, goal: reflectGoal });
      setMutedState(false); setCameraEnabled(false); setCameraNote(""); setElapsedSeconds(0); setCallMessage(""); setCleanup(null); setCleanupTarget(null);
      // Ringing starts on acceptance, so a failed start stays in the green room with its message.
      apply({ type: "ready" });
      apply({ type: "sessionAccepted" });
      const media = mediaRef.current ??= selectMediaController();
      setTestMedia(media.testMode);
      setLiveCall(initialLiveCallState);
      const controller = media.create((event) => handleMediaEvent(attempt, event), (event) => {
        if (attempt === attemptRef.current) setLiveCall((state) => reduceLiveCall(state, event));
      });
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

  // The green room's Back: release the microphone and return to the Meet card.
  function leaveGreenRoom() {
    const { teardown } = apply({ type: "back" });
    if (teardown.releaseMic) releaseMedia();
    endForTeardown(teardown, "user", "close");
    setSetupMessage(""); setPreviousSessionId(null);
    setMoveFocus(true);
  }

  function backToSetup() {
    const origin = callOrigin;
    const { teardown } = apply({ type: "back" });
    if (teardown.releaseMic) releaseMedia();
    endForTeardown(teardown, "user", "close");
    setCallMessage(""); setCleanup(null); setCleanupTarget(null); setSetupMessage("");
    setCallOrigin(null); setSaveOffer(closedOffer);
    clearReflection();
    if (origin?.kind === "person") { void openPerson(origin.person.id); return; }
    setMoveFocus(true);
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
    setSaveOffer({ ...saveOffer, saving: true, error: "" });
    // A failed list load can't rule out a same-named person, so check a fresh list before creating.
    const list = peopleStatus === "ready" ? people : await loadPeople();
    if (authLostRef.current) return;
    if (!list) { setSaveOffer((offer) => ({ ...offer, saving: false, error: "We couldn’t check your saved people, so nothing was saved. Please try again." })); return; }
    const match = list.find((person) => sameName(person.name, callOrigin.role.name));
    if (match && peopleStatus !== "ready") { setSaveOffer((offer) => ({ ...offer, saving: false, error: `You already saved someone named ${match.name}. Choose Update to apply this call’s setup.` })); return; }
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

  function dismissSave() {
    setSaveOffer(closedOffer);
    backToSetupRef.current?.focus();
  }

  async function signOut() {
    setSigningOut(true); setHeaderMessage("");
    authLostRef.current = true;
    // The transition is read now for its teardown but committed after the requests, so the screen
    // only changes once sign-out resolves, exactly as it does today.
    const transition = reduceFlow(flowRef.current, { type: "signOut" });
    const commit = () => { flowRef.current = transition.state; setFlow(transition.state); };
    // Unconditional: this also invalidates a start request that is still in flight.
    releaseMedia();
    clearPrivateSetup();
    if (transition.teardown.endSession || sessionIdRef.current) {
      const id = takeSessionId();
      if (id) await endSession(id, "auth_loss").catch(() => undefined);
    }
    try {
      const { error } = await createBrowserAuthClient().auth.signOut();
      if (error) { authLostRef.current = false; commit(); setHeaderMessage("Could not sign out. Please try again."); return; }
      commit();
      routeToSignIn();
    } catch {
      authLostRef.current = false; commit(); setHeaderMessage("Could not sign out. Please try again.");
    } finally { setSigningOut(false); }
  }

  const phase = callPhase(flow);
  const live = flow.stage === "call" || flow.stage === "retry-call";
  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const planned = plannedDurationRef.current;
      setElapsedSeconds(Math.min(elapsed, planned));
      if (elapsed >= planned) finish("time_limit");
    }, 250);
    return () => window.clearInterval(timer);
    // finish only touches refs and state setters, so the first-render closure is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // The people list backs both the home cards and the same-name check after End.
  const peopleWanted = flow.stage === "lobby" || flow.stage === "briefing" || ((flow.stage === "recap" || flow.stage === "retry-recap") && flow.outcome === "ended");
  useEffect(() => {
    if (!peopleWanted) return;
    void loadPeople();
    // loadPeople only touches refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleWanted]);

  useEffect(() => {
    mediaRef.current ??= selectMediaController();
    setTestMedia(mediaRef.current.testMode);
    // W10 history orders the starters; until its route exists the lobby simply has none.
    getPracticeHistory().then(setPracticedPresets, () => undefined);
  }, []);

  useEffect(() => {
    const personId = searchParams.get("person");
    if (personId) void openPerson(personId);
    // Read once on arrival from a person page; later selections happen in state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPageHide = () => {
      clearReflection();
      const { teardown } = apply({ type: "pageHide" });
      if (!controllerRef.current && !sessionIdRef.current) return;
      releaseMedia();
      endForTeardown(teardown, "navigation", "abandon");
    };
    // A back/forward-cache restore may follow a sign-out elsewhere; never resurface private setup text.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      clearPrivateSetup();
      // Only the setup screens start over, as they do today; a finished call screen stays put.
      if (!callPhase(flowRef.current)) {
        const state = createFlowState("lobby");
        flowRef.current = state;
        setFlow(state);
      }
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    const { data } = createBrowserAuthClient().auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") handleAuthLoss(); });
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      data.subscription.unsubscribe();
      releaseMedia();
      const id = takeSessionId();
      if (id) void endSession(id, "navigation", { keepalive: true }).catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMessage = [callMessage, cameraNote, phase === "ended" || phase === "interrupted" ? cleanupMessage(cleanup) : ""].filter(Boolean).join(" ");
  const canRetryCleanup = !!cleanupTarget && !!cleanup && cleanup.state !== "closing" && !(cleanup.state === "closed" && cleanup.cleanup === "confirmed");
  const meetPerson = savedPerson ?? draftPerson;
  const meetStart: MeetStart = meetPerson
    ? { kind: "person", person: meetPerson, sharedFacts: sharedFactTexts, situation: draftPerson ? "custom" : personStartSituation(meetPerson, reviewRole) }
    : examplePreset && setupMode === "example" && JSON.stringify(roleContextSchema.safeParse(reviewRole).data) === JSON.stringify(roleContextSchema.parse(examples[examplePreset].role))
      ? { kind: "preset", preset: examplePreset } : { kind: "role" };
  const meetState: MeetState = setupMode === "generated" && draftStream.progress.step !== "idle"
    ? meetStateFromProgress(draftStream.progress, draftStream.progress.step === "ready" ? reviewRole : null)
    : { status: "ready", role: reviewRole, stanceOptions };
  const portraitSrc = examplePreset && !meetPerson ? starterPortraitPath(examplePreset) : null;
  const meetName = meetPerson?.name ?? (meetState.status === "ready" ? meetState.role.name : meetState.status === "streaming" ? meetState.partialRole?.name ?? "" : reviewRole.name);
  const meetRelationship = meetPerson?.relationship ?? reviewRole.role;

  return <><WorkspaceHeader page="practice" signingOut={signingOut} onSignOut={() => void signOut()} quiet={phase !== null} />
    <main id="main">
      {headerMessage && <p role="status" className="notice">{headerMessage}</p>}
      {phase === null ? (flow.stage === "meet"
        ? <MeetCard identity={{ name: meetName, relationship: meetRelationship, portraitSrc }} state={meetState} onRoleChange={setReviewRole}
            editable={meetPerson ? "situation" : "all"} start={meetStart} privateNotes={lastDraftRef.current?.privateNotes ?? ""}
            durationSeconds={durationSeconds} onDurationChange={setDurationSeconds}
            onBack={() => { draftStream.cancel(); if (savedPerson) leavePerson(); else backToDescribe(); }}
            onCall={() => showStage({ type: "toGreenRoom" })}
            onRetry={lastDraftRef.current ? () => { const request = lastDraftRef.current; if (request) draftStream.start(request); } : undefined}
            disabled={signingOut} disabledReason="Signing you out…" focusHeading={moveFocus} />
        : flow.stage === "green"
          ? <GreenRoom name={meetName} relationship={meetRelationship} portraitSrc={portraitSrc}
              onBack={leaveGreenRoom} onReady={(handoff) => { micHandoffRef.current = handoff; start(); }}
              starting={starting} startError={setupMessage || null} disabled={signingOut || endingPrevious} disabledReason={signingOut ? "Signing you out…" : "Ending the previous practice…"} focusHeading={moveFocus}
              extras={previousSessionId ? <button type="button" className="button secondary" onClick={() => void endPrevious()} disabled={endingPrevious}>{endingPrevious ? "Ending the previous practice…" : "End the previous practice"}</button> : undefined} />
        : flow.stage === "briefing" && subject
          ? <Briefing subject={subject} draft={briefingDrafts.draftFor(subject)} onDraftChange={(patch) => briefingDrafts.update(subject, patch)}
              situations={subject.kind === "person" ? situations : undefined} onBack={() => { showStage({ type: "back" }); }} onSetUp={setUp}
              generating={generating} error={generateError} disabled={signingOut} disabledReason="Signing you out…" focusHeading={moveFocus} />
          : <Lobby people={people} status={peopleStatus} practicedPresets={practicedPresets} onRetry={() => void loadPeople()}
              onPickPerson={(person) => openBriefing({ kind: "person", person })} onPickStarter={(preset) => openBriefing({ kind: "starter", preset })}
              onSomeoneNew={() => openBriefing({ kind: "new" })}
              onAddStarter={async (preset) => { await createPerson(roleToPersonFields(examples[preset].role)); await loadPeople(); }}
              onEditPerson={(person) => router.push(`/practice/people/${encodeURIComponent(person.id)}`)}
              onDeletePerson={async (person) => { await deletePerson(person.id); await loadPeople(); }}
              disabled={signingOut || generating} disabledReason="Please wait a moment." focusHeading={moveFocus} notice={setupMessage || undefined} />
      ) : <>
        <CallStage counterpartName={callInfo.name} goal={callInfo.goal} phase={phase} muted={muted} cameraEnabled={cameraEnabled} elapsedSeconds={elapsedSeconds} durationSeconds={plannedDurationRef.current}
          remoteStream={remoteStream} localStream={localStream}
          onMuteToggle={toggleMute} onCameraToggle={() => void toggleCamera()} onEnd={() => finish("user")} statusMessage={statusMessage} testMedia={testMedia} turns={turns}
          live={liveCall} onInteraction={sendInteraction} onCancel={backToSetup} />
        {(phase === "ended" || phase === "interrupted") && <RecapStage ended={phase === "ended"} origin={callOrigin} saveOffer={saveOffer} people={people} peopleStatus={peopleStatus}
          onSave={() => void saveFromCall()} onDismissSave={dismissSave} reflect={reflect} turns={turns}
          onSelfReflectionChange={(selfReflection) => setReflect((state) => ({ ...state, selfReflection }))} onReflect={() => void requestReflectionNow()} onReflectionDone={clearReflection}
          canRetryCleanup={canRetryCleanup} onRetryCleanup={() => cleanupTarget && closeRemote(cleanupTarget.id, cleanupTarget.reason)} onBackToSetup={backToSetup} backToSetupRef={backToSetupRef} />}
      </>}
    </main></>;
}
