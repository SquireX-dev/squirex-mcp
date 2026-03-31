/**
 * SquireX MCP Server — Agentforce Scan Rules Registry
 *
 * Static registry of all 26 Agentforce Capability Scanner rules.
 * This mirrors the Go engine's RegisterDefaults() in capability/rules.go.
 * Kept in sync manually — the source of truth is the Go engine.
 *
 * @module rules-registry
 */

export interface RuleDefinition {
  id: string;
  name: string;
  category: string;
  categoryNumber: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation: string;
}

/**
 * All 26 Agentforce Capability Scanner rules across 9 categories.
 */
export const AGENTFORCE_RULES: RuleDefinition[] = [
  // ── Category 1: Action Configuration ──
  {
    id: 'AGENTFORCE-1.1',
    name: 'Mandatory User Confirmation',
    category: 'Action Configuration',
    categoryNumber: 1,
    severity: 'critical',
    description: 'Actions that modify system state (apex, flow, externalService) must have isConfirmationRequired=true to prevent autonomous data destruction by the LLM.',
    remediation: 'Set <isConfirmationRequired>true</isConfirmationRequired> in the genAiFunction-meta.xml for all state-altering actions.',
  },
  {
    id: 'AGENTFORCE-1.2',
    name: 'Schema Synchronization Verification',
    category: 'Action Configuration',
    categoryNumber: 1,
    severity: 'high',
    description: 'schema.json modifications without corresponding genAiFunction-meta.xml updates cause the platform to silently ignore schema changes.',
    remediation: 'Ensure any commit modifying schema.json also modifies the genAiFunction-meta.xml (e.g., update the <description> tag).',
  },
  {
    id: 'AGENTFORCE-1.3',
    name: 'Target Context Privilege Analysis',
    category: 'Action Configuration',
    categoryNumber: 1,
    severity: 'critical',
    description: 'Actions invoking Apex without "with sharing" or Flows with SystemModeWithoutSharing create privilege escalation paths.',
    remediation: 'Ensure target Apex classes use "with sharing" keyword. Refactor Flows to run in user context.',
  },
  // ── Category 2: Agent Script Safety ──
  {
    id: 'AGENTFORCE-2.1',
    name: 'Validation Guard Clauses',
    category: 'Agent Script Safety',
    categoryNumber: 2,
    severity: 'high',
    description: 'Data-modifying actions invoked in Agent Script without preceding validation logic (conditional checks, available-when clauses).',
    remediation: 'Add validation guards before state-altering actions. Use "available when" clauses to enforce preconditions.',
  },
  {
    id: 'AGENTFORCE-2.2',
    name: 'Transition Integrity',
    category: 'Agent Script Safety',
    categoryNumber: 2,
    severity: 'medium',
    description: 'Topic transitions (@utils.transition) targeting non-existent topics or lacking default fallback routing.',
    remediation: 'Ensure all transitions point to valid, defined topic endpoints. Add default fallback routing.',
  },
  {
    id: 'AGENTFORCE-2.3',
    name: 'Prompt Injection Defense',
    category: 'Agent Script Safety',
    categoryNumber: 2,
    severity: 'critical',
    description: 'Dynamic user input injected into instruction streams without structural separation or defensive heuristics.',
    remediation: 'Use XML delimiters to separate system instructions from user input. Add defensive instructions around injection points.',
  },
  // ── Category 3: Grounding Security ──
  {
    id: 'AGENTFORCE-3.1',
    name: 'Hardcoded Sensitive Indicators',
    category: 'Grounding Security',
    categoryNumber: 3,
    severity: 'critical',
    description: 'API keys, OAuth tokens, internal endpoints, or PII patterns detected in prompt template or plugin instruction text.',
    remediation: 'Remove hardcoded values. Use dynamic variables or secure external credentials.',
  },
  {
    id: 'AGENTFORCE-3.2',
    name: 'FLS Masking Tag Alignment',
    category: 'Grounding Security',
    categoryNumber: 3,
    severity: 'high',
    description: 'Fields used in prompt templates lack SecurityClassification tags or Shield Encryption, bypassing Trust Layer masking.',
    remediation: 'Update field metadata with appropriate compliance categorization (SecurityClassification tags).',
  },
  // ── Category 4: Structural Dependency ──
  {
    id: 'AGENTFORCE-4.1',
    name: 'Planner Orchestration Completeness',
    category: 'Structural Dependency',
    categoryNumber: 4,
    severity: 'high',
    description: 'GenAiPlannerBundle references plugins or functions not present in the deployment package or target org.',
    remediation: 'Include all referenced GenAiFunction and GenAiPlugin components in the deployment package.',
  },
  {
    id: 'AGENTFORCE-4.2',
    name: 'Deactivation Collision',
    category: 'Structural Dependency',
    categoryNumber: 4,
    severity: 'medium',
    description: 'Deployment attempts to deactivate a prompt template version that is actively referenced by other components.',
    remediation: 'Query dependency graphs before deactivation. Remove references before deactivating templates.',
  },
  {
    id: 'AGENTFORCE-4.3',
    name: 'Evaluation Governance',
    category: 'Structural Dependency',
    categoryNumber: 4,
    severity: 'medium',
    description: 'Deployed agents lack corresponding AiEvaluationDefinition test suites.',
    remediation: 'Create AiEvaluationDefinition with synthetic test cases for all deployed agents.',
  },
  // ── Category 5: Extended Graph Security ──
  {
    id: 'AGENTFORCE-FLOW-01',
    name: 'Flow Context Escalation',
    category: 'Extended Graph Security',
    categoryNumber: 5,
    severity: 'high',
    description: 'Flow invoked by agent action runs in system context without sharing, enabling unauthorized data access.',
    remediation: 'Set Flow runInMode to CurrentUser or add explicit sharing checks within the Flow.',
  },
  {
    id: 'AGENTFORCE-FLOW-02',
    name: 'Flow Silent State Mutation',
    category: 'Extended Graph Security',
    categoryNumber: 5,
    severity: 'high',
    description: 'Flow performs DML operations without visibility to the agent orchestration layer.',
    remediation: 'Ensure DML-performing Flows are wrapped in actions with isConfirmationRequired=true.',
  },
  {
    id: 'AGENTFORCE-FLOW-03',
    name: 'Flow Input Injection',
    category: 'Extended Graph Security',
    categoryNumber: 5,
    severity: 'high',
    description: 'Flow input variables accept unvalidated agent-provided values that are used in SOQL or DML operations.',
    remediation: 'Add input validation and sanitization within the Flow before using values in queries or DML.',
  },
  {
    id: 'AGENTFORCE-API-01',
    name: 'API Endpoint Injection',
    category: 'Extended Graph Security',
    categoryNumber: 5,
    severity: 'critical',
    description: 'External service actions allow agent-influenced URL construction or header injection.',
    remediation: 'Hardcode API endpoints. Never allow agent-provided values in URL paths or headers.',
  },
  {
    id: 'AGENTFORCE-PT-01',
    name: 'Prompt Template Poisoning',
    category: 'Extended Graph Security',
    categoryNumber: 5,
    severity: 'critical',
    description: 'Prompt template includes merge fields that could be manipulated to override system instructions.',
    remediation: 'Isolate merge fields from system instructions using structural delimiters. Validate field content.',
  },
  {
    id: 'AGENTFORCE-PT-02',
    name: 'Prompt Template Activation State',
    category: 'Extended Graph Security',
    categoryNumber: 5,
    severity: 'medium',
    description: 'Experimental or untested prompt template versions have accessLevel set to Allowed.',
    remediation: 'Set accessLevel to Blocked for templates not yet validated. Only activate after testing.',
  },
  // ── Category 6: Supply Chain Security ──
  {
    id: 'AGENTFORCE-SC-01',
    name: 'API Version Downgrade',
    category: 'Supply Chain Security',
    categoryNumber: 6,
    severity: 'high',
    description: 'Deployment uses an older API version that may silently skip newer metadata types (e.g., GenAiPlannerBundle requires 64.0+).',
    remediation: 'Ensure sfdx-project.json sourceApiVersion matches the minimum required for all metadata types.',
  },
  {
    id: 'AGENTFORCE-SC-02',
    name: 'Schema Desynchronization',
    category: 'Supply Chain Security',
    categoryNumber: 6,
    severity: 'medium',
    description: 'Metadata component versions are misaligned across development, staging, and production environments.',
    remediation: 'Enforce version pinning in CI/CD. Validate component versions before deployment.',
  },
  {
    id: 'AGENTFORCE-SC-03',
    name: 'Managed Package Origin',
    category: 'Supply Chain Security',
    categoryNumber: 6,
    severity: 'medium',
    description: 'Agent actions reference components from unverified managed packages without origin validation.',
    remediation: 'Verify managed package origins. Only use components from trusted, security-reviewed packages.',
  },
  // ── Category 7: Agentic Architecture ──
  {
    id: 'AGENTFORCE-7.1',
    name: 'Topic Bloat',
    category: 'Agentic Architecture',
    categoryNumber: 7,
    severity: 'medium',
    description: 'Agent has too many topics or actions, increasing LLM confusion and reducing action selection accuracy.',
    remediation: 'Consolidate related actions under focused topics. Limit actions per topic to reduce ambiguity.',
  },
  {
    id: 'AGENTFORCE-7.2',
    name: 'Inadequate Skill Semantics',
    category: 'Agentic Architecture',
    categoryNumber: 7,
    severity: 'medium',
    description: 'Action or topic descriptions are vague, ambiguous, or semantically overlapping, confusing the planner.',
    remediation: 'Write clear, specific, non-overlapping descriptions for each topic and action.',
  },
  {
    id: 'AGENTFORCE-8.1',
    name: 'Context Traversal',
    category: 'Agentic Architecture',
    categoryNumber: 7,
    severity: 'high',
    description: 'Agent action chains allow traversal from low-privilege to high-privilege contexts without re-authorization.',
    remediation: 'Implement authorization checkpoints at context boundaries. Require re-confirmation for privilege escalation.',
  },
  // ── Category 8: Instruction Integrity ──
  {
    id: 'AGENTFORCE-9.1',
    name: 'Metadata Instruction Poisoning',
    category: 'Instruction Integrity',
    categoryNumber: 8,
    severity: 'critical',
    description: 'Adversarial content embedded in metadata fields (descriptions, labels) that could override agent instructions.',
    remediation: 'Sanitize all metadata text fields. Implement content validation for instruction-adjacent metadata.',
  },
  {
    id: 'AGENTFORCE-9.2',
    name: 'Cross-Topic Instruction Boundary',
    category: 'Instruction Integrity',
    categoryNumber: 8,
    severity: 'high',
    description: 'Instructions from one topic can influence behavior in another topic due to missing isolation boundaries.',
    remediation: 'Enforce strict topic isolation. Use system instruction overrides scoped to individual topics.',
  },
  // ── Category 9: Operational Reliability ──
  {
    id: 'AGENTFORCE-10.1',
    name: 'Validation Conflict',
    category: 'Operational Reliability',
    categoryNumber: 9,
    severity: 'medium',
    description: 'Conflicting validation rules or guard clauses that may cause non-deterministic agent behavior.',
    remediation: 'Review and resolve conflicting validation logic. Ensure guard clauses are consistent and non-overlapping.',
  },
];

/**
 * Get all rules.
 */
export function getAllRules(): RuleDefinition[] {
  return AGENTFORCE_RULES;
}

/**
 * Get a specific rule by ID.
 */
export function getRuleById(id: string): RuleDefinition | undefined {
  return AGENTFORCE_RULES.find(r => r.id === id);
}

/**
 * Get rules by category name.
 */
export function getRulesByCategory(category: string): RuleDefinition[] {
  return AGENTFORCE_RULES.filter(r => r.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get rules by severity.
 */
export function getRulesBySeverity(severity: string): RuleDefinition[] {
  return AGENTFORCE_RULES.filter(r => r.severity === severity);
}
