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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Could not save data in this browser.");
  }
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
  const today = localDateString(new Date());
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
  const quotes = sanitizeQuotes(payload.quotes);
  const unlock = sanitizeUnlock(payload.unlock);
  const business = sanitizeBusiness(payload.business);
  const previous =
    canUseStorage()
      ? {
          quotes: localStorage.getItem(QUOTES_KEY),
          unlock: localStorage.getItem(UNLOCK_KEY),
          business: localStorage.getItem(BUSINESS_KEY),
        }
      : null;

  try {
    writeJson(QUOTES_KEY, quotes);
    writeJson(UNLOCK_KEY, unlock);
    writeJson(BUSINESS_KEY, business);
  } catch (error) {
    if (previous) {
      restoreRaw(QUOTES_KEY, previous.quotes);
      restoreRaw(UNLOCK_KEY, previous.unlock);
      restoreRaw(BUSINESS_KEY, previous.business);
    }
    throw error;
  }
}

function sanitizeQuotes(value: unknown): QuoteDoc[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => sanitizeQuote(entry))
    .filter((entry): entry is QuoteDoc => entry !== null);
}

function sanitizeQuote(value: unknown): QuoteDoc | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const createdAt = asString(record.createdAt) ?? new Date().toISOString();
  const updatedAt = asString(record.updatedAt) ?? createdAt;
  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => sanitizeLineItem(item))
        .filter((item): item is LineItem => item !== null)
    : [];

  return {
    id: asString(record.id) ?? createId("doc"),
    status: record.status === "invoice" ? "invoice" : "quote",
    title: asString(record.title) ?? "Untitled quote",
    clientName: asString(record.clientName) ?? "",
    clientEmail: asString(record.clientEmail) ?? "",
    clientAddress: asString(record.clientAddress) ?? "",
    date: asString(record.date) ?? localDateString(new Date()),
    taxPercent: asNumber(record.taxPercent),
    notes: asString(record.notes) ?? "",
    items: items.length > 0 ? items : [emptyLineItem()],
    createdAt,
    updatedAt,
  };
}

function sanitizeLineItem(value: unknown): LineItem | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return {
    id: asString(record.id) ?? createId("line"),
    description: asString(record.description) ?? "",
    qty: asNumber(record.qty, 1),
    unitPrice: asNumber(record.unitPrice),
  };
}

function sanitizeUnlock(value: unknown): UnlockState {
  if (!value || typeof value !== "object") return emptyUnlock();
  const record = value as Record<string, unknown>;
  return {
    paid: record.paid === true,
    sessionId: asString(record.sessionId),
    unlockedAt: asString(record.unlockedAt),
  };
}

function sanitizeBusiness(value: unknown): BusinessProfile {
  if (!value || typeof value !== "object") return emptyBusiness();
  const record = value as Record<string, unknown>;
  return {
    name: asString(record.name) ?? "",
    address: asString(record.address) ?? "",
    email: asString(record.email) ?? "",
    phone: asString(record.phone) ?? "",
    logoDataUrl: asString(record.logoDataUrl) ?? "",
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function restoreRaw(key: string, value: string | null): void {
  if (!canUseStorage()) return;
  try {
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, value);
  } catch {}
}
