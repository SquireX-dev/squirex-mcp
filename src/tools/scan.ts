/**
 * SquireX MCP Server — Agentforce Scan Tools
 *
 * Core scanning tools: scan_agentforce, scan_agentforce_file, scan_agentforce_rule
 * These are the primary value proposition tools.
 *
 * @module tools/scan
 */

import { executeScan } from '../executor.js';

export const scanTools = [
  {
    name: 'scan_agentforce',
    description: 'Run the full Agentforce Capability Scan (26 SAST rules across 9 categories) against the current project. Returns SARIF-structured violations covering action configuration, agent script safety, grounding security, structural dependencies, flow/prompt template security, supply chain, agentic architecture, instruction integrity, and operational reliability.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        directory: {
          type: 'string',
          description: 'Root directory to scan (defaults to project directory)',
        },
        baseBranch: {
          type: 'string',
          description: 'Base branch for diff-based scanning (only scan changed files). If omitted, performs a full scan.',
        },
      },
    },
    handler: async (args: { directory?: string; baseBranch?: string }) => {
      const scanArgs: string[] = [];
      if (args.directory) {
        scanArgs.push('-d', args.directory);
      }
      if (args.baseBranch) {
        scanArgs.push('--base', args.baseBranch);
      }

      const result = await executeScan(scanArgs, { cwd: args.directory });

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
    name: 'scan_agentforce_file',
    description: 'Scan a specific Agentforce metadata file for capability violations. Supports .genAiFunction-meta.xml, .genAiPlugin-meta.xml, .genAiPlannerBundle-meta.xml, .genAiPromptTemplate-meta.xml, .agent files, .cls (Apex), .trigger, and schema.json files.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        filePath: {
          type: 'string',
          description: 'Path to the metadata file to scan (relative to project root)',
        },
      },
      required: ['filePath'],
    },
    handler: async (args: { filePath: string }) => {
      const result = await executeScan(['--file', args.filePath]);

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
    name: 'scan_agentforce_rule',
    description: 'Run a single Agentforce SAST rule against the project. Useful for focused analysis. Rule IDs follow the pattern AGENTFORCE-X.Y (e.g., AGENTFORCE-1.1 for Mandatory User Confirmation).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ruleId: {
          type: 'string',
          description: 'The rule ID to run (e.g., "AGENTFORCE-1.1", "AGENTFORCE-PT-01", "AGENTFORCE-SC-02")',
        },
      },
      required: ['ruleId'],
    },
    handler: async (args: { ruleId: string }) => {
      const result = await executeScan(['--rule', args.ruleId]);

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
