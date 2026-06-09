import { readFileSync } from "node:fs";
import { readConfig } from "./project-config.js";
import { lstatIfExists, rootPath, writeGeneratedText, writeGeneratedTextIfMissing } from "./fsx.js";

const ROOT_AGENTS_PATH = "AGENTS.md";
const START_MARKER = "<!-- benjamin-docs:start -->";
const END_MARKER = "<!-- benjamin-docs:end -->";
const AGENT_GUIDANCE_LABEL = "Agent guidance path";

export interface AgentContractOptions {
  children?: boolean;
}

export interface AgentContractResult {
  written: string[];
  messages: string[];
  preservedExisting: boolean;
}

export interface AgentContractCheckResult {
  ok: boolean;
  enabled: boolean;
  summary: string;
  errors: string[];
  warnings: string[];
}

export function installAgentContracts(root: string, options: AgentContractOptions = {}): AgentContractResult {
  const config = readConfig(root);
  const written: string[] = [];
  const messages: string[] = [];
  const childPaths = options.children ? discoverChildContractPaths(root, config.docsRoot) : [];

  for (const childPath of childPaths) {
    if (writeGeneratedTextIfMissing(root, childPath, childContractContent(config.docsRoot), AGENT_GUIDANCE_LABEL)) {
      written.push(childPath);
      messages.push(`Agent guidance: created ${childPath}.`);
    }
  }

  const rootAgentsPath = rootPath(root, ROOT_AGENTS_PATH);
  const existing = lstatIfExists(rootAgentsPath);
  const rootSection = rootContractSection(config.docsRoot, childPaths);

  if (!existing) {
    writeGeneratedText(root, ROOT_AGENTS_PATH, `# AGENTS\n\n${rootSection}\n`, AGENT_GUIDANCE_LABEL);
    written.push(ROOT_AGENTS_PATH);
    messages.push("Agent guidance: created AGENTS.md.");
    return { written, messages, preservedExisting: false };
  }

  const content = readFileSync(rootAgentsPath, "utf8");
  const replacement = replaceMarkedSection(content, rootSection);
  if (!replacement) {
    messages.push("Agent guidance: preserved existing AGENTS.md.");
    messages.push("Consider adding a Benjamin Docs section or splitting long guidance into child AGENTS.md files.");
    return { written, messages, preservedExisting: true };
  }

  if (replacement !== content) {
    writeGeneratedText(root, ROOT_AGENTS_PATH, replacement, AGENT_GUIDANCE_LABEL);
    written.push(ROOT_AGENTS_PATH);
    messages.push("Agent guidance: updated AGENTS.md.");
  } else {
    messages.push("Agent guidance: AGENTS.md already up to date.");
  }

  return { written, messages, preservedExisting: false };
}

export function checkAgentContracts(root: string): AgentContractCheckResult {
  const rootAgentsPath = rootPath(root, ROOT_AGENTS_PATH);
  if (!lstatIfExists(rootAgentsPath)) {
    return {
      ok: true,
      enabled: false,
      summary: "Benjamin Docs agent guidance is not installed.",
      errors: [],
      warnings: [],
    };
  }

  const content = readFileSync(rootAgentsPath, "utf8");
  const markerState = getMarkerState(content);
  if (!markerState.hasStart && !markerState.hasEnd) {
    return {
      ok: true,
      enabled: true,
      summary: "Existing AGENTS.md has no Benjamin Docs section.",
      errors: [],
      warnings: ["Existing AGENTS.md is preserved because it has no Benjamin Docs markers."],
    };
  }

  if (!markerState.balanced) {
    return {
      ok: false,
      enabled: true,
      summary: "Benjamin Docs agent guidance has unbalanced markers.",
      errors: ["AGENTS.md must contain exactly one Benjamin Docs start marker followed by exactly one end marker."],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const section = content.slice(markerState.startIndex, markerState.endIndex + END_MARKER.length);

  let docsRoot: string | undefined;
  try {
    docsRoot = readConfig(root).docsRoot;
  } catch (error) {
    errors.push(`Unable to read .benjamin-docs/config.json: ${errorMessage(error)}`);
  }

  if (!section.includes(".benjamin-docs/config.json")) {
    errors.push("AGENTS.md Benjamin Docs section must reference .benjamin-docs/config.json.");
  }

  if (docsRoot && !section.includes(`${docsRoot}/`)) {
    errors.push(`AGENTS.md Benjamin Docs section must reference configured docs root ${docsRoot}.`);
  }

  return {
    ok: errors.length === 0,
    enabled: true,
    summary: errors.length === 0 ? "Benjamin Docs agent guidance is installed." : "Benjamin Docs agent guidance needs attention.",
    errors,
    warnings,
  };
}

function rootContractSection(docsRoot: string, childPaths: string[]): string {
  const childIndex =
    childPaths.length > 0
      ? `\n### Child Agent Contract Index\n\n${childPaths.map((childPath) => `- \`${childPath}\``).join("\n")}\n`
      : "";

  return `${START_MARKER}
## Benjamin Docs Project Memory

- Project memory lives in \`${docsRoot}/\`.
- Machine metadata lives in \`.benjamin-docs/config.json\` and sibling files.
- Before project or code changes, read the most relevant Benjamin docs first:
  - \`${docsRoot}/project/brief.md\`
  - \`${docsRoot}/project/roadmap.md\`
  - \`${docsRoot}/project/open-questions.md\`
  - \`${docsRoot}/handoff/agent-brief.md\`
- Update Benjamin docs when durable decisions, workflows, architecture, risks, or handoff context change.
- Do not dump raw transcripts unless the user explicitly asks for an archive.
- Preserve the user's intent, but call out weak assumptions, contradictions, and useful alternatives.
- Before claiming handoff readiness, run \`benjamin-docs ready\`.
${childIndex}${END_MARKER}`;
}

function childContractContent(docsRoot: string): string {
  return `# AGENTS

## Benjamin-managed project memory

- This folder contains Benjamin Docs project memory for \`${docsRoot}/\`.
- Prefer updating focused docs over adding broad notes.
- Keep durable decisions, workflows, architecture, risks, and handoff context current.
- Preserve existing user-authored content unless the user explicitly asks for cleanup.
`;
}

function discoverChildContractPaths(root: string, docsRoot: string): string[] {
  const docsRootPath = rootPath(root, docsRoot);
  const docsRootStat = lstatIfExists(docsRootPath);
  if (!docsRootStat?.isDirectory()) return [];
  return [`${docsRoot}/AGENTS.md`];
}

function replaceMarkedSection(content: string, replacement: string): string | undefined {
  const startIndex = content.indexOf(START_MARKER);
  if (startIndex === -1) return undefined;

  const endIndex = content.indexOf(END_MARKER, startIndex + START_MARKER.length);
  if (endIndex === -1) return undefined;

  return `${content.slice(0, startIndex)}${replacement}${content.slice(endIndex + END_MARKER.length)}`;
}

function getMarkerState(content: string): {
  hasStart: boolean;
  hasEnd: boolean;
  balanced: boolean;
  startIndex: number;
  endIndex: number;
} {
  const startMatches = content.match(new RegExp(escapeRegExp(START_MARKER), "g")) ?? [];
  const endMatches = content.match(new RegExp(escapeRegExp(END_MARKER), "g")) ?? [];
  const startIndex = content.indexOf(START_MARKER);
  const endIndex = content.indexOf(END_MARKER, startIndex + START_MARKER.length);

  return {
    hasStart: startMatches.length > 0,
    hasEnd: endMatches.length > 0,
    balanced: startMatches.length === 1 && endMatches.length === 1 && startIndex !== -1 && endIndex > startIndex,
    startIndex,
    endIndex,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
