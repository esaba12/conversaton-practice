"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckinBanner, TalkedForRealMark } from "@/components/practice/checkin-banner";
import { PlannedDate } from "@/components/practice/planned-date";
import { checkinPlanned, deletePlanned, listPlanned, setPlanned, SessionClientError } from "@/lib/planned/api-client";
import { localDay, planFor, talkedForReal } from "@/lib/planned/checkin";
import type { Guess } from "@/lib/planned/input";
import type { Planned } from "@/lib/schemas/planned";

// Client wiring for B1/B2 so a host page mounts one element. Loads the owner's plans from /api/planned.
function usePlans() {
  const router = useRouter();
  const [plans, setPlans] = useState<Planned[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setToday(localDay());
    listPlanned().then((list) => { if (live) setPlans(list); }, (failure) => {
      if (!live) return;
      if (failure instanceof SessionClientError && failure.code === "UNAUTHENTICATED") router.replace("/auth/sign-in");
      else setPlans([]);
    });
    return () => { live = false; };
  }, [router]);

  const upsert = (plan: Planned) => setPlans((list) => [...(list ?? []).filter((item) => item.personId !== plan.personId), plan]);

  // Resolves true on success. Error text never includes what the user wrote.
  async function run(action: () => Promise<void>, failure: string) {
    if (busy) return false;
    setBusy(true); setError("");
    try { await action(); return true; }
    catch (caught) {
      if (caught instanceof SessionClientError && caught.code === "UNAUTHENTICATED") router.replace("/auth/sign-in");
      else setError(caught instanceof SessionClientError && caught.code === "NOT_FOUND" ? "That plan no longer exists." : failure);
      return false;
    } finally { setBusy(false); }
  }
  return { plans, today, busy, error, run, upsert, remove: (id: string) => setPlans((list) => (list ?? []).filter((item) => item.id !== id)) };
}

export function PlannedSection({ personId, personName, guess = null }: { personId: string; personName: string; guess?: Guess | null }) {
  const { plans, today, busy, error, run, upsert, remove } = usePlans();
  if (plans === null || today === null) return null;
  const plan = planFor(plans, personId);
  return <>
    {talkedForReal(plan) && <div><TalkedForRealMark /></div>}
    <CheckinBanner key={plan?.id ?? "none"} plan={plan} personName={personName} today={today} busy={busy} errorMessage={error || undefined}
      onAnswer={(answer, note) => run(async () => { if (plan) upsert(await checkinPlanned(plan.id, answer, note)); }, "We couldn’t save that. Please try again.")}
      onPickDay={(day) => run(async () => { upsert(await setPlanned({ personId, plannedOn: day, ...(plan?.label ? { label: plan.label } : {}) })); }, "We couldn’t save that day. Please try again.")} />
    <PlannedDate key={plan?.id ?? "none"} personId={personId} personName={personName} plan={plan} guess={guess} busy={busy} errorMessage={error || undefined}
      onSave={(input) => void run(async () => { upsert(await setPlanned(input)); }, "We couldn’t save the day. Please try again.")}
      onRemove={() => { if (plan) void run(async () => { await deletePlanned(plan.id); remove(plan.id); }, "We couldn’t remove the day. Please try again."); }} />
  </>;
}

// Home: one banner per saved person whose day has come. Each banner stays mounted so a "Not yet" can offer a new day.
export function HomeCheckin({ people }: { people: readonly { id: string; name: string }[] }) {
  const { plans, today, busy, error, run, upsert } = usePlans();
  if (plans === null || today === null) return null;
  return <>{plans.map((plan) => {
    const person = people.find((item) => item.id === plan.personId);
    return person ? <CheckinBanner key={plan.id} plan={plan} personName={person.name} today={today} busy={busy} errorMessage={error || undefined}
      onAnswer={(answer, note) => run(async () => { upsert(await checkinPlanned(plan.id, answer, note)); }, "We couldn’t save that. Please try again.")}
      onPickDay={(day) => run(async () => { upsert(await setPlanned({ personId: plan.personId, plannedOn: day, ...(plan.label ? { label: plan.label } : {}) })); }, "We couldn’t save that day. Please try again.")} /> : null;
  })}</>;
}
