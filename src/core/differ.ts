import type { EnvDocument, DiffResult, MissingVariable } from "./types.js"
import { extractVariables } from "./parser.js"

const SENSITIVE_PATTERNS = [
  "PASS",
  "SECRET",
  "TOKEN",
  "KEY",
  "PWD",
  "AUTH",
  "CREDENTIAL",
  "SALT",
  "HASH",
  "CERT",
  "PEM",
  "SIGNATURE",
] as const

const isSensitiveKey = (key: string): boolean => {
  const upper = key.toUpperCase()
  return SENSITIVE_PATTERNS.some((pattern) => upper.includes(pattern))
}

const parseCommentBlock = (
  doc: EnvDocument,
  index: number,
): {
  description?: string
  validationType?: "number" | "boolean" | "url" | "email" | "string"
  isOptional?: boolean
} => {
  const commentLines: string[] = []
  for (let j = index - 1; j >= 0; j--) {
    const line = doc[j]
    if (line.type === "comment") {
      const cleanComment = line.raw.replace(/^#\s*/, "").trim()
      commentLines.unshift(cleanComment)
    } else if (line.type === "blank") {
      // We permit single blank lines inside a description block to support paragraph breaks
      // in documentation comments, but terminate on multiple consecutive empty lines.
      if (j - 1 >= 0 && doc[j - 1].type !== "comment") {
        break
      }
    } else {
      break
    }
  }

  let validationType: "number" | "boolean" | "url" | "email" | "string" | undefined
  let isOptional = false
  const descriptions: string[] = []

  for (const line of commentLines) {
    const typeMatch = line.match(
      /^@type\s+(number|int|integer|boolean|bool|url|uri|email|string)\b/i,
    )
    if (typeMatch) {
      const typeStr = typeMatch[1].toLowerCase()
      if (typeStr === "int" || typeStr === "integer") {
        validationType = "number"
      } else if (typeStr === "bool") {
        validationType = "boolean"
      } else if (typeStr === "uri") {
        validationType = "url"
      } else {
        validationType = typeStr as any
      }
    } else if (line.match(/^@optional\b/i)) {
      isOptional = true
    } else {
      descriptions.push(line)
    }
  }

  return {
    description: descriptions.length > 0 ? descriptions.join("\n") : undefined,
    validationType,
    isOptional,
  }
}

/**
 * Compares a template example document with an active env document to find differences.
 * Identifies missing variables (which need to be repaired), unused variables, and synced variables.
 *
 * @param example - The parsed template (.env.example) document.
 * @param actual - The parsed active environment (.env) document.
 * @returns A structured diff containing missing, unused, and synced variables.
 */
export const compareEnvs = (example: EnvDocument, actual: EnvDocument): DiffResult => {
  const actualVars = extractVariables(actual)
  const exampleVars = extractVariables(example)

  const missing: MissingVariable[] = []
  const synced: string[] = []
  const optional: string[] = []

  for (let i = 0; i < example.length; i++) {
    const line = example[i]
    if (line.type !== "variable" || line.key === undefined) {
      continue
    }

    const key = line.key
    const actualValue = actualVars.get(key)

    if (actualValue === undefined || actualValue === "") {
      const parsedComments = parseCommentBlock(example, i)
      if (parsedComments.isOptional) {
        optional.push(key)
      } else {
        missing.push({
          key,
          defaultValue: line.value !== "" ? line.value : undefined,
          isSensitive: isSensitiveKey(key),
          description: parsedComments.description,
          validationType: parsedComments.validationType,
        })
      }
    } else {
      synced.push(key)
    }
  }

  const unusedSet = new Set<string>()
  for (const line of actual) {
    if (line.type === "variable" && line.key !== undefined) {
      if (!exampleVars.has(line.key)) {
        unusedSet.add(line.key)
      }
    }
  }
  const unused = Array.from(unusedSet)

  return {
    missing,
    unused,
    synced,
    optional,
  }
}
