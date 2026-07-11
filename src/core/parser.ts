import fs from "node:fs/promises"
import type { EnvDocument } from "./types.js"

const VARIABLE_REGEX = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/

const stripBOM = (content: string): string => {
  // Prevent Byte Order Mark (BOM) characters from corrupting the first parsed key name.
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }
  return content
}

const extractValue = (rawValue: string): string => {
  const trimmed = rawValue.trim()

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\([nrt\\"])/g, (_, esc) => {
      switch (esc) {
        case "n":
          return "\n"
        case "r":
          return "\r"
        case "t":
          return "\t"
        case "\\":
          return "\\"
        case '"':
          return '"'
        default:
          return esc
      }
    })
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }

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
export const parseEnv = async (filePath: string): Promise<EnvDocument> => {
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
      document.push({
        type: "blank",
        raw: rawLine,
      })
    } else if (trimmedLine.startsWith("#")) {
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
export const extractVariables = (doc: EnvDocument): Map<string, string> => {
  const variables = new Map<string, string>()
  for (const line of doc) {
    if (line.type === "variable" && line.key !== undefined) {
      variables.set(line.key, line.value ?? "")
    }
  }
  return variables
}
