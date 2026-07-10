import { compareEnvs } from "../../core/differ.js"
import { loadAndParseEnvs } from "../loader.js"

/**
 * Runs the 'check' diagnostics command suited for CI pipelines.
 * Outputs the results as JSON and exits with code 1 if any required variables are missing.
 *
 * @param envPath - Path to the active env file.
 * @param examplePath - Path to the template example file.
 */
export async function runCheck(envPath: string, examplePath: string): Promise<void> {
  const { actual, example, exampleExists } = await loadAndParseEnvs(envPath, examplePath)

  if (!exampleExists) {
    process.exit(1)
  }

  const diff = compareEnvs(example, actual)

  console.log(JSON.stringify(diff, null, 2))

  if (diff.missing.length > 0) {
    process.exit(1)
  }

  process.exit(0)
}
