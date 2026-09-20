export type DocStatus = "quote" | "invoice";

export type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
};

export type QuoteDoc = {
  id: string;
  status: DocStatus;
  title: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  date: string;
  taxPercent: number;
  notes: string;
  items: LineItem[];
  createdAt: string;
  updatedAt: string;
};

export type BusinessProfile = {
  name: string;
  address: string;
  email: string;
  phone: string;
  /** Data URL for logo image (paid print brand block). */
  logoDataUrl: string;
};

export type UnlockState = {
  paid: boolean;
  sessionId?: string;
  unlockedAt?: string;
};

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  quotes: QuoteDoc[];
  unlock: UnlockState;
  business: BusinessProfile;
};
