import { readFileSync, readdirSync, rmSync, rmdirSync } from "node:fs";
import { lstatIfExists, rootPath, writeGeneratedText } from "./fsx.js";

const HOOK_COMMAND_MARKER = "benjamin-docs session-";
const HOOK_FILE_LABEL = "Agent hook path";
const SHARED_SESSION_START_MATCHER = "startup|resume|clear";

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
  status: "installed" | "repaired" | "already installed" | "removed" | "not installed" | "skipped";
  note?: string;
  legacyStop?: boolean;
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
  const incompatibleStructure = describeIncompatibleHookStructure(content, target.id);
  if (incompatibleStructure) {
    return {
      ...target,
      status: "skipped",
      note: `Existing ${target.path} has an incompatible hook structure (${incompatibleStructure}). Preserved unchanged; add the Benjamin Docs hooks manually.`,
    };
  }
  const hadBenjaminHook = eventContainsCommand(content, isBenjaminSessionCommand);
  const changed = target.id === "cursor" ? addCursorHooks(content) : addSharedSchemaHooks(content, target.id);
  if (!changed) {
    return { ...target, status: "already installed" };
  }

  writeGeneratedText(root, target.path, `${JSON.stringify(content, null, 2)}\n`, HOOK_FILE_LABEL);
  return { ...target, status: hadBenjaminHook ? "repaired" : "installed" };
}

function describeIncompatibleHookStructure(content: JsonObject, targetId: HookTargetId): string | undefined {
  const hooks = content.hooks;
  if (hooks === undefined) return undefined;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return "hooks must be an object";

  const hookMap = hooks as JsonObject;
  const events = targetId === "cursor" ? ["sessionStart", "stop"] : ["SessionStart", "Stop"];
  for (const event of events) {
    if (hookMap[event] !== undefined && !Array.isArray(hookMap[event])) return `${event} must be an array`;
    if (targetId !== "cursor" && Array.isArray(hookMap[event])) {
      for (const group of hookMap[event]) {
        if (typeof group !== "object" || group === null || Array.isArray(group)) continue;
        const groupObject = group as JsonObject;
        if (Object.hasOwn(groupObject, "hooks") && !Array.isArray(groupObject.hooks)) {
          return `${event} group hooks must be an array`;
        }
      }
    }
  }

  return undefined;
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

  const health = inspectHookHealth(existing.value, target.id);
  return {
    ...target,
    status: health.expectedStart ? "installed" : "not installed",
    ...(health.legacyStop && {
      legacyStop: true,
      note: "Legacy Benjamin stop hook detected; reinstall this target to remove it.",
    }),
  };
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
  const expectedStartCommand = sessionStartCommand(format);
  const removedLegacyStop = removeBenjaminEntriesFromEvent(hooks, "Stop", "session-stop", undefined, true);
  const removedStaleStart = removeInvalidSharedSessionStartEntries(hooks, expectedStartCommand);
  const addedStart = addSharedSchemaEntry(hooks, "SessionStart", SHARED_SESSION_START_MATCHER, expectedStartCommand);
  return removedLegacyStop || removedStaleStart || addedStart;
}

function addSharedSchemaEntry(hooks: JsonObject, event: string, matcher: string | undefined, command: string): boolean {
  const groups = ensureArray(hooks, event);
  if (groups.some((group) => isValidSharedSessionStartGroup(group, command))) return false;

  const entry: JsonObject = { type: "command", command };
  const group: JsonObject = matcher === undefined ? { hooks: [entry] } : { matcher, hooks: [entry] };
  groups.push(group);
  return true;
}

function isValidSharedSessionStartGroup(group: unknown, expectedCommand: string): boolean {
  if (typeof group !== "object" || group === null || Array.isArray(group)) return false;
  const groupObject = group as JsonObject;
  if (groupObject.matcher !== SHARED_SESSION_START_MATCHER || !Array.isArray(groupObject.hooks)) return false;
  return groupObject.hooks.some((entry) => isExecutableCommandEntry(entry, expectedCommand));
}

function isExecutableCommandEntry(entry: unknown, expectedCommand: string): boolean {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
  const object = entry as JsonObject;
  return object.type === "command" && object.command === expectedCommand;
}

function hasInvalidSharedSessionStartEntry(group: unknown, expectedCommand: string): boolean {
  const commandMarker = "benjamin-docs session-start";
  if (!eventContainsCommand(group, (command) => commandStartsWithMarker(command, commandMarker))) return false;
  if (typeof group !== "object" || group === null || Array.isArray(group)) return true;

  const groupObject = group as JsonObject;
  if (entryHasCommandMarker(group, commandMarker)) return true;
  if (!Array.isArray(groupObject.hooks)) return true;

  return groupObject.hooks.some((entry) => {
    if (!eventContainsCommand(entry, (command) => commandStartsWithMarker(command, commandMarker))) return false;
    return groupObject.matcher !== SHARED_SESSION_START_MATCHER
      || !isExecutableCommandEntry(entry, expectedCommand);
  });
}

function removeInvalidSharedSessionStartEntries(hooks: JsonObject, expectedCommand: string): boolean {
  const groups = hooks.SessionStart;
  if (!Array.isArray(groups)) return false;

  const commandMarker = "benjamin-docs session-start";
  let changed = false;
  const keptGroups: unknown[] = [];

  for (const group of groups) {
    if (typeof group !== "object" || group === null || Array.isArray(group)) {
      keptGroups.push(group);
      continue;
    }

    const groupObject = group as JsonObject;
    let groupChanged = false;
    if (entryHasCommandMarker(groupObject, commandMarker)) {
      delete groupObject.command;
      changed = true;
      groupChanged = true;
    }

    const entries = groupObject.hooks;
    if (!Array.isArray(entries)) {
      if (!groupChanged || hasMeaningfulSharedGroupData(groupObject)) keptGroups.push(groupObject);
      continue;
    }

    const supportedMatcher = groupObject.matcher === SHARED_SESSION_START_MATCHER;
    const keptEntries = entries.filter((entry) => {
      if (!entryHasCommandMarker(entry, commandMarker)) return true;
      const valid = supportedMatcher && isExecutableCommandEntry(entry, expectedCommand);
      if (!valid) changed = true;
      return valid;
    });

    if (keptEntries.length !== entries.length) {
      groupObject.hooks = keptEntries;
      groupChanged = true;
    }
    if (!groupChanged || hasMeaningfulSharedGroupData(groupObject)) {
      keptGroups.push(groupObject);
    } else if (entries.length > 0) {
      changed = true;
    }
  }

  if (!changed) return false;
  if (keptGroups.length === 0) delete hooks.SessionStart;
  else hooks.SessionStart = keptGroups;
  return true;
}

function hasMeaningfulSharedGroupData(group: JsonObject): boolean {
  if (Array.isArray(group.hooks) && group.hooks.length > 0) return true;
  return Object.keys(group).some((key) => key !== "matcher" && key !== "hooks" && key !== "command");
}

function removeSharedSchemaHooks(content: JsonObject): boolean {
  const hooks = content.hooks;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return false;

  const hookMap = hooks as JsonObject;
  let changed = false;

  for (const event of Object.keys(hookMap)) {
    changed = removeBenjaminEntriesFromEvent(hookMap, event, "session-", undefined, true) || changed;
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
  const expectedStartCommand = sessionStartCommand("cursor");
  changed = removeBenjaminEntriesFromEvent(hooks, "stop", "session-stop") || changed;
  changed = removeBenjaminEntriesFromEvent(hooks, "sessionStart", "session-start", expectedStartCommand) || changed;
  changed = addCursorEntry(hooks, "sessionStart", { command: expectedStartCommand }) || changed;

  return changed;
}

function removeBenjaminEntriesFromEvent(
  hooks: JsonObject,
  event: string,
  commandName: string,
  keepCommand?: string,
  preserveMixedSharedGroup = false,
): boolean {
  const groups = hooks[event];
  if (!Array.isArray(groups)) return false;

  const commandMarker = `benjamin-docs ${commandName}`;
  let changed = false;
  const keptGroups: unknown[] = [];

  for (const group of groups) {
    if (
      !preserveMixedSharedGroup
      && entryHasCommandMarker(group, commandMarker)
      && entryCommand(group) !== keepCommand
    ) {
      changed = true;
      continue;
    }

    if (typeof group !== "object" || group === null || Array.isArray(group)) {
      keptGroups.push(group);
      continue;
    }

    const groupObject = group as JsonObject;
    let groupChanged = false;
    if (
      preserveMixedSharedGroup
      && entryHasCommandMarker(groupObject, commandMarker)
      && entryCommand(groupObject) !== keepCommand
    ) {
      delete groupObject.command;
      changed = true;
      groupChanged = true;
    }

    const entries = groupObject.hooks;
    if (!Array.isArray(entries)) {
      if (!groupChanged || hasMeaningfulSharedGroupData(groupObject)) keptGroups.push(groupObject);
      continue;
    }

    const keptEntries = entries.filter((entry) => !entryHasCommandMarker(entry, commandMarker) || entryCommand(entry) === keepCommand);
    if (keptEntries.length === entries.length) {
      if (!groupChanged || hasMeaningfulSharedGroupData(groupObject)) keptGroups.push(groupObject);
      continue;
    }

    changed = true;
    groupChanged = true;
    if (keptEntries.length > 0) {
      groupObject.hooks = keptEntries;
    } else {
      delete groupObject.hooks;
    }
    if (hasMeaningfulSharedGroupData(groupObject)) keptGroups.push(groupObject);
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
  return typeof command === "string" && commandStartsWithMarker(command, marker);
}

function commandStartsWithMarker(command: string, marker: string): boolean {
  if (marker === HOOK_COMMAND_MARKER) return isBenjaminSessionCommand(command);
  return command === marker || (command.startsWith(marker) && /\s/.test(command.charAt(marker.length)));
}

function isBenjaminSessionCommand(command: string): boolean {
  return /^benjamin-docs session-(?:start|stop)(?:\s|$)/.test(command);
}

function entryCommand(entry: unknown): string | undefined {
  if (typeof entry !== "object" || entry === null) return undefined;
  const command = (entry as JsonObject).command;
  return typeof command === "string" ? command : undefined;
}

function inspectHookHealth(content: JsonObject, targetId: HookTargetId): { expectedStart: boolean; legacyStop: boolean } {
  const hooks = content.hooks;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) {
    return { expectedStart: false, legacyStop: false };
  }

  const hookMap = hooks as JsonObject;
  const format = targetId === "codex" ? "codex" : targetId === "cursor" ? "cursor" : "claude";
  const startEvent = targetId === "cursor" ? "sessionStart" : "SessionStart";
  const stopEvent = targetId === "cursor" ? "stop" : "Stop";
  const expectedCommand = sessionStartCommand(format);

  return {
    expectedStart: targetId === "cursor"
      ? eventContainsCommand(hookMap[startEvent], (command) => command === expectedCommand)
      : Array.isArray(hookMap[startEvent])
        && hookMap[startEvent].some((group) => isValidSharedSessionStartGroup(group, expectedCommand))
        && !hookMap[startEvent].some((group) => hasInvalidSharedSessionStartEntry(group, expectedCommand)),
    legacyStop: eventContainsCommand(hookMap[stopEvent], (command) => commandStartsWithMarker(command, "benjamin-docs session-stop")),
  };
}

function eventContainsCommand(value: unknown, predicate: (command: string) => boolean): boolean {
  if (Array.isArray(value)) return value.some((entry) => eventContainsCommand(entry, predicate));
  if (typeof value !== "object" || value === null) return false;
  const object = value as JsonObject;
  return (typeof object.command === "string" && predicate(object.command))
    || Object.values(object).some((entry) => eventContainsCommand(entry, predicate));
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
