"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Paywall } from "@/components/Paywall";
import { priceLabel, shouldOfferPaywall } from "@/lib/config";
import {
  emptyBusiness,
  getBusiness,
  isUnlocked,
  quoteCount,
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
  const [unlocked, setUnlocked] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>(emptyBusiness());
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const label = priceLabel();
  const showUpgradeOffer = !unlocked && shouldOfferPaywall(unlocked, count);

  useEffect(() => {
    setUnlocked(isUnlocked());
    setProfile(getBusiness());
    setCount(quoteCount());
    setReady(true);
  }, []);

  function patch(partial: Partial<BusinessProfile>) {
    setProfile((prev) => ({ ...prev, ...partial }));
  }

  function onSave() {
    persistProfile(profile);
  }

  function persistProfile(next: BusinessProfile) {
    try {
      saveBusiness(next);
      setFlash("Business profile saved on this device.");
    } catch {
      setFlash("Could not save your business profile in this browser.");
    }
  }

  function onClearLogo() {
    const next = { ...profile, logoDataUrl: "" };
    setProfile(next);
    persistProfile(next);
  }

  async function onLogoFile(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const next = { ...profile, logoDataUrl: dataUrl };
      setProfile(next);
      persistProfile(next);
    } catch {
      setFlash("Could not save that image in this browser.");
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
            {unlocked
              ? "Your logo and details replace the free footer on print/PDF."
              : `Unlock once (${label}) to brand print/PDF with your logo and details.`}
          </p>
        </header>

        {showUpgradeOffer ? <Paywall /> : null}

        <section className="ggt-result">
          {!unlocked ? (
            <p className="qinv-note">
              Save your business details now. Unlock once to add a logo and use
              them on print/PDF.
            </p>
          ) : null}
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
          {unlocked ? (
            <>
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
                  onChange={(e) => {
                    const next = { ...profile, logoDataUrl: e.target.value };
                    setProfile(next);
                    persistProfile(next);
                  }}
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
            </>
          ) : null}
          <div className="qinv-actions">
            <button type="button" className="ggt-btn" onClick={onSave}>
              Save profile
            </button>
            {unlocked ? (
              <button
                type="button"
                className="ggt-btn qinv-btn--ghost"
                onClick={onClearLogo}
              >
                Clear logo
              </button>
            ) : null}
          </div>
          {flash ? <p className="qinv-note">{flash}</p> : null}
          <p className="ggt-trust">
            Stored in this browser only. Export a JSON backup from the home
            page.
          </p>
        </section>
      </div>
    </main>
  );
}
