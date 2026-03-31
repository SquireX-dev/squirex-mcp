/**
 * SquireX MCP Server — Prompts
 *
 * Pre-built prompt templates for common Agentforce security workflows.
 * These help AI agents orchestrate multi-step scan-and-fix workflows.
 *
 * @module prompts
 */

export interface McpPromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export const promptDefinitions: McpPromptDefinition[] = [
  {
    name: 'review-agentforce-security',
    description: 'Run a comprehensive Agentforce security review: execute all 26 SAST rules, prioritize violations by severity, and produce a structured remediation plan.',
    arguments: [
      {
        name: 'directory',
        description: 'Project root directory to scan',
        required: false,
      },
    ],
  },
  {
    name: 'fix-agentforce-violation',
    description: 'Diagnose a specific Agentforce violation and apply the fix. The agent will read the rule details, analyze the violating file, and suggest or apply code/metadata changes.',
    arguments: [
      {
        name: 'ruleId',
        description: 'The rule ID that was violated (e.g., AGENTFORCE-1.1)',
        required: true,
      },
      {
        name: 'filePath',
        description: 'Path to the file containing the violation',
        required: true,
      },
    ],
  },
  {
    name: 'harden-agent-metadata',
    description: 'Proactively review all Agentforce metadata (GenAiFunction, GenAiPlugin, GenAiPromptTemplate, .agent files) and suggest hardening improvements even if no violations are found. Focus on defense-in-depth.',
    arguments: [
      {
        name: 'focusArea',
        description: 'Optional focus area: "privileges", "injection", "supply-chain", or "architecture"',
        required: false,
      },
    ],
  },
  {
    name: 'generate-test-evaluation',
    description: 'Generate Agentforce DX test specifications (YAML) based on scan results. These test specs can be pushed to the Agentforce Testing Center to validate agent behavior dynamically after metadata changes.',
    arguments: [
      {
        name: 'sarifPath',
        description: 'Path to SARIF results file to generate tests from',
        required: false,
      },
    ],
  },
];

/**
 * Get the prompt messages for a given prompt name.
 */
export function getPromptMessages(
  name: string,
  args: Record<string, string> = {}
): Array<{ role: string; content: { type: string; text: string } }> {
  switch (name) {
    case 'review-agentforce-security':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Perform a comprehensive Agentforce security review on this project.',
              '',
              'Steps:',
              '1. Use the `scan_agentforce` tool to run all 26 SAST rules.',
              '2. Use the `list_scan_rules` tool to understand each rule category.',
              '3. For each violation found:',
              '   a. Use `explain_violation` to get root-cause analysis.',
              '   b. Use `suggest_fix` to generate remediation code.',
              '4. Produce a final report organized by severity (Critical → High → Medium → Low).',
              '5. Include a remediation priority matrix and estimated effort for each fix.',
              '',
              args['directory'] ? `Project directory: ${args['directory']}` : 'Scan the current project directory.',
            ].join('\n'),
          },
        },
      ];

    case 'fix-agentforce-violation':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Fix the Agentforce violation ${args['ruleId']} in ${args['filePath']}.`,
              '',
              'Steps:',
              `1. Use \`get_rule_details\` to understand rule ${args['ruleId']}.`,
              `2. Read the file ${args['filePath']} to understand the current state.`,
              `3. Use \`explain_violation\` to get root-cause analysis.`,
              `4. Use \`suggest_fix\` to generate a remediation suggestion.`,
              '5. Apply the fix to the file.',
              '6. Re-run `scan_agentforce_rule` to verify the fix resolves the violation.',
            ].join('\n'),
          },
        },
      ];

    case 'harden-agent-metadata':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Proactively review and harden all Agentforce metadata in this project.',
              '',
              'Steps:',
              '1. Use `scan_agentforce` to identify any existing violations.',
              '2. Even for components that pass scanning, review for defense-in-depth opportunities:',
              '   - Are all destructive actions requiring confirmation?',
              '   - Are all Apex classes using "with sharing"?',
              '   - Are prompt templates using structural delimiters?',
              '   - Are sensitive fields properly classified for FLS masking?',
              '3. Suggest improvements even when no violations are flagged.',
              '',
              args['focusArea'] ? `Focus area: ${args['focusArea']}` : 'Review all security domains.',
            ].join('\n'),
          },
        },
      ];

    case 'generate-test-evaluation':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Generate Agentforce DX test specifications based on scan findings.',
              '',
              'Steps:',
              '1. Run `scan_agentforce` to get current violations.',
              '2. For each violation, generate a corresponding test case in Agentforce DX YAML format that:',
              '   a. Tests that the remediated configuration prevents the vulnerability.',
              '   b. Follows the sf agent test specification format.',
              '   c. Includes both positive (should pass) and negative (should catch) test cases.',
              '3. Output the YAML test specs ready for `sf agent test run`.',
              '',
              args['sarifPath'] ? `Use SARIF from: ${args['sarifPath']}` : 'Run a fresh scan to generate findings.',
            ].join('\n'),
          },
        },
      ];

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
