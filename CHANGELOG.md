# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-10

### Added

- Initial release of `envrepair`.
- Format-preserving `.env` parser that retains inline comments, blank lines, and ordering.
- Pure diffing engine for comparing active environment files against templates.
- Interactive terminal repair loop using `@inquirer/prompts` with automatic masked inputs for credentials.
- CI/CD environment auto-detection to prevent prompts from hanging in headless scripts.
- Signal-forwarding and exit-code-mirroring process proxy launcher.
- Commands: `doctor`, `repair`, `diff`, `check`, and default process proxy execution mode.
- Path customization support via `--env` and `--example` flags.
