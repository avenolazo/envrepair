import { describe, it, expect, vi, beforeEach } from "vitest"
import { promptForMissing } from "../../src/prompt/engine.js"
import { input, password } from "@inquirer/prompts"
import { isCI } from "../../src/utils/ci.js"

// Mock interactive prompt dependencies to allow running without terminal stdio.
vi.mock("@inquirer/prompts", () => {
  return {
    input: vi.fn(),
    password: vi.fn(),
  }
})

// Mock CI check to simulate different runner environments.
vi.mock("../../src/utils/ci.js", () => {
  return {
    isCI: vi.fn(),
  }
})

describe("promptForMissing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return empty results if missing variables array is empty", async () => {
    const results = await promptForMissing([])
    expect(results).toEqual([])
    expect(input).not.toHaveBeenCalled()
    expect(password).not.toHaveBeenCalled()
  })

  it("should bypass prompting and return empty results when running in CI", async () => {
    vi.mocked(isCI).mockReturnValue(true)

    const results = await promptForMissing([{ key: "VAR", isSensitive: false }])

    expect(results).toEqual([])
    expect(input).not.toHaveBeenCalled()
    expect(password).not.toHaveBeenCalled()
  })

  it("should route normal variables to input prompt and sensitive variables to password prompt", async () => {
    vi.mocked(isCI).mockReturnValue(false)
    vi.mocked(input).mockResolvedValue("normal-value")
    vi.mocked(password).mockResolvedValue("secret-value")

    const missing = [
      { key: "PORT", defaultValue: "3000", isSensitive: false, description: "Server Port" },
      { key: "API_KEY", isSensitive: true },
    ]

    const results = await promptForMissing(missing)

    // Verify input prompt config
    expect(input).toHaveBeenCalledWith({
      message: "PORT (Server Port)",
      default: "3000",
      validate: expect.any(Function),
    })

    // Verify password prompt config
    expect(password).toHaveBeenCalledWith({
      message: "API_KEY",
      mask: "*",
      default: undefined,
      validate: expect.any(Function),
    })

    // Verify final combined results
    expect(results).toEqual([
      { key: "PORT", value: "normal-value" },
      { key: "API_KEY", value: "secret-value" },
    ])
  })

  it("should validate inputs based on validationType rules", async () => {
    vi.mocked(isCI).mockReturnValue(false)
    vi.mocked(input).mockResolvedValue("value")

    // Test Number validation
    await promptForMissing([{ key: "PORT", isSensitive: false, validationType: "number" }])
    const numberValidator = vi.mocked(input).mock.calls[0][0].validate as (
      value: string,
    ) => boolean | string
    expect(numberValidator("123")).toBe(true)
    expect(numberValidator("abc")).toBe("Please enter a valid number.")

    // Test Boolean validation
    await promptForMissing([{ key: "IS_ACTIVE", isSensitive: false, validationType: "boolean" }])
    const booleanValidator = vi.mocked(input).mock.calls[1][0].validate as (
      value: string,
    ) => boolean | string
    expect(booleanValidator("true")).toBe(true)
    expect(booleanValidator("no")).toBe(true)
    expect(booleanValidator("invalid")).toBe(
      "Please enter a valid boolean (true/false, yes/no, or 1/0).",
    )

    // Test URL validation
    await promptForMissing([{ key: "API_URL", isSensitive: false, validationType: "url" }])
    const urlValidator = vi.mocked(input).mock.calls[2][0].validate as (
      value: string,
    ) => boolean | string
    expect(urlValidator("https://google.com")).toBe(true)
    expect(urlValidator("not-a-url")).toBe(
      "Please enter a valid absolute URL (e.g., https://example.com).",
    )

    // Test Email validation
    await promptForMissing([{ key: "ADMIN_EMAIL", isSensitive: false, validationType: "email" }])
    const emailValidator = vi.mocked(input).mock.calls[3][0].validate as (
      value: string,
    ) => boolean | string
    expect(emailValidator("admin@example.com")).toBe(true)
    expect(emailValidator("invalid-email")).toBe("Please enter a valid email address.")
  })
})
