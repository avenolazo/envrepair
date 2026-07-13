import { compareEnvs } from "../../core/differ.js"
import { loadAndParseEnvs } from "../loader.js"
import { log } from "../../utils/logger.js"

interface DiffOptions {
  json?: boolean
}

/**
 * Runs the 'diff' command.
 * Outputs the differences between active and example environment files
 * as human-readable text or structured JSON.
 *
 * @param envPath - Path or paths to the active env file(s).
 * @param examplePath - Path to the template example file.
 * @param options - CLI options (e.g. `--json`).
 */
export async function runDiff(
  envPath: string | string[],
  examplePath: string,
  options: DiffOptions,
): Promise<void> {
  const { actual, example, exampleExists } = await loadAndParseEnvs(envPath, examplePath)

  if (!exampleExists) {
    process.exit(1)
  }

  const diff = compareEnvs(example, actual)

  if (options.json) {
    console.log(JSON.stringify(diff, null, 2))
    return
  }

  log.header("Environment Differences")

  if (diff.missing.length > 0) {
    console.log("Missing Variables:")
    for (const v of diff.missing) {
      const defaultValueHint = v.defaultValue ? ` (default: ${v.defaultValue})` : ""
      console.log(`  - ${v.key}${defaultValueHint}`)
    }
  } else {
    console.log("No missing variables.")
  }

  console.log()

  if (diff.optional.length > 0) {
    console.log("Optional Variables (missing):")
    for (const key of diff.optional) {
      console.log(`  - ${key}`)
    }
  } else {
    console.log("No missing optional variables.")
  }

  console.log()

  if (diff.unused.length > 0) {
    console.log("Unused Variables:")
    for (const key of diff.unused) {
      console.log(`  - ${key}`)
    }
  } else {
    console.log("No unused variables.")
  }

  console.log()
  console.log(`Synced variables: ${diff.synced.length}`)
}
