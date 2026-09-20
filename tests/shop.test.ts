import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("shop gate", () => {
  it("refuses checkout when sale is not live (sku_not_live)", async () => {
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "");
    vi.stubEnv("NEXT_PUBLIC_SHOP_ORIGIN", "https://goldengoosetools.com");
    const { startSale } = await import("../lib/shop");
    const result = await startSale("http://localhost:3000/unlock");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("sku_not_live");
      expect(result.message.toLowerCase()).toContain("not live");
    }
  });

  it("quoteInvoiceSaleLive reads env flag", async () => {
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "true");
    const { quoteInvoiceSaleLive } = await import("../lib/config");
    expect(quoteInvoiceSaleLive()).toBe(true);
  });

  it("priceLabel defaults to $9", async () => {
    vi.stubEnv("NEXT_PUBLIC_PRICE_LABEL", "");
    const { priceLabel } = await import("../lib/config");
    expect(priceLabel()).toBe("$9");
  });

  it("product constants stay quote-invoice", async () => {
    const { TOOL_ID, TOOL_PATH, ACCENT } = await import("../lib/config");
    expect(TOOL_ID).toBe("quote-invoice");
    expect(TOOL_PATH).toBe("/tools/quote-invoice");
    expect(ACCENT).toBe("#7d9b7a");
  });
});
