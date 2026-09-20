import { describe, expect, it } from "vitest";
import { createId } from "../lib/ids";

describe("ids", () => {
  it("creates prefixed unique ids", () => {
    const a = createId("doc");
    const b = createId("doc");
    expect(a).toMatch(/^doc_/);
    expect(b).toMatch(/^doc_/);
    expect(a).not.toBe(b);
  });
});
