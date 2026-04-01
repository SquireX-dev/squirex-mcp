#!/usr/bin/env node

/**
 * SquireX MCP Server
 *
 * Model Context Protocol server for the Agentforce Capability Scanner.
 * Exposes 16 tools, 6 resources, and 4 prompts for AI coding agents.
 *
 * This is the SOLE IDE integration point for SquireX. No separate VS Code
 * extension or JetBrains plugin is needed — any IDE that supports MCP
 * can use SquireX through this server.
 *
 * Transport: stdio (default) or SSE
 *
 * @module index
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { scanTools } from './tools/scan.js';
import { rulesTools } from './tools/rules.js';
import { secondaryTools } from './tools/secondary.js';
import { testingCenterTools } from './tools/testing-center.js';
import { resourceDefinitions, resourceTemplates, readResource } from './resources/index.js';
import { promptDefinitions, getPromptMessages } from './prompts/index.js';

// ── Server Setup ──

const server = new Server(
  {
    name: 'squirex',
    version: '1.0.2',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ── All Tools ──

const allTools = [...scanTools, ...rulesTools, ...secondaryTools, ...testingCenterTools];

// Build a handler map for fast dispatch
const toolHandlers = new Map<string, (args: Record<string, unknown>) => Promise<unknown>>();
for (const tool of allTools) {
  toolHandlers.set(tool.name, tool.handler as (args: Record<string, unknown>) => Promise<unknown>);
}

// ── Tool Handlers ──

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = toolHandlers.get(name);

  if (!handler) {
    throw new Error(`Unknown tool: ${name}. Available tools: ${allTools.map(t => t.name).join(', ')}`);
  }

  try {
    return await handler(args || {}) as { content: Array<{ type: string; text: string }> };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// ── Resource Handlers ──

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: resourceDefinitions };
});

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return { resourceTemplates };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return readResource(request.params.uri);
});

// ── Prompt Handlers ──

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: promptDefinitions };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const prompt = promptDefinitions.find(p => p.name === name);
  if (!prompt) {
    throw new Error(`Unknown prompt: ${name}. Available: ${promptDefinitions.map(p => p.name).join(', ')}`);
  }

  const messages = getPromptMessages(name, (args || {}) as Record<string, string>);
  return { messages };
});

// ── Server Startup ──

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (not stdout — stdout is reserved for MCP protocol)
  console.error('SquireX MCP Server v1.0.2');
  console.error(`Agentforce Capability Scanner: 26 rules across 9 categories`);
  console.error(`Tools: ${allTools.length} | Resources: ${resourceDefinitions.length} | Prompts: ${promptDefinitions.length}`);
  console.error(`Project dir: ${process.env['SQUIREX_PROJECT_DIR'] || process.cwd()}`);
}

main().catch((err) => {
  console.error('Fatal error starting SquireX MCP Server:', err);
  process.exit(1);
});
