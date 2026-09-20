import { describe, expect, it } from "vitest";
import {
  formatMoney,
  grandTotal,
  lineTotal,
  roundMoney,
  subtotal,
  taxAmount,
} from "../lib/money";
import type { LineItem } from "../lib/types";

const items: LineItem[] = [
  { id: "a", description: "A", qty: 2, unitPrice: 10 },
  { id: "b", description: "B", qty: 1, unitPrice: 5.5 },
];

describe("money", () => {
  it("computes line and document totals", () => {
    expect(lineTotal(items[0])).toBe(20);
    expect(subtotal(items)).toBe(25.5);
    expect(taxAmount(items, 10)).toBe(2.55);
    expect(grandTotal(items, 10)).toBe(28.05);
  });

  it("rounds to cents", () => {
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it("formats currency", () => {
    expect(formatMoney(12.5)).toMatch(/12\.50/);
  });
});
