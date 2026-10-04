"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { LifeBuoy, PhoneOff, X } from "lucide-react";
import { ShortcutList } from "./call-shortcuts";
import styles from "./call.module.css";

type SheetProps = {
  title: string;
  onClose: () => void;
  // Fullscreen calls open a modal dialog (focus is held inside, Esc closes). The design gallery renders it in place.
  modal: boolean;
  children: ReactNode;
  icon?: ReactNode;
};

function CallSheet({ title, onClose, modal, children, icon }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !modal) return;
    if (!dialog.open) dialog.showModal?.();
    return () => { if (dialog.open) dialog.close(); };
  }, [modal]);
  return (
    <dialog ref={ref} className={styles.sheet} data-inline={!modal || undefined} open={modal ? undefined : true} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => { if (!modal && event.key === "Escape") { event.preventDefault(); onClose(); } }}>
      <div className={styles.sheetHeader}>
        {icon}
        <h2 id={titleId} className={styles.sheetTitle}>{title}</h2>
        <button type="button" className={styles.sheetClose} onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}><X size={20} strokeWidth={1.75} aria-hidden="true" /></button>
      </div>
      {children}
    </dialog>
  );
}

// W9: the support exit from docs/08, reachable from every call. Ending here uses the same End path as the call bar.
export function HelpSheet({ onClose, onEnd, modal }: { onClose: () => void; onEnd: () => void; modal: boolean }) {
  return (
    <CallSheet title="Help" onClose={onClose} modal={modal} icon={<LifeBuoy className={styles.sheetIcon} size={22} strokeWidth={1.75} aria-hidden="true" />}>
      <p className={styles.sheetText}>You can stop at any time. If something in this conversation is weighing on you, please reach out to someone you trust or a support line.</p>
      <p className={styles.sheetText}>If you’re in immediate danger, call 911. In the US you can call or text 988 to reach the Suicide &amp; Crisis Lifeline.</p>
      <p className={styles.sheetNote}>This is a practice call with a fictional AI character.</p>
      <div className={styles.sheetActions}>
        <button type="button" className={styles.sheetSecondary} onClick={onClose}>Keep practicing</button>
        <button type="button" className={styles.sheetDanger} onClick={onEnd}><PhoneOff size={20} strokeWidth={1.75} aria-hidden="true" />End practice now</button>
      </div>
    </CallSheet>
  );
}

export function EndConfirmSheet({ name, onClose, onEnd, modal }: { name: string; onClose: () => void; onEnd: () => void; modal: boolean }) {
  return (
    <CallSheet title={`End the call with ${name}?`} onClose={onClose} modal={modal}>
      <p className={styles.sheetText}>The practice ends for good. You can start a new one afterwards.</p>
      <div className={styles.sheetActions}>
        <button type="button" className={styles.sheetSecondary} onClick={onClose} autoFocus>Keep talking</button>
        <button type="button" className={styles.sheetDanger} onClick={onEnd}><PhoneOff size={20} strokeWidth={1.75} aria-hidden="true" />End call</button>
      </div>
    </CallSheet>
  );
}

export function ShortcutsSheet({ onClose, modal }: { onClose: () => void; modal: boolean }) {
  return (
    <CallSheet title="Keyboard shortcuts" onClose={onClose} modal={modal}>
      <ShortcutList />
      <p className={styles.sheetNote}>Shortcuts never fire while you’re typing in a field.</p>
    </CallSheet>
  );
}
