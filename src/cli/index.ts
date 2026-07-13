import { Command } from "commander"
import path from "node:path"
import { findEnvFiles, fileExists } from "../utils/env-files.js"
import { compareEnvs } from "../core/differ.js"
import { appendVariables } from "../core/writer.js"
import { loadAndParseEnvs } from "./loader.js"
import { promptForMissing } from "../prompt/engine.js"
import { launchProcess } from "../runner/proxy.js"
import { isCI } from "../utils/ci.js"
import { log } from "../utils/logger.js"

const program = new Command()

program
  .name("envrepair")
  .description("Self-healing environment configuration manager for local development")
  .version("0.1.8")
  .option("-e, --env <path>", "Path to the environment file")
  .option("-x, --example <path>", "Path to the example template file")
  .option("-m, --mode <name>", "Environment mode (e.g. development, production, test)")

interface ResolvedPaths {
  env: string | string[]
  writeTarget: string
  example: string
}

async function resolvePaths(opts: any): Promise<ResolvedPaths> {
  const resolved = await findEnvFiles(process.cwd(), opts.mode)
  return {
    env: opts.env ? opts.env : resolved.activeFiles,
    writeTarget: opts.env ? opts.env : resolved.env,
    example: opts.example ? opts.example : resolved.example,
  }
}

program
  .command("doctor")
  .description("Diagnose missing and unused environment variables")
  .action(async () => {
    const opts = program.opts()
    const { env, example } = await resolvePaths(opts)
    const { runDoctor } = await import("./commands/doctor.js")
    await runDoctor(env, example)
  })

program
  .command("repair")
  .description("Interactively repair missing environment variables")
  .action(async () => {
    const opts = program.opts()
    const { env, example, writeTarget } = await resolvePaths(opts)
    const { runRepair } = await import("./commands/repair.js")
    await runRepair(env, example, writeTarget)
  })

program
  .command("diff")
  .description("Output environment file differences")
  .option("--json", "Output results as JSON")
  .action(async (cmdOpts) => {
    const opts = program.opts()
    const { env, example } = await resolvePaths(opts)
    const { runDiff } = await import("./commands/diff.js")
    await runDiff(env, example, cmdOpts)
  })

program
  .command("check")
  .description("Perform a silent check returning JSON and a status exit code")
  .action(async () => {
    const opts = program.opts()
    const { env, example } = await resolvePaths(opts)
    const { runCheck } = await import("./commands/check.js")
    await runCheck(env, example)
  })

program
  .command("init")
  .description("Initialize .env.example template from an existing .env file")
  .action(async () => {
    const opts = program.opts()
    const env = opts.env ? opts.env : path.resolve(process.cwd(), ".env")
    const example = opts.example ? opts.example : path.resolve(process.cwd(), ".env.example")
    const { runInit } = await import("./commands/init.js")
    await runInit(env, example)
  })

/**
 * Executes the default process proxy pipeline.
 * Performs a silent comparison, prompts for repairs if necessary,
 * and launches the target process with transparency.
 */
async function runProxyFlow(
  envPath: string | string[],
  examplePath: string,
  writeTarget: string,
  command: string,
  args: string[],
): Promise<void> {
  const exampleExists = await fileExists(examplePath)

  if (exampleExists) {
    const { actual, example } = await loadAndParseEnvs(envPath, examplePath)
    const diff = compareEnvs(example, actual)

    if (diff.missing.length > 0) {
      if (isCI()) {
        log.error(`Incomplete environment. Missing ${diff.missing.length} variable(s) in CI.`)
        process.exit(1)
      }

      log.header(`Missing ${diff.missing.length} required environment variable(s)`)
      const answers = await promptForMissing(diff.missing)

      if (answers.length > 0) {
        await appendVariables(writeTarget, answers)
        log.success(`Appended ${answers.length} repaired variable(s) to ${writeTarget}.`)
      }
    }
  }

  // Pass execution directly to target process proxy.
  launchProcess(command, args)
}

// Extract CLI command line arguments.
const rawArgs = process.argv.slice(2)

if (rawArgs.length === 0) {
  program.outputHelp()
  process.exit(0)
}

// Parse configuration paths prior to command routing.
let explicitEnv: string | undefined = undefined
let explicitExample: string | undefined = undefined
let mode: string | undefined = undefined
const commandArgs: string[] = []

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i]
  if (arg === "--env" || arg === "-e") {
    explicitEnv = rawArgs[++i]
  } else if (arg === "--example" || arg === "-x") {
    explicitExample = rawArgs[++i]
  } else if (arg === "--mode" || arg === "-m") {
    mode = rawArgs[++i]
  } else {
    commandArgs.push(arg)
  }
}

const subcommands = [
  "doctor",
  "repair",
  "diff",
  "check",
  "init",
  "help",
  "--help",
  "-h",
  "--version",
  "-V",
]

if (commandArgs.length > 0 && subcommands.includes(commandArgs[0])) {
  // Let Commander.js parse standard subcommands and options.
  program.parse(process.argv)
} else if (commandArgs.length > 0) {
  // Execute process proxy mode using the rest of the arguments.
  const resolved = await findEnvFiles(process.cwd(), mode)
  const env = explicitEnv ? explicitEnv : resolved.activeFiles
  const writeTarget = explicitEnv ? explicitEnv : resolved.env
  const example = explicitExample ? explicitExample : resolved.example

  runProxyFlow(env, example, writeTarget, commandArgs[0], commandArgs.slice(1)).catch((err) => {
    log.error(`Execution failed: ${err.message}`)
    process.exit(1)
  })
} else {
  // Fallback to displaying command instructions.
  program.outputHelp()
}
