/**
 * SquireX — Agentforce Testing Center Push Client
 *
 * Pushes generated DX test specs to a Salesforce sandbox using the
 * Agentforce DX CLI (sf agent test). This completes the closed-loop
 * pipeline: SquireX scan → generate tests → push to Testing Center.
 *
 * @module testing-center/push-client
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';

const execFileAsync = promisify(execFile);

export interface PushOptions {
  /** Salesforce org alias or username */
  targetOrg: string;
  /** Path to the DX test YAML file */
  testFilePath: string;
  /** Timeout in seconds (default: 300) */
  timeout?: number;
  /** Wait for test completion (default: true) */
  wait?: boolean;
}

export interface PushResult {
  success: boolean;
  testRunId?: string;
  message: string;
  stdout: string;
  stderr: string;
}

export interface TestRunResult {
  success: boolean;
  testRunId: string;
  status: string;
  passCount: number;
  failCount: number;
  results: Array<{
    testCaseName: string;
    passed: boolean;
    message?: string;
  }>;
}

/**
 * Validate that the sf CLI is installed and has the agent commands.
 */
export async function validateSfCli(): Promise<{ available: boolean; version?: string; error?: string }> {
  try {
    const { stdout } = await execFileAsync('sf', ['version'], { timeout: 10_000 });
    const version = stdout.trim().split('\n')[0];

    // Check if agent commands are available
    try {
      await execFileAsync('sf', ['agent', 'test', '--help'], { timeout: 10_000 });
    } catch {
      return {
        available: false,
        version,
        error: 'sf CLI is installed but "sf agent test" commands are not available. Ensure you have the latest sf CLI with Agentforce DX support.',
      };
    }

    return { available: true, version };
  } catch {
    return {
      available: false,
      error: 'sf CLI is not installed. Install from https://developer.salesforce.com/tools/salesforcecli',
    };
  }
}

/**
 * Push a DX test spec to the Salesforce Testing API.
 *
 * This invokes: sf agent test run --test-file <path> --target-org <org>
 */
export async function pushTestSpec(options: PushOptions): Promise<PushResult> {
  const { targetOrg, testFilePath, timeout = 300, wait = true } = options;

  // Validate test file exists
  if (!fs.existsSync(testFilePath)) {
    return {
      success: false,
      message: `Test file not found: ${testFilePath}`,
      stdout: '',
      stderr: '',
    };
  }

  const args = [
    'agent', 'test', 'run',
    '--test-file', testFilePath,
    '--target-org', targetOrg,
    '--json',
  ];

  if (wait) {
    args.push('--wait', timeout.toString());
  }

  try {
    const { stdout, stderr } = await execFileAsync('sf', args, {
      timeout: (timeout + 30) * 1000, // Extra buffer
    });

    let result: unknown;
    try {
      result = JSON.parse(stdout);
    } catch {
      result = null;
    }

    const sfResult = result as { result?: { testRunId?: string } } | null;

    return {
      success: true,
      testRunId: sfResult?.result?.testRunId,
      message: 'Test spec pushed successfully to Agentforce Testing Center',
      stdout,
      stderr,
    };
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      message: error.message || 'Failed to push test spec',
      stdout: error.stdout || '',
      stderr: error.stderr || '',
    };
  }
}

/**
 * Validate a DX test spec without executing it.
 *
 * This invokes: sf agent test validate --test-file <path>
 */
export async function validateTestSpec(testFilePath: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  if (!fs.existsSync(testFilePath)) {
    return { valid: false, errors: [`File not found: ${testFilePath}`] };
  }

  try {
    await execFileAsync('sf', [
      'agent', 'test', 'validate',
      '--test-file', testFilePath,
      '--json',
    ], { timeout: 30_000 });

    return { valid: true, errors: [] };
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; message?: string };

    let errors: string[] = [];
    try {
      const parsed = JSON.parse(error.stdout || '{}') as { result?: { errors?: string[] } };
      errors = parsed?.result?.errors || [error.message || 'Validation failed'];
    } catch {
      errors = [error.message || 'Validation failed'];
    }

    return { valid: false, errors };
  }
}

/**
 * Get the status of a previously submitted test run.
 */
export async function getTestRunStatus(
  testRunId: string,
  targetOrg: string
): Promise<TestRunResult> {
  try {
    const { stdout } = await execFileAsync('sf', [
      'agent', 'test', 'results',
      '--test-run-id', testRunId,
      '--target-org', targetOrg,
      '--json',
    ], { timeout: 30_000 });

    const parsed = JSON.parse(stdout) as {
      result?: {
        status?: string;
        tests?: Array<{
          testCaseName?: string;
          outcome?: string;
          message?: string;
        }>;
      };
    };

    const tests = parsed?.result?.tests || [];
    const passCount = tests.filter(t => t.outcome === 'Pass').length;
    const failCount = tests.filter(t => t.outcome === 'Fail').length;

    return {
      success: true,
      testRunId,
      status: parsed?.result?.status || 'Unknown',
      passCount,
      failCount,
      results: tests.map(t => ({
        testCaseName: t.testCaseName || 'Unknown',
        passed: t.outcome === 'Pass',
        message: t.message,
      })),
    };
  } catch (err) {
    return {
      success: false,
      testRunId,
      status: 'Error',
      passCount: 0,
      failCount: 0,
      results: [],
    };
  }
}
