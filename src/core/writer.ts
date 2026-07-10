import fs from "node:fs/promises"
import path from "node:path"
import type { WriterOptions } from "./types.js"

function formatEnvValue(value: string): string {
  const needsQuoting = /[\s'"#\n\r]/.test(value)
  if (needsQuoting) {
    return `"${value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")}"`
  }
  return value
}

/**
 * Appends new variables to the end of a .env file.
 * Employs an append-only strategy to protect existing styling, structure, and formatting.
 *
 * @param filePath - The target file path.
 * @param entries - List of key-value pairs to write.
 * @param options - Configure append behaviour (e.g. customized separator message).
 */
export async function appendVariables(
  filePath: string,
  entries: Array<{ key: string; value: string }>,
  options?: WriterOptions,
): Promise<void> {
  if (entries.length === 0) {
    return
  }

  const createIfMissing = options?.createIfMissing ?? true
  const separator = options?.separator ?? "# --- Added by envrepair ---"

  let fileExists = true
  try {
    await fs.access(filePath)
  } catch {
    fileExists = false
  }

  if (!fileExists) {
    if (!createIfMissing) {
      throw new Error(`Target environment file does not exist: ${filePath}`)
    }
    // Ensure parent directories exist before creating the file.
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    const newContent =
      entries.map((entry) => `${entry.key}=${formatEnvValue(entry.value)}`).join("\n") + "\n"

    await fs.writeFile(filePath, newContent, "utf-8")
    return
  }

  const content = await fs.readFile(filePath, "utf-8")
  let appendPrefix = ""

  // Prevent formatting issues by checking if the existing content ends with a newline.
  if (content.length > 0 && !content.endsWith("\n")) {
    appendPrefix = "\n"
  }

  const linesToAppend = [
    separator,
    ...entries.map((entry) => `${entry.key}=${formatEnvValue(entry.value)}`),
  ]

  const appendContent = appendPrefix + linesToAppend.join("\n") + "\n"
  await fs.appendFile(filePath, appendContent, "utf-8")
}
