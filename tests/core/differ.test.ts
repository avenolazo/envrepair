import { describe, it, expect } from 'vitest';
import { compareEnvs } from '../../src/core/differ.js';
import { EnvDocument } from '../../src/core/types.js';

describe('compareEnvs', () => {
  it('should identify missing, unused, and synced variables correctly', () => {
    // Mock template (.env.example)
    const example: EnvDocument = [
      { type: 'comment', raw: '# The database URL' },
      { type: 'variable', key: 'DATABASE_URL', value: 'postgres://localhost', raw: 'DATABASE_URL=postgres://localhost' },
      { type: 'comment', raw: '# Authentication credentials' },
      { type: 'comment', raw: '# Keep this private' },
      { type: 'variable', key: 'JWT_SECRET', value: '', raw: 'JWT_SECRET=' },
      { type: 'variable', key: 'PORT', value: '3000', raw: 'PORT=3000' },
    ];

    // Mock active environment (.env)
    const actual: EnvDocument = [
      { type: 'variable', key: 'DATABASE_URL', value: 'postgres://production', raw: 'DATABASE_URL=postgres://production' },
      { type: 'variable', key: 'JWT_SECRET', value: '', raw: 'JWT_SECRET=' }, // Empty value is considered missing
      { type: 'variable', key: 'UNUSED_VAR', value: 'hello', raw: 'UNUSED_VAR=hello' },
    ];

    const result = compareEnvs(example, actual);

    // Verify missing variables detection
    expect(result.missing).toHaveLength(2);

    // PORT is missing entirely
    expect(result.missing.find(v => v.key === 'PORT')).toEqual({
      key: 'PORT',
      defaultValue: '3000',
      isSensitive: false,
      description: undefined,
    });

    // JWT_SECRET is present but empty, and is classified as sensitive
    expect(result.missing.find(v => v.key === 'JWT_SECRET')).toEqual({
      key: 'JWT_SECRET',
      defaultValue: undefined,
      isSensitive: true,
      description: 'Authentication credentials\nKeep this private',
    });

    // Verify unused variables detection
    expect(result.unused).toEqual(['UNUSED_VAR']);

    // Verify synced variables detection (DATABASE_URL is in both and has a value)
    expect(result.synced).toEqual(['DATABASE_URL']);
  });
});
