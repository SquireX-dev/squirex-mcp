/**
 * SquireX MCP Server — Testing, Schema, Conflict, and SARIF Tools
 *
 * Secondary tools that complement the Agentforce scanning value proposition.
 *
 * @module tools/secondary
 */

import { executeTests, executeSchemaAnalysis, executeConflictPrediction, executeScan } from '../executor.js';

export const secondaryTools = [
  // ── Testing ──
  {
    name: 'run_tests',
    description: 'Execute Apex tests locally using the high-fidelity Go interpreter. Returns structured test results with pass/fail status, assertion details, stack traces, and line-level code coverage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file: {
          type: 'string',
          description: 'Specific test file to run (e.g., "MyTest.cls")',
        },
        filter: {
          type: 'string',
          description: 'Regex pattern to filter test methods (e.g., "testAccount.*")',
        },
        parallel: {
          type: 'boolean',
          description: 'Run tests in parallel for faster execution',
        },
        failFast: {
          type: 'boolean',
          description: 'Stop on first test failure',
        },
      },
    },
    handler: async (args: { file?: string; filter?: string; parallel?: boolean; failFast?: boolean }) => {
      const testArgs: string[] = [];
      if (args.file) testArgs.push('-f', args.file);
      if (args.filter) testArgs.push('--filter', args.filter);
      if (args.parallel) testArgs.push('--parallel');
      if (args.failFast) testArgs.push('--fail-fast');

      const result = await executeTests(testArgs);

      return {
        content: [
          {
            type: 'text' as const,
            text: typeof result.data === 'string'
              ? result.data
              : JSON.stringify(result.data, null, 2),
          },
        ],
      };
    },
  },

  {
    name: 'get_coverage',
    description: 'Extract code coverage data from the most recent test run. Shows covered/uncovered lines per class.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        className: {
          type: 'string',
          description: 'Filter coverage for a specific Apex class',
        },
      },
    },
    handler: async (args: { className?: string }) => {
      // Run tests first to get coverage, then extract coverage data
      const testArgs: string[] = ['--verbose'];
      if (args.className) testArgs.push('-f', `${args.className}Test.cls`);

      const result = await executeTests(testArgs);

      // Extract coverage section from results
      const data = result.data as Record<string, unknown>;
      const coverage = data?.['coverage'] || data;

      return {
        content: [
          {
            type: 'text' as const,
            text: typeof coverage === 'string'
              ? coverage
              : JSON.stringify(coverage, null, 2),
          },
        ],
      };
    },
  },

  // ── Schema ──
  {
    name: 'analyze_schema',
    description: 'Aggregate and analyze the inferred schema from all Apex classes in the project. Returns SObject definitions, field usage heatmaps, and relationship graphs. Useful for understanding the data model without an org connection.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        directory: {
          type: 'string',
          description: 'Root directory containing Apex classes (default: ./force-app)',
        },
        includeHeatmap: {
          type: 'boolean',
          description: 'Include field usage heatmaps in output',
        },
      },
    },
    handler: async (args: { directory?: string; includeHeatmap?: boolean }) => {
      const schemaArgs: string[] = [];
      if (args.directory) schemaArgs.push('-d', args.directory);
      if (args.includeHeatmap) schemaArgs.push('--include-heatmap');

      const result = await executeSchemaAnalysis(schemaArgs);

      return {
        content: [
          {
            type: 'text' as const,
            text: typeof result.data === 'string'
              ? result.data
              : JSON.stringify(result.data, null, 2),
          },
        ],
      };
    },
  },

  // ── Conflicts ──
  {
    name: 'predict_conflicts',
    description: 'Predict merge conflicts between two branches by analyzing Apex class changes, DML patterns, and metadata dependencies. Helps prevent deployment failures.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        branches: {
          type: 'string',
          description: 'Two branches to compare, comma-separated (e.g., "main,feature")',
        },
        simulate: {
          type: 'boolean',
          description: 'Simulate merge and predict outcomes',
        },
      },
      required: ['branches'],
    },
    handler: async (args: { branches: string; simulate?: boolean }) => {
      const conflictArgs: string[] = [];
      if (args.simulate) conflictArgs.push('--simulate');

      const result = await executeConflictPrediction(args.branches, conflictArgs);

      return {
        content: [
          {
            type: 'text' as const,
            text: typeof result.data === 'string'
              ? result.data
              : JSON.stringify(result.data, null, 2),
          },
        ],
      };
    },
  },

  // ── SARIF ──
  {
    name: 'generate_sarif_report',
    description: 'Generate a SARIF (Static Analysis Results Interchange Format) report from the Agentforce Capability Scan. SARIF is the standard format for GitHub Security tab, Azure DevOps, and other CI/CD integrations.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        outputPath: {
          type: 'string',
          description: 'Path to write the SARIF file (defaults to stdout)',
        },
      },
    },
    handler: async (args: { outputPath?: string }) => {
      const scanArgs: string[] = [];
      if (args.outputPath) {
        scanArgs.push('--sarif', args.outputPath);
      }

      const result = await executeScan(scanArgs);

      return {
        content: [
          {
            type: 'text' as const,
            text: typeof result.data === 'string'
              ? result.data
              : JSON.stringify(result.data, null, 2),
          },
        ],
      };
    },
  },
];
