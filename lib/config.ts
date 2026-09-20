/** Tool registry stub — shop may list id `quote-invoice`, path `/tools/quote-invoice`. */
export const TOOL_ID = "quote-invoice";
export const TOOL_SLUG = "quote-invoice";
export const TOOL_PATH = "/tools/quote-invoice";
export const TOOL_NAME = "Quote & Invoice";
/** Moss — Cos accent for this tool. */
export const ACCENT = "#7d9b7a";

export const TOOL_URL = "https://goldengoosetools.com/tools/quote-invoice";

/** Free pass is unlimited; upgrade offer appears after this many saved quotes. */
export const PAYWALL_AFTER_QUOTES = 3;

export const FREE_PRINT_FOOTER =
  "Prepared with Golden Goose Tools · goldengoosetools.com";

const DEFAULT_SHOP = "https://goldengoosetools.com";
const DEFAULT_PRICE_LABEL = "$9";

type Env = Record<string, string | undefined>;

function publicEnv(): Env {
  return {
    NEXT_PUBLIC_SHOP_ORIGIN: process.env.NEXT_PUBLIC_SHOP_ORIGIN,
    NEXT_PUBLIC_PRICE_LABEL: process.env.NEXT_PUBLIC_PRICE_LABEL,
    NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE:
      process.env.NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE,
    NEXT_PUBLIC_ALLOW_LOCAL_UNLOCK: process.env.NEXT_PUBLIC_ALLOW_LOCAL_UNLOCK,
  };
}

export function shopOrigin(env: Env = publicEnv()): string {
  const raw = env.NEXT_PUBLIC_SHOP_ORIGIN?.trim();
  if (!raw) return DEFAULT_SHOP;
  return raw.replace(/\/$/, "");
}

/** Display label only — never hardcode the paid amount in UI copy. */
export function priceLabel(env: Env = publicEnv()): string {
  const raw = env.NEXT_PUBLIC_PRICE_LABEL?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_PRICE_LABEL;
}

/**
 * Checkout is gated until Cos smoke-clears and Groundwork merges shop allowlist.
 * Set NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE=true to enable.
 * NEVER fall through to seo-audit / accessibility pricing.
 */
export function quoteInvoiceSaleLive(env: Env = publicEnv()): boolean {
  return env.NEXT_PUBLIC_QUOTE_INVOICE_SALE_LIVE === "true";
}

export function allowLocalUnlock(env: Env = publicEnv()): boolean {
  return env.NEXT_PUBLIC_ALLOW_LOCAL_UNLOCK === "true" && process.env.NODE_ENV !== "production";
}

export function toolPath(path = "/"): string {
  const nextPath = path.startsWith("/") ? path : `/${path}`;
  return nextPath === "/" ? TOOL_PATH : `${TOOL_PATH}${nextPath}`;
}

export function toolUrl(path = "/", origin = TOOL_URL): string {
  const base = origin.replace(/\/$/, "");
  if (base === TOOL_URL) {
    return path === "/" ? base : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return `${base}${toolPath(path)}`;
}
