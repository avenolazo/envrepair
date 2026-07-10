import fs from "node:fs/promises"
import type { EnvDocument } from "./types.js"

// Matches standard environment variable declarations, supporting optional 'export' prefixes.
// Supports leading whitespace before the key or export prefix.
// Group 1 captures the key name, Group 2 captures the raw value string after the equals sign.
const VARIABLE_REGEX = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/

/**
 * Strips the UTF-8 Byte Order Mark (BOM) if present.
 * This prevents BOM characters from corrupting the first parsed key name.
 */
function stripBOM(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }
  return content
}

/**
 * Extracts and decodes the value of a parsed variable.
 * Preserves quotes and escape sequences for double-quoted values,
 * treats single quotes literally, and removes inline comments for unquoted values.
 */
function extractValue(rawValue: string): string {
  const trimmed = rawValue.trim()

  // Handle double-quoted values: resolve escape sequences and strip wrapping quotes.
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\")
      .replace(/\\"/g, '"')
  }

  // Handle single-quoted values: treat everything literally and strip wrapping quotes.
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }

  // Handle unquoted values: strip inline comments if preceded by whitespace.
  const commentIndex = trimmed.indexOf(" #")
  if (commentIndex !== -1) {
    return trimmed.substring(0, commentIndex).trim()
  }

  return trimmed
}

/**
 * Parses the contents of a .env file into a structured EnvDocument.
 * Preserves comments, blank lines, and line ordering to ensure format-safe edits.
 *
 * @param filePath - The path to the env file to parse.
 * @returns An ordered array of parsed line objects.
 */
export async function parseEnv(filePath: string): Promise<EnvDocument> {
  const rawContent = await fs.readFile(filePath, "utf-8")
  const content = stripBOM(rawContent)
  const rawLines = content.split("\n")

  const document: EnvDocument = []

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i]
    // Trim trailing carriage return to support Windows CRLF line endings.
    const cleanLine = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
    const trimmedLine = cleanLine.trim()

    if (trimmedLine === "") {
      // Preserve blank lines for structural spacing.
      document.push({
        type: "blank",
        raw: rawLine,
      })
    } else if (trimmedLine.startsWith("#")) {
      // Preserve standalone comments.
      document.push({
        type: "comment",
        raw: rawLine,
      })
    } else {
      const match = cleanLine.match(VARIABLE_REGEX)
      if (match) {
        const key = match[1]
        const rawValue = match[2]
        const value = extractValue(rawValue)

        document.push({
          type: "variable",
          key,
          value,
          raw: rawLine,
        })
      } else {
        // Treat malformed or unrecognized lines as comments to prevent data loss.
        document.push({
          type: "comment",
          raw: rawLine,
        })
      }
    }
  }

  return document
}

/**
 * Extracts key-value pairs from an EnvDocument.
 * Provides a fast lookup map containing resolved environment variable values.
 *
 * @param doc - The parsed env document.
 * @returns A Map containing variable keys and their extracted values.
 */
export function extractVariables(doc: EnvDocument): Map<string, string> {
  const variables = new Map<string, string>()
  for (const line of doc) {
    if (line.type === "variable" && line.key !== undefined) {
      variables.set(line.key, line.value ?? "")
    }
  }
  return variables
}
