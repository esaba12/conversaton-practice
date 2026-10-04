"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Ellipsis, Plus } from "lucide-react";
import { motionTransition } from "@/lib/ui/motion";
import { Portrait } from "./portrait";
import styles from "./person-card.module.css";

export type PersonCardAction = { label: string; onSelect: () => void; tone?: "danger" };

export type PersonCardProps = {
  variant: "saved" | "starter" | "new";
  name: string;
  relationship?: string;
  /** Up to three short descriptors; extra ones are dropped. */
  traits?: readonly string[];
  /** One small line, e.g. "Knows 2 things about you". */
  meta?: string;
  /** Face still; the monogram shows when missing or when it fails to load. */
  portraitSrc?: string | null;
  /** "Start here" highlight for the first run. */
  highlight?: boolean;
  onOpen: () => void;
  /** Edit, delete, "Add to my people". Rendered behind a separate "More" button. */
  actions?: readonly PersonCardAction[];
  disabled?: boolean;
  disabledReason?: string;
  /** Marks the main hit target so the lobby can move focus between cards with arrow keys. */
  onCardKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
};

export function personCardLabel(variant: PersonCardProps["variant"], name: string, relationship?: string): string {
  if (variant === "new") return "Practice with someone new";
  return relationship ? `Practice with ${name}, ${relationship}` : `Practice with ${name}`;
}

export function PersonCard({
  variant, name, relationship, traits = [], meta, portraitSrc, highlight = false, onOpen, actions = [], disabled = false, disabledReason, onCardKeyDown, children,
}: PersonCardProps) {
  const reduced = useReducedMotion();
  const baseId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const reasonId = `${baseId}-reason`;
  const isNew = variant === "new";
  const cta = isNew ? "Start" : `Practice with ${name}`;

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !moreRef.current?.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    moreRef.current?.focus();
  }

  return (
    <motion.article
      className={styles.card}
      data-variant={variant}
      data-highlight={highlight || undefined}
      whileHover={disabled || reduced ? undefined : { y: -4 }}
      transition={motionTransition("lift", reduced)}
    >
      <button
        type="button"
        className={styles.hit}
        aria-label={personCardLabel(variant, name, relationship)}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? reasonId : undefined}
        data-lobby-card
        onClick={() => { if (!disabled) onOpen(); }}
        onKeyDown={onCardKeyDown}
      >
        <span className={styles.face} aria-hidden="true">
          {isNew
            ? <span className={styles.plus}><Plus size={40} strokeWidth={1.75} /></span>
            : <Portrait name={name} size={240} src={portraitSrc} className={styles.portrait} />}
        </span>
        <span className={styles.body}>
          {highlight ? <span className={styles.badge} data-tone="accent">Start here</span>
            : variant === "starter" ? <span className={styles.badge}>Starter</span> : null}
          <span className={styles.name}>{isNew ? "Someone new" : name}</span>
          {relationship ? <span className={styles.relationship}>{relationship}</span> : null}
          {traits.length > 0 ? (
            <span className={styles.traits}>
              {traits.slice(0, 3).map((trait) => <span key={trait} className={styles.trait}>{trait}</span>)}
            </span>
          ) : null}
          {meta ? <span className={styles.meta}>{meta}</span> : null}
          <span className={styles.cta}>{cta}</span>
        </span>
      </button>
      {disabled ? <span id={reasonId} className={styles.reason}>{disabledReason?.trim() || "This isn't available right now."}</span> : null}
      {actions.length > 0 ? (
        <>
          <button
            ref={moreRef}
            type="button"
            className={styles.more}
            aria-label={`More for ${name}`}
            aria-expanded={menuOpen}
            aria-controls={`${baseId}-menu`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Ellipsis size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          {menuOpen ? (
            <ul
              ref={menuRef}
              id={`${baseId}-menu`}
              className={styles.menu}
              aria-label={`Actions for ${name}`}
              onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); closeMenu(); } }}
            >
              {actions.map((action) => (
                <li key={action.label}>
                  <button type="button" className={styles.menuItem} data-tone={action.tone} onClick={() => { setMenuOpen(false); action.onSelect(); }}>
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      {children}
    </motion.article>
  );
}

/** Same footprint as a card, shown while saved people load. Static under reduced motion. */
export function PersonCardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <span className={styles.skeletonFace} />
      <span className={styles.skeletonLine} />
      <span className={styles.skeletonLineShort} />
    </div>
  );
}
