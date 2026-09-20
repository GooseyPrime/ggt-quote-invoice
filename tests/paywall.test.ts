import { describe, expect, it } from "vitest";
import { PAYWALL_AFTER_QUOTES, shouldOfferPaywall, toolPath } from "../lib/config";

describe("paywall gating", () => {
  it("stays hidden below the save threshold", () => {
    expect(shouldOfferPaywall(false, PAYWALL_AFTER_QUOTES - 1)).toBe(false);
  });

  it("opens when a new save reaches the threshold", () => {
    expect(shouldOfferPaywall(false, PAYWALL_AFTER_QUOTES)).toBe(true);
  });

  it("stays open for later saves after the threshold", () => {
    expect(shouldOfferPaywall(false, PAYWALL_AFTER_QUOTES + 2)).toBe(true);
  });

  it("builds routes under the mounted tool base path", () => {
    expect(toolPath("/")).toBe("/tools/quote-invoice");
    expect(toolPath("/quote/doc_1")).toBe("/tools/quote-invoice/quote/doc_1");
  });
});
