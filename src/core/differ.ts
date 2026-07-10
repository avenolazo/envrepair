import type { EnvDocument, DiffResult, MissingVariable } from "./types.js"
import { extractVariables } from "./parser.js"

// Keywords commonly associated with credentials or sensitive values.
// Used to determine if shell inputs should mask user typings.
const SENSITIVE_PATTERNS = [
  "PASS", // Matches PASSWORD, PASSPHRASE, DB_PASS, SMTP_PASS
  "SECRET", // Matches CLIENT_SECRET, APP_SECRET
  "TOKEN", // Matches API_TOKEN, ACCESS_TOKEN, JWT
  "KEY", // Matches API_KEY, PRIVATE_KEY, STRIPE_KEY, KEY
  "PWD", // Matches DB_PWD, PWD
  "AUTH", // Matches AUTH, AUTHORIZATION
  "CREDENTIAL", // Matches CREDENTIALS
  "SALT", // Matches BCRYPT_SALT
  "HASH", // Matches PASSWORD_HASH
  "CERT", // Matches CLIENT_CERT, CERTIFICATE
  "PEM", // Matches SSL_PEM
  "SIGNATURE", // Matches WEBHOOK_SIGNATURE
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
 * Gathers preceding comments for a variable node in the env document and parses annotations.
 * This is used to present the developer with helpful context and validation types.
 */
function parseCommentBlock(
  doc: EnvDocument,
  index: number,
): {
  description?: string
  validationType?: "number" | "boolean" | "url" | "email" | "string"
} {
  const commentLines: string[] = []
  for (let j = index - 1; j >= 0; j--) {
    const line = doc[j]
    if (line.type === "comment") {
      const cleanComment = line.raw.replace(/^#\s*/, "").trim()
      commentLines.unshift(cleanComment)
    } else if (line.type === "blank") {
      // Allow single blank lines within comment blocks but stop if multiple blank lines occur.
      if (j - 1 >= 0 && doc[j - 1].type !== "comment") {
        break
      }
    } else {
      break
    }
  }

  let validationType: "number" | "boolean" | "url" | "email" | "string" | undefined
  const descriptions: string[] = []

  for (const line of commentLines) {
    // Matches @type annotations, e.g. "@type number", "@type boolean", etc.
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
    } else {
      descriptions.push(line)
    }
  }

  return {
    description: descriptions.length > 0 ? descriptions.join("\n") : undefined,
    validationType,
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
      const parsedComments = parseCommentBlock(example, i)
      missing.push({
        key,
        defaultValue: line.value !== "" ? line.value : undefined,
        isSensitive: isSensitiveKey(key),
        description: parsedComments.description,
        validationType: parsedComments.validationType,
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
