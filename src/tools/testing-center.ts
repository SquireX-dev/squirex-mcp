/**
 * SquireX MCP Server — Testing Center Bridge Tools
 *
 * Tools for converting SARIF violations to Agentforce DX test specs
 * and pushing them to the Salesforce Testing Center.
 *
 * This is the bridge between shift-left static scanning (SquireX)
 * and Salesforce's native dynamic testing (Testing Center).
 *
 * @module tools/testing-center
 */

import { convertSarifToTestSuite, testSuiteToYaml, convertSarifFileToYaml } from '../testing-center/sarif-to-yaml.js';
import { pushTestSpec, validateTestSpec, validateSfCli, getTestRunStatus } from '../testing-center/push-client.js';
import { executeScan } from '../executor.js';

export const testingCenterTools = [
  {
    name: 'generate_dx_tests',
    description: 'Convert Agentforce scan violations into Agentforce DX test specifications (YAML format) compatible with `sf agent test run` and the Salesforce Testing Center. This bridges SquireX static analysis with Salesforce dynamic testing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sarifPath: {
          type: 'string',
          description: 'Path to a SARIF file from a previous scan. If omitted, a fresh scan is run.',
        },
        outputPath: {
          type: 'string',
          description: 'Path to write the generated YAML file. Defaults to {sarifPath}.agent-test.yaml.',
        },
        suiteName: {
          type: 'string',
          description: 'Name for the test suite. Defaults to "squirex-security-validation".',
        },
      },
    },
    handler: async (args: { sarifPath?: string; outputPath?: string; suiteName?: string }) => {
      let sarifContent: string;

      if (args.sarifPath) {
        // Read from file
        const result = convertSarifFileToYaml(args.sarifPath, args.outputPath);

        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `✅ Generated ${result.testCount} Agentforce DX test case(s)`,
                `📄 Output: ${result.outputPath}`,
                '',
                `Use \`sf agent test run --test-file ${result.outputPath}\` to push to the Testing Center.`,
                '',
                '---',
                '',
                result.yamlContent,
              ].join('\n'),
            },
          ],
        };
      } else {
        // Run a fresh scan
        const scanResult = await executeScan();
        sarifContent = typeof scanResult.data === 'string'
          ? scanResult.data
          : JSON.stringify(scanResult.data);

        const suite = convertSarifToTestSuite(sarifContent, { suiteName: args.suiteName });
        const yamlContent = testSuiteToYaml(suite);

        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `✅ Generated ${suite.testCases.length} Agentforce DX test case(s) from fresh scan`,
                '',
                'Save this YAML and use `sf agent test run --test-file <path>` to push to the Testing Center.',
                '',
                '---',
                '',
                yamlContent,
              ].join('\n'),
            },
          ],
        };
      }
    },
  },

  {
    name: 'validate_dx_tests',
    description: 'Validate a generated Agentforce DX test spec without executing it. Checks YAML syntax and schema compliance with the sf agent test format.',
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
      // First check if sf CLI is available
      const cliCheck = await validateSfCli();
      if (!cliCheck.available) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `⚠️ ${cliCheck.error}\n\nThe validation requires the Salesforce CLI with Agentforce DX support.`,
            },
          ],
          isError: true,
        };
      }

      const result = await validateTestSpec(args.testFilePath);

      if (result.valid) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `✅ Test spec is valid and ready for execution.\n\nRun: \`sf agent test run --test-file ${args.testFilePath}\``,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Validation errors:\n\n${result.errors.map(e => `- ${e}`).join('\n')}`,
            },
          ],
          isError: true,
        };
      }
    },
  },

  {
    name: 'push_to_testing_center',
    description: 'Push an Agentforce DX test spec to the Salesforce Testing Center via `sf agent test run`. Requires an authenticated Salesforce org. This completes the closed loop: SquireX scan → generate tests → push to Testing Center → validate behavior.',
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
        wait: {
          type: 'boolean',
          description: 'Wait for test completion (default: true)',
        },
      },
      required: ['testFilePath', 'targetOrg'],
    },
    handler: async (args: { testFilePath: string; targetOrg: string; wait?: boolean }) => {
      // Check sf CLI
      const cliCheck = await validateSfCli();
      if (!cliCheck.available) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `⚠️ ${cliCheck.error}`,
            },
          ],
          isError: true,
        };
      }

      const result = await pushTestSpec({
        testFilePath: args.testFilePath,
        targetOrg: args.targetOrg,
        wait: args.wait ?? true,
      });

      if (result.success) {
        return {
          content: [
            {
              type: 'text' as const,
              text: [
                `✅ ${result.message}`,
                result.testRunId ? `Test Run ID: ${result.testRunId}` : '',
                '',
                'Check results in the Salesforce Agentforce Testing Center.',
              ].filter(Boolean).join('\n'),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ ${result.message}\n\n${result.stderr}`,
            },
          ],
          isError: true,
        };
      }
    },
  },

  {
    name: 'get_testing_center_results',
    description: 'Get the status and results of a previously submitted Agentforce Test Run from the Testing Center.',
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
      const result = await getTestRunStatus(args.testRunId, args.targetOrg);

      if (result.success) {
        const summary = [
          `## Test Run: ${result.testRunId}`,
          `**Status:** ${result.status}`,
          `**Passed:** ${result.passCount} | **Failed:** ${result.failCount}`,
          '',
          '| Test Case | Result | Message |',
          '|-----------|--------|---------|',
          ...result.results.map(r =>
            `| ${r.testCaseName} | ${r.passed ? '✅ Pass' : '❌ Fail'} | ${r.message || '—'} |`
          ),
        ].join('\n');

        return {
          content: [{ type: 'text' as const, text: summary }],
        };
      } else {
        return {
          content: [
            { type: 'text' as const, text: `❌ Failed to retrieve test results for run ${args.testRunId}` },
          ],
          isError: true,
        };
      }
    },
  },
];
