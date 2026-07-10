import { EnvDocument, DiffResult, MissingVariable } from "./types.js"
import { extractVariables } from "./parser.js"

// Keywords commonly associated with credentials or sensitive values.
// Used to determine if shell inputs should mask user typings.
const SENSITIVE_PATTERNS = [
  "SECRET",
  "TOKEN",
  "PASSWORD",
  "API_KEY",
  "PRIVATE_KEY",
  "AUTH",
  "JWT",
  "CREDENTIAL",
  "PASSPHRASE",
] as const

/**
 * Determines if a variable key is likely to contain sensitive data.
 * Checks for the presence of typical credential-related keywords.
 */
function isSensitiveKey(key: string): boolean {
  const upper = key.toUpperCase()
  return SENSITIVE_PATTERNS.some((pattern) => upper.includes(pattern))
}

/**
 * Gathers preceding comments for a variable node in the env document.
 * This is used to present the developer with helpful context when prompting for values.
 */
function extractDescription(doc: EnvDocument, index: number): string | undefined {
  const comments: string[] = []
  for (let j = index - 1; j >= 0; j--) {
    const line = doc[j]
    if (line.type === "comment") {
      const cleanComment = line.raw.replace(/^#\s*/, "").trim()
      comments.unshift(cleanComment)
    } else if (line.type === "blank") {
      // Allow single blank lines within comment blocks but stop if multiple blank lines occur.
      if (j - 1 >= 0 && doc[j - 1].type !== "comment") {
        break
      }
    } else {
      break
    }
  }
  return comments.length > 0 ? comments.join("\n") : undefined
}

/**
 * Compares a template example document with an active env document to find differences.
 * Identifies missing variables (which need to be repaired), unused variables, and synced variables.
 *
 * @param example - The parsed template (.env.example) document.
 * @param actual - The parsed active environment (.env) document.
 * @returns A structured diff containing missing, unused, and synced variables.
 */
export function compareEnvs(example: EnvDocument, actual: EnvDocument): DiffResult {
  const actualVars = extractVariables(actual)
  const exampleVars = extractVariables(example)

  const missing: MissingVariable[] = []
  const synced: string[] = []

  // Identify missing and synced keys based on the template definitions.
  for (let i = 0; i < example.length; i++) {
    const line = example[i]
    if (line.type !== "variable" || line.key === undefined) {
      continue
    }

    const key = line.key
    const actualValue = actualVars.get(key)

    // If a key is absent or contains only empty values in the active env, it is missing.
    if (actualValue === undefined || actualValue === "") {
      missing.push({
        key,
        defaultValue: line.value !== "" ? line.value : undefined,
        isSensitive: isSensitiveKey(key),
        description: extractDescription(example, i),
      })
    } else {
      synced.push(key)
    }
  }

  // Identify variables in the active environment that are no longer part of the template.
  const unused: string[] = []
  for (const line of actual) {
    if (line.type === "variable" && line.key !== undefined) {
      if (!exampleVars.has(line.key)) {
        unused.push(line.key)
      }
    }
  }

  return {
    missing,
    unused,
    synced,
  }
}
