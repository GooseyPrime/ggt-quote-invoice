"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Paywall } from "@/components/Paywall";
import { PAYWALL_AFTER_QUOTES } from "@/lib/config";
import { createId } from "@/lib/ids";
import {
  formatMoney,
  grandTotal,
  lineTotal,
  subtotal,
  taxAmount,
} from "@/lib/money";
import {
  convertToInvoice,
  createBlankQuote,
  deleteQuote,
  emptyLineItem,
  getQuote,
  isUnlocked,
  quoteCount,
  saveQuote,
} from "@/lib/storage";
import type { LineItem, QuoteDoc } from "@/lib/types";

export default function QuoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");

  const [doc, setDoc] = useState<QuoteDoc | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    let found = getQuote(id);
    if (!found && id === "new") {
      found = createBlankQuote();
      try {
        saveQuote(found);
        setReady(true);
        router.replace(`/quote/${found.id}`);
      } catch {
        setDoc(found);
        setReady(true);
      }
      return;
    }
    setDoc(found);
    setReady(true);
  }, [id, router]);

  const totals = useMemo(() => {
    if (!doc) return { sub: 0, tax: 0, total: 0 };
    return {
      sub: subtotal(doc.items),
      tax: taxAmount(doc.items, doc.taxPercent),
      total: grandTotal(doc.items, doc.taxPercent),
    };
  }, [doc]);

  function patch(partial: Partial<QuoteDoc>) {
    setDoc((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  function patchItem(itemId: string, partial: Partial<LineItem>) {
    setDoc((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId ? { ...it, ...partial } : it,
        ),
      };
    });
  }

  function addItem() {
    setDoc((prev) => {
      if (!prev) return prev;
      return { ...prev, items: [...prev.items, emptyLineItem()] };
    });
  }

  function removeItem(itemId: string) {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = prev.items.filter((it) => it.id !== itemId);
      return {
        ...prev,
        items: next.length > 0 ? next : [{ ...emptyLineItem(), id: createId("line") }],
      };
    });
  }

  function onSave() {
    if (!doc) return;
    setSaveError(null);
    const before = quoteCount();
    const had = Boolean(getQuote(doc.id));
    let isNew = false;
    try {
      ({ isNew } = saveQuote(doc));
    } catch {
      setSavedFlash(false);
      setShowPaywall(false);
      setSaveError("Could not save this document in this browser.");
      return;
    }
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);

    const after = quoteCount();
    const crossed =
      !isUnlocked() &&
      (isNew || (!had && after >= PAYWALL_AFTER_QUOTES)) &&
      after >= PAYWALL_AFTER_QUOTES &&
      before < PAYWALL_AFTER_QUOTES;

    // Also show if already at/over threshold after any save while free
    if (!isUnlocked() && (crossed || after >= PAYWALL_AFTER_QUOTES)) {
      setShowPaywall(true);
    }
  }

  function onConvert() {
    if (!doc) return;
    try {
      saveQuote(doc);
      const next = convertToInvoice(doc.id);
      if (next) setDoc(next);
    } catch {
      setSavedFlash(false);
      setSaveError("Could not save this document in this browser.");
    }
  }

  function onDelete() {
    if (!doc) return;
    if (!window.confirm("Delete this document from this browser?")) return;
    try {
      deleteQuote(doc.id);
      router.push("/");
    } catch {
      setSavedFlash(false);
      setSaveError("Could not update this document in this browser.");
    }
  }

  if (!ready) {
    return (
      <main className="ggt-root">
        <div className="ggt-wrap">
          <p className="qinv-empty">Loading…</p>
        </div>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="ggt-root">
        <div className="ggt-wrap">
          <Nav />
          <p className="qinv-empty">Document not found.</p>
          <Link href="/" className="ggt-btn">
            Back to list
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="ggt-root">
      <div className="ggt-wrap">
        <Nav />
        <header className="ggt-hero">
          <p className="ggt-eyebrow">
            {doc.status === "invoice" ? "Invoice" : "Quote"}
          </p>
          <h1>{doc.title || "Untitled"}</h1>
          <p className="ggt-lede">Edit details, then save. Print/PDF when ready.</p>
        </header>

        <section className="ggt-result">
          <div className="qinv-grid qinv-grid--2">
            <label className="qinv-field">
              <span className="qinv-label">Title</span>
              <input
                className="ggt-input"
                value={doc.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <label className="qinv-field">
              <span className="qinv-label">Date</span>
              <input
                className="ggt-input"
                type="date"
                value={doc.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </label>
          </div>

          <label className="qinv-field">
            <span className="qinv-label">Client name</span>
            <input
              className="ggt-input"
              value={doc.clientName}
              onChange={(e) => patch({ clientName: e.target.value })}
            />
          </label>
          <div className="qinv-grid qinv-grid--2">
            <label className="qinv-field">
              <span className="qinv-label">Client email</span>
              <input
                className="ggt-input"
                type="email"
                value={doc.clientEmail}
                onChange={(e) => patch({ clientEmail: e.target.value })}
              />
            </label>
            <label className="qinv-field">
              <span className="qinv-label">Tax %</span>
              <input
                className="ggt-input"
                type="number"
                min={0}
                step={0.01}
                value={doc.taxPercent}
                onChange={(e) =>
                  patch({ taxPercent: Number(e.target.value) || 0 })
                }
              />
            </label>
          </div>
          <label className="qinv-field">
            <span className="qinv-label">Client address</span>
            <textarea
              className="qinv-textarea"
              value={doc.clientAddress}
              onChange={(e) => patch({ clientAddress: e.target.value })}
            />
          </label>

          <h2 className="qinv-label" style={{ marginTop: 24 }}>
            Line items
          </h2>
          {doc.items.map((item) => (
            <div key={item.id} className="qinv-line">
              <div className="qinv-grid qinv-grid--3">
                <label className="qinv-field">
                  <span className="qinv-label">Description</span>
                  <input
                    className="ggt-input"
                    value={item.description}
                    onChange={(e) =>
                      patchItem(item.id, { description: e.target.value })
                    }
                  />
                </label>
                <label className="qinv-field">
                  <span className="qinv-label">Qty</span>
                  <input
                    className="ggt-input"
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.qty}
                    onChange={(e) =>
                      patchItem(item.id, { qty: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <label className="qinv-field">
                  <span className="qinv-label">Unit price</span>
                  <input
                    className="ggt-input"
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) =>
                      patchItem(item.id, {
                        unitPrice: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
              </div>
              <p className="qinv-meta">
                Line total: {formatMoney(lineTotal(item))}
              </p>
              <button
                type="button"
                className="ggt-btn qinv-btn--ghost"
                onClick={() => removeItem(item.id)}
              >
                Remove line
              </button>
            </div>
          ))}
          <div className="qinv-actions">
            <button type="button" className="ggt-btn qinv-btn--ghost" onClick={addItem}>
              Add line
            </button>
          </div>

          <label className="qinv-field">
            <span className="qinv-label">Notes</span>
            <textarea
              className="qinv-textarea"
              value={doc.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>

          <div className="qinv-totals" aria-live="polite">
            <div>Subtotal {formatMoney(totals.sub)}</div>
            <div>Tax {formatMoney(totals.tax)}</div>
            <strong>Total {formatMoney(totals.total)}</strong>
          </div>

          <div className="qinv-actions">
            <button type="button" className="ggt-btn" onClick={onSave}>
              Save
            </button>
            {doc.status === "quote" ? (
              <button
                type="button"
                className="ggt-btn qinv-btn--ghost"
                onClick={onConvert}
              >
                Convert to invoice
              </button>
            ) : null}
            <Link href={`/print/${doc.id}`} className="ggt-btn qinv-btn--ghost">
              Print / PDF
            </Link>
            <button
              type="button"
              className="ggt-btn qinv-btn--ghost"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
          {savedFlash ? <p className="qinv-note">Saved on this device.</p> : null}
          {saveError ? <p className="qinv-error">{saveError}</p> : null}
        </section>

        {showPaywall ? <Paywall /> : null}
      </div>
    </main>
  );
}
