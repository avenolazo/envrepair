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
  <a href="https://github.com/avenolazo/envrepair/actions/workflows/ci.yml">
    <img src="https://github.com/avenolazo/envrepair/actions/workflows/ci.yml/badge.svg" alt="CI Build Status">
  </a>
  <a href="https://github.com/avenolazo/envrepair/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/avenolazo/envrepair.svg?style=flat-square" alt="license">
  </a>
</p>

<p align="center">
  <strong>A zero-dependency CLI wrapper that detects and repairs missing environment variables before your app starts.</strong>
</p>

<p align="center">
  <a href="https://nodei.co/npm/envrepair/">
    <img src="https://nodei.co/npm/envrepair.png?downloads=true&downloadRank=true&stars=true" alt="NPM stats">
  </a>
</p>

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Quick Demo](#quick-demo)
- [Features](#features)
- [How It Works](#how-it-works)
- [Works With](#works-with)
- [Smart Type Validation](#smart-type-validation)
- [Optional Variables](#optional-variables)
- [FAQ](#faq)
- [Comparison](#comparison)
- [Command Reference](#command-reference)
- [Options](#options)
- [Multi-Environment Support](#multi-environment-support)
- [Configuration](#configuration)
- [CI/CD Integration](#cicd-integration)
- [Contributing](#contributing)
- [License](#license)

---

Stop crashing your app because your `.env` is out of sync with `.env.example`. envrepair compares your active `.env` against the template, repairs missing variables interactively, then launches your command while preserving comments, spacing, blank lines, and ordering.

<p align="center">
  <img src="https://raw.githubusercontent.com/avenolazo/envrepair/main/assets/demo.gif" alt="Interactive terminal session demonstrating envrepair identifying missing variables in .env, prompting the user for input, and spawning the development server once repaired." width="600">
</p>

## Installation

### Local Installation (Recommended for teams)

Install `envrepair` as a development dependency so it is available to all team members after `npm install`:

```bash
# npm
npm install -D envrepair

# pnpm
pnpm add -D envrepair

# yarn
yarn add -D envrepair

# bun
bun add -d envrepair
```

Then, prepend your startup scripts in `package.json`:

```json
"scripts": {
  "dev": "envrepair next dev"
}
```

### Global Installation & On-Demand

Install globally or run on-demand without a local installation:

```bash
# Install globally
npm install -g envrepair

# Or run instantly on demand
npx envrepair [command] # npm
bunx envrepair [command] # bun
```

## Quick Start

Simply prepend your normal development command with `envrepair`:

```bash
envrepair next dev
```

Whenever this command is run, `envrepair` will:

1. **Scan**: Compares your local `.env` (or `.env.local`) against `.env.example`.
2. **Prompt & Validate**: Interactively prompts you in the terminal for any missing keys, validating formats (like numbers, URLs, and emails) and masking sensitive credentials.
3. **Save**: Appends the new variables to your `.env` file safely, preserving all of your existing comments, spacing, blank lines, and ordering.
4. **Spawn**: Instantly starts your target command (`next dev`) as a transparent child process, passing signals (like `Ctrl+C`) and exit codes down to the shell.

**Example session:**

```
$ envrepair next dev

  Missing 2 required environment variable(s)

  DATABASE_URL
    Enter value: postgres://localhost/mydb

  API_SECRET_TOKEN
    Enter value (hidden): **************

  Appended 2 repaired variable(s) to .env.

> next dev
```

## Quick Demo

<video src="https://github.com/user-attachments/assets/eb0232f4-8c4c-42a5-bb2a-7c28ee084467" width="100%" controls aria-label="Walkthrough video displaying envrepair running in a real-world local environment setup process"></video>

## Features

- **Zero runtime dependencies.** Bundles all internal CLI utilities (prompts, spawners, parsers) to ensure instant installs, minimal footprint, and zero supply chain vulnerability risks.
- **Preserves your `.env` exactly as you organized it.** Comments, spacing, blank lines, and ordering stay intact.
- **Rejects invalid formats before they reach your application.** Validates URLs, emails, numbers, and booleans in real-time using `# @type` annotations in your template.
- **Masks credentials automatically.** Any key matching common sensitive patterns (PASSWORD, SECRET, TOKEN, KEY, etc.) is prompted with hidden input.
- Behaves like your original command. `Ctrl+C`, exit codes, and terminal output work exactly as expected.
- Automatically detects CI environments and exits with status 1 instead of hanging on interactive prompts.

## How It Works

```
.env.example
      │
      ▼
Compare with .env
      │
 Missing keys?
  ┌───┴───┐
  │       │
Prompt  Launch
  │
Update .env
  │
Launch
```

## Works With

`envrepair` wraps any development command. It is not tied to a specific framework or runtime.

```
next dev      node server.js    vite
npm run dev   bun run dev       astro dev
nest start    remix dev         python manage.py runserver
```

## Smart Type Validation

Add `# @type <type>` annotations to `.env.example` to validate inputs during prompts:

```env
# @type url
API_BASE_URL=
```

```
API_BASE_URL:
  Enter value: localhost
  ❌ Invalid url

  Enter value: https://api.example.com
  ✓
```

Supported validation types: `string`, `number`, `boolean`, `url`, `email`.

## Optional Variables

If your application has optional integrations (e.g. Sentry, Datadog) that are not strictly required for local development, mark them with a `# @optional` annotation in `.env.example`:

```env
# @optional
SENTRY_DSN=
```

When marked optional:

- `envrepair` will not prompt you for this key during setup.
- It will not cause diagnostic checks (`doctor`, `check`) or CI runs to fail if it is missing or empty.
- It will still be listed as `optional` in `doctor` and `diff` command reports.

## FAQ

**Does `envrepair` overwrite existing values?**

No. Only variables that are missing from your `.env` are appended. Existing values are never modified.

**Is this intended for production?**

No. `envrepair` is designed for local development. In CI environments it skips prompts entirely and exits with status 1 if variables are missing, so it integrates cleanly into pipelines without hanging.

## Comparison

| Feature                                                    | `envrepair` | `dotenv-safe` | `sync-dotenv` | `envalid` | `t3-env` |
| :--------------------------------------------------------- | :---------: | :-----------: | :-----------: | :-------: | :------: |
| **Works as a CLI wrapper**                                 |   ✅ Yes    |     ❌ No     |    ✅ Yes     |   ❌ No   |  ❌ No   |
| **Requires explicit validation definition**                |    ❌ No    |     ❌ No     |     ❌ No     |  ✅ Yes   |  ✅ Yes  |
| **Auto-repairs missing variables**                         |   ✅ Yes    |     ❌ No     |     ❌ No     |   ❌ No   |  ❌ No   |
| **Interactive terminal prompts**                           |   ✅ Yes    |     ❌ No     |     ❌ No     |   ❌ No   |  ❌ No   |
| **Preserves comments, spacing, blank lines, and ordering** |   ✅ Yes    |     ❌ No     |     ❌ No     |   ❌ No   |  ❌ No   |
| **Input masking for secrets**                              |   ✅ Yes    |     ❌ No     |     ❌ No     |   ❌ No   |  ❌ No   |
| **Interactive typed input prompts**                        |   ✅ Yes    |     ❌ No     |     ❌ No     |   ❌ No   |  ❌ No   |
| **Schema-based validation (Zod, etc.)**                    |    ❌ No    |     ❌ No     |     ❌ No     |   ❌ No   |  ✅ Yes  |
| **Zero runtime dependencies**                              |   ✅ Yes    |     ❌ No     |     ❌ No     |   ❌ No   |  ❌ No   |

> [!NOTE]
> `envrepair` focuses on interactive environment setup and automatic repair before your application starts. Tools like `t3-env` and `envalid` focus on validating environment variables inside your application at runtime. These tools solve different problems and can be used together.

## Why Not Just Use...?

### dotenv-safe

`dotenv-safe` intentionally fails fast, crashing your app if variables are missing and leaving you to find and fix them manually. `envrepair` guides you through repairing them interactively before your app ever starts.

### t3-env / envalid

These are runtime schema validators that live inside your application code. They are excellent at validating the types and shapes of variables your app depends on. `envrepair` works at the terminal layer before your app boots. They solve different problems and can be used together.

### sync-dotenv

`sync-dotenv` automatically copies missing keys from `.env.example` into `.env` with empty values. It does not prompt you to fill them in, and it destroys your existing comments, spacing, and ordering in the process.

## Command Reference

### Default Mode

```bash
envrepair [target-command]
```

Checks environment validity, runs interactive repair if needed, then runs the target command.

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

Shows differences between the active and template environment files. Outputs plain text or structured JSON.

### check

```bash
envrepair check
```

Runs validation without interactive prompts, outputs differences in JSON, and exits with status 1 if variables are missing. Designed for CI/CD scripting.

### init

```bash
envrepair init
```

Bootstraps a `.env.example` template by parsing an active `.env` file, preserving all spacing, comments, and structure while stripping the values of all variables.

## Options

- `-e, --env <path>`: Path to the active env file.
- `-x, --example <path>`: Path to the template example file (defaults to `.env.example`).
- `-m, --mode <name>`: Specifies environment mode (e.g. `development`, `production`). Resolves cascading files matching the mode.
- `-h, --help`: Displays help information.

## Multi-Environment Support

`envrepair` automatically supports multi-environment configurations using priority-based cascading resolution, mirroring standard frameworks (such as Next.js and Vite).

When you run `envrepair` without file path overrides, it scans and merges variables from existing active files in the following priority order (from lowest to highest):

1. `.env` (lowest priority)
2. `.env.${mode}` (if `--mode` is specified)
3. `.env.local` (local overrides; skipped if `--mode test` is used)
4. `.env.${mode}.local` (highest priority; if `--mode` is specified)

Any missing variables identified will be appended to the highest priority existing override file on disk (defaulting to `.env` or `.env.${mode}`).

## Configuration

You can customize `envrepair` defaults for your project directly inside your `package.json` file. This is highly useful if you store environment files in custom directories or use custom names.

Add an `"envrepair"` key to your `package.json`:

```json
{
  "name": "your-project",
  "envrepair": {
    "env": ".config/local.env",
    "example": ".env.template",
    "mode": "development"
  }
}
```

### Configuration Options

- `env` (string): Relative path to the target environment file (e.g. `.env`, `.config/local.env`).
- `example` (string): Relative path to the template environment file (e.g. `.env.example`, `.env.template`).
- `mode` (string): Default environment mode (e.g. `development`, `production`).

> [!NOTE]
> Command line arguments (like `-e`, `-x`, or `-m`) will always override settings defined in `package.json`.

## CI/CD Integration

In headless environments, `envrepair` skips prompts and exits with status 1 if variables are missing:

```bash
# Validates environment state and exits with 0 or 1.
envrepair check
```

## Contributing

Contributions are welcome! Please check the [Contributing Guidelines](CONTRIBUTING.md).

## License

Distributed under the [MIT License](LICENSE). See [LICENSE](LICENSE) for more details.
