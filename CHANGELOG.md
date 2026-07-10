# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-07-10

### Added

- Added interactive terminal demo GIF to the top of the README.
- Added a full console quick demo video (`walkthrough.mp4`) directly in the README.

### Changed

- Expanded README installation guide to support local project dependency options (npm, pnpm, yarn).
- Documented the recommended workflow for devDependencies and package.json dev scripts.
- Restructured and polished the README layout, including logo alignment, brand name casing, GitHub alert boxes, and section reordering.
- Removed all em-dashes and refined language grammar throughout the documentation.

## [0.1.2] - 2026-07-10

### Added

- Added comprehensive comparison table in README against dotenv-safe, sync-dotenv, and t3-env/envalid.
- Added repository, bugs, and homepage metadata to package.json for better NPM registry integration.
- Installed devDependency types for cross-spawn.

### Fixed

- Fixed typescript compilation errors (explicitly typed parameters on close handlers).
- Cleaned up comments across the entire codebase to focus only on explaining 'Why' instead of 'What'.

### Changed

- Modernized all function declarations to modern ES6+ arrow function syntax.

## [0.1.1] - 2026-07-10

### Fixed

- Replaced relative logo image paths in README with raw GitHub absolute CDN links to fix rendering on npmjs.com.
- Fixed sensitive variables masking keywords check by expanding patterns to match short credential tokens (PASS, KEY, SECRET, PWD, CERT, PEM, etc.).
- Bypassed git checks during release processes.

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
