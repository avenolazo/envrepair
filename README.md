<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/avenolazo/envrepair/main/assets/logo-dark.jpg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/avenolazo/envrepair/main/assets/logo-light.png">
    <img alt="envrepair logo" src="https://raw.githubusercontent.com/avenolazo/envrepair/main/assets/logo-dark.jpg" width="150" height="150">
  </picture>
</p>

<h1 align="center">envrepair</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/envrepair">
    <img src="https://img.shields.io/npm/v/envrepair.svg?style=flat-square" alt="npm version">
  </a>
  <a href="https://github.com/avenolazo/envrepair/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/avenolazo/envrepair.svg?style=flat-square" alt="license">
  </a>
</p>

<p align="center">
  <strong>Self-healing environment configuration manager for local development.</strong>
</p>

<p align="center">
  <a href="#why">Why?</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#command-reference">Command Reference</a>
</p>

---

`envrepair` validates your active `.env` file against `.env.example` before running your startup scripts. If variables are missing, the tool prompts for their values interactively in the terminal (masking credentials) and appends them to `.env` while preserving all comments, blank lines, and formatting.

## Why `envrepair`?

Managing `.env` files across a team is a constant source of developer friction:

- If a teammate adds a new key to `.env.example`, pulling their changes will crash your local application because your `.env` file is out of sync.
- Traditional validators like `dotenv-safe` force you to add runtime dependencies to your code and write boilerplate bootstrap checks.
- Basic sync scripts simply copy keys with empty values, destroying your comments, custom spacing, and file organization.

`envrepair` acts as a **non-intrusive terminal bouncer**. It runs at the process level (requiring zero code changes), interactively guides you to repair missing variables with real-time validation, and preserves 100% of your `.env` layout.

## Comparison

| Feature                           |       `envrepair`       |      `dotenv-safe`       |     `sync-dotenv`      |     `t3-env` / `envalid`     |
| :-------------------------------- | :---------------------: | :----------------------: | :--------------------: | :--------------------------: |
| **No Code Changes Required**      |    ✅ (CLI Wrapper)     | ❌ (Import boilerplate)  |    ✅ (CLI Runner)     |  ❌ (Requires code schema)   |
| **Interactive Terminal Prompts**  |   ✅ (Input prompts)    |    ❌ (Crash on boot)    | ❌ (Adds empty fields) |      ❌ (Crash on boot)      |
| **Comment & Layout Preservation** |  ✅ (Preserves format)  | ➖ (Doesn't write files) | ❌ (Destroys layouts)  |   ➖ (Doesn't write files)   |
| **Input Masking for Secrets**     |    ✅ (Auto-masking)    |            ❌            |           ❌           |              ❌              |
| **Smart Type Validation**         | ✅ (URL, Email, Number) |            ❌            |           ❌           | ✅ (Validates runtime types) |

## Features

- Parses `.env` files into structural nodes to keep comments, blank lines, and ordering intact when appending new keys.
- Interactively prompts for missing variables with automatic input masking for sensitive credentials (like passwords, keys, and tokens).
- Reads `# @type <type>` comments from `.env.example` to validate formats (number, boolean, url, email) in real-time.
- Runs target processes transparently, forwarding exit codes and POSIX signals.
- Automatically detects headless environments and runs diagnostic checks instead of hanging.

## Smart Type Validation

`envrepair` allows you to enforce type validation for missing variables directly in `.env.example` using `# @type <validationType>` comment annotations.

### Supported Types:

- **`number`** (or `int`, `integer`): Rejects any input that is not a valid number.
- **`boolean`** (or `bool`): Accepts `true`, `false`, `yes`, `no`, `1`, or `0`.
- **`url`** (or `uri`): Validates that the input is a valid absolute URL (e.g., `https://api.example.com`).
- **`email`**: Checks for standard email address format (e.g., `user@domain.com`).
- **`string`**: Default plaintext validation.

### Example:

In `.env.example`:

```env
# Backend port number
# @type number
PORT=3000

# Third-party service credentials
# @type url
API_BASE_URL=

# Admin contact address
# @type email
ADMIN_EMAIL=
```

When `envrepair` prompts for these variables, it automatically hides the `@type` annotation line so the description stays clean, and validates inputs in real-time, rejecting incorrect formats with clear helper instructions.

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
