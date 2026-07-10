import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { appendVariables } from "../../src/core/writer.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const tempDir = path.join(__dirname, "../temp-writer-tests")

describe("appendVariables", () => {
  beforeEach(async () => {
    // Create clean temporary directory before each test.
    await fs.mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up temporary directory after each test.
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("should create a new file if it does not exist", async () => {
    const filePath = path.join(tempDir, ".env")
    const entries = [
      { key: "NEW_VAR", value: "hello" },
      { key: "SPACED_VAR", value: "hello world" },
    ]

    await appendVariables(filePath, entries)

    const content = await fs.readFile(filePath, "utf-8")
    expect(content).toBe('NEW_VAR=hello\nSPACED_VAR="hello world"\n')
  })

  it("should append to an existing file with a separator comment and ensure newline safety", async () => {
    const filePath = path.join(tempDir, ".env")
    // Write original file without trailing newline.
    await fs.writeFile(filePath, "EXISTING_VAR=value", "utf-8")

    const entries = [{ key: "APPENDED_VAR", value: "new-value" }]

    await appendVariables(filePath, entries, { separator: "# --- custom ---" })

    const content = await fs.readFile(filePath, "utf-8")
    expect(content).toBe("EXISTING_VAR=value\n# --- custom ---\nAPPENDED_VAR=new-value\n")
  })

  it("should respect createIfMissing option when set to false", async () => {
    const filePath = path.join(tempDir, "non-existent.env")
    const entries = [{ key: "VAR", value: "val" }]

    await expect(appendVariables(filePath, entries, { createIfMissing: false })).rejects.toThrow()
  })
})
