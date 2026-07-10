import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Holds absolute paths for active environment and template files.
 */
export interface EnvFilePaths {
  /**
   * Absolute path to the active environment file (e.g. .env).
   */
  env: string;
  /**
   * Absolute path to the template environment file (e.g. .env.example).
   */
  example: string;
}

/**
 * Resolves standard env and example file paths relative to the working directory.
 * Ensures the CLI behaves consistently when executed from subfolders.
 * 
 * @param cwd - Working directory to search, defaults to process.cwd().
 * @returns Object containing absolute paths to the environment files.
 */
export async function findEnvFiles(cwd: string = process.cwd()): Promise<EnvFilePaths> {
  return {
    env: path.resolve(cwd, '.env'),
    example: path.resolve(cwd, '.env.example'),
  };
}

/**
 * Verifies if a file exists and is accessible.
 * Used to check for missing template or target files prior to parsing.
 * 
 * @param filePath - Path to check.
 * @returns True if the file exists and is accessible, false otherwise.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
