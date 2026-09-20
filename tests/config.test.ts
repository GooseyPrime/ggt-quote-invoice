import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOOL_PATH } from "../lib/config";

describe("Next.js routing config", () => {
  it("keeps the framework basePath aligned with the tool path", async () => {
    const config = await readFile(
      path.resolve(__dirname, "..", "next.config.mjs"),
      "utf8",
    );
    expect(config).toContain(`basePath: "${TOOL_PATH}"`);
  });
});
