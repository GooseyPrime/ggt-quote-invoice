"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FREE_PRINT_FOOTER, toolPath } from "@/lib/config";
import {
  formatMoney,
  grandTotal,
  lineTotal,
  subtotal,
  taxAmount,
} from "@/lib/money";
import { getBusiness, getQuote, isUnlocked } from "@/lib/storage";
import type { BusinessProfile, QuoteDoc } from "@/lib/types";

/**
 * Print/PDF view. Free: single 8pt muted GGT footer only.
 * Paid: buyer logo + business details. Never show paywall / DRAFT / watermark here.
 */
export default function PrintPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [doc, setDoc] = useState<QuoteDoc | null>(null);
  const [paid, setPaid] = useState(false);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDoc(getQuote(id));
    setPaid(isUnlocked());
    setBusiness(getBusiness());
    setReady(true);
  }, [id]);

  const totals = useMemo(() => {
    if (!doc) return { sub: 0, tax: 0, total: 0 };
    return {
      sub: subtotal(doc.items),
      tax: taxAmount(doc.items, doc.taxPercent),
      total: grandTotal(doc.items, doc.taxPercent),
    };
  }, [doc]);

  if (!ready) {
    return <div className="qinv-print">Loading…</div>;
  }

  if (!doc) {
    return (
      <div className="qinv-print">
        <p>Document not found.</p>
        <Link href={toolPath("/")} className="no-print">
          Back
        </Link>
      </div>
    );
  }

  const hasBrand =
    paid &&
    business &&
    (business.name ||
      business.logoDataUrl ||
      business.address ||
      business.email ||
      business.phone);

  return (
    <div className="qinv-print">
      <div className="qinv-print__sheet">
        <div className="qinv-print__toolbar no-print">
          <button type="button" className="ggt-btn" onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <Link href={toolPath(`/quote/${doc.id}`)} className="ggt-btn qinv-btn--ghost">
            Edit
          </Link>
          <Link href={toolPath("/")} className="ggt-btn qinv-btn--ghost">
            All quotes
          </Link>
        </div>

        <h1>{doc.title || "Untitled"}</h1>
        <p className="qinv-print__status">
          {doc.status === "invoice" ? "Invoice" : "Quote"} · {doc.date}
        </p>

        <div className="qinv-print__parties">
          <div>
            <p className="qinv-print__label">Bill to</p>
            <div>
              {doc.clientName || "—"}
              {doc.clientEmail ? (
                <>
                  <br />
                  {doc.clientEmail}
                </>
              ) : null}
              {doc.clientAddress ? (
                <>
                  <br />
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {doc.clientAddress}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="num">Qty</th>
              <th className="num">Unit</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description || "—"}</td>
                <td className="num">{item.qty}</td>
                <td className="num">{formatMoney(item.unitPrice)}</td>
                <td className="num">{formatMoney(lineTotal(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="qinv-print__totals">
          <div>Subtotal {formatMoney(totals.sub)}</div>
          <div>
            Tax ({doc.taxPercent}%) {formatMoney(totals.tax)}
          </div>
          <div>
            <strong>Total {formatMoney(totals.total)}</strong>
          </div>
        </div>

        {doc.notes ? (
          <div className="qinv-print__notes">
            <p className="qinv-print__label">Notes</p>
            {doc.notes}
          </div>
        ) : null}

        {paid && hasBrand ? (
          <footer className="qinv-print__footer-paid">
            {business.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logoDataUrl} alt="" />
            ) : null}
            <div className="qinv-print__brand-meta">
              {business.name ? <strong>{business.name}</strong> : null}
              {business.address ? (
                <div style={{ whiteSpace: "pre-wrap" }}>{business.address}</div>
              ) : null}
              {business.email ? <div>{business.email}</div> : null}
              {business.phone ? <div>{business.phone}</div> : null}
            </div>
          </footer>
        ) : (
          <footer className="qinv-print__footer-free">{FREE_PRINT_FOOTER}</footer>
        )}
      </div>
    </div>
  );
}
