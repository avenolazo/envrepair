import { execSync } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { appendVariables } from "../src/core/writer.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const tempDir = path.join(__dirname, "temp-integration-tests")

describe("CLI Integration Tests", () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true })

    // Write a dummy example file.
    await fs.writeFile(
      path.join(tempDir, ".env.example"),
      "# Database URL\nDB_URL=postgres://localhost\nPORT=3000\n",
      "utf-8",
    )
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("should run doctor and fail when variables are missing", () => {
    const envPath = path.join(tempDir, ".env")
    const examplePath = path.join(tempDir, ".env.example")

    // Run using ts-node or vitest execution wrapper.
    // Since we bundle to dist, let's run the bundled script.
    const distCliPath = path.resolve(__dirname, "../dist/index.js")

    let error: any
    try {
      execSync(`node ${distCliPath} --env ${envPath} --example ${examplePath} doctor`, {
        stdio: "pipe",
      })
    } catch (err: any) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.status).toBe(1)
    const stdout = error.stdout.toString()
    expect(stdout).toContain("Environment Diagnosis")
    expect(stdout).toContain("DB_URL (missing)")
    expect(stdout).toContain("PORT (missing)")
  })

  it("should run check command, output JSON, and exit with status 1 on missing variables", () => {
    const distCliPath = path.resolve(__dirname, "../dist/index.js")
    const envPath = path.join(tempDir, ".env")
    const examplePath = path.join(tempDir, ".env.example")

    let error: any
    try {
      execSync(`node ${distCliPath} --env ${envPath} --example ${examplePath} check`, {
        stdio: "pipe",
      })
    } catch (err: any) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.status).toBe(1)
    const stdout = error.stdout.toString()
    const parsed = JSON.parse(stdout)
    expect(parsed.missing).toHaveLength(2)
    expect(parsed.missing[0].key).toBe("DB_URL")
  })

  it("should pass doctor and check command when environment is synced", async () => {
    const distCliPath = path.resolve(__dirname, "../dist/index.js")
    const envPath = path.join(tempDir, ".env")
    const examplePath = path.join(tempDir, ".env.example")

    // Pre-populate the env file.
    await fs.writeFile(envPath, "DB_URL=postgres://prod\nPORT=3000\n", "utf-8")

    // Test doctor command succeeds.
    const doctorStdout = execSync(
      `node ${distCliPath} --env ${envPath} --example ${examplePath} doctor`,
      {
        encoding: "utf-8",
      },
    )
    expect(doctorStdout).toContain("Environment is healthy and fully synced.")

    // Test check command succeeds and outputs JSON with empty missing array.
    const checkStdout = execSync(
      `node ${distCliPath} --env ${envPath} --example ${examplePath} check`,
      {
        encoding: "utf-8",
      },
    )
    const parsed = JSON.parse(checkStdout)
    expect(parsed.missing).toHaveLength(0)
    expect(parsed.synced).toContain("DB_URL")
    expect(parsed.synced).toContain("PORT")
  })

  it("should auto-detect and prioritize .env.local when running in directory without path arguments", async () => {
    const distCliPath = path.resolve(__dirname, "../dist/index.js")

    // Create a temporary workspace root.
    const workspaceDir = path.join(tempDir, "workspace")
    await fs.mkdir(workspaceDir, { recursive: true })

    // Write .env.example, .env, and .env.local inside this workspace.
    await fs.writeFile(path.join(workspaceDir, ".env.example"), "VAR_A=1\nVAR_B=2\n", "utf-8")
    await fs.writeFile(path.join(workspaceDir, ".env"), "VAR_A=10\n", "utf-8") // .env has VAR_A but lacks VAR_B
    await fs.writeFile(path.join(workspaceDir, ".env.local"), "VAR_A=100\nVAR_B=200\n", "utf-8") // .env.local is fully synced

    // Run check command from the workspace CWD.
    // It should automatically discover .env.local and consider it fully synced.
    const checkStdout = execSync(`node ${distCliPath} check`, {
      cwd: workspaceDir,
      encoding: "utf-8",
    })

    const parsed = JSON.parse(checkStdout)
    expect(parsed.missing).toHaveLength(0)
    expect(parsed.synced).toContain("VAR_A")
    expect(parsed.synced).toContain("VAR_B")
  })

  it("should identify unused variables in doctor report but not fail execution", async () => {
    const distCliPath = path.resolve(__dirname, "../dist/index.js")
    const envPath = path.join(tempDir, ".env")
    const examplePath = path.join(tempDir, ".env.example")

    // Pre-populate the env file with required vars AND an extra unused variable.
    await fs.writeFile(envPath, "DB_URL=postgres://prod\nPORT=3000\nEXTRA_VAR=some_val\n", "utf-8")

    // Test doctor command succeeds (exit code 0) even with unused variables.
    const doctorStdout = execSync(
      `node ${distCliPath} --env ${envPath} --example ${examplePath} doctor`,
      {
        encoding: "utf-8",
      },
    )
    expect(doctorStdout).toContain("Environment is healthy and fully synced.")
    expect(doctorStdout).toContain("EXTRA_VAR (unused)")
  })

  it("should preserve format (comments, blank lines) during repair updates", async () => {
    const distCliPath = path.resolve(__dirname, "../dist/index.js")
    const envPath = path.join(tempDir, ".env")
    const examplePath = path.join(tempDir, ".env.example")

    // Setup an env file with comments and blank lines.
    const initialContent =
      "# My local development configuration\n\nDB_URL=postgres://prod\n\n# End config\n"
    await fs.writeFile(envPath, initialContent, "utf-8")

    // .env.example has PORT, which is missing in .env.
    // We execute check first to confirm it is missing.
    let error: any
    try {
      execSync(`node ${distCliPath} --env ${envPath} --example ${examplePath} check`, {
        stdio: "pipe",
      })
    } catch (err: any) {
      error = err
    }
    expect(error).toBeDefined()

    // Verify raw comments are preserved and PORT gets added.
    await appendVariables(envPath, [{ key: "PORT", value: "3000" }], {
      separator: "# --- Added ---",
    })

    const finalContent = await fs.readFile(envPath, "utf-8")
    expect(finalContent).toContain("# My local development configuration")
    expect(finalContent).toContain("# End config")
    expect(finalContent).toContain("PORT=3000")
  })
})
