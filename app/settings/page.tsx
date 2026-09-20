"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Paywall } from "@/components/Paywall";
import { priceLabel } from "@/lib/config";
import {
  emptyBusiness,
  getBusiness,
  isUnlocked,
  saveBusiness,
} from "@/lib/storage";
import type { BusinessProfile } from "@/lib/types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const [paid, setPaid] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>(emptyBusiness());
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const label = priceLabel();

  useEffect(() => {
    setPaid(isUnlocked());
    setProfile(getBusiness());
    setReady(true);
  }, []);

  function patch(partial: Partial<BusinessProfile>) {
    setProfile((prev) => ({ ...prev, ...partial }));
  }

  function onSave() {
    saveBusiness(profile);
    setFlash("Business profile saved on this device.");
  }

  async function onLogoFile(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      patch({ logoDataUrl: dataUrl });
    } catch {
      setFlash("Could not read that image.");
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

  return (
    <main className="ggt-root">
      <div className="ggt-wrap">
        <Nav />
        <header className="ggt-hero">
          <p className="ggt-eyebrow">Settings</p>
          <h1>Business profile</h1>
          <p className="ggt-lede">
            {paid
              ? "Your logo and details replace the free footer on print/PDF."
              : `Unlock once (${label}) to brand print/PDF with your logo and details.`}
          </p>
        </header>

        {!paid ? <Paywall /> : null}

        {paid ? (
          <section className="ggt-result">
            <label className="qinv-field">
              <span className="qinv-label">Business name</span>
              <input
                className="ggt-input"
                value={profile.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
            <label className="qinv-field">
              <span className="qinv-label">Address</span>
              <textarea
                className="qinv-textarea"
                value={profile.address}
                onChange={(e) => patch({ address: e.target.value })}
              />
            </label>
            <div className="qinv-grid qinv-grid--2">
              <label className="qinv-field">
                <span className="qinv-label">Email</span>
                <input
                  className="ggt-input"
                  type="email"
                  value={profile.email}
                  onChange={(e) => patch({ email: e.target.value })}
                />
              </label>
              <label className="qinv-field">
                <span className="qinv-label">Phone</span>
                <input
                  className="ggt-input"
                  value={profile.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                />
              </label>
            </div>
            <label className="qinv-field">
              <span className="qinv-label">Logo (file → data URL)</span>
              <input
                className="ggt-input"
                type="file"
                accept="image/*"
                onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className="qinv-field">
              <span className="qinv-label">Logo data URL (optional paste)</span>
              <textarea
                className="qinv-textarea"
                value={profile.logoDataUrl}
                onChange={(e) => patch({ logoDataUrl: e.target.value })}
                placeholder="data:image/png;base64,…"
              />
            </label>
            {profile.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="qinv-logo-preview"
                src={profile.logoDataUrl}
                alt="Logo preview"
              />
            ) : null}
            <div className="qinv-actions">
              <button type="button" className="ggt-btn" onClick={onSave}>
                Save profile
              </button>
              <button
                type="button"
                className="ggt-btn qinv-btn--ghost"
                onClick={() => {
                  patch({ logoDataUrl: "" });
                }}
              >
                Clear logo
              </button>
            </div>
            {flash ? <p className="qinv-note">{flash}</p> : null}
            <p className="ggt-trust">
              Stored in this browser only. Export a JSON backup from the home
              page.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
