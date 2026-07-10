import { Command } from 'commander';
import { findEnvFiles, fileExists } from '../utils/env-files.js';
import { compareEnvs } from '../core/differ.js';
import { appendVariables } from '../core/writer.js';
import { loadAndParseEnvs } from './loader.js';
import { promptForMissing } from '../prompt/engine.js';
import { launchProcess } from '../runner/proxy.js';
import { isCI } from '../utils/ci.js';
import { log } from '../utils/logger.js';

const defaults = await findEnvFiles();
const program = new Command();

program
  .name('envrepair')
  .description('Self-healing environment configuration manager for local development')
  .version('0.1.0')
  .option('-e, --env <path>', 'Path to the environment file', defaults.env)
  .option('-x, --example <path>', 'Path to the example template file', defaults.example);

program
  .command('doctor')
  .description('Diagnose missing and unused environment variables')
  .action(async () => {
    const opts = program.opts();
    const { runDoctor } = await import('./commands/doctor.js');
    await runDoctor(opts.env, opts.example);
  });

program
  .command('repair')
  .description('Interactively repair missing environment variables')
  .action(async () => {
    const opts = program.opts();
    const { runRepair } = await import('./commands/repair.js');
    await runRepair(opts.env, opts.example);
  });

program
  .command('diff')
  .description('Output environment file differences')
  .option('--json', 'Output results as JSON')
  .action(async (cmdOpts) => {
    const opts = program.opts();
    const { runDiff } = await import('./commands/diff.js');
    await runDiff(opts.env, opts.example, cmdOpts);
  });

program
  .command('check')
  .description('Perform a silent check returning JSON and a status exit code')
  .action(async () => {
    const opts = program.opts();
    const { runCheck } = await import('./commands/check.js');
    await runCheck(opts.env, opts.example);
  });

/**
 * Executes the default process proxy pipeline.
 * Performs a silent comparison, prompts for repairs if necessary,
 * and launches the target process with transparency.
 */
async function runProxyFlow(
  envPath: string,
  examplePath: string,
  command: string,
  args: string[]
): Promise<void> {
  const exampleExists = await fileExists(examplePath);
  
  if (exampleExists) {
    const { actual, example } = await loadAndParseEnvs(envPath, examplePath);
    const diff = compareEnvs(example, actual);

    if (diff.missing.length > 0) {
      if (isCI()) {
        log.error(`Incomplete environment. Missing ${diff.missing.length} variable(s) in CI.`);
        process.exit(1);
      }

      log.header(`Missing ${diff.missing.length} required environment variable(s)`);
      const answers = await promptForMissing(diff.missing);

      if (answers.length > 0) {
        await appendVariables(envPath, answers);
        log.success(`Appended ${answers.length} repaired variable(s) to ${envPath}.`);
      }
    }
  }

  // Pass execution directly to target process proxy.
  launchProcess(command, args);
}

// Extract CLI command line arguments.
const rawArgs = process.argv.slice(2);

if (rawArgs.length === 0) {
  program.outputHelp();
  process.exit(0);
}

// Parse configuration paths prior to command routing.
let envPath = defaults.env;
let examplePath = defaults.example;
const commandArgs: string[] = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--env' || arg === '-e') {
    envPath = rawArgs[++i];
  } else if (arg === '--example' || arg === '-x') {
    examplePath = rawArgs[++i];
  } else {
    commandArgs.push(arg);
  }
}

const subcommands = ['doctor', 'repair', 'diff', 'check', 'help', '--help', '-h', '--version', '-V'];

if (commandArgs.length > 0 && subcommands.includes(commandArgs[0])) {
  // Let Commander.js parse standard subcommands and options.
  program.parse(process.argv);
} else if (commandArgs.length > 0) {
  // Execute process proxy mode using the rest of the arguments.
  runProxyFlow(envPath, examplePath, commandArgs[0], commandArgs.slice(1)).catch(err => {
    log.error(`Execution failed: ${err.message}`);
    process.exit(1);
  });
} else {
  // Fallback to displaying command instructions.
  program.outputHelp();
}
