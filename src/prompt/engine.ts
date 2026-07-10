import { input, password } from "@inquirer/prompts"
import type { MissingVariable } from "../core/types.js"
import { isCI } from "../utils/ci.js"

/**
 * Creates an interactive validator function based on the variable's type constraints.
 */
function createValidator(variable: MissingVariable) {
  return (value: string): boolean | string => {
    // If empty and there is a default value, allow it (will fall back to default)
    if (!value && variable.defaultValue !== undefined) {
      return true
    }

    if (!value) {
      return true
    }

    if (variable.validationType === "number") {
      const isNum = !isNaN(Number(value))
      return isNum ? true : "Please enter a valid number."
    }

    if (variable.validationType === "boolean") {
      const valLower = value.toLowerCase()
      const isBool = ["true", "false", "1", "0", "yes", "no"].includes(valLower)
      return isBool ? true : "Please enter a valid boolean (true/false, yes/no, or 1/0)."
    }

    if (variable.validationType === "url") {
      try {
        new URL(value)
        return true
      } catch {
        return "Please enter a valid absolute URL (e.g., https://example.com)."
      }
    }

    if (variable.validationType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? true : "Please enter a valid email address."
    }

    return true
  }
}

/**
 * Interactively prompts the developer for values of missing environment variables.
 * Uses masked input for credentials and plaintext input for public configurations.
 * Correctly bypasses prompting and returns empty values when running in CI.
 * Handles process termination gracefully (e.g., Ctrl+C).
 *
 * @param missing - List of missing variables to prompt for.
 * @returns List of key-value pairs containing the developer's inputs.
 */
export async function promptForMissing(
  missing: MissingVariable[],
): Promise<Array<{ key: string; value: string }>> {
  if (missing.length === 0 || isCI()) {
    return []
  }

  const results: Array<{ key: string; value: string }> = []

  try {
    for (const variable of missing) {
      // Build prompt message incorporating variable comments/description.
      const message =
        variable.description ? `${variable.key} (${variable.description})` : variable.key

      let value: string

      if (variable.isSensitive) {
        value = await password({
          message,
          mask: "*",
          validate: createValidator(variable),
        })
      } else {
        value = await input({
          message,
          default: variable.defaultValue,
          validate: createValidator(variable),
        })
      }

      results.push({ key: variable.key, value })
    }
  } catch (error: any) {
    // Intercept force-close events (Ctrl+C) to prevent raw stack trace leaks.
    if (
      error.name === "ExitPromptError" ||
      (error instanceof Error && error.message.includes("force closed"))
    ) {
      console.log("\nOperation cancelled by user.")
      process.exit(130)
    }
    throw error
  }

  return results
}
