# envrepair

An environment configuration manager for local development.

`envrepair` is a command line tool that validates your active `.env` file against `.env.example` before launching your application process. If any variables are missing, the tool prompts for their values interactively in the terminal (masking sensitive fields) and updates `.env` without modifying existing formatting, comments, or blank lines.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)
- [Options](#options)
- [CI/CD Integration](#cicd-integration)
- [Technical Architecture and Design](#technical-architecture-and-design)
- [License](#license)

## Features

- **Format preservation**: Parses env documents into structured line arrays, preserving comments, spacing, and ordering when writing new variables.
- **Interactive inputs**: Collects missing variables in the terminal and uses masked inputs for sensitive key patterns (passwords, tokens, keys).
- **Process proxying**: Executes target commands transparently, forwarding termination signals and returning the child process exit code.
- **CI/CD validation**: Automatically falls back to validation and reports errors without hanging in non-interactive environments.

## Installation

Install globally:

```bash
npm install -g envrepair
```

Or execute on demand:

```bash
npx envrepair
```

## Quick Start

Prepend your start command with `envrepair`:

```bash
envrepair next dev
```

The execution flow runs as follows:
1. `envrepair` compares `.env` against `.env.example`.
2. If variables are missing or empty, the CLI prompts for values.
3. Entered values are appended to `.env` while leaving original lines unchanged.
4. The target process (`next dev`) is spawned with inherited standard input and output streams.

## Command Reference

### Default Proxy

```bash
envrepair [target-command]
```

Checks environment validity, runs interactive repair if needed, and proxy executes the target command.

### doctor

```bash
envrepair doctor
```

Analyzes the environment files and outputs a status report of synced, missing, and unused variables. Exits with status 1 if missing variables exist.

### repair

```bash
envrepair repair
```

Runs the interactive terminal prompt flow to repair missing variables without starting a target process.

### diff

```bash
envrepair diff [--json]
```

Calculates the difference between active and template environment files. Prints plain text or structured JSON.

### check

```bash
envrepair check
```

Runs validation without interactive prompts, outputs differences in JSON, and exits with status 1 if variables are missing. Designed for automated scripting.

## Options

- `-e, --env <path>`: Path to the active env file (defaults to `.env`).
- `-x, --example <path>`: Path to the template example file (defaults to `.env.example`).
- `-h, --help`: Displays help information.

## CI/CD Integration

In headless environments, `envrepair` automatically skips prompts and exits with status 1 if variables are missing:

```bash
# Validates environment state and exits with 0 or 1.
envrepair check
```

## Technical Architecture and Design

Detailed specifications and architectural plans can be found in the project documentation:

- [Architecture Design](docs/03_architecture_design.md): Directory structure, module contracts, and data flows.
- [Parser Specification](docs/04_parser_specification.md): Value extraction grammar, quoting styles, escaping rules, and edge cases.
- [Competitive Landscape](docs/01_competitive_landscape.md): Gap analysis and comparisons with other dotenv validation tools.
- [Dependency Audit](docs/02_tech_stack_validation.md): Dependency rationalization and build configuration details.

## License

MIT
