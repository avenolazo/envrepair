import { describe, it, expect, vi, beforeEach } from "vitest"
import path from "node:path"
import fs from "node:fs/promises"
import { findEnvFiles } from "../../src/utils/env-files.js"

vi.mock("node:fs/promises")

describe("findEnvFiles", () => {
  const dummyCwd = "/test/project"

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("should default to .env if .env.local does not exist", async () => {
    // Mock fs.access to reject for all files (file does not exist)
    vi.spyOn(fs, "access").mockRejectedValue(new Error("ENOENT"))

    const paths = await findEnvFiles(dummyCwd)

    expect(paths.env).toBe(path.resolve(dummyCwd, ".env"))
    expect(paths.example).toBe(path.resolve(dummyCwd, ".env.example"))
  })

  it("should prioritize .env.local if it exists in the workspace", async () => {
    // Mock fs.access to resolve for .env.local and reject for others
    vi.spyOn(fs, "access").mockImplementation(async (filePath) => {
      if (filePath.toString().endsWith(".env.local")) {
        return // File exists
      }
      throw new Error("ENOENT")
    })

    const paths = await findEnvFiles(dummyCwd)

    expect(paths.env).toBe(path.resolve(dummyCwd, ".env.local"))
    expect(paths.example).toBe(path.resolve(dummyCwd, ".env.example"))
  })

  it("should walk up parent directories to find .env.example if missing in current directory", async () => {
    const subCwd = "/test/project/src"

    vi.spyOn(fs, "access").mockImplementation(async (filePath) => {
      const p = filePath.toString()
      if (p === "/test/project/.env.example" || p === "/test/project/.env.local") {
        return // File exists
      }
      throw new Error("ENOENT")
    })

    const paths = await findEnvFiles(subCwd)

    expect(paths.env).toBe("/test/project/.env.local")
    expect(paths.example).toBe("/test/project/.env.example")
  })
})
