import { compareEnvs } from '../../core/differ.js';
import { appendVariables } from '../../core/writer.js';
import { loadAndParseEnvs } from '../loader.js';
import { promptForMissing } from '../../prompt/engine.js';
import { isCI } from '../../utils/ci.js';
import { log } from '../../utils/logger.js';

/**
 * Runs the interactive environment repair loop.
 * Detects missing variables, prompts the user for inputs (bypassed in CI),
 * and appends values to the active environment file.
 * 
 * @param envPath - Path to the active env file.
 * @param examplePath - Path to the template example file.
 */
export async function runRepair(envPath: string, examplePath: string): Promise<void> {
  const { actual, example, exampleExists } = await loadAndParseEnvs(envPath, examplePath);

  if (!exampleExists) {
    process.exit(1);
  }

  const diff = compareEnvs(example, actual);

  if (diff.missing.length === 0) {
    log.success('Environment is already healthy and fully synced.');
    return;
  }

  // Intercept repairs in CI where headless execution makes prompts hang.
  if (isCI()) {
    log.error('Cannot run interactive repair in a CI/CD environment.');
    process.exit(1);
  }

  log.header(`Repairing Environment: ${diff.missing.length} missing variable(s) found`);

  // Prompt the user for the values.
  const answers = await promptForMissing(diff.missing);

  if (answers.length > 0) {
    await appendVariables(envPath, answers);
    log.success(`Successfully repaired env file. Appended ${answers.length} variable(s).`);
  } else {
    log.warn('Repair skipped. No variables were added.');
  }
}
