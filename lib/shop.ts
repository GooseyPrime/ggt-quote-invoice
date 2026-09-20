import {
  TOOL_ID,
  allowLocalUnlock,
  quoteInvoiceSaleLive,
  shopOrigin,
  toolUrl,
} from "./config";

export type SaleResult =
  | { ok: true; checkoutUrl: string; sessionId?: string }
  | {
      ok: false;
      message: string;
      code?: "sku_not_live" | "unconfigured" | "shop_error";
    };

export type VerifyResult = {
  ok: boolean;
  paid: boolean;
  kind?: string;
  message?: string;
  sessionId?: string;
  paymentStatus?: string;
};

const LOCAL_SESSION = "local";

/**
 * Start checkout via shop POST /api/sale.
 * Body: { url, product: "quote-invoice", toolId: "quote-invoice" }
 *
 * NEVER falls through to seo-audit / accessibility. Until NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE=true
 * (and the desk allowlist includes quote-invoice), refuse here.
 */
export async function startSale(returnUrl?: string): Promise<SaleResult> {
  if (!quoteInvoiceSaleLive()) {
    return {
      ok: false,
      code: "sku_not_live",
      message:
        "Checkout for Quote & Invoice is not live on the shop sale desk yet. Unlimited free quotes still work. We will not route you through a different shop product (that would charge the wrong price).",
    };
  }

  const origin = shopOrigin();
  if (!origin) {
    if (allowLocalUnlock()) {
      const next = new URL(
        returnUrl ??
          (typeof window !== "undefined" ? toolUrl("/unlock", window.location.origin) : "/unlock"),
      );
      next.searchParams.set("session_id", LOCAL_SESSION);
      return { ok: true, checkoutUrl: next.toString(), sessionId: LOCAL_SESSION };
    }
    return {
      ok: false,
      code: "unconfigured",
      message: "Shop payments are not configured. Set NEXT_PUBLIC_SHOP_ORIGIN.",
    };
  }

  const checkoutUrl = returnUrl?.trim() || toolUrl("/unlock");
  const body = JSON.stringify({
    url: checkoutUrl,
    returnUrl: checkoutUrl,
    product: TOOL_ID,
    toolId: TOOL_ID,
  });

  return postSale(`${origin}/api/sale`, body);
}

/**
 * Verify via shop GET /api/verify?session_id=
 * Unlock when ok && paid. $0 promo (paymentStatus "no_payment_required") still unlocks.
 */
export async function verifySale(sessionId: string): Promise<VerifyResult> {
  if (!sessionId) {
    return {
      ok: false,
      paid: false,
      kind: "invalid_request",
      message: "Missing checkout session id.",
    };
  }

  const origin = shopOrigin();

  if (allowLocalUnlock() && sessionId === LOCAL_SESSION) {
    return {
      ok: true,
      paid: true,
      sessionId,
      kind: "local_unlock",
      paymentStatus: "no_payment_required",
    };
  }

  if (!origin) {
    return {
      ok: false,
      paid: false,
      kind: "unconfigured",
      message: "Shop verification is not configured.",
    };
  }

  const getUrl = new URL(`${origin}/api/verify`);
  getUrl.searchParams.set("session_id", sessionId);
  const getResult = await requestVerify(getUrl.toString(), sessionId, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (getResult) return getResult;

  const postResult = await requestVerify(`${origin}/api/verify`, sessionId, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sessionId, session_id: sessionId }),
  });
  if (postResult) return postResult;

  return {
    ok: false,
    paid: false,
    kind: "shop_error",
    message: "The shop could not verify this sale.",
  };
}

async function requestVerify(
  url: string,
  sessionId: string,
  init: RequestInit,
): Promise<VerifyResult | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    const body = await readJson(res);
    return isVerifyShape(body) ? normalizeVerify(body, sessionId) : null;
  } catch {
    return null;
  }
}

async function postSale(url: string, body: string): Promise<SaleResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
    });
    const data = await readJson(res);
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      const checkoutUrl =
        asString(record.url) ??
        asString(record.checkoutUrl) ??
        asString(record.checkout_url);

      if (!res.ok || record.ok === false) {
        return {
          ok: false,
          code: "shop_error",
          message:
            asString(record.message) ??
            "The shop sale desk refused this checkout. Quote & Invoice may not be on the allowlist yet.",
        };
      }

      if (record.ok === true && checkoutUrl) {
        return {
          ok: true,
          checkoutUrl,
          sessionId: asString(record.sessionId) ?? asString(record.session_id),
        };
      }
      return {
        ok: false,
        code: "shop_error",
        message: asString(record.message) ?? "The shop could not start checkout.",
      };
    }
    return { ok: false, code: "shop_error", message: "The shop could not start checkout." };
  } catch {
    return {
      ok: false,
      code: "shop_error",
      message: "Could not reach the shop payment desk.",
    };
  }
}

function isVerifyShape(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("paid" in (value as object) || "ok" in (value as object)),
  );
}

function normalizeVerify(
  data: Record<string, unknown>,
  sessionId: string,
): VerifyResult {
  const paymentStatus =
    asString(data.paymentStatus) ?? asString(data.payment_status);
  const paidFlag = data.paid === true;
  const zeroPromo = paymentStatus === "no_payment_required";
  const okFlag = data.ok === true;
  const paid =
    (okFlag && paidFlag) || (okFlag && zeroPromo) || paidFlag || zeroPromo;

  return {
    ok: okFlag || paid,
    paid,
    kind: asString(data.kind),
    message: asString(data.message),
    sessionId:
      asString(data.sessionId) ?? asString(data.session_id) ?? sessionId,
    paymentStatus,
  };
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
