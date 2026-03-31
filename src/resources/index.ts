/**
 * SquireX MCP Server — Resources
 *
 * MCP Resources provide read-only context that AI agents can request
 * to understand the project state without executing commands.
 *
 * @module resources
 */

import { getAllRules, getRuleById, type RuleDefinition } from '../rules-registry.js';
import { executeScan, executeSchemaAnalysis, executeTests } from '../executor.js';

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Static resource definitions.
 */
export const resourceDefinitions: McpResource[] = [
  {
    uri: 'squirex://scan/rules',
    name: 'Agentforce Scan Rules',
    description: 'Complete catalog of all 26 Agentforce SAST rules with ID, name, category, severity, description, and remediation guidance.',
    mimeType: 'application/json',
  },
  {
    uri: 'squirex://scan/results/latest',
    name: 'Latest Scan Results',
    description: 'Most recent Agentforce Capability Scan results in SARIF format.',
    mimeType: 'application/json',
  },
  {
    uri: 'squirex://schema/objects',
    name: 'Inferred Schema Objects',
    description: 'List of all SObjects inferred from the codebase, including custom objects and standard object overrides.',
    mimeType: 'application/json',
  },
  {
    uri: 'squirex://test-results/latest',
    name: 'Latest Test Results',
    description: 'Most recent Apex test execution results including pass/fail status, assertions, and timings.',
    mimeType: 'application/json',
  },
  {
    uri: 'squirex://coverage/latest',
    name: 'Latest Coverage Data',
    description: 'Most recent code coverage data — covered/uncovered lines per class.',
    mimeType: 'application/json',
  },
];

/**
 * Resource templates (parameterized URIs).
 */
export const resourceTemplates: McpResourceTemplate[] = [
  {
    uriTemplate: 'squirex://scan/rules/{ruleId}',
    name: 'Rule Detail',
    description: 'Detailed information about a specific Agentforce SAST rule.',
    mimeType: 'application/json',
  },
];

/**
 * Read a resource by its URI.
 */
export async function readResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  // Parse the URI
  if (uri === 'squirex://scan/rules') {
    const rules = getAllRules();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(rules, null, 2),
      }],
    };
  }

  // Match parameterized rule URI
  const ruleMatch = uri.match(/^squirex:\/\/scan\/rules\/(.+)$/);
  if (ruleMatch) {
    const ruleId = ruleMatch[1];
    const rule = getRuleById(ruleId);
    if (!rule) {
      throw new Error(`Rule "${ruleId}" not found`);
    }
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(rule, null, 2),
      }],
    };
  }

  if (uri === 'squirex://scan/results/latest') {
    const result = await executeScan();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
      }],
    };
  }

  if (uri === 'squirex://schema/objects') {
    const result = await executeSchemaAnalysis();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
      }],
    };
  }

  if (uri === 'squirex://test-results/latest' || uri === 'squirex://coverage/latest') {
    const result = await executeTests();
    const data = result.data as Record<string, unknown>;
    const content = uri.includes('coverage') ? (data?.['coverage'] || data) : data;
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      }],
    };
  }

  throw new Error(`Unknown resource URI: ${uri}`);
}
