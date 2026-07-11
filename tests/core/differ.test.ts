import { describe, it, expect } from "vitest"
import { compareEnvs } from "../../src/core/differ.js"
import { EnvDocument } from "../../src/core/types.js"

describe("compareEnvs", () => {
  it("should identify missing, unused, and synced variables correctly", () => {
    // Mock template (.env.example)
    const example: EnvDocument = [
      { type: "comment", raw: "# The database URL" },
      {
        type: "variable",
        key: "DATABASE_URL",
        value: "postgres://localhost",
        raw: "DATABASE_URL=postgres://localhost",
      },
      { type: "comment", raw: "# Authentication credentials" },
      { type: "comment", raw: "# Keep this private" },
      { type: "variable", key: "JWT_SECRET", value: "", raw: "JWT_SECRET=" },
      { type: "variable", key: "PORT", value: "3000", raw: "PORT=3000" },
    ]

    // Mock active environment (.env)
    const actual: EnvDocument = [
      {
        type: "variable",
        key: "DATABASE_URL",
        value: "postgres://production",
        raw: "DATABASE_URL=postgres://production",
      },
      { type: "variable", key: "JWT_SECRET", value: "", raw: "JWT_SECRET=" }, // Empty value is considered missing
      { type: "variable", key: "UNUSED_VAR", value: "hello", raw: "UNUSED_VAR=hello" },
    ]

    const result = compareEnvs(example, actual)

    // Verify missing variables detection
    expect(result.missing).toHaveLength(2)

    // PORT is missing entirely
    expect(result.missing.find((v) => v.key === "PORT")).toEqual({
      key: "PORT",
      defaultValue: "3000",
      isSensitive: false,
      description: undefined,
    })

    // JWT_SECRET is present but empty, and is classified as sensitive
    expect(result.missing.find((v) => v.key === "JWT_SECRET")).toEqual({
      key: "JWT_SECRET",
      defaultValue: undefined,
      isSensitive: true,
      description: "Authentication credentials\nKeep this private",
    })

    // Verify unused variables detection
    expect(result.unused).toEqual(["UNUSED_VAR"])

    // Verify synced variables detection (DATABASE_URL is in both and has a value)
    expect(result.synced).toEqual(["DATABASE_URL"])
  })

  it("should parse validation annotations from template comments", () => {
    const example: EnvDocument = [
      { type: "comment", raw: "# A numeric limit value" },
      { type: "comment", raw: "# @type number" },
      { type: "variable", key: "LIMIT", value: "", raw: "LIMIT=" },
      { type: "comment", raw: "# API endpoints" },
      { type: "comment", raw: "# @type url" },
      { type: "variable", key: "API_URL", value: "", raw: "API_URL=" },
    ]

    const actual: EnvDocument = []

    const result = compareEnvs(example, actual)

    expect(result.missing).toHaveLength(2)

    expect(result.missing.find((v) => v.key === "LIMIT")).toEqual({
      key: "LIMIT",
      defaultValue: undefined,
      isSensitive: false,
      description: "A numeric limit value",
      validationType: "number",
    })

    expect(result.missing.find((v) => v.key === "API_URL")).toEqual({
      key: "API_URL",
      defaultValue: undefined,
      isSensitive: false,
      description: "API endpoints",
      validationType: "url",
    })
  })

  it("should flag various sensitive key patterns as sensitive", () => {
    const example: EnvDocument = [
      { type: "variable", key: "DB_PASS", value: "", raw: "DB_PASS=" },
      { type: "variable", key: "SMTP_PWD", value: "", raw: "SMTP_PWD=" },
      { type: "variable", key: "STRIPE_KEY", value: "", raw: "STRIPE_KEY=" },
      { type: "variable", key: "WEBHOOK_SIGNATURE", value: "", raw: "WEBHOOK_SIGNATURE=" },
      { type: "variable", key: "CLIENT_CERT", value: "", raw: "CLIENT_CERT=" },
      { type: "variable", key: "SSL_PEM", value: "", raw: "SSL_PEM=" },
      { type: "variable", key: "BCRYPT_SALT", value: "", raw: "BCRYPT_SALT=" },
      { type: "variable", key: "PUBLIC_CONFIG", value: "", raw: "PUBLIC_CONFIG=" },
    ]

    const result = compareEnvs(example, [])

    expect(result.missing.find((v) => v.key === "DB_PASS")?.isSensitive).toBe(true)
    expect(result.missing.find((v) => v.key === "SMTP_PWD")?.isSensitive).toBe(true)
    expect(result.missing.find((v) => v.key === "STRIPE_KEY")?.isSensitive).toBe(true)
    expect(result.missing.find((v) => v.key === "WEBHOOK_SIGNATURE")?.isSensitive).toBe(true)
    expect(result.missing.find((v) => v.key === "CLIENT_CERT")?.isSensitive).toBe(true)
    expect(result.missing.find((v) => v.key === "SSL_PEM")?.isSensitive).toBe(true)
    expect(result.missing.find((v) => v.key === "BCRYPT_SALT")?.isSensitive).toBe(true)
    expect(result.missing.find((v) => v.key === "PUBLIC_CONFIG")?.isSensitive).toBe(false)
  })

  it("should parse optional annotations and separate them from required missing variables", () => {
    const example: EnvDocument = [
      { type: "comment", raw: "# An optional analytic key" },
      { type: "comment", raw: "# @optional" },
      { type: "variable", key: "ANALYTICS_KEY", value: "", raw: "ANALYTICS_KEY=" },
      { type: "comment", raw: "# A required database key" },
      { type: "variable", key: "DATABASE_URL", value: "", raw: "DATABASE_URL=" },
    ]

    const actual: EnvDocument = []

    const result = compareEnvs(example, actual)

    expect(result.missing).toHaveLength(1)
    expect(result.missing[0].key).toBe("DATABASE_URL")

    expect(result.optional).toEqual(["ANALYTICS_KEY"])
  })
})
