const CODE = /^[0-9A-HJKMNP-TV-Z]{10}$/;

export function isEndCommand(body: string): boolean {
  return /^(end|stop)$/i.test(body.trim());
}

export function isLinkCode(body: string): boolean {
  return CODE.test(body.trim());
}

export const CLOSING_LINE = "This practice has ended. Start the next one on the website, or text me when you want to pick someone.";
export const UNLINKED_LINE = "Add your number on the website first. Text practice stays locked until then.";
export const LINKED_LINE = "You're linked. Text me when you want to practice.";
export const PHONE_TAKEN_LINE = "This number is already linked. Remove it from the other account on the website first.";
export const VIDEO_BUSY_LINE = "End the call on the website first. Then text me to practice.";
export const TEXT_ONLY_LINE = "This practice is text only.";
export const SUPPORT_EXIT_LINE = "I'm stepping out of this practice. If you might be in danger, contact local emergency help or someone you trust. This practice has ended.";

const SUPPORT = [
  "kill myself",
  "killing myself",
  "want to die",
  "going to hurt myself",
  "going to hurt them",
  "going to kill",
];

// Best-effort only. A miss is not evidence that the check worked.
export function isSupportExit(body: string): boolean {
  const folded = body.toLowerCase();
  return SUPPORT.some((phrase) => folded.includes(phrase));
}
