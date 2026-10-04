"use client";

import { useId } from "react";
import { Phone, PlayCircle } from "lucide-react";
import { PrimaryButton } from "@/components/ui";
import type { StandInOffer as Offer } from "@/lib/practice/stand-in-sitting";
import styles from "./stand-in.module.css";

// W10 acceptance 1. The Meet card always offers both: the stand-in first with a new counterpart,
// the normal call first once this person has an ended practice. Skipping goes straight to the
// normal call. The goal is required for the stand-in only, and the button says why when it is missing.
export type StandInOfferProps = {
  counterpartName: string;
  offer: Offer;
  onShowMeFirst: () => void;
  onSkip: () => void;
  /** A start request is already in flight. */
  starting?: boolean;
  /** Blocks both buttons, e.g. a previous practice is still open. */
  callDisabledReason?: string;
};

export function StandInOfferButtons({ counterpartName, offer, onShowMeFirst, onSkip, starting = false, callDisabledReason }: StandInOfferProps) {
  const reasonId = `${useId()}-reason`;
  const blocked = callDisabledReason?.trim() ?? "";
  const callLabel = offer.shown ? offer.skipLabel : `Call ${counterpartName}`;

  const call = blocked
    ? <PrimaryButton label={callLabel} icon={Phone} disabled disabledReason={blocked} />
    : <PrimaryButton label={callLabel} icon={Phone} loading={starting} loadingLabel={`Calling ${counterpartName}…`} onClick={onSkip} />;

  if (!offer.shown) return <div className={styles.offer}><div className={styles.offerActions}>{call}</div></div>;

  const standInReason = blocked || offer.reason;
  const standInPrimary = standInReason
    ? <PrimaryButton label={offer.label} icon={PlayCircle} disabled disabledReason={standInReason} />
    : <PrimaryButton label={offer.label} icon={PlayCircle} loading={starting} loadingLabel="Starting…" onClick={onShowMeFirst} />;
  const standInSecondary = (
    <span className={styles.withReason}>
      <button type="button" className={styles.secondary} onClick={onShowMeFirst} disabled={standInReason !== ""} aria-describedby={standInReason ? reasonId : undefined}>
        <PlayCircle size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>{offer.label}</span>
      </button>
      {standInReason ? <span id={reasonId} className={styles.reason}>{standInReason}</span> : null}
    </span>
  );
  const skipSecondary = (
    <button type="button" className={styles.secondary} onClick={onSkip} disabled={blocked !== "" || starting}>
      <span>{offer.skipLabel}</span>
    </button>
  );

  return (
    <div className={styles.offer}>
      <div className={styles.offerActions}>
        {offer.emphasis === "primary" ? <>{standInPrimary}{skipSecondary}</> : <>{call}{standInSecondary}</>}
      </div>
      {offer.helper ? <p className={styles.helper}>{offer.helper}</p> : null}
      <p className={styles.helper}>{offer.privacyNote}</p>
    </div>
  );
}
