import type { LineItem } from "./types";

export function lineTotal(item: LineItem): number {
  const qty = Number.isFinite(item.qty) ? item.qty : 0;
  const price = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
  return roundMoney(qty * price);
}

export function subtotal(items: LineItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0));
}

export function taxAmount(items: LineItem[], taxPercent: number): number {
  const pct = Number.isFinite(taxPercent) ? taxPercent : 0;
  return roundMoney(subtotal(items) * (pct / 100));
}

export function grandTotal(items: LineItem[], taxPercent: number): number {
  return roundMoney(subtotal(items) + taxAmount(items, taxPercent));
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(n: number, currency = "USD"): string {
  const value = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}
