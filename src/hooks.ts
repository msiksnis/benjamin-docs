import { readFileSync, readdirSync, rmSync, rmdirSync } from "node:fs";
import { lstatIfExists, rootPath, writeGeneratedText } from "./fsx.js";

const HOOK_COMMAND_MARKER = "benjamin-docs session-";
const HOOK_FILE_LABEL = "Agent hook path";

export type HookTargetId = "claude-code" | "codex" | "cursor";

export interface HookTarget {
  id: HookTargetId;
  label: string;
  path: string;
}

export interface HookTargetResult {
  id: HookTargetId;
  label: string;
  path: string;
  status: "installed" | "already installed" | "removed" | "not installed" | "skipped";
  note?: string;
}

export interface HooksResult {
  targets: HookTargetResult[];
}

type JsonObject = Record<string, unknown>;

export function knownHookTargets(): HookTarget[] {
  return [
    { id: "claude-code", label: "Claude Code", path: ".claude/settings.json" },
    { id: "codex", label: "Codex CLI", path: ".codex/hooks.json" },
    { id: "cursor", label: "Cursor", path: ".cursor/hooks.json" },
  ];
}

export function installHooks(root: string, targetIds?: HookTargetId[]): HooksResult {
  return applyToTargets(root, targetIds, installHooksForTarget);
}

export function uninstallHooks(root: string, targetIds?: HookTargetId[]): HooksResult {
  return applyToTargets(root, targetIds, uninstallHooksForTarget);
}

export function checkHooks(root: string, targetIds?: HookTargetId[]): HooksResult {
  return applyToTargets(root, targetIds, checkHooksForTarget);
}

export function formatHooksResult(action: "install" | "uninstall" | "status", result: HooksResult): string {
  const lines = [`benjamin-docs hooks ${action}`, ""];

  for (const target of result.targets) {
    lines.push(`${target.status.padEnd(18)} ${target.label.padEnd(12)} ${target.path}`);
    if (target.note) lines.push(`${" ".repeat(19)}${target.note}`);
  }

  lines.push("");
  if (action === "install") {
    lines.push("Session-start hooks inject Benjamin Docs context when an agent session begins.");
    lines.push("Codex: enable hooks with features.hooks = true in ~/.codex/config.toml, then trust the hooks via /hooks in Codex.");
    lines.push("Remove them anytime with: benjamin-docs hooks uninstall");
  }

  return lines.join("\n");
}

function applyToTargets(
  root: string,
  targetIds: HookTargetId[] | undefined,
  action: (root: string, target: HookTarget) => HookTargetResult,
): HooksResult {
  const targets = knownHookTargets().filter((target) => !targetIds || targetIds.includes(target.id));
  return { targets: targets.map((target) => action(root, target)) };
}

function installHooksForTarget(root: string, target: HookTarget): HookTargetResult {
  const existing = readHookFile(root, target);
  if (existing.unreadable) {
    return { ...target, status: "skipped", note: `Existing ${target.path} could not be parsed. Preserved unchanged; add the Benjamin Docs hooks manually.` };
  }

  const content = existing.value ?? {};
  const changed = target.id === "cursor" ? addCursorHooks(content) : addSharedSchemaHooks(content, target.id);
  if (!changed) {
    return { ...target, status: "already installed" };
  }

  writeGeneratedText(root, target.path, `${JSON.stringify(content, null, 2)}\n`, HOOK_FILE_LABEL);
  return { ...target, status: "installed" };
}

function uninstallHooksForTarget(root: string, target: HookTarget): HookTargetResult {
  const existing = readHookFile(root, target);
  if (existing.unreadable) {
    return { ...target, status: "skipped", note: `Existing ${target.path} could not be parsed. Preserved unchanged.` };
  }

  if (!existing.value) {
    return { ...target, status: "not installed" };
  }

  const content = existing.value;
  const changed = target.id === "cursor" ? removeCursorHooks(content) : removeSharedSchemaHooks(content);
  if (!changed) {
    return { ...target, status: "not installed" };
  }

  if (isEmptyHookFile(content, target.id)) {
    rmSync(rootPath(root, target.path));
    removeDirIfEmpty(root, target.path.split("/")[0] ?? "");
    return { ...target, status: "removed", note: `Removed ${target.path} because only Benjamin Docs hooks were in it.` };
  }

  writeGeneratedText(root, target.path, `${JSON.stringify(content, null, 2)}\n`, HOOK_FILE_LABEL);
  return { ...target, status: "removed" };
}

function checkHooksForTarget(root: string, target: HookTarget): HookTargetResult {
  const existing = readHookFile(root, target);
  if (existing.unreadable) {
    return { ...target, status: "skipped", note: `Existing ${target.path} could not be parsed.` };
  }

  if (!existing.value) {
    return { ...target, status: "not installed" };
  }

  return { ...target, status: hasBenjaminHooks(existing.value) ? "installed" : "not installed" };
}

interface ReadHookFileResult {
  value?: JsonObject;
  unreadable: boolean;
}

function readHookFile(root: string, target: HookTarget): ReadHookFileResult {
  const fullPath = rootPath(root, target.path);
  const stat = lstatIfExists(fullPath);
  if (!stat) return { unreadable: false };
  if (!stat.isFile()) return { unreadable: true };

  try {
    const parsed: unknown = JSON.parse(readFileSync(fullPath, "utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { unreadable: true };
    return { value: parsed as JsonObject, unreadable: false };
  } catch {
    return { unreadable: true };
  }
}

function sessionStartCommand(format: string): string {
  return `benjamin-docs session-start --format ${format}`;
}

function addSharedSchemaHooks(content: JsonObject, targetId: HookTargetId): boolean {
  const format = targetId === "codex" ? "codex" : "claude";
  const hooks = ensureObject(content, "hooks");
  const removedLegacyStop = removeBenjaminEntriesFromEvent(hooks, "Stop", "session-stop");
  const addedStart = addSharedSchemaEntry(hooks, "SessionStart", "startup|resume|clear", sessionStartCommand(format));
  return removedLegacyStop || addedStart;
}

function addSharedSchemaEntry(hooks: JsonObject, event: string, matcher: string | undefined, command: string): boolean {
  const groups = ensureArray(hooks, event);
  if (groups.some((group) => sharedSchemaGroupHasMarker(group))) return false;

  const entry: JsonObject = { type: "command", command };
  const group: JsonObject = matcher === undefined ? { hooks: [entry] } : { matcher, hooks: [entry] };
  groups.push(group);
  return true;
}

function sharedSchemaGroupHasMarker(group: unknown): boolean {
  if (typeof group !== "object" || group === null) return false;
  const hooks = (group as JsonObject).hooks;
  if (!Array.isArray(hooks)) return false;
  return hooks.some((entry) => entryHasMarker(entry));
}

function removeSharedSchemaHooks(content: JsonObject): boolean {
  const hooks = content.hooks;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return false;

  const hookMap = hooks as JsonObject;
  let changed = false;

  for (const event of Object.keys(hookMap)) {
    const groups = hookMap[event];
    if (!Array.isArray(groups)) continue;

    const kept = groups.filter((group) => !sharedSchemaGroupHasMarker(group));
    if (kept.length !== groups.length) {
      changed = true;
      if (kept.length === 0) {
        delete hookMap[event];
      } else {
        hookMap[event] = kept;
      }
    }
  }

  if (changed && Object.keys(hookMap).length === 0) {
    delete content.hooks;
  }

  return changed;
}

function addCursorHooks(content: JsonObject): boolean {
  let changed = false;
  if (content.version === undefined) {
    content.version = 1;
    changed = true;
  }
  const hooks = ensureObject(content, "hooks");
  changed = removeBenjaminEntriesFromEvent(hooks, "stop", "session-stop") || changed;
  changed = addCursorEntry(hooks, "sessionStart", { command: sessionStartCommand("cursor") }) || changed;

  return changed;
}

function removeBenjaminEntriesFromEvent(hooks: JsonObject, event: string, commandName: string): boolean {
  const groups = hooks[event];
  if (!Array.isArray(groups)) return false;

  const commandMarker = `benjamin-docs ${commandName}`;
  let changed = false;
  const keptGroups: unknown[] = [];

  for (const group of groups) {
    if (entryHasCommandMarker(group, commandMarker)) {
      changed = true;
      continue;
    }

    if (typeof group !== "object" || group === null || Array.isArray(group)) {
      keptGroups.push(group);
      continue;
    }

    const groupObject = group as JsonObject;
    const entries = groupObject.hooks;
    if (!Array.isArray(entries)) {
      keptGroups.push(group);
      continue;
    }

    const keptEntries = entries.filter((entry) => !entryHasCommandMarker(entry, commandMarker));
    if (keptEntries.length === entries.length) {
      keptGroups.push(group);
      continue;
    }

    changed = true;
    if (keptEntries.length > 0) {
      groupObject.hooks = keptEntries;
      keptGroups.push(groupObject);
    }
  }

  if (!changed) return false;
  if (keptGroups.length === 0) {
    delete hooks[event];
  } else {
    hooks[event] = keptGroups;
  }
  return true;
}

function addCursorEntry(hooks: JsonObject, event: string, entry: JsonObject): boolean {
  const entries = ensureArray(hooks, event);
  if (entries.some((existing) => entryHasMarker(existing))) return false;

  entries.push(entry);
  return true;
}

function removeCursorHooks(content: JsonObject): boolean {
  const hooks = content.hooks;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return false;

  const hookMap = hooks as JsonObject;
  let changed = false;

  for (const event of Object.keys(hookMap)) {
    const entries = hookMap[event];
    if (!Array.isArray(entries)) continue;

    const kept = entries.filter((entry) => !entryHasMarker(entry));
    if (kept.length !== entries.length) {
      changed = true;
      if (kept.length === 0) {
        delete hookMap[event];
      } else {
        hookMap[event] = kept;
      }
    }
  }

  if (changed && Object.keys(hookMap).length === 0) {
    delete content.hooks;
  }

  return changed;
}

function entryHasMarker(entry: unknown): boolean {
  return entryHasCommandMarker(entry, HOOK_COMMAND_MARKER);
}

function entryHasCommandMarker(entry: unknown, marker: string): boolean {
  if (typeof entry !== "object" || entry === null) return false;
  const command = (entry as JsonObject).command;
  return typeof command === "string" && command.includes(marker);
}

function hasBenjaminHooks(content: JsonObject): boolean {
  const hooks = content.hooks;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return false;

  return Object.values(hooks as JsonObject).some(
    (groups) => Array.isArray(groups) && groups.some((group) => sharedSchemaGroupHasMarker(group) || entryHasMarker(group)),
  );
}

function isEmptyHookFile(content: JsonObject, targetId: HookTargetId): boolean {
  const keys = Object.keys(content).filter((key) => content[key] !== undefined);
  if (targetId === "cursor") {
    return keys.every((key) => key === "version" || key === "hooks") && isEmptyHooksValue(content.hooks);
  }

  return keys.every((key) => key === "hooks") && isEmptyHooksValue(content.hooks);
}

function isEmptyHooksValue(hooks: unknown): boolean {
  if (hooks === undefined) return true;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return false;
  return Object.keys(hooks as JsonObject).length === 0;
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

function ensureObject(parent: JsonObject, key: string): JsonObject {
  const existing = parent[key];
  if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
    return existing as JsonObject;
  }

  const created: JsonObject = {};
  parent[key] = created;
  return created;
}

function ensureArray(parent: JsonObject, key: string): unknown[] {
  const existing = parent[key];
  if (Array.isArray(existing)) return existing;

  const created: unknown[] = [];
  parent[key] = created;
  return created;
}
