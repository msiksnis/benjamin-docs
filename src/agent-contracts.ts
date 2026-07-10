import { readFileSync } from "node:fs";
import { isAbsolute, win32 } from "node:path";
import { readConfig } from "./project-config.js";
import { assertGeneratedPathSafe, lstatIfExists, rootPath, writeGeneratedText, writeGeneratedTextIfMissing } from "./fsx.js";

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

interface MarkerState {
  hasStart: boolean;
  hasEnd: boolean;
  balanced: boolean;
  startIndex: number;
  endIndex: number;
}

export function installAgentContracts(root: string, options: AgentContractOptions = {}): AgentContractResult {
  const config = readConfig(root);
  const written: string[] = [];
  const messages: string[] = [];
  const rootAgentsPath = rootPath(root, ROOT_AGENTS_PATH);
  const existing = lstatIfExists(rootAgentsPath);
  if (existing) assertGeneratedPathSafe(root, [ROOT_AGENTS_PATH], AGENT_GUIDANCE_LABEL, "file");

  let existingContent = "";
  let existingMarkerState: MarkerState | undefined;
  if (existing) {
    existingContent = readFileSync(rootAgentsPath, "utf8");
    existingMarkerState = getMarkerState(existingContent);
    if ((existingMarkerState.hasStart || existingMarkerState.hasEnd) && !existingMarkerState.balanced) {
      messages.push("Agent guidance: preserved existing AGENTS.md.");
      messages.push("Consider adding a Benjamin Docs section or splitting long guidance into child AGENTS.md files.");
      return { written, messages, preservedExisting: true };
    }
  }

  const childPaths = uniquePaths([
    ...(options.children ? discoverChildContractPaths(root, config.docsRoot) : []),
    ...discoverExistingChildContractPaths(root, config.docsRoot),
  ]);

  for (const childPath of childPaths) {
    if (writeGeneratedTextIfMissing(root, childPath, childContractContent(config.docsRoot), AGENT_GUIDANCE_LABEL)) {
      written.push(childPath);
      messages.push(`Agent guidance: created ${childPath}.`);
    }
  }

  const rootSection = rootContractSection(config.docsRoot, childPaths);

  if (!existing) {
    writeGeneratedText(root, ROOT_AGENTS_PATH, `# AGENTS\n\n${rootSection}\n`, AGENT_GUIDANCE_LABEL);
    written.push(ROOT_AGENTS_PATH);
    messages.push("Agent guidance: created AGENTS.md.");
    return { written, messages, preservedExisting: false };
  }

  if (!existingMarkerState) throw new Error("Internal error: existing AGENTS.md marker state was not read.");

  const replacement = upsertMarkedSection(existingContent, existingMarkerState, rootSection);
  if (replacement !== existingContent) {
    writeGeneratedText(root, ROOT_AGENTS_PATH, replacement, AGENT_GUIDANCE_LABEL);
    written.push(ROOT_AGENTS_PATH);
    messages.push(
      existingMarkerState.hasStart || existingMarkerState.hasEnd
        ? "Agent guidance: updated AGENTS.md."
        : "Agent guidance: added Benjamin Docs section to existing AGENTS.md.",
    );
  } else {
    messages.push("Agent guidance: AGENTS.md already up to date.");
  }

  return { written, messages, preservedExisting: false };
}

export function hasAgentContractMarkers(root: string): boolean {
  const rootAgentsPath = rootPath(root, ROOT_AGENTS_PATH);
  if (!lstatIfExists(rootAgentsPath)?.isFile()) return false;

  try {
    return getMarkerState(readFileSync(rootAgentsPath, "utf8")).balanced;
  } catch {
    return false;
  }
}

export function checkAgentContracts(root: string): AgentContractCheckResult {
  const rootAgentsPath = rootPath(root, ROOT_AGENTS_PATH);
  if (!lstatIfExists(rootAgentsPath)) {
    const orphanedChildErrors = checkOrphanedChildContracts(root);
    if (orphanedChildErrors.length > 0) {
      return {
        ok: false,
        enabled: true,
        summary: "Benjamin Docs agent guidance needs attention.",
        errors: orphanedChildErrors,
        warnings: [],
      };
    }

    return {
      ok: true,
      enabled: false,
      summary: "Benjamin Docs agent guidance is not installed.",
      errors: [],
      warnings: [],
    };
  }

  try {
    assertGeneratedPathSafe(root, [ROOT_AGENTS_PATH], AGENT_GUIDANCE_LABEL, "file");
  } catch (error) {
    return {
      ok: false,
      enabled: true,
      summary: "Benjamin Docs agent guidance cannot be checked safely.",
      errors: [errorMessage(error)],
      warnings: [],
    };
  }

  const content = readFileSync(rootAgentsPath, "utf8");
  const markerState = getMarkerState(content);
  if (!markerState.hasStart && !markerState.hasEnd) {
    const unindexedChildErrors = checkChildContractsWithoutRootIndex(root);

    return {
      ok: unindexedChildErrors.length === 0,
      enabled: true,
      summary:
        unindexedChildErrors.length === 0
          ? "Existing AGENTS.md has no Benjamin Docs section."
          : "Benjamin Docs agent guidance needs attention.",
      errors: unindexedChildErrors,
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

  if (docsRoot) {
    errors.push(...checkConfiguredDocsRoot(root, docsRoot));
  }

  if (!section.includes(".benjamin-docs/config.json")) {
    errors.push("AGENTS.md Benjamin Docs section must reference .benjamin-docs/config.json.");
  }

  if (docsRoot && !section.includes(`${docsRoot}/`)) {
    errors.push(`AGENTS.md Benjamin Docs section must reference configured docs root ${docsRoot}.`);
  }

  const indexedChildPaths = childContractIndexPaths(section);
  errors.push(...checkIndexedChildContracts(root, indexedChildPaths));
  if (docsRoot) {
    errors.push(...checkExpectedChildContractIndex(root, docsRoot, indexedChildPaths));
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
- Use feature docs for distinct features or changes; use handoff docs for continuation context.
- After code, config, schema, test, workflow, or product behavior changes, review docs impact before final response.
- Complete Benjamin Docs maintenance before writing the final user-facing answer.
- Never let Benjamin Docs bookkeeping replace, delay, or materially change that answer.
- Reading memory alone needs no mention. After a durable memory update, an optional final note must be one short sentence, for example: \`Benjamin Docs updated: checkout handoff.\`
- Feature docs are not enough when project-level memory becomes stale; update roadmap, architecture, code map, changelog, or handoff docs when those facts change.
- When a feature ships or is abandoned, run \`benjamin-docs scope status <slug> archived\` so derived views stay current.
- Prefer concrete evidence: code paths, commands, decisions, risks, and next actions.
- Do not dump raw transcripts unless the user explicitly asks for an archive.
- Preserve the user's intent, but call out weak assumptions, contradictions, and useful alternatives.
- Run \`benjamin-docs drift\` to see docs whose watched code changed after the doc last changed; re-verify and update them.
- Before claiming handoff readiness, run \`benjamin-docs review --changed\` when git history is available, then \`benjamin-docs ready\`.
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

function discoverExistingChildContractPaths(root: string, docsRoot: string): string[] {
  const childPath = `${docsRoot}/AGENTS.md`;
  let parts: string[];
  try {
    parts = childIndexPathParts(childPath);
    assertGeneratedPathSafe(root, parts, AGENT_GUIDANCE_LABEL, "file");
  } catch {
    return [];
  }

  const childStat = lstatIfExists(rootPath(root, ...parts));
  return childStat?.isFile() ? [childPath] : [];
}

function replaceMarkedSection(content: string, markerState: MarkerState, replacement: string): string {
  return `${content.slice(0, markerState.startIndex)}${replacement}${content.slice(markerState.endIndex + END_MARKER.length)}`;
}

function upsertMarkedSection(content: string, markerState: MarkerState, replacement: string): string {
  if (!markerState.hasStart && !markerState.hasEnd) {
    const trimmed = content.replace(/\s+$/u, "");
    return `${trimmed}\n\n${replacement}\n`;
  }

  return replaceMarkedSection(content, markerState, replacement);
}

function getMarkerState(content: string): MarkerState {
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

function checkIndexedChildContracts(root: string, childPaths: string[]): string[] {
  const errors: string[] = [];

  for (const childPath of childPaths) {
    let parts: string[];
    try {
      parts = childIndexPathParts(childPath);
      assertGeneratedPathSafe(root, parts, AGENT_GUIDANCE_LABEL, "file");
    } catch (error) {
      errors.push(`AGENTS.md references unsafe child contract: ${childPath} (${errorMessage(error)}).`);
      continue;
    }

    const childStat = lstatIfExists(rootPath(root, ...parts));
    if (!childStat) {
      errors.push(`AGENTS.md references missing child contract: ${childPath}.`);
      continue;
    }

    if (!childStat.isFile()) {
      errors.push(`AGENTS.md references child contract that is not a regular file: ${childPath}.`);
    }
  }

  return errors;
}

function checkChildContractsWithoutRootIndex(root: string): string[] {
  try {
    return checkExpectedChildContractIndex(root, readConfig(root).docsRoot, []);
  } catch {
    return [];
  }
}

function checkOrphanedChildContracts(root: string): string[] {
  let docsRoot: string;
  try {
    docsRoot = readConfig(root).docsRoot;
  } catch {
    return [];
  }

  const expectedChildPath = `${docsRoot}/AGENTS.md`;
  let parts: string[];
  try {
    parts = childIndexPathParts(expectedChildPath);
  } catch (error) {
    return [`Unable to check expected child contract ${expectedChildPath}: ${errorMessage(error)}.`];
  }

  try {
    assertGeneratedPathSafe(root, parts, AGENT_GUIDANCE_LABEL, "file");
  } catch (error) {
    return [`Child AGENTS.md exists but root AGENTS.md is missing: ${expectedChildPath} (${errorMessage(error)}).`];
  }

  const childStat = lstatIfExists(rootPath(root, ...parts));
  if (!childStat) return [];
  if (!childStat.isFile()) return [`Child AGENTS.md exists but is not a regular file: ${expectedChildPath}.`];

  return [`Child AGENTS.md exists but root AGENTS.md is missing: ${expectedChildPath}.`];
}

function checkConfiguredDocsRoot(root: string, docsRoot: string): string[] {
  let parts: string[];
  try {
    parts = childIndexPathParts(docsRoot);
    assertGeneratedPathSafe(root, parts, "Configured docs root", "any");
  } catch (error) {
    return [`Configured docs root is unsafe: ${docsRoot}/ (${errorMessage(error)}).`];
  }

  const docsRootStat = lstatIfExists(rootPath(root, ...parts));
  if (!docsRootStat) return [`Configured docs root is missing: ${docsRoot}/.`];
  if (!docsRootStat.isDirectory()) return [`Configured docs root is not a directory: ${docsRoot}/.`];
  return [];
}

function checkExpectedChildContractIndex(root: string, docsRoot: string, indexedChildPaths: string[]): string[] {
  const expectedChildPath = `${docsRoot}/AGENTS.md`;
  if (indexedChildPaths.includes(expectedChildPath)) return [];

  let parts: string[];
  try {
    parts = childIndexPathParts(expectedChildPath);
    assertGeneratedPathSafe(root, parts, AGENT_GUIDANCE_LABEL, "file");
  } catch (error) {
    return [`Unable to check expected child contract ${expectedChildPath}: ${errorMessage(error)}.`];
  }

  const childStat = lstatIfExists(rootPath(root, ...parts));
  if (!childStat?.isFile()) return [];

  return [`Child AGENTS.md exists but is missing from root index: ${expectedChildPath}.`];
}

function childContractIndexPaths(section: string): string[] {
  const lines = section.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim() === "### Child Agent Contract Index");
  if (headerIndex === -1) return [];

  const paths: string[] = [];
  for (const line of lines.slice(headerIndex + 1)) {
    const trimmed = line.trim();
    if (/^#{1,6}\s+/.test(trimmed)) break;

    const match = trimmed.match(/^- `([^`]+)`$/);
    if (match?.[1]) paths.push(match[1]);
  }

  return paths;
}

function childIndexPathParts(relativePath: string): string[] {
  if (!relativePath || relativePath.includes("\\") || isAbsolute(relativePath) || win32.isAbsolute(relativePath)) {
    throw new Error(`child contract path must be a relative project path: ${relativePath}`);
  }

  const parts = relativePath.split("/");
  if (parts.some((part) => part === "" || part === "." || part === ".." || isAbsolute(part) || win32.isAbsolute(part))) {
    throw new Error(`child contract path must be a relative project path: ${relativePath}`);
  }

  return parts;
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
