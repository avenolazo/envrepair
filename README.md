# envrepair

> Self-healing environment configuration manager for local development.

`envrepair` is a lightweight CLI utility that sits in front of your local startup scripts. It ensures your active `.env` file is fully aligned with `.env.example` before starting your application. If variables are missing, it repairs them interactively in your terminal and starts your app without context switching or manual file editing.

---

## Features

- **Format-Preserving Parser**: Retains existing formatting, blank lines, and comments in your `.env` files.
- **Interactive Repair Loop**: Prompts for missing fields and masks sensitive entries (API keys, secrets, passwords).
- **Zero Configuration**: Infers settings automatically from your current directory.
- **Transparent Process Proxying**: Forwards signals (Ctrl+C, termination) and exit codes to target commands.
- **CI-Safe Validation**: Silent mode designed for continuous integration checks.

---

## Installation

```bash
npm install -g envrepair
# or run on demand via npx
npx envrepair
```

---

## Quick Start

Wrap your startup command with `envrepair`:

```bash
envrepair next dev
# or
envrepair vite
```

1. `envrepair` compares `.env.example` against `.env`.
2. If any variables are missing, you will be prompted for values directly in the terminal (sensitive fields masked).
3. Value updates are appended to `.env` cleanly.
4. Your target process (e.g. `next dev` or `vite`) is spawned with transparent log forwarding.

---

## Command Reference

### Default Mode
```bash
envrepair [target-command]
```
Checks for missing environment variables, runs the interactive repair if needed, and proxy executes the target command.

### Diagnosis
```bash
envrepair doctor
```
Diagnoses `.env` against `.env.example` showing a status report of synced, missing, and unused variables. Exits with code 1 if issues are found.

### Repair
```bash
envrepair repair
```
Runs the interactive repair loop to input missing variables without launching any application process.

### Diff
```bash
envrepair diff [--json]
```
Outputs differences between active and template environment files. Supplying `--json` prints structured JSON.

### Check
```bash
envrepair check
```
A non-interactive diagnostics check that outputs JSON and exits with status 1 if variables are missing. Ideal for CI pipelines.

---

## Command-line Options

- `-e, --env <path>`: Path to the active env file (defaults to `.env`).
- `-x, --example <path>`: Path to the template example file (defaults to `.env.example`).
- `-h, --help`: Displays usage instructions.

---

## CI / CD Pipelines

In headless or non-interactive environments, `envrepair` automatically skips prompts and reports status to prevent terminal hangs:

```bash
# Performs validation check and exits with status 1 if variables are missing.
envrepair check
```

---

## Competitive Positioning

| Feature | dotenv / Node.js | dotenv-safe / envalid | envrepair |
|---|---|---|---|
| **Reads .env** | Yes | Yes | Yes |
| **Detects Missing** | No | Yes | Yes |
| **Interactive Repair** | No | No | **Yes** |
| **Bypasses Crashes** | No | No | **Yes** (self-heals and starts) |
| **Format Preserving** | No | No | **Yes** |

---

## License

MIT
