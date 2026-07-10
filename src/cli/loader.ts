import { EnvDocument } from "../core/types.js"
import { parseEnv } from "../core/parser.js"
import { fileExists } from "../utils/env-files.js"
import { log } from "../utils/logger.js"

/**
 * Structured result containing both parsed env documents.
 */
export interface LoadedEnvs {
  /**
   * The parsed active environment (.env) document.
   */
  actual: EnvDocument
  /**
   * The parsed template (.env.example) document.
   */
  example: EnvDocument
  /**
   * Indicates if the active env file exists.
   */
  actualExists: boolean
  /**
   * Indicates if the example template file exists.
   */
  exampleExists: boolean
}

/**
 * Safely reads and parses the target environment and example files.
 * Handles missing files gracefully by logging warnings instead of throwing.
 *
 * @param envPath - Resolved path to the active env file.
 * @param examplePath - Resolved path to the template example file.
 * @returns Parsed documents and existence states.
 */
export async function loadAndParseEnvs(envPath: string, examplePath: string): Promise<LoadedEnvs> {
  const actualExists = await fileExists(envPath)
  const exampleExists = await fileExists(examplePath)

  let example: EnvDocument = []
  let actual: EnvDocument = []

  if (!exampleExists) {
    log.warn(`Template file not found at ${examplePath}. Comparisons will be skipped.`)
  } else {
    try {
      example = await parseEnv(examplePath)
    } catch (err: any) {
      log.error(`Failed to parse template file: ${err.message}`)
    }
  }

  if (actualExists) {
    try {
      actual = await parseEnv(envPath)
    } catch (err: any) {
      log.error(`Failed to parse environment file: ${err.message}`)
    }
  }

  return {
    actual,
    example,
    actualExists,
    exampleExists,
  }
}
