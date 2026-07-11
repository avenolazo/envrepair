# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2026-07-11

### Added

- Added support for optional variables annotated with `# @optional` in `.env.example` templates, allowing optional services to skip verification prompts and check failures.
- Added a comprehensive developer guide in `CONTRIBUTING.md` covering setup, testing, formatting, and Conventional Commits.
- Configured automated security scanning via GitHub CodeQL workflow.
- Configured repository sponsorship in `.github/FUNDING.yml` and dependency updates in `.github/dependabot.yml`.

### Changed

- Downgraded repository package manager requirement to `pnpm@9.15.4` and added workspace packages configurations to resolve Dependabot lockfile parsing errors.

## [0.1.4] - 2026-07-11

### Changed

- Moved all runtime dependencies (`@inquirer/prompts`, `commander`, `cross-spawn`, `picocolors`) to `devDependencies` and configured `tsup` to bundle them via `noExternal`.

### Added

- Zero-dependency runtime execution by inlining and compiling all third-party modules into the final ESM build.

### Fixed

- Resolved ESM module-scope dynamic require errors for Node built-in modules inside the compiled bundle by injecting a `createRequire` module-level shim banner.

## [0.1.3] - 2026-07-10

- Added interactive console demo GIF to the README header.
- Added a full console quick demo video (`walkthrough.mp4`) directly in the README.
- Added support and guides for installing `envrepair` locally as a devDependency using npm, pnpm, or yarn.

## [0.1.2] - 2026-07-10

### Added

- Added a comprehensive feature comparison table in the README evaluating `envrepair` against `dotenv-safe`, `sync-dotenv`, and `t3-env`/`envalid`.
- Expanded sensitive variable pattern matching to automatically mask short credential keys (e.g. `PASS`, `KEY`, `SECRET`, `PWD`, `CERT`, `PEM`).

### Fixed

- Resolved TypeScript compilation errors caused by implicit `any` types in process close handlers.

## [0.1.1] - 2026-07-10

### Added

- Added smart input validation using `# @type` comment annotations in `.env.example` templates (supporting `number`, `boolean`, `url`, and `email`).
- Added smart default environment file discovery that prioritizes `.env.local` if it exists.

### Fixed

- Fixed sensitive password prompts by removing unsafe default string leakages.
- Resolved logo rendering issues on npmjs.com by switching to absolute CDN URLs in the README.
- Fixed TypeScript compile-time imports by adopting type-only imports to satisfy `verbatimModuleSyntax`.

## [0.1.0] - 2026-07-10

### Added

- Initial release of `envrepair`.
- Format-preserving `.env` parser that retains inline comments, blank lines, and ordering.
- Interactive terminal repair loop using `@inquirer/prompts` with automatic masked inputs for credentials.
- CI/CD environment auto-detection to prevent CLI prompts from hanging in headless scripts.
- Transparent process proxy launcher that forwards signals (e.g., `Ctrl+C`) and mirrors exit codes.
