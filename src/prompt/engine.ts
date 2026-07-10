import { input, password } from '@inquirer/prompts';
import { MissingVariable } from '../core/types.js';
import { isCI } from '../utils/ci.js';

/**
 * Interactively prompts the developer for values of missing environment variables.
 * Uses masked input for credentials and plaintext input for public configurations.
 * Correctly bypasses prompting and returns empty values when running in CI.
 * Handles process termination gracefully (e.g., Ctrl+C).
 * 
 * @param missing - List of missing variables to prompt for.
 * @returns List of key-value pairs containing the developer's inputs.
 */
export async function promptForMissing(
  missing: MissingVariable[]
): Promise<Array<{ key: string; value: string }>> {
  if (missing.length === 0 || isCI()) {
    return [];
  }

  const results: Array<{ key: string; value: string }> = [];

  try {
    for (const variable of missing) {
      // Build prompt message incorporating variable comments/description.
      const message = variable.description
        ? `${variable.key} (${variable.description})`
        : variable.key;

      let value: string;

      if (variable.isSensitive) {
        value = await password({
          message,
          mask: '*',
          // Default values for sensitive fields are masked but supported.
          default: variable.defaultValue,
        });
      } else {
        value = await input({
          message,
          default: variable.defaultValue,
        });
      }

      results.push({ key: variable.key, value });
    }
  } catch (error: any) {
    // Intercept force-close events (Ctrl+C) to prevent raw stack trace leaks.
    if (
      error.name === 'ExitPromptError' ||
      (error instanceof Error && error.message.includes('force closed'))
    ) {
      console.log('\nOperation cancelled by user.');
      process.exit(130);
    }
    throw error;
  }

  return results;
}
