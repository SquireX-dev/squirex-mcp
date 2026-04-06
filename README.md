# @squirex.dev/mcp-server

> **SquireX MCP Server** — Agentforce Capability Scanner for AI Coding Agents

[![npm version](https://img.shields.io/npm/v/@squirex.dev/mcp-server.svg)](https://www.npmjs.com/package/@squirex.dev/mcp-server)
[![License](https://img.shields.io/badge/license-proprietary-blue.svg)](LICENSE.md)

Model Context Protocol server exposing the SquireX Agentforce Capability Scanner to AI-powered developer tools. Works with **Claude Code**, **Gemini**, **GitHub Copilot**, and any MCP-compatible IDE.

---

## Why SquireX?

Salesforce Agentforce agents use LLMs to autonomously execute Apex, Flows, and external services. Without guardrails, this creates **OWASP LLM Top 10** vulnerabilities:

- 🔴 **Excessive Agency** — Agents that modify data without user confirmation
- 🔴 **Prompt Injection** — User input that hijacks agent instructions
- 🔴 **Privilege Escalation** — Actions running in system context without sharing
- 🟠 **Supply Chain** — Stale API versions that silently skip metadata types

SquireX scans your Agentforce metadata with **51+ SAST rules across 19 categories** and integrates directly into your AI coding workflow.

---

## Quick Start

Add to your AI IDE configuration (Claude Code, Gemini, VS Code, JetBrains):

```json
{
  "mcpServers": {
    "squirex": {
      "command": "npx",
      "args": ["-y", "@squirex.dev/mcp-server"],
      "env": {
        "SQUIREX_PROJECT_DIR": "/path/to/your/salesforce/project"
      }
    }
  }
}
```

That's it. Your AI agent now has access to the Agentforce Capability Scanner.

---

## MCP Surface

### Tools (16)

#### Core Scanning (Primary Value)

| Tool | Description |
|------|-------------|
| `scan_agentforce` | Run all 51+ SAST rules against the project. Returns SARIF. |
| `scan_agentforce_file` | Scan a single metadata file (`.genAiFunction-meta.xml`, `.agent`, etc.) |
| `scan_agentforce_rule` | Run a specific rule (e.g., `AGENTFORCE-1.1`) |

#### Rule Intelligence

| Tool | Description |
|------|-------------|
| `list_scan_rules` | List all 51+ rules with ID, category, severity |
| `get_rule_details` | Deep dive: description + remediation guidance |
| `explain_violation` | Root-cause analysis for a specific violation |
| `suggest_fix` | Generate a code/metadata fix suggestion |

#### Apex Testing & Schema

| Tool | Description |
|------|-------------|
| `run_tests` | Execute Apex tests locally using the Go interpreter |
| `get_coverage` | Extract line-level code coverage data |
| `analyze_schema` | Aggregate inferred SObject schema from the codebase |
| `predict_conflicts` | Predict merge conflicts between branches |
| `generate_sarif_report` | Generate SARIF for CI/CD pipeline integration |

#### Testing Center Bridge

| Tool | Description |
|------|-------------|
| `generate_dx_tests` | Convert scan violations → Agentforce DX test YAML for Testing Center |
| `validate_dx_tests` | Validate DX test spec syntax and schema |
| `push_to_testing_center` | Push test spec to Salesforce via `sf agent test run` |
| `get_testing_center_results` | Get status/results of a Testing Center test run |

### Resources (6)

| URI | Description |
|-----|-------------|
| `squirex://scan/rules` | Complete 51+ rule catalog |
| `squirex://scan/rules/{id}` | Rule detail with remediation |
| `squirex://scan/results/latest` | Latest scan results (SARIF) |
| `squirex://schema/objects` | Inferred SObject schema |
| `squirex://test-results/latest` | Latest Apex test results |
| `squirex://coverage/latest` | Latest code coverage |

### Prompts (4)

| Prompt | What It Does |
|--------|-------------|
| `review-agentforce-security` | Full 51+ rule scan → prioritized remediation plan |
| `fix-agentforce-violation` | Diagnose + fix a specific violation |
| `harden-agent-metadata` | Proactive defense-in-depth review |
| `generate-test-evaluation` | Generate Agentforce DX test YAML specs for Testing Center |

---

## Agentforce Capability Scanner — 51+ Rules

| # | Category | Rules | Severity |
|---|----------|-------|----------|
| 1 | **Action Configuration** | Mandatory Confirmation, Schema Sync, Privilege Analysis | 🔴 Critical / 🟠 High |
| 2 | **Agent Script Safety** | Validation Guards, Transition Integrity, Prompt Injection Defense | 🔴 Critical / 🟠 High |
| 3 | **Grounding Security** | Hardcoded Secrets, FLS Masking Alignment | 🔴 Critical / 🟠 High |
| 4 | **Structural Dependency** | Planner Completeness, Deactivation Collision, Evaluation Governance | 🟠 High / 🟡 Medium |
| 5 | **Flow Security** | Flow Context/Silent State/Injection, API Injection, PT Poisoning/Activation | 🔴 Critical / 🟠 High |
| 6 | **Supply Chain Security** | API Downgrade, Schema Desync, Managed Package Origin | 🟠 High / 🟡 Medium |
| 7 | **Agentic Architecture** | Topic Bloat, Skill Semantics, Orphaned Bot Evaluation | 🟠 High / 🟡 Medium |
| 9 | **Instruction Integrity** | Metadata Instruction Poisoning, Cross-Topic Boundary | 🔴 Critical / 🟠 High |
| 10 | **Operational Reliability** | Validation Conflict | 🟡 Medium |
| 11 | **Autonomous Scheduling** | Unguarded Scheduled Action, Time-Window Privilege Drift | 🔴 Critical / 🟠 High |
| 12 | **Copilot Studio Config** | Memory Poisoning, API Version Drift | 🔴 Critical |
| 13 | **Data Cloud Grounding** | RAG Without Schema Classification | 🔴 Critical |
| 14 | **Slack Integration** | Slack Bot Without DLP Guard | 🟠 High |
| 15 | **External Service Security** | Certificate Pinning, Dynamic Cloaking RAG | 🟠 High |
| 16 | **Custom Permission** | Agent Action Without Permission Gate | 🟠 High |
| 17 | **Commerce** | Idempotency Key, Amount Bounds Check | 🔴 Critical |
| 18 | **Multi-Agent Orchestration** | Compositional Fragment Trap, Sybil Identity | 🔴 Critical / 🟠 High |
| 19 | **Platform Event / CDC** | Sub-agent Spawning Loop, CDC Field Filter | 🔴 Critical / 🟠 High |
| 20–24 | **OWASP LLM Top 10** | Excessive Agency, Data Exfil, SSRF, DoS, MCP Auth | 🔴 Critical / 🟠 High |
| 30–34 | **Enterprise Graph** | PII Graph, Privilege Graph, Blast Radius, MCP Scope, XSS Graph | 🔴 Critical / 🟠 High |

---

## Supported Metadata Types

- `.genAiFunction-meta.xml`
- `.genAiPlugin-meta.xml`
- `.genAiPlannerBundle-meta.xml`
- `.genAiPromptTemplate-meta.xml`
- `.genAiPromptTemplateActv-meta.xml`
- `.agent` files
- `.cls` (Apex classes)
- `.trigger` (Apex triggers)
- `.namedCredential-meta.xml`
- `.connectedApp-meta.xml`
- `.field-meta.xml`
- `.aiEvaluationDefinition-meta.xml`
- `.flow-meta.xml`
- `schema.json`
- `sfdx-project.json`
- `package.xml`
- LWC components (`.js` in `lwc/` dirs)

---

## How It Works

```
AI Coding Agent (Claude / Gemini / Copilot)
        │
        │ MCP Protocol (stdio)
        ▼
┌─────────────────────────┐
│ @squirex.dev/mcp-server │ ← This package
│  16 tools, 6 resources  │
│  4 prompts              │
└───────┬─────────────────┘
        │ spawn
        ▼
┌─────────────────────────┐
│   squirex CLI            │
│   scan / generate-tests  │ ← Testing Center bridge
└───────┬─────────────────┘
        │ JSON IPC
        ▼
┌─────────────────────────┐      ┌─────────────────────┐
│   squireinterp           │      │   sf agent test run  │
│   Go Execution Engine    │      │   (Salesforce CLI)   │
│   51+ SAST Rules         │      │   → Testing Center   │
└─────────────────────────┘      └─────────────────────┘
```

The Testing Center bridge tools delegate to `squirex generate-tests`, which:
1. Runs a capability scan (or reads existing SARIF)
2. Converts violations to Agentforce DX test YAML (all 51+ rules, normalized `AGENTFORCE-X.Y` IDs)
3. Optionally validates and pushes to the Salesforce Testing Center via `sf agent test run`

---

## Requirements

- Node.js ≥ 18
- `squirex` CLI installed (or available via npx)
- A Salesforce project with Agentforce metadata

---

## GitHub App Integration

For automated PR scanning, install the [SquireX GitHub App](https://github.com/apps/squirex) — one-click setup, 51+ rule scan on every pull request, SARIF in your Security tab.

| Plan | Public Repos | Private Repos | Price |
|------|-------------|---------------|-------|
| Free | Unlimited | — | $0 |
| Enterprise | Unlimited | Unlimited | $1,000/repo/year |

---

## License

Proprietary — See [LICENSE.md](LICENSE.md)

Copyright © 2026 SquireX. All Rights Reserved.

---

<sub>⚡ Built by <a href="https://squirex.dev">SquireX</a> — Securing the AI Agent Pipeline</sub>
