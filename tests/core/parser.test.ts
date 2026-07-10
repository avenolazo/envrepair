import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it, expect } from "vitest"
import { parseEnv, extractVariables } from "../../src/core/parser.js"

// Resolve current directory path since ESM does not provide __dirname natively.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixturesDir = path.join(__dirname, "../fixtures")

describe("parseEnv", () => {
  it("should parse basic env files correctly preserving comments and blank lines", async () => {
    const doc = await parseEnv(path.join(fixturesDir, "basic.env"))

    expect(doc).toHaveLength(6)

    // Verify first line is a comment
    expect(doc[0]).toEqual({
      type: "comment",
      raw: "# Database",
    })

    // Verify variable parsing
    expect(doc[1]).toEqual({
      type: "variable",
      key: "DATABASE_URL",
      value: "postgres://localhost:5432/mydb",
      raw: "DATABASE_URL=postgres://localhost:5432/mydb",
    })

    // Verify blank line preservation
    expect(doc[2]).toEqual({
      type: "blank",
      raw: "",
    })

    // Verify another comment
    expect(doc[3]).toEqual({
      type: "comment",
      raw: "# App",
    })

    // Verify second variable parsing
    expect(doc[4]).toEqual({
      type: "variable",
      key: "PORT",
      value: "3000",
      raw: "PORT=3000",
    })

    // Verify trailing newline is preserved as a blank line
    expect(doc[5]).toEqual({
      type: "blank",
      raw: "",
    })
  })

  it("should parse comments-only env files correctly", async () => {
    const doc = await parseEnv(path.join(fixturesDir, "comments-only.env"))
    expect(doc.every((line) => line.type === "comment" || line.type === "blank")).toBe(true)
  })

  it("should handle different quotation styles and escape sequences", async () => {
    const doc = await parseEnv(path.join(fixturesDir, "quoted-values.env"))
    const vars = extractVariables(doc)

    // Verify quote stripping
    expect(vars.get("DOUBLE_QUOTED")).toBe("hello world")
    expect(vars.get("SINGLE_QUOTED")).toBe("hello world")

    // Verify escaped double quotes inside double quotes
    expect(vars.get("DOUBLE_QUOTED_ESCAPED")).toBe('hello "world"')

    // Verify single-quoted literals ignore escape processing
    expect(vars.get("SINGLE_QUOTED_ESCAPED")).toBe("hello \\'world\\'")

    // Verify newline expansion in double quotes vs literal in single quotes
    expect(vars.get("DOUBLE_QUOTED_NEWLINE")).toBe("line1\nline2")
    expect(vars.get("SINGLE_QUOTED_NEWLINE")).toBe("line1\\nline2")

    // Verify spaces are preserved in unquoted values
    expect(vars.get("UNQUOTED_SPACES")).toBe("hello world")
  })

  it("should handle edge cases like exports, spaces around equals, empty values, and inline comments", async () => {
    const doc = await parseEnv(path.join(fixturesDir, "edge-cases.env"))
    const vars = extractVariables(doc)

    // Verify export prefix is correctly ignored
    expect(vars.get("EXPORTED_VAR")).toBe("value")

    // Verify spaces before key are trimmed
    expect(vars.get("SPACES_BEFORE_KEY")).toBe("value")

    // Verify spaces around equals are correctly handled
    expect(vars.get("SPACES_AROUND_EQUALS")).toBe("value")

    // Verify empty values are parsed as empty strings
    expect(vars.get("EMPTY_VAR")).toBe("")

    // Verify inline comment is stripped when preceded by space
    expect(vars.get("INLINE_COMMENT")).toBe("value")

    // Verify # is kept if not preceded by a space
    expect(vars.get("INLINE_COMMENT_NO_SPACE")).toBe("value#notcomment")

    // Verify comment character inside quotes is treated as part of the value
    expect(vars.get("QUOTED_COMMENT")).toBe("value # not comment")

    // Verify invalid keys starting with digits are treated as comments to prevent parser crash
    expect(vars.has("123INVALID_KEY")).toBe(false)

    // Verify malformed lines are treated as comments to prevent data loss
    const malformedLine = doc.find((l) => l.raw.includes("MALFORMED LINE"))
    expect(malformedLine?.type).toBe("comment")
  })

  it("should handle empty files", async () => {
    const doc = await parseEnv(path.join(fixturesDir, "empty.env"))
    expect(doc.every((line) => line.type === "blank")).toBe(true)
  })
})
