"use client";

import { useState } from "react";
import { priceLabel } from "@/lib/config";
import { startSale } from "@/lib/shop";

type Props = {
  /** When true, render the compact upgrade offer (post–3rd quote). */
  open?: boolean;
};

export function Paywall({ open = true }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = priceLabel();

  if (!open) return null;

  async function onUnlock() {
    setBusy(true);
    setError(null);
    const result = await startSale(
      typeof window !== "undefined"
        ? `${window.location.origin}/unlock`
        : undefined,
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.location.href = result.checkoutUrl;
  }

  return (
    <section className="ggt-paywall" aria-labelledby="qinv-paywall-title">
      <h2 id="qinv-paywall-title">Keep your brand on the page</h2>
      <p>
        Unlimited quotes stay free. Pay once ({label}) on this device to replace
        the small Golden Goose Tools footer on print/PDF with your logo and
        business details. No screen mark, no DRAFT stamp, no feature cut.
      </p>
      <div className="qinv-actions">
        <button
          type="button"
          className="ggt-btn"
          disabled={busy}
          onClick={onUnlock}
        >
          {busy ? "Opening checkout…" : `Unlock for ${label}`}
        </button>
      </div>
      {error ? <p className="qinv-error">{error}</p> : null}
      <p className="ggt-trust">
        Paid once. Yours to keep on this device. No account required for the
        free pass. Checkout runs on the Golden Goose Tools shop — this tool
        never holds card secrets.
      </p>
    </section>
  );
}
