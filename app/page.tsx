"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackupBanner } from "@/components/BackupBanner";
import { Nav } from "@/components/Nav";
import { Paywall } from "@/components/Paywall";
import { PAYWALL_AFTER_QUOTES } from "@/lib/config";
import { formatMoney, grandTotal } from "@/lib/money";
import {
  createBlankQuote,
  isUnlocked,
  listQuotes,
  quoteCount,
  saveQuote,
} from "@/lib/storage";
import type { QuoteDoc } from "@/lib/types";

export default function HomePage() {
  const [docs, setDocs] = useState<QuoteDoc[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  function refresh() {
    setDocs(listQuotes());
    setUnlocked(isUnlocked());
    setCount(quoteCount());
    setReady(true);
  }

  useEffect(() => {
    refresh();
  }, []);

  function onNew() {
    const blank = createBlankQuote();
    saveQuote(blank);
    window.location.href = `/quote/${blank.id}`;
  }

  const showPaywall = ready && !unlocked && count >= PAYWALL_AFTER_QUOTES;

  return (
    <main className="ggt-root">
      <div className="ggt-wrap">
        <Nav />
        <header className="ggt-hero">
          <p className="ggt-eyebrow">Golden Goose Tools</p>
          <h1>Quote &amp; Invoice</h1>
          <p className="ggt-lede">
            Unlimited free quotes in this browser. Print or PDF anytime. Pay
            once to put your logo on the document footer.
          </p>
        </header>

        <BackupBanner />

        <div className="qinv-actions">
          <button type="button" className="ggt-btn" onClick={onNew}>
            New quote
          </button>
        </div>

        <section className="ggt-result" aria-labelledby="qinv-list-title">
          <h2 id="qinv-list-title">Your documents</h2>
          {!ready ? (
            <p className="qinv-empty">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="qinv-empty">
              No quotes yet. Create one — everything stays on this device.
            </p>
          ) : (
            <ul className="qinv-list">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <Link href={`/quote/${doc.id}`}>
                    <strong>{doc.title || "Untitled"}</strong>
                  </Link>
                  <p className="qinv-meta">
                    {doc.status === "invoice" ? "Invoice" : "Quote"}
                    {doc.clientName ? ` · ${doc.clientName}` : ""}
                    {` · ${doc.date}`}
                    {` · ${formatMoney(grandTotal(doc.items, doc.taxPercent))}`}
                  </p>
                  <div className="qinv-actions">
                    <Link href={`/print/${doc.id}`} className="ggt-btn qinv-btn--ghost">
                      Print / PDF
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {showPaywall ? <Paywall /> : null}
      </div>
    </main>
  );
}
