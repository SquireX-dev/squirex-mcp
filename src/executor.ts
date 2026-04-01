/**
 * SquireX MCP Server — CLI Subprocess Executor
 *
 * Wraps the squirex CLI binary invocation with clean JSON output parsing.
 * All MCP tools delegate to this executor for actual scan/test/schema operations.
 *
 * @module executor
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import * as fs from 'node:fs';

const execFileAsync = promisify(execFile);

export interface ExecutorOptions {
  /** Working directory for CLI invocation (defaults to SQUIREX_PROJECT_DIR) */
  cwd?: string;
  /** Path to squirex CLI binary (auto-detected if not provided) */
  cliBinary?: string;
  /** Path to Go interpreter binary (auto-detected if not provided) */
  goBinary?: string;
  /** Timeout in milliseconds (default: 120000) */
  timeout?: number;
}

export interface ExecutorResult {
  /** Parsed JSON output from stdout, or raw string if not JSON */
  data: unknown;
  /** Raw stdout */
  stdout: string;
  /** Raw stderr (diagnostics, not errors) */
  stderr: string;
  /** Exit code */
  exitCode: number;
}

/**
 * Resolves the path to the squirex CLI binary.
 * Checks: 1) Explicit path 2) Project-local 3) Global npx
 */
function resolveCliBinary(explicit?: string): string {
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }

  // Check project-local node_modules
  const projectDir = process.env['SQUIREX_PROJECT_DIR'] || process.cwd();
  const localBin = path.join(projectDir, 'node_modules', '.bin', 'squirex');
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  // Fall back to global
  return 'npx';
}

/**
 * Resolves the Go interpreter binary path.
 */
function resolveGoBinary(explicit?: string): string | undefined {
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }

  const projectDir = process.env['SQUIREX_PROJECT_DIR'] || process.cwd();
  const localInterp = path.join(projectDir, 'interpreter', 'squireinterp');
  if (fs.existsSync(localInterp)) {
    return localInterp;
  }

  return undefined;
}

/**
 * Execute a squirex CLI command and return structured results.
 */
export async function executeCliCommand(
  args: string[],
  options: ExecutorOptions = {}
): Promise<ExecutorResult> {
  const cwd = options.cwd || process.env['SQUIREX_PROJECT_DIR'] || process.cwd();
  const timeout = options.timeout || 120_000;
  const cliBinary = resolveCliBinary(options.cliBinary);
  const goBinary = resolveGoBinary(options.goBinary);

  // Build command args
  let command: string;
  let fullArgs: string[];

  if (cliBinary === 'npx') {
    command = 'npx';
    fullArgs = ['-y', 'squirex', ...args];
  } else {
    command = 'node';
    fullArgs = [cliBinary, ...args];
  }

  // Inject Go binary path if available
  if (goBinary) {
    fullArgs.push('--go-binary', goBinary);
  }

  // Set environment for authorized engine execution
  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    SQUIREX_VERIFIED: '1',
    FORCE_COLOR: '0', // Disable chalk colors for clean JSON parsing
  };

  try {
    const { stdout, stderr } = await execFileAsync(command, fullArgs, {
      cwd,
      timeout,
      env,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large scan results
    });

    let data: unknown;
    try {
      data = JSON.parse(stdout.trim());
    } catch {
      data = stdout.trim();
    }

    return { data, stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; code?: number; message?: string };
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    const exitCode = error.code || 1;

    let data: unknown;
    try {
      data = JSON.parse(stdout.trim());
    } catch {
      data = { error: error.message || 'CLI execution failed', stderr };
    }

    return { data, stdout, stderr, exitCode };
  }
}

/**
 * Execute a scan command and return SARIF results.
 */
export async function executeScan(
  scanArgs: string[] = [],
  options: ExecutorOptions = {}
): Promise<ExecutorResult> {
  const args = ['scan-pr', '-d', '.', '--sarif', '-', ...scanArgs];
  return executeCliCommand(args, options);
}

/**
 * Execute Apex tests and return structured results.
 */
export async function executeTests(
  testArgs: string[] = [],
  options: ExecutorOptions = {}
): Promise<ExecutorResult> {
  const args = ['run', '--use-go', '--json', ...testArgs];
  return executeCliCommand(args, options);
}

/**
 * Execute schema analysis and return structured results.
 */
export async function executeSchemaAnalysis(
  schemaArgs: string[] = [],
  options: ExecutorOptions = {}
): Promise<ExecutorResult> {
  const args = ['schema', 'analyze', '-o', '-', ...schemaArgs];
  return executeCliCommand(args, options);
}

/**
 * Execute conflict prediction and return structured results.
 */
export async function executeConflictPrediction(
  branches: string,
  conflictArgs: string[] = [],
  options: ExecutorOptions = {}
): Promise<ExecutorResult> {
  const args = ['conflict', '-b', branches, '--format', 'json', ...conflictArgs];
  return executeCliCommand(args, options);
}

/**
 * Execute generate-tests command for Testing Center bridge.
 * Delegates to the core CLI's `squirex generate-tests` command.
 */
export async function executeGenerateTests(
  genArgs: string[] = [],
  options: ExecutorOptions = {}
): Promise<ExecutorResult> {
  const args = ['generate-tests', '--json', ...genArgs];
  return executeCliCommand(args, options);
}
