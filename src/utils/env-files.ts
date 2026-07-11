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
 * Searches upward from a starting directory to find the closest directory containing .env.example.
 * This ensures the CLI finds the correct repository root config when run from subdirectories.
 *
 * @param startDir - The directory path to begin the upward search.
 * @returns The directory path where .env.example was found, or the original startDir as a fallback.
 */
const findProjectRoot = async (startDir: string): Promise<string> => {
  let dir = startDir
  while (true) {
    const hasExample = await fileExists(path.join(dir, ".env.example"))
    if (hasExample) {
      return dir
    }

    const parent = path.dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }
  return startDir
}

/**
 * Resolves standard env and example file paths relative to the working directory.
 * Walks upward if no .env.example is found in the current working directory.
 *
 * @param cwd - Working directory to search, defaults to process.cwd().
 * @returns Object containing absolute paths to the environment files.
 */
export const findEnvFiles = async (cwd: string = process.cwd()): Promise<EnvFilePaths> => {
  const projectRoot = await findProjectRoot(cwd)

  const envLocalPath = path.resolve(projectRoot, ".env.local")
  const envPath = path.resolve(projectRoot, ".env")
  const examplePath = path.resolve(projectRoot, ".env.example")

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
