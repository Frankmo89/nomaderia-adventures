/**
 * Persist quiz lead id + email so buy CTAs (Stripe Payment Link) can append
 * client_reference_id / prefilled_email after the visitor finishes the quiz.
 * Browser-only; never throws.
 */

const LEAD_ID_KEY = "nomaderia_quiz_lead_id";
const EMAIL_KEY = "nomaderia_quiz_email";

function safeGet(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const v = window.localStorage.getItem(key);
    return v && v.trim() !== "" ? v.trim() : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

export function getStoredQuizLeadId(): string | null {
  return safeGet(LEAD_ID_KEY);
}

export function getStoredQuizEmail(): string | null {
  return safeGet(EMAIL_KEY);
}

export function persistQuizLead(leadId: string | null, email?: string | null): void {
  if (leadId) safeSet(LEAD_ID_KEY, leadId);
  if (email && email.trim() !== "") safeSet(EMAIL_KEY, email.trim());
}
