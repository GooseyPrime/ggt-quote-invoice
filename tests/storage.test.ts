import { afterEach, describe, expect, it, vi } from "vitest";

type StorageMap = Map<string, string>;

function stubStorage(backing: StorageMap = new Map()): StorageMap {
  const localStorage = {
    getItem(key: string) {
      return backing.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      backing.set(key, value);
    },
    removeItem(key: string) {
      backing.delete(key);
    },
    clear() {
      backing.clear();
    },
  };

  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", localStorage);

  return backing;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetModules();
});

describe("storage helpers", () => {
  it("uses the local calendar date for blank quotes", async () => {
    const RealDate = Date;

    class MockDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? "2026-01-02T01:30:00.000Z");
      }

      static now() {
        return new RealDate("2026-01-02T01:30:00.000Z").valueOf();
      }

      getFullYear() {
        return 2026;
      }

      getMonth() {
        return 0;
      }

      getDate() {
        return 1;
      }
    }

    vi.stubGlobal("Date", MockDate as unknown as DateConstructor);
    const { createBlankQuote } = await import("../lib/storage");
    expect(createBlankQuote().date).toBe("2026-01-01");
  });

  it("sanitizes malformed backup quotes before saving them", async () => {
    const backing = stubStorage();
    const { importBackup, listQuotes } = await import("../lib/storage");

    importBackup({
      version: 1,
      exportedAt: "2026-09-20T00:00:00.000Z",
      quotes: [
        null as never,
        {
          id: "doc_1",
          status: "invoice",
          title: "Imported",
          clientName: "Client",
          clientEmail: 42,
          clientAddress: "123 Road",
          date: "2026-09-20",
          taxPercent: 7.5,
          notes: null,
          items: [null, { id: "line_1", description: "Work", qty: 2, unitPrice: 50 }],
          createdAt: "2026-09-20T00:00:00.000Z",
          updatedAt: "2026-09-20T00:00:00.000Z",
        } as never,
      ],
      unlock: { paid: true, sessionId: 12 } as never,
      business: { name: "Goose", logoDataUrl: 99 } as never,
    });

    const savedQuotes = JSON.parse(
      backing.get("ggt.quote-invoice.quotes.v1") ?? "[]",
    ) as Array<Record<string, unknown>>;
    expect(savedQuotes).toHaveLength(1);
    expect(savedQuotes[0].clientEmail).toBe("");
    expect(savedQuotes[0].items).toHaveLength(1);
    expect(() => listQuotes()).not.toThrow();
  });

  it("throws when browser storage cannot persist data", async () => {
    const localStorage = {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error("quota");
      },
    };

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", localStorage);

    const { saveBusiness } = await import("../lib/storage");
    expect(() =>
      saveBusiness({
        name: "Goose",
        address: "",
        email: "",
        phone: "",
        logoDataUrl: "",
      }),
    ).toThrow("Could not save data in this browser.");
  });

  it("rolls back a backup import when a later write fails", async () => {
    const backing = new Map<string, string>([
      ["ggt.quote-invoice.quotes.v1", JSON.stringify([{ id: "old", updatedAt: "2026-09-20T00:00:00.000Z" }])],
      ["ggt.quote-invoice.unlock.v1", JSON.stringify({ paid: false })],
      ["ggt.quote-invoice.business.v1", JSON.stringify({ name: "Old" })],
    ]);
    let writes = 0;
    const localStorage = {
      getItem(key: string) {
        return backing.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        writes += 1;
        if (writes === 2) throw new Error("quota");
        backing.set(key, value);
      },
      removeItem(key: string) {
        backing.delete(key);
      },
    };

    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", localStorage);

    const { importBackup } = await import("../lib/storage");
    expect(() =>
      importBackup({
        version: 1,
        exportedAt: "2026-09-20T00:00:00.000Z",
        quotes: [],
        unlock: { paid: true },
        business: { name: "New", address: "", email: "", phone: "", logoDataUrl: "" },
      }),
    ).toThrow("Could not save data in this browser.");

    expect(backing.get("ggt.quote-invoice.unlock.v1")).toBe(JSON.stringify({ paid: false }));
    expect(backing.get("ggt.quote-invoice.business.v1")).toBe(JSON.stringify({ name: "Old" }));
  });
});
