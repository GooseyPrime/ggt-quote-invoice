"use client";

import { useRef, useState } from "react";
import { exportBackup, importBackup } from "@/lib/storage";
import type { BackupPayload } from "@/lib/types";

export function BackupBanner() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function onExport() {
    const payload = exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ggt-quote-invoice-backup-${payload.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Backup downloaded.");
  }

  async function onImport(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupPayload;
      importBackup(data);
      setMsg("Backup imported. Reloading…");
      window.location.reload();
    } catch {
      setMsg("Could not import that file. Use a JSON backup from this tool.");
    }
  }

  return (
    <aside className="ggt-result qinv-banner" role="note">
      <p className="qinv-banner__title">Data lives in this browser</p>
      <p className="ggt-lede qinv-banner__body">
        Quotes, unlock, and business details are stored in localStorage on this
        device only. Clear site data and they are gone. Export a JSON backup
        regularly; import it to restore.
      </p>
      <div className="qinv-actions">
        <button type="button" className="ggt-btn" onClick={onExport}>
          Export JSON
        </button>
        <button
          type="button"
          className="ggt-btn qinv-btn--ghost"
          onClick={() => fileRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => onImport(e.target.files?.[0] ?? null)}
        />
      </div>
      {msg ? <p className="qinv-note">{msg}</p> : null}
    </aside>
  );
}
