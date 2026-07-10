import { describe, it, expect, vi, beforeEach } from "vitest"
import { launchProcess } from "../../src/runner/proxy.js"
import spawn from "cross-spawn"

// Mock cross-spawn to avoid launching actual external processes during testing.
vi.mock("cross-spawn", () => {
  return {
    default: vi.fn().mockReturnValue({
      on: vi.fn(),
      killed: false,
      kill: vi.fn(),
    }),
  }
})

describe("launchProcess", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call spawn with inherit stdio option", () => {
    launchProcess("npm", ["run", "dev"])
    expect(spawn).toHaveBeenCalledWith("npm", ["run", "dev"], { stdio: "inherit" })
  })
})
