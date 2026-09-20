"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { appPath } from "@/lib/config";
import { verifySale } from "@/lib/shop";
import { isUnlocked, setUnlocked } from "@/lib/storage";

function UnlockInner() {
  const search = useSearchParams();
  const sessionId = search.get("session_id") ?? search.get("sessionId") ?? "";
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "err">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        if (isUnlocked() && !sessionId) {
          if (!cancelled) {
            setStatus("ok");
            setMessage("This device is already unlocked.");
          }
          return;
        }
        if (!sessionId) {
          if (!cancelled) {
            setStatus("err");
            setMessage("This checkout return link is incomplete. Return from the shop checkout again.");
          }
          return;
        }
        if (!cancelled) setStatus("working");
        const result = await verifySale(sessionId);
        if (cancelled) return;
        if (result.ok && result.paid) {
          setUnlocked(result.sessionId ?? sessionId);
          setStatus("ok");
          setMessage(
            "Paid unlock saved on this device. Add your logo and business details in Settings — they appear on print/PDF instead of the free footer.",
          );
          return;
        }
        setStatus("err");
        setMessage(
          result.message ?? "The shop did not confirm payment for this session.",
        );
      } catch {
        if (!cancelled) {
          setStatus("err");
          setMessage("Could not save or verify this unlock on this device.");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="ggt-root">
      <div className="ggt-wrap">
        <Nav />
        <header className="ggt-hero">
          <p className="ggt-eyebrow">Unlock</p>
          <h1>Device unlock</h1>
          <p className="ggt-lede">
            Verifying with the Golden Goose Tools shop. No card data is handled
            here.
          </p>
        </header>
        <section className="ggt-result">
          {status === "working" || status === "idle" ? (
            <p>Checking payment…</p>
          ) : null}
          {status === "ok" ? <p>{message}</p> : null}
          {status === "err" ? <p className="qinv-error">{message}</p> : null}
          <div className="qinv-actions">
            <Link href={appPath("/settings")} className="ggt-btn">
              Business settings
            </Link>
            <Link href={appPath("/")} className="ggt-btn qinv-btn--ghost">
              Quotes
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function UnlockPage() {
  return (
    <Suspense
      fallback={
        <main className="ggt-root">
          <div className="ggt-wrap">
            <p>Loading…</p>
          </div>
        </main>
      }
    >
      <UnlockInner />
    </Suspense>
  );
}
