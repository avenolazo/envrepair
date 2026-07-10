<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.jpg">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.png">
    <img alt="envrepair logo" src="assets/logo-dark.jpg" width="150" height="150">
  </picture>
</p>

<h1 align="center">envrepair</h1>

<p align="center">
  <strong>Self-healing environment configuration manager for local development.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#command-reference">Command Reference</a>
</p>

---

`envrepair` validates your active `.env` file against `.env.example` before running your startup scripts. If variables are missing, the tool prompts for their values interactively in the terminal (masking credentials) and appends them to `.env` while preserving all comments, blank lines, and formatting.

## Features

- **Format preservation**: Parses env files into structural node arrays, ensuring comments, spacing, and ordering are kept intact when new variables are appended.
- **Interactive inputs**: Prompts for missing variables using masked inputs for sensitive key patterns (passwords, tokens, keys) and standard inputs for public options.
- **Process proxying**: Executes target commands as a transparent child process, forwarding signals and mirroring the exit code.
- **CI/CD validation**: Automatically falls back to diagnostic checks without hanging in headless environments.

## Installation

Install globally:

```bash
npm install -g envrepair
```

Or run on demand:

```bash
npx envrepair
```

## Quick Start

Prepend your start command with `envrepair`:

```bash
envrepair next dev
```

The tool will:

1. Compare `.env` against `.env.example`.
2. Prompt for inputs in the terminal if variables are missing or empty.
3. Append updates to `.env` while keeping existing formatting.
4. Spawn the target command (`next dev`) with inherited standard input and output streams.

## Command Reference

### Default Mode

```bash
envrepair [target-command]
```

Checks environment validity, runs interactive repair if needed, and proxy executes the target command.

### doctor

```bash
envrepair doctor
```

Outputs a status report of synced, missing, and unused variables. Exits with status 1 if missing variables exist.

### repair

```bash
envrepair repair
```

Runs the interactive terminal prompt flow to repair missing variables without starting a target process.

### diff

```bash
envrepair diff [--json]
```

Calculates differences between active and template environment files. Prints plain text or structured JSON.

### check

```bash
envrepair check
```

Runs validation without interactive prompts, outputs differences in JSON, and exits with status 1 if variables are missing. Designed for CI/CD scripting.

## Options

- `-e, --env <path>`: Path to the active env file (defaults to `.env`).
- `-x, --example <path>`: Path to the template example file (defaults to `.env.example`).
- `-h, --help`: Displays help information.

## CI/CD Integration

In headless environments, `envrepair` skips prompts and exits with status 1 if variables are missing:

```bash
# Validates environment state and exits with 0 or 1.
envrepair check
```

## License

MIT
