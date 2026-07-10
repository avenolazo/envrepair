import fs from "node:fs/promises"
import path from "node:path"

/**
 * Holds absolute paths for active environment and template files.
 */
export interface EnvFilePaths {
  /**
   * Absolute path to the active environment file (e.g. .env).
   */
  env: string
  /**
   * Absolute path to the template environment file (e.g. .env.example).
   */
  example: string
}

/**
 * Resolves standard env and example file paths relative to the working directory.
 * Ensures the CLI behaves consistently when executed from subfolders.
 *
 * @param cwd - Working directory to search, defaults to process.cwd().
 * @returns Object containing absolute paths to the environment files.
 */
export const findEnvFiles = async (cwd: string = process.cwd()): Promise<EnvFilePaths> => {
  const envLocalPath = path.resolve(cwd, ".env.local")
  const envPath = path.resolve(cwd, ".env")
  const examplePath = path.resolve(cwd, ".env.example")

  const hasEnvLocal = await fileExists(envLocalPath)

  return {
    env: hasEnvLocal ? envLocalPath : envPath,
    example: examplePath,
  }
}

/**
 * Verifies if a file exists and is accessible.
 * Used to check for missing template or target files prior to parsing.
 *
 * @param filePath - Path to check.
 * @returns True if the file exists and is accessible, false otherwise.
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
