import { readFileSync, readdirSync, rmSync, rmdirSync } from "node:fs";
import { lstatIfExists, rootPath, writeGeneratedText } from "./fsx.js";

const SERVER_KEY = "benjamin-docs";
const MCP_FILE_LABEL = "MCP registration path";
const TOML_START_MARKER = "# benjamin-docs:start";
const TOML_END_MARKER = "# benjamin-docs:end";

export type McpTargetId = "claude-code" | "cursor" | "codex";

export interface McpTarget {
  id: McpTargetId;
  label: string;
  path: string;
}

export interface McpTargetResult {
  id: McpTargetId;
  label: string;
  path: string;
  status: "registered" | "already registered" | "removed" | "not registered" | "skipped";
  note?: string;
}

export interface McpResult {
  targets: McpTargetResult[];
}

type JsonObject = Record<string, unknown>;

export function knownMcpTargets(): McpTarget[] {
  return [
    { id: "claude-code", label: "Claude Code", path: ".mcp.json" },
    { id: "cursor", label: "Cursor", path: ".cursor/mcp.json" },
    { id: "codex", label: "Codex CLI", path: ".codex/config.toml" },
  ];
}

export function installMcp(root: string, targetIds?: McpTargetId[]): McpResult {
  return applyToTargets(root, targetIds, installMcpForTarget);
}

export function uninstallMcp(root: string, targetIds?: McpTargetId[]): McpResult {
  return applyToTargets(root, targetIds, uninstallMcpForTarget);
}

export function checkMcp(root: string, targetIds?: McpTargetId[]): McpResult {
  return applyToTargets(root, targetIds, checkMcpForTarget);
}

export function formatMcpResult(action: "install" | "uninstall" | "status", result: McpResult): string {
  const lines = [`benjamin-docs mcp ${action}`, ""];

  for (const target of result.targets) {
    lines.push(`${target.status.padEnd(19)} ${target.label.padEnd(12)} ${target.path}`);
    if (target.note) lines.push(`${" ".repeat(20)}${target.note}`);
  }

  lines.push("");
  if (action === "install") {
    lines.push("Registered clients spawn `benjamin-docs mcp` in this project and get memory tools:");
    lines.push("memory_context, memory_search, memory_read, memory_update, memory_record_decision, memory_status.");
    lines.push("Remove the registrations anytime with: benjamin-docs mcp uninstall");
  }

  return lines.join("\n");
}

function applyToTargets(
  root: string,
  targetIds: McpTargetId[] | undefined,
  action: (root: string, target: McpTarget) => McpTargetResult,
): McpResult {
  const targets = knownMcpTargets().filter((target) => !targetIds || targetIds.includes(target.id));
  return { targets: targets.map((target) => action(root, target)) };
}

function serverEntry(): JsonObject {
  return { command: "benjamin-docs", args: ["mcp"] };
}

function installMcpForTarget(root: string, target: McpTarget): McpTargetResult {
  if (target.id === "codex") return installCodexBlock(root, target);

  const existing = readJsonFile(root, target);
  if (existing.unreadable) {
    return { ...target, status: "skipped", note: `Existing ${target.path} could not be parsed. Preserved unchanged; add the ${SERVER_KEY} server manually.` };
  }

  const content = existing.value ?? {};
  const servers = ensureObject(content, "mcpServers");
  if (isSameEntry(servers[SERVER_KEY])) {
    return { ...target, status: "already registered" };
  }

  servers[SERVER_KEY] = serverEntry();
  writeGeneratedText(root, target.path, `${JSON.stringify(content, null, 2)}\n`, MCP_FILE_LABEL);
  return { ...target, status: "registered" };
}

function uninstallMcpForTarget(root: string, target: McpTarget): McpTargetResult {
  if (target.id === "codex") return uninstallCodexBlock(root, target);

  const existing = readJsonFile(root, target);
  if (existing.unreadable) {
    return { ...target, status: "skipped", note: `Existing ${target.path} could not be parsed. Preserved unchanged.` };
  }

  if (!existing.value) return { ...target, status: "not registered" };

  const content = existing.value;
  const servers = content.mcpServers;
  if (typeof servers !== "object" || servers === null || Array.isArray(servers) || !(SERVER_KEY in (servers as JsonObject))) {
    return { ...target, status: "not registered" };
  }

  delete (servers as JsonObject)[SERVER_KEY];
  if (Object.keys(servers as JsonObject).length === 0) delete content.mcpServers;

  if (Object.keys(content).length === 0) {
    rmSync(rootPath(root, target.path));
    removeDirIfEmpty(root, dirOf(target.path));
    return { ...target, status: "removed", note: `Removed ${target.path} because only the ${SERVER_KEY} registration was in it.` };
  }

  writeGeneratedText(root, target.path, `${JSON.stringify(content, null, 2)}\n`, MCP_FILE_LABEL);
  return { ...target, status: "removed" };
}

function checkMcpForTarget(root: string, target: McpTarget): McpTargetResult {
  if (target.id === "codex") {
    const text = readTextFile(root, target);
    if (text === undefined) return { ...target, status: "not registered" };
    return { ...target, status: text.includes(TOML_START_MARKER) ? "registered" : "not registered" };
  }

  const existing = readJsonFile(root, target);
  if (existing.unreadable) return { ...target, status: "skipped", note: `Existing ${target.path} could not be parsed.` };
  if (!existing.value) return { ...target, status: "not registered" };

  const servers = existing.value.mcpServers;
  const registered = typeof servers === "object" && servers !== null && !Array.isArray(servers) && SERVER_KEY in (servers as JsonObject);
  return { ...target, status: registered ? "registered" : "not registered" };
}

function codexBlock(): string {
  return [TOML_START_MARKER, `[mcp_servers.${SERVER_KEY}]`, 'command = "benjamin-docs"', 'args = ["mcp"]', TOML_END_MARKER].join("\n");
}

function installCodexBlock(root: string, target: McpTarget): McpTargetResult {
  const text = readTextFile(root, target);
  if (text === undefined) {
    writeGeneratedText(root, target.path, `${codexBlock()}\n`, MCP_FILE_LABEL);
    return { ...target, status: "registered" };
  }

  const markerState = tomlMarkerState(text);
  if (markerState === "unbalanced") {
    return { ...target, status: "skipped", note: `Existing ${target.path} has unbalanced benjamin-docs markers. Preserved unchanged.` };
  }

  if (markerState === "present") {
    const replaced = replaceTomlBlock(text, codexBlock());
    if (replaced === text) return { ...target, status: "already registered" };
    writeGeneratedText(root, target.path, replaced, MCP_FILE_LABEL);
    return { ...target, status: "registered" };
  }

  writeGeneratedText(root, target.path, `${text.replace(/\s+$/u, "")}\n\n${codexBlock()}\n`, MCP_FILE_LABEL);
  return { ...target, status: "registered" };
}

function uninstallCodexBlock(root: string, target: McpTarget): McpTargetResult {
  const text = readTextFile(root, target);
  if (text === undefined) return { ...target, status: "not registered" };

  const markerState = tomlMarkerState(text);
  if (markerState === "unbalanced") {
    return { ...target, status: "skipped", note: `Existing ${target.path} has unbalanced benjamin-docs markers. Preserved unchanged.` };
  }

  if (markerState === "absent") return { ...target, status: "not registered" };

  const remaining = removeTomlBlock(text);
  if (remaining.trim() === "") {
    rmSync(rootPath(root, target.path));
    removeDirIfEmpty(root, dirOf(target.path));
    return { ...target, status: "removed", note: `Removed ${target.path} because only the ${SERVER_KEY} registration was in it.` };
  }

  writeGeneratedText(root, target.path, remaining, MCP_FILE_LABEL);
  return { ...target, status: "removed" };
}

function tomlMarkerState(text: string): "absent" | "present" | "unbalanced" {
  const starts = text.split(TOML_START_MARKER).length - 1;
  const ends = text.split(TOML_END_MARKER).length - 1;
  if (starts === 0 && ends === 0) return "absent";
  if (starts === 1 && ends === 1 && text.indexOf(TOML_START_MARKER) < text.indexOf(TOML_END_MARKER)) return "present";
  return "unbalanced";
}

function replaceTomlBlock(text: string, block: string): string {
  const start = text.indexOf(TOML_START_MARKER);
  const end = text.indexOf(TOML_END_MARKER) + TOML_END_MARKER.length;
  return `${text.slice(0, start)}${block}${text.slice(end)}`;
}

function removeTomlBlock(text: string): string {
  const start = text.indexOf(TOML_START_MARKER);
  const end = text.indexOf(TOML_END_MARKER) + TOML_END_MARKER.length;
  const before = text.slice(0, start).replace(/\n+$/u, "\n");
  const after = text.slice(end).replace(/^\n+/u, "");
  const joined = `${before}${after}`;
  return joined.trim() === "" ? "" : joined;
}

interface ReadJsonResult {
  value?: JsonObject;
  unreadable: boolean;
}

function readJsonFile(root: string, target: McpTarget): ReadJsonResult {
  const text = readTextFile(root, target);
  if (text === undefined) return { unreadable: false };

  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { unreadable: true };
    return { value: parsed as JsonObject, unreadable: false };
  } catch {
    return { unreadable: true };
  }
}

function readTextFile(root: string, target: McpTarget): string | undefined {
  const fullPath = rootPath(root, target.path);
  const stat = lstatIfExists(fullPath);
  if (!stat) return undefined;
  if (!stat.isFile()) return undefined;
  return readFileSync(fullPath, "utf8");
}

function isSameEntry(entry: unknown): boolean {
  if (typeof entry !== "object" || entry === null) return false;
  const record = entry as JsonObject;
  return record.command === "benjamin-docs" && Array.isArray(record.args) && record.args.length === 1 && record.args[0] === "mcp";
}

function ensureObject(parent: JsonObject, key: string): JsonObject {
  const existing = parent[key];
  if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
    return existing as JsonObject;
  }

  const created: JsonObject = {};
  parent[key] = created;
  return created;
}

function dirOf(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function removeDirIfEmpty(root: string, dir: string): void {
  if (!dir) return;

  try {
    const fullPath = rootPath(root, dir);
    if (readdirSync(fullPath).length === 0) rmdirSync(fullPath);
  } catch {
    // Leave the directory alone when it cannot be inspected or removed.
  }
}
