import styles from "./call.module.css";

export type CallShortcut = "mute" | "captions" | "type" | "wait" | "end" | "shortcuts";

// docs/next/05-UI-UPGRADE.md U4. Shown in the "?" sheet in this order.
export const callShortcuts: readonly { keys: string; action: CallShortcut; label: string }[] = [
  { keys: "M", action: "mute", label: "Mute or unmute your microphone" },
  { keys: "C", action: "captions", label: "Show or hide captions" },
  { keys: "T", action: "type", label: "Type instead of speaking" },
  { keys: "W", action: "wait", label: "Ask them to wait" },
  { keys: "Esc", action: "end", label: "End the call (asks first)" },
  { keys: "?", action: "shortcuts", label: "Show these shortcuts" },
];

export type ShortcutKeyEvent = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
  defaultPrevented?: boolean;
  target?: EventTarget | null;
};

// Typing in any field never triggers a shortcut.
export function isTypingTarget(target: EventTarget | null | undefined) {
  if (!target || typeof target !== "object") return false;
  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  const tag = typeof element.tagName === "string" ? element.tagName.toUpperCase() : "";
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable === true;
}

export function shortcutFor(event: ShortcutKeyEvent): CallShortcut | null {
  if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isTypingTarget(event.target)) return null;
  switch (event.key) {
    case "m": case "M": return "mute";
    case "c": case "C": return "captions";
    case "t": case "T": return "type";
    case "w": case "W": return "wait";
    case "Escape": return "end";
    case "?": return "shortcuts";
    default: return null;
  }
}

export function ShortcutList() {
  return (
    <dl className={styles.shortcutList}>
      {callShortcuts.map((shortcut) => (
        <div key={shortcut.action} className={styles.shortcutRow}>
          <dt><kbd className={styles.kbd}>{shortcut.keys}</kbd></dt>
          <dd>{shortcut.label}</dd>
        </div>
      ))}
    </dl>
  );
}
