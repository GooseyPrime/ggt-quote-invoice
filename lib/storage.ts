import { createId } from "./ids";
import type {
  BackupPayload,
  BusinessProfile,
  LineItem,
  QuoteDoc,
  UnlockState,
} from "./types";

const QUOTES_KEY = "ggt.quote-invoice.quotes.v1";
const UNLOCK_KEY = "ggt.quote-invoice.unlock.v1";
const BUSINESS_KEY = "ggt.quote-invoice.business.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function emptyBusiness(): BusinessProfile {
  return {
    name: "",
    address: "",
    email: "",
    phone: "",
    logoDataUrl: "",
  };
}

export function emptyUnlock(): UnlockState {
  return { paid: false };
}

export function emptyLineItem(): LineItem {
  return {
    id: createId("line"),
    description: "",
    qty: 1,
    unitPrice: 0,
  };
}

export function createBlankQuote(): QuoteDoc {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  return {
    id: createId("doc"),
    status: "quote",
    title: "Untitled quote",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    date: today,
    taxPercent: 0,
    notes: "",
    items: [emptyLineItem()],
    createdAt: now,
    updatedAt: now,
  };
}

export function listQuotes(): QuoteDoc[] {
  const docs = readJson<QuoteDoc[]>(QUOTES_KEY, []);
  return [...docs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getQuote(id: string): QuoteDoc | null {
  return listQuotes().find((d) => d.id === id) ?? null;
}

export function quoteCount(): number {
  return listQuotes().length;
}

/** Persist a quote. Returns true if this was a newly created doc. */
export function saveQuote(doc: QuoteDoc): { isNew: boolean; doc: QuoteDoc } {
  const all = listQuotes();
  const idx = all.findIndex((d) => d.id === doc.id);
  const next: QuoteDoc = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    all[idx] = next;
    writeJson(QUOTES_KEY, all);
    return { isNew: false, doc: next };
  }
  all.unshift(next);
  writeJson(QUOTES_KEY, all);
  return { isNew: true, doc: next };
}

export function deleteQuote(id: string): void {
  writeJson(
    QUOTES_KEY,
    listQuotes().filter((d) => d.id !== id),
  );
}

export function convertToInvoice(id: string): QuoteDoc | null {
  const doc = getQuote(id);
  if (!doc) return null;
  const next: QuoteDoc = {
    ...doc,
    status: "invoice",
    updatedAt: new Date().toISOString(),
  };
  saveQuote(next);
  return next;
}

export function getUnlock(): UnlockState {
  return readJson<UnlockState>(UNLOCK_KEY, emptyUnlock());
}

export function isUnlocked(): boolean {
  return getUnlock().paid === true;
}

export function setUnlocked(sessionId?: string): UnlockState {
  const next: UnlockState = {
    paid: true,
    sessionId,
    unlockedAt: new Date().toISOString(),
  };
  writeJson(UNLOCK_KEY, next);
  return next;
}

export function getBusiness(): BusinessProfile {
  return readJson<BusinessProfile>(BUSINESS_KEY, emptyBusiness());
}

export function saveBusiness(profile: BusinessProfile): void {
  writeJson(BUSINESS_KEY, profile);
}

export function exportBackup(): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    quotes: listQuotes(),
    unlock: getUnlock(),
    business: getBusiness(),
  };
}

export function importBackup(payload: BackupPayload): void {
  if (!payload || payload.version !== 1) {
    throw new Error("Unsupported backup format.");
  }
  writeJson(QUOTES_KEY, Array.isArray(payload.quotes) ? payload.quotes : []);
  writeJson(
    UNLOCK_KEY,
    payload.unlock && typeof payload.unlock === "object"
      ? payload.unlock
      : emptyUnlock(),
  );
  writeJson(
    BUSINESS_KEY,
    payload.business && typeof payload.business === "object"
      ? payload.business
      : emptyBusiness(),
  );
}
