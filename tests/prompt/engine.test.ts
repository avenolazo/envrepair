import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promptForMissing } from '../../src/prompt/engine.js';
import { input, password } from '@inquirer/prompts';
import { isCI } from '../../src/utils/ci.js';

// Mock interactive prompt dependencies to allow running without terminal stdio.
vi.mock('@inquirer/prompts', () => {
  return {
    input: vi.fn(),
    password: vi.fn(),
  };
});

// Mock CI check to simulate different runner environments.
vi.mock('../../src/utils/ci.js', () => {
  return {
    isCI: vi.fn(),
  };
});

describe('promptForMissing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty results if missing variables array is empty', async () => {
    const results = await promptForMissing([]);
    expect(results).toEqual([]);
    expect(input).not.toHaveBeenCalled();
    expect(password).not.toHaveBeenCalled();
  });

  it('should bypass prompting and return empty results when running in CI', async () => {
    vi.mocked(isCI).mockReturnValue(true);

    const results = await promptForMissing([
      { key: 'VAR', isSensitive: false },
    ]);

    expect(results).toEqual([]);
    expect(input).not.toHaveBeenCalled();
    expect(password).not.toHaveBeenCalled();
  });

  it('should route normal variables to input prompt and sensitive variables to password prompt', async () => {
    vi.mocked(isCI).mockReturnValue(false);
    vi.mocked(input).mockResolvedValue('normal-value');
    vi.mocked(password).mockResolvedValue('secret-value');

    const missing = [
      { key: 'PORT', defaultValue: '3000', isSensitive: false, description: 'Server Port' },
      { key: 'API_KEY', isSensitive: true },
    ];

    const results = await promptForMissing(missing);

    // Verify input prompt config
    expect(input).toHaveBeenCalledWith({
      message: 'PORT (Server Port)',
      default: '3000',
    });

    // Verify password prompt config
    expect(password).toHaveBeenCalledWith({
      message: 'API_KEY',
      mask: '*',
      default: undefined,
    });

    // Verify final combined results
    expect(results).toEqual([
      { key: 'PORT', value: 'normal-value' },
      { key: 'API_KEY', value: 'secret-value' },
    ]);
  });
});
