"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PersonEditor, emptyPerson, parsePersonDraft } from "@/components/presentation/people-editor";
import { PeopleHeader } from "@/components/presentation/people-list";
import { KnowsAboutYou, NeverShared } from "@/components/presentation/people-sharing";
import styles from "@/components/presentation/people.module.css";
import { createBrowserAuthClient } from "@/lib/auth/browser";
import { SessionClientError, createPerson, deletePerson, getPerson, getPrivatePrep, listFacts, pickPersonFields, savePrivatePrep, setSharedFacts, updatePerson } from "@/lib/people/api-client";
import type { AboutMeFact, Person, PersonFields } from "@/lib/schemas/people";

const CONFLICT = "This person was changed somewhere else, so nothing was saved. Your edits are still here. Load the latest version to see the saved copy; that replaces your unsaved edits.";
const codeOf = (error: unknown) => (error instanceof SessionClientError ? error.code : null);
type Message = { status?: string; error?: string; conflict?: boolean };

export function PersonWorkspace({ personId }: { personId: string | null }) {
  const router = useRouter();
  const isNew = personId === null;
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing" | "error">(isNew ? "ready" : "loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [person, setPerson] = useState<Person | null>(null);
  const [fields, setFields] = useState<PersonFields>(emptyPerson);
  const [facts, setFacts] = useState<AboutMeFact[]>([]);
  const [factsError, setFactsError] = useState("");
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [message, setMessage] = useState<Message>({});
  const [notesMessage, setNotesMessage] = useState<Message>({});
  const [announcement, setAnnouncement] = useState("");

  function authLost() {
    setNotes(""); setSavedNotes(""); setFields(emptyPerson); setPerson(null);
    router.replace("/auth/sign-in");
    router.refresh();
  }
  function applyPerson(next: Person) { setPerson(next); setFields(pickPersonFields(next)); }

  useEffect(() => {
    let live = true;
    void Promise.allSettled([personId ? getPerson(personId) : Promise.resolve(null), listFacts(), getPrivatePrep()]).then(([personResult, factsResult, prepResult]) => {
      if (!live) return;
      if ([personResult, factsResult, prepResult].some((result) => result.status === "rejected" && codeOf(result.reason) === "UNAUTHENTICATED")) { authLost(); return; }
      if (personResult.status === "rejected") setLoadState(codeOf(personResult.reason) === "NOT_FOUND" ? "missing" : "error");
      else { if (personResult.value) applyPerson(personResult.value); setLoadState("ready"); }
      if (factsResult.status === "fulfilled") { setFacts(factsResult.value); setFactsError(""); } else setFactsError("We couldn’t load your About-me facts.");
      if (prepResult.status === "fulfilled") { setNotes(prepResult.value.notes); setSavedNotes(prepResult.value.notes); } else setNotesMessage({ error: "We couldn’t load your private notes." });
    });
    const { data } = createBrowserAuthClient().auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") authLost(); });
    return () => { live = false; data.subscription.unsubscribe(); };
    // authLost and applyPerson only use state setters and the router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, reloadKey]);

  const dirty = isNew || !person || JSON.stringify(pickPersonFields(fields)) !== JSON.stringify(pickPersonFields(person));
  const name = person?.name ?? "this person";

  async function save() {
    const parsed = parsePersonDraft(fields);
    if (!parsed || saving) return;
    setSaving(true); setMessage({});
    try {
      if (!person) { const created = await createPerson(parsed); router.replace(`/practice/people/${created.id}`); return; }
      applyPerson(await updatePerson(person.id, parsed, person.version));
      setMessage({ status: "Saved. Future practices use this version." });
    } catch (error) {
      const code = codeOf(error);
      if (code === "UNAUTHENTICATED") { authLost(); return; }
      if (code === "VERSION_CONFLICT") setMessage({ error: CONFLICT, conflict: true });
      else if (code === "NOT_FOUND") setMessage({ error: "This person no longer exists. Nothing was saved." });
      else if (code === "USAGE_LIMIT" && error instanceof SessionClientError) setMessage({ error: error.message });
      else setMessage({ error: "We couldn’t save. Your edits are still here; please try again." });
    } finally { setSaving(false); }
  }

  async function reload() {
    if (!person) return;
    try { applyPerson(await getPerson(person.id)); setMessage({ status: "Loaded the latest saved version." }); }
    catch (error) { if (codeOf(error) === "UNAUTHENTICATED") authLost(); else setMessage({ error: "We couldn’t load the latest version. Please try again.", conflict: true }); }
  }

  async function toggleShare(factId: string, share: boolean) {
    const fact = facts.find((item) => item.id === factId);
    if (!person || !fact || sharing) return;
    const next = share ? [...person.sharedFactIds, factId] : person.sharedFactIds.filter((item) => item !== factId);
    // Cleared rather than "Sharing…" so each move is announced once, even when the result text repeats.
    setSharing(true); setAnnouncement("");
    try {
      // Only the version and shared set change; unsaved field edits stay in the form.
      setPerson(await setSharedFacts(person.id, next, person.version));
      setAnnouncement(share ? `Shared “${fact.text}” with ${name}.` : `Stopped sharing “${fact.text}” with ${name}.`);
    } catch (error) {
      const code = codeOf(error);
      if (code === "UNAUTHENTICATED") { authLost(); return; }
      if (code === "VERSION_CONFLICT") { setMessage({ error: CONFLICT, conflict: true }); setAnnouncement("Sharing didn’t change because this person was changed somewhere else."); }
      else if (code === "VALIDATION_ERROR") { setAnnouncement("Sharing didn’t change because that fact no longer exists."); void listFacts().then(setFacts, () => undefined); }
      else setAnnouncement("Sharing didn’t change. Please try again.");
    } finally { setSharing(false); }
  }

  async function saveNotes() {
    if (notesSaving) return;
    setNotesSaving(true); setNotesMessage({});
    try {
      const prep = await savePrivatePrep(notes.trim());
      setNotes(prep.notes); setSavedNotes(prep.notes);
      setNotesMessage({ status: prep.notes ? "Private notes saved. They are never shared." : "Private notes cleared." });
    } catch (error) {
      if (codeOf(error) === "UNAUTHENTICATED") { authLost(); return; }
      setNotesMessage({ error: "We couldn’t save your private notes. They are still here; please try again." });
    } finally { setNotesSaving(false); }
  }

  async function remove() {
    if (!person || deleting) return;
    setDeleting(true); setMessage({});
    try { await deletePerson(person.id); router.push("/practice"); }
    catch (error) {
      const code = codeOf(error);
      if (code === "UNAUTHENTICATED") { authLost(); return; }
      if (code === "NOT_FOUND") { router.push("/practice"); return; }
      setMessage({ error: "We couldn’t delete this person. Please try again." });
      setDeleting(false);
    }
  }

  return <><PeopleHeader />
    <main id="main"><div className={styles.page}>
      {loadState === "loading" && <p className={styles.meta} role="status">Loading this person…</p>}
      {(loadState === "missing" || loadState === "error") && <div className={styles.heading} role="alert">
        <h1>{loadState === "missing" ? "Person not found." : "We couldn’t load this person."}</h1>
        <div className="actions">
          {loadState === "error" && <button type="button" className="button" onClick={() => { setLoadState("loading"); setReloadKey((key) => key + 1); }}>Try again</button>}
          <Link className="button secondary" href="/practice">Back to practice</Link>
        </div>
      </div>}
      {loadState === "ready" && <>
        <PersonEditor fields={fields} onChange={setFields} isNew={isNew} savedName={person?.name} version={person?.version} updatedAt={person?.updatedAt}
          dirty={dirty} saving={saving} busy={sharing} onSave={() => void save()} onDelete={person ? () => void remove() : undefined} deleting={deleting}
          conflict={message.conflict} onReload={() => void reload()} statusMessage={message.status} errorMessage={message.error}
          practiceHref={person ? `/practice?person=${person.id}` : undefined} />
        <KnowsAboutYou personName={name} facts={facts} sharedIds={person?.sharedFactIds ?? []} onToggle={(factId, share) => void toggleShare(factId, share)}
          disabled={!person || deleting} disabledReason={!person ? "Save this person first, then choose what they know about you." : factsError || undefined} announcement={announcement} />
        <NeverShared notes={notes} onChange={setNotes} onSave={() => void saveNotes()} saving={notesSaving} dirty={notes.trim() !== savedNotes} statusMessage={notesMessage.status} errorMessage={notesMessage.error} />
      </>}
    </div></main></>;
}
