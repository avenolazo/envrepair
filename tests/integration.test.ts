import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, 'temp-integration-tests');

describe('CLI Integration Tests', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
    
    // Write a dummy example file.
    await fs.writeFile(
      path.join(tempDir, '.env.example'),
      '# Database URL\nDB_URL=postgres://localhost\nPORT=3000\n',
      'utf-8'
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should run doctor and fail when variables are missing', () => {
    const cliPath = path.resolve(__dirname, '../src/cli/index.ts');
    const envPath = path.join(tempDir, '.env');
    const examplePath = path.join(tempDir, '.env.example');

    // Run using ts-node or vitest execution wrapper.
    // Since we bundle to dist, let's run the bundled script.
    const distCliPath = path.resolve(__dirname, '../dist/index.js');

    let error: any;
    try {
      execSync(`node ${distCliPath} --env ${envPath} --example ${examplePath} doctor`, {
        stdio: 'pipe',
      });
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.status).toBe(1);
    const stdout = error.stdout.toString();
    expect(stdout).toContain('Environment Diagnosis');
    expect(stdout).toContain('DB_URL (missing)');
    expect(stdout).toContain('PORT (missing)');
  });

  it('should run check command, output JSON, and exit with status 1 on missing variables', () => {
    const distCliPath = path.resolve(__dirname, '../dist/index.js');
    const envPath = path.join(tempDir, '.env');
    const examplePath = path.join(tempDir, '.env.example');

    let error: any;
    try {
      execSync(`node ${distCliPath} --env ${envPath} --example ${examplePath} check`, {
        stdio: 'pipe',
      });
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.status).toBe(1);
    const stdout = error.stdout.toString();
    const parsed = JSON.parse(stdout);
    expect(parsed.missing).toHaveLength(2);
    expect(parsed.missing[0].key).toBe('DB_URL');
  });

  it('should pass doctor and check command when environment is synced', async () => {
    const distCliPath = path.resolve(__dirname, '../dist/index.js');
    const envPath = path.join(tempDir, '.env');
    const examplePath = path.join(tempDir, '.env.example');

    // Pre-populate the env file.
    await fs.writeFile(envPath, 'DB_URL=postgres://prod\nPORT=3000\n', 'utf-8');

    // Test doctor command succeeds.
    const doctorStdout = execSync(`node ${distCliPath} --env ${envPath} --example ${examplePath} doctor`, {
      encoding: 'utf-8',
    });
    expect(doctorStdout).toContain('Environment is healthy and fully synced.');

    // Test check command succeeds and outputs JSON with empty missing array.
    const checkStdout = execSync(`node ${distCliPath} --env ${envPath} --example ${examplePath} check`, {
      encoding: 'utf-8',
    });
    const parsed = JSON.parse(checkStdout);
    expect(parsed.missing).toHaveLength(0);
    expect(parsed.synced).toContain('DB_URL');
    expect(parsed.synced).toContain('PORT');
  });
});
