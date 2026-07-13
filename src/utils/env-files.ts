import fs from "node:fs/promises"
import path from "node:path"

/**
 * Holds absolute paths for active environment and template files.
 */
export interface EnvFilePaths {
  /**
   * Absolute path to the environment file write target.
   */
  env: string
  /**
   * Absolute path to the template environment file (e.g. .env.example).
   */
  example: string
  /**
   * Absolute paths of all existing active env files in cascading order (lowest to highest priority).
   */
  activeFiles: string[]
}

/**
 * Searches upward from a starting directory to find the closest directory containing package.json or .env.example.
 * This ensures the CLI finds the correct repository root config when run from subdirectories.
 *
 * @param startDir - The directory path to begin the upward search.
 * @returns The directory path where package.json or .env.example was found, or the original startDir as a fallback.
 */
export const findProjectRoot = async (startDir: string): Promise<string> => {
  let dir = startDir
  while (true) {
    const hasPkg = await fileExists(path.join(dir, "package.json"))
    if (hasPkg) {
      return dir
    }
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
 * Supports environment modes and returns a cascading list of active env files.
 *
 * @param cwd - Working directory to search, defaults to process.cwd().
 * @param mode - Optional environment mode (e.g. development, production, test).
 * @returns Object containing absolute paths to the environment files.
 */
export const findEnvFiles = async (
  cwd: string = process.cwd(),
  mode?: string,
): Promise<EnvFilePaths> => {
  const projectRoot = await findProjectRoot(cwd)
  const examplePath = path.resolve(projectRoot, ".env.example")

  const activeFiles: string[] = []

  // 1. .env (lowest priority)
  const envPath = path.resolve(projectRoot, ".env")
  activeFiles.push(envPath)

  // 2. .env.${mode} (if mode is set)
  if (mode) {
    activeFiles.push(path.resolve(projectRoot, `.env.${mode}`))
  }

  // 3. .env.local (if mode is not 'test')
  if (mode !== "test") {
    activeFiles.push(path.resolve(projectRoot, ".env.local"))
  }

  // 4. .env.${mode}.local (if mode is set)
  if (mode) {
    activeFiles.push(path.resolve(projectRoot, `.env.${mode}.local`))
  }

  // Filter to only existing files
  const existingActive: string[] = []
  for (const file of activeFiles) {
    if (await fileExists(file)) {
      existingActive.push(file)
    }
  }

  // Default to .env if no active files exist
  if (existingActive.length === 0) {
    existingActive.push(envPath)
  }

  // Determine write target (highest priority existing file, or .env if none exist)
  let writeTarget = envPath
  if (mode && (await fileExists(path.resolve(projectRoot, `.env.${mode}.local`)))) {
    writeTarget = path.resolve(projectRoot, `.env.${mode}.local`)
  } else if (await fileExists(path.resolve(projectRoot, ".env.local"))) {
    writeTarget = path.resolve(projectRoot, ".env.local")
  } else if (mode && (await fileExists(path.resolve(projectRoot, `.env.${mode}`)))) {
    writeTarget = path.resolve(projectRoot, `.env.${mode}`)
  } else if (await fileExists(envPath)) {
    writeTarget = envPath
  } else {
    // If no files exist on disk, default write target to .env (or .env.mode if mode set)
    writeTarget = mode ? path.resolve(projectRoot, `.env.${mode}`) : envPath
  }

  return {
    env: writeTarget,
    example: examplePath,
    activeFiles: existingActive,
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
