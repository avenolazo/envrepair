import { compareEnvs } from "../../core/differ.js"
import { extractVariables } from "../../core/parser.js"
import { loadAndParseEnvs } from "../loader.js"
import { log } from "../../utils/logger.js"

/**
 * Executes the 'doctor' diagnosis command.
 * Scans example and active files, lists the status of each variable,
 * and exits with code 1 if any required variable is missing.
 *
 * @param envPath - Path or paths to the active env file(s).
 * @param examplePath - Path to the template example file.
 */
export async function runDoctor(envPath: string | string[], examplePath: string): Promise<void> {
  const { actual, example, exampleExists } = await loadAndParseEnvs(envPath, examplePath)

  if (!exampleExists) {
    process.exit(1)
  }

  const diff = compareEnvs(example, actual)
  const actualVars = extractVariables(actual)

  log.header("Environment Diagnosis")

  // List all variables defined in the example with their current sync status.
  for (const line of example) {
    if (line.type === "variable" && line.key !== undefined) {
      const isMissing = diff.missing.some((v) => v.key === line.key)
      const isOptional = diff.optional.includes(line.key)
      if (isMissing) {
        log.variable(line.key, "missing")
      } else if (isOptional) {
        log.variable(line.key, "optional")
      } else {
        log.variable(line.key, "synced", actualVars.get(line.key))
      }
    }
  }

  // List any extra variables not present in the example.
  if (diff.unused.length > 0) {
    log.header("Unused Variables (Not in template)")
    for (const key of diff.unused) {
      log.variable(key, "unused")
    }
  }

  if (diff.missing.length > 0) {
    console.log()
    log.error(`Environment is incomplete. Missing ${diff.missing.length} required variable(s).`)
    process.exit(1)
  }

  console.log()
  log.success("Environment is healthy and fully synced.")
  process.exit(0)
}
