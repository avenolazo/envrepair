import fs from "node:fs/promises"
import { parseEnv } from "../../core/parser.js"
import { fileExists } from "../../utils/env-files.js"
import { log } from "../../utils/logger.js"

/**
 * Executes the 'init' command.
 * Scans the active environment file, strips all variable values,
 * and writes a template structure to `.env.example`.
 *
 * @param envPath - Path to the active env file to read from.
 * @param examplePath - Path to the template example file to write to.
 */
export async function runInit(envPath: string, examplePath: string): Promise<void> {
  const envExists = await fileExists(envPath)

  if (!envExists) {
    log.error(`No active environment file found at ${envPath} to initialize from.`)
    process.exit(1)
  }

  try {
    const doc = await parseEnv(envPath)
    const lines: string[] = []

    for (const line of doc) {
      if (line.type === "blank") {
        lines.push(line.raw)
      } else if (line.type === "comment") {
        lines.push(line.raw)
      } else if (line.type === "variable" && line.key !== undefined) {
        lines.push(`${line.key}=`)
      }
    }

    const content = lines.join("\n")
    // Ensure final newline if not already present
    const finalContent = content.endsWith("\n") ? content : content + "\n"

    await fs.writeFile(examplePath, finalContent, "utf-8")
    log.success(`Successfully initialized template file at ${examplePath} from ${envPath}`)
  } catch (err: any) {
    log.error(`Failed to initialize template: ${err.message}`)
    process.exit(1)
  }
}
