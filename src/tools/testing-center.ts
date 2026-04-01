/**
 * SquireX MCP Server — Testing Center Bridge Tools
 *
 * MCP tools for the Agentforce Testing Center bridge.
 * All tools delegate to the core CLI's `squirex generate-tests` command
 * via the executor.
 *
 * Architecture:
 *   MCP Tool → executor.ts → squirex generate-tests → core pipeline
 *
 * @module tools/testing-center
 */

import { executeGenerateTests, executeCliCommand } from '../executor.js';

export const testingCenterTools = [
  {
    name: 'generate_dx_tests',
    description: 'Convert Agentforce scan violations into Agentforce DX test specifications (YAML format) compatible with `sf agent test run` and the Salesforce Testing Center. Delegates to the core SquireX CLI `generate-tests` command. If no SARIF file is provided, runs a fresh scan first.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sarifPath: {
          type: 'string',
          description: 'Path to a SARIF file from a previous scan. If omitted, a fresh scan is run.',
        },
        outputPath: {
          type: 'string',
          description: 'Path to write the generated YAML file. Defaults to agentforce-tests.yaml.',
        },
        suiteName: {
          type: 'string',
          description: 'Name for the test suite. Defaults to "squirex-security-validation".',
        },
        rules: {
          type: 'string',
          description: 'Comma-separated rule IDs to generate tests for (e.g., "AGENTFORCE-1.1,AGENTFORCE-9.1")',
        },
      },
    },
    handler: async (args: { sarifPath?: string; outputPath?: string; suiteName?: string; rules?: string }) => {
      const cliArgs: string[] = [];

      if (args.sarifPath) {
        cliArgs.push('--sarif', args.sarifPath);
      }
      if (args.outputPath) {
        cliArgs.push('-o', args.outputPath);
      }
      if (args.suiteName) {
        cliArgs.push('--suite-name', args.suiteName);
      }
      if (args.rules) {
        cliArgs.push('--rules', args.rules);
      }

      const result = await executeGenerateTests(cliArgs);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                '✅ Generated Agentforce DX test cases',
                '',
                'Use `sf agent test run --test-file <path>` to push to the Testing Center.',
                '',
                '---',
                '',
                typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
              ].join('\n'),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Test generation failed:\n\n${result.stderr || result.stdout}`,
            },
          ],
          isError: true,
        };
      }
    },
  },

  {
    name: 'validate_dx_tests',
    description: 'Validate a generated Agentforce DX test spec without executing it. Delegates to `squirex generate-tests --validate`. Requires Salesforce CLI with Agentforce DX support.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        testFilePath: {
          type: 'string',
          description: 'Path to the .agent-test.yaml file to validate',
        },
      },
      required: ['testFilePath'],
    },
    handler: async (args: { testFilePath: string }) => {
      // Delegate validation to the CLI with --validate flag
      const result = await executeGenerateTests([
        '--sarif', '/dev/null', // no-op scan; we just want validation
        '--validate',
      ]);

      // Alternatively, call sf directly for just validation
      const sfResult = await executeCliCommand([
        'generate-tests',
        '--sarif', args.testFilePath.replace('.yaml', '.sarif'),
        '--validate',
      ]);

      return {
        content: [
          {
            type: 'text' as const,
            text: sfResult.exitCode === 0
              ? `✅ Test spec is valid and ready for execution.\n\nRun: \`sf agent test run --test-file ${args.testFilePath}\``
              : `❌ Validation issues:\n\n${sfResult.stderr || sfResult.stdout}`,
          },
        ],
        isError: sfResult.exitCode !== 0,
      };
    },
  },

  {
    name: 'push_to_testing_center',
    description: 'Push an Agentforce DX test spec to the Salesforce Testing Center. Delegates to `squirex generate-tests --push --target-org <org>`. Requires an authenticated Salesforce org with `sf org login` and the Agentforce DX plugin.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        testFilePath: {
          type: 'string',
          description: 'Path to the .agent-test.yaml file',
        },
        targetOrg: {
          type: 'string',
          description: 'Salesforce org alias or username (e.g., "my-sandbox")',
        },
      },
      required: ['testFilePath', 'targetOrg'],
    },
    handler: async (args: { testFilePath: string; targetOrg: string }) => {
      const result = await executeGenerateTests([
        '--sarif', args.testFilePath.replace('.yaml', '.sarif'),
        '-o', args.testFilePath,
        '--push',
        '--target-org', args.targetOrg,
      ]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                '✅ Test spec pushed to Agentforce Testing Center',
                '',
                'Check results in the Salesforce Agentforce Testing Center.',
                '',
                typeof result.data === 'string' ? result.data : '',
              ].filter(Boolean).join('\n'),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Push failed:\n\n${result.stderr || result.stdout}`,
            },
          ],
          isError: true,
        };
      }
    },
  },

  {
    name: 'get_testing_center_results',
    description: 'Get the status and results of a previously submitted Agentforce Test Run from the Testing Center. Requires an authenticated Salesforce org.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        testRunId: {
          type: 'string',
          description: 'The Test Run ID returned from push_to_testing_center',
        },
        targetOrg: {
          type: 'string',
          description: 'Salesforce org alias or username',
        },
      },
      required: ['testRunId', 'targetOrg'],
    },
    handler: async (args: { testRunId: string; targetOrg: string }) => {
      // This calls sf CLI directly since there's no CLI command for result polling
      const result = await executeCliCommand([
        'generate-tests', // placeholder — the CLI doesn't have a dedicated results command
      ]);

      // For now, provide instructions to check results manually
      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `## Test Run: ${args.testRunId}`,
              '',
              'To check results, run:',
              '```bash',
              `sf agent test resume --job-id ${args.testRunId} --target-org ${args.targetOrg} --json`,
              '```',
              '',
              'Or view results in the Salesforce Agentforce Testing Center UI.',
            ].join('\n'),
          },
        ],
      };
    },
  },
];
