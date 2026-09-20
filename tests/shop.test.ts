import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("shop gate", () => {
  it("refuses checkout when sale is explicitly off (sku_not_live)", async () => {
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "false");
    vi.stubEnv("NEXT_PUBLIC_SHOP_ORIGIN", "https://goldengoosetools.com");
    const { startSale } = await import("../lib/shop");
    const result = await startSale("http://localhost:3000/unlock");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("sku_not_live");
      expect(result.message.toLowerCase()).toContain("disabled");
    }
  });

  it("quoteInvoiceSaleLive defaults on and can be turned off", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "");
    const { quoteInvoiceSaleLive } = await import("../lib/config");
    expect(quoteInvoiceSaleLive()).toBe(true);
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "false");
    const mod = await import("../lib/config");
    expect(mod.quoteInvoiceSaleLive()).toBe(false);
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "0");
    const modZero = await import("../lib/config");
    expect(modZero.quoteInvoiceSaleLive()).toBe(false);
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "off");
    const modOff = await import("../lib/config");
    expect(modOff.quoteInvoiceSaleLive()).toBe(false);
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

  it("passes the unlock return url through checkout", async () => {
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "true");
    vi.stubEnv("NEXT_PUBLIC_SHOP_ORIGIN", "https://shop.example");
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.url).toBe("https://tool.example/tools/quote-invoice/unlock");
      expect(body.returnUrl).toBe("https://tool.example/tools/quote-invoice/unlock");
      return new Response(
        JSON.stringify({ ok: true, url: "https://shop.example/checkout/session" }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const { startSale } = await import("../lib/shop");
    const result = await startSale("https://tool.example/tools/quote-invoice/unlock");
    expect(result.ok).toBe(true);
  });

  it("does not allow local unlock in production", async () => {
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_UNLOCK", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { verifySale } = await import("../lib/shop");
    const result = await verifySale("local");
    expect(result.ok).toBe(false);
    expect(result.paid).toBe(false);
    expect(result.kind).not.toBe("local_unlock");
  });

  it("does not use the local checkout fallback in production", async () => {
    vi.stubEnv("NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE", "true");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_LOCAL_UNLOCK", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SHOP_ORIGIN", "");
    const { startSale } = await import("../lib/shop");
    const result = await startSale("http://localhost:3000/tools/quote-invoice/unlock");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("unconfigured");
    }
  });

  it("retries verification with POST after a failing GET", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOP_ORIGIN", "https://shop.example");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, paid: true }), { status: 500 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, paid: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { verifySale } = await import("../lib/shop");
    const result = await verifySale("sess_123");
    expect(result.ok).toBe(true);
    expect(result.paid).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a failed verification result when both verification calls fail", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOP_ORIGIN", "https://shop.example");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { verifySale } = await import("../lib/shop");
    const result = await verifySale("sess_123");
    expect(result.ok).toBe(false);
    expect(result.paid).toBe(false);
    expect(result.kind).toBe("shop_error");
  });

  it("does not unlock rejected verification results", async () => {
    vi.stubEnv("NEXT_PUBLIC_SHOP_ORIGIN", "https://shop.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            paid: true,
            paymentStatus: "no_payment_required",
          }),
          { status: 200 },
        ),
      ),
    );
    const { verifySale } = await import("../lib/shop");
    const result = await verifySale("sess_123");
    expect(result.ok).toBe(false);
    expect(result.paid).toBe(false);
  });
});
