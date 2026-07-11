# Contributing to envrepair

Guidelines for contributing to `envrepair`.

---

## Development Setup

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

## Development Workflow

### Building

Build the zero-dependency distribution before testing or releasing:

```bash
pnpm build
```

### Running Tests

Verify logic with Vitest:

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Linting & Formatting

Ensure code conforms to formatting and linting rules:

```bash
pnpm fix
```

---

## Code Guidelines

1. **Zero Runtime Dependencies**: Do not add packages to the `"dependencies"` object in `package.json`. Install dependencies as a devDependency to be bundled by `tsup` via the `noExternal` configuration.
2. **Format Preservation**: Modifications to `parser.ts` or `writer.ts` must maintain compatibility with the format-preserving implementation (comments, whitespace, blank lines, and ordering).
3. **TSDoc / JSDoc**: Exported functions must include JSDoc/TSDoc annotations. Document the **why** (rationale, assumptions, side-effects) rather than the **what**.

---

## Commit Messages

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

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

## Pull Request Process

1. Create a branch named after the feature/bug (e.g., `feat/my-feature` or `fix/issue-id`).
2. Run `pnpm fix` and verify all tests pass (`pnpm test`).
3. Open a Pull Request on GitHub.
4. Ensure the PR title follows the Conventional Commit format.
