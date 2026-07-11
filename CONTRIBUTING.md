# Contributing to envrepair

Thank you for contributing to `envrepair`. Follow these guidelines to ensure a smooth contribution process.

---

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm v9

### Initializing the Project

```bash
# Clone the repository
git clone https://github.com/avenolazo/envrepair.git
cd envrepair

# Install dependencies
pnpm install
```

---

## 💻 Development Workflow

### Building

`envrepair` uses `tsup` to bundle all runtime dependencies into a zero-dependency ESM distribution. Run the build script before packing or testing final outputs:

```bash
pnpm build
```

### Running Tests

All logic must be accompanied by vitest test coverage.

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Linting & Formatting

Ensure all files conform to the ESLint and Prettier configs before pushing:

```bash
# Run linting and formatting fixes
pnpm fix
```

---

## 📐 Code Guidelines

1. **Zero Runtime Dependencies**: Do not add new packages to the `"dependencies"` object in `package.json`. If you require a utility, implement it directly or install it as a devDependency to be bundled by `tsup` (`noExternal` configuration).
2. **Format Preservation**: Any changes to `parser.ts` or `writer.ts` must maintain complete compatibility with the format-preserving philosophy (comments, whitespace, blank lines, and formatting must not be destroyed).
3. **TSDoc / JSDoc**: Every exported function must include TSDoc/JSDoc annotations. Document the **why** (rationale, assumptions, side effects) rather than the **what**.

---

## 📝 Commit Messages

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification for clear history and automatic changelog generation.

### Formats

```text
<type>(<scope>): <description>
```

### Types

- `feat`: A new feature (e.g., adding a new type validator).
- `fix`: A bug fix.
- `docs`: Documentation updates.
- `test`: Adding or correcting tests.
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `chore`: Maintenance (e.g. updating dependencies, workflows, configurations).

---

## 🚀 Pull Request Process

1. Create a branch named after the feature/bug (e.g. `feat/my-feature` or `fix/issue-id`).
2. Implement your changes, run `pnpm fix`, and verify all tests pass (`pnpm test`).
3. Open a Pull Request on GitHub.
4. Ensure the PR title follows the Conventional Commit format (as PRs are squashed and merged).
