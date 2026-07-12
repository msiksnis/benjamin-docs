import { existsSync } from "node:fs";
import { CONFIG_DIR } from "./constants.js";
import { CONTEXT_BUDGETS, truncateAtBoundary } from "./context-budget.js";
import { getChangedFiles, isReviewableSourceChange } from "./git.js";
import { rootPath } from "./fsx.js";
import { getPackageVersion } from "./info.js";
import { assertSafeDocsRoot, readConfig } from "./project-config.js";
import {
  SESSION_START_CLOSEOUT,
  SESSION_START_DOCS_ROOT_PREFIX,
  SESSION_START_HEADER,
  SESSION_START_OVERFLOW_SUFFIX,
  SESSION_START_READ_FIRST_DOCS,
  SESSION_START_READ_FIRST_PREFIX,
} from "./session-context.js";
import { compareVersions, getCachedUpdateInfo, spawnBackgroundUpdateRefresh } from "./update-check.js";
import type { BenjaminDocsConfig } from "./types.js";
import { beginSessionTracking, evaluateSessionStop, type SessionHookInput } from "./session-state.js";

export type SessionHookFormat = "claude" | "codex" | "cursor";

export function getSessionStartContext(root: string, commandPath?: string): string {
  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) return "";

  let config: BenjaminDocsConfig;
  try {
    config = readConfig(root);
    assertSafeDocsRoot(config.docsRoot);
  } catch {
    return "";
  }
  const docsRoot = config.docsRoot;

  const requiredLines = [SESSION_START_HEADER, `${SESSION_START_DOCS_ROOT_PREFIX}${docsRoot}/`];

  const readFirst = SESSION_START_READ_FIRST_DOCS.filter((doc) => {
    try {
      return existsSync(rootPath(root, docsRoot, doc));
    } catch {
      return false;
    }
  });
  if (readFirst.length > 0) {
    requiredLines.push(`${SESSION_START_READ_FIRST_PREFIX}${readFirst.join(", ")}`);
  }

  const optionalLines: string[] = [];
  const currentVersion = getPackageVersion();
  if (!config.bdVersion || compareVersions(currentVersion, config.bdVersion) > 0) {
    optionalLines.push(
      `This repo's Benjamin Docs setup was last upgraded ${config.bdVersion ? `at ${config.bdVersion}` : "before 0.10.0"}; the CLI is ${currentVersion}. Run: benjamin-docs upgrade`,
    );
  }

  const update = getCachedUpdateInfo();
  if (update?.updateAvailable) {
    optionalLines.push(
      `benjamin-docs ${update.latest} is available (installed ${update.installed}). Suggest to the user: pnpm update -g benjamin-docs, then benjamin-docs upgrade.`,
    );
  }

  spawnBackgroundUpdateRefresh(commandPath, Date.now());

  const fullContext = [...requiredLines, ...optionalLines, SESSION_START_CLOSEOUT].join("\n");
  if (fullContext.length <= CONTEXT_BUDGETS.sessionStartCharacters) return fullContext;

  const preservedContext = [...requiredLines, SESSION_START_CLOSEOUT].join("\n");
  if (optionalLines.length === 0) return preservedContext;

  const optionalBudget = CONTEXT_BUDGETS.sessionStartCharacters - preservedContext.length - 1;
  if (optionalBudget < SESSION_START_OVERFLOW_SUFFIX.length) return "";

  const boundedOptionalContext = truncateAtBoundary(optionalLines.join("\n"), optionalBudget, SESSION_START_OVERFLOW_SUFFIX);
  return `${preservedContext}\n${boundedOptionalContext}`;
}

export function formatSessionStart(
  root: string,
  format?: SessionHookFormat,
  commandPath?: string,
  hookInput: SessionHookInput = emptySessionHookInput(),
): string {
  const context = getSessionStartContext(root, commandPath);
  if (!context) return "";
  try {
    beginSessionTracking(root, readConfig(root).docsRoot, format, hookInput);
  } catch {
    // Context injection must still work when optional session tracking cannot start.
  }
  if (format === "codex") {
    return JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } });
  }
  if (format === "cursor") {
    return JSON.stringify({ additional_context: context });
  }
  return context;
}

export function getSessionStopNudge(
  root: string,
  format?: SessionHookFormat,
  hookInput: SessionHookInput = emptySessionHookInput(),
): string {
  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) return "";

  let docsRoot: string;
  try {
    docsRoot = readConfig(root).docsRoot;
  } catch {
    return "";
  }

  const tracked = evaluateSessionStop(root, docsRoot, format, hookInput);
  if (tracked.tracked) {
    if (tracked.sourceChanges.length === 0) return "";
    return sessionStopNudge(tracked.sourceChanges.length, docsRoot);
  }

  const changed = getChangedFiles(root, "HEAD");
  if (!changed.ok) return "";

  const sourceChanges = changed.files.filter((file) => isReviewableSourceChange(file, docsRoot) && !isAgentConfigPath(file));
  const memoryChanges = changed.files.filter((file) => file.startsWith(`${docsRoot}/`) && file.endsWith(".md"));
  if (sourceChanges.length === 0 || memoryChanges.length > 0) return "";

  return sessionStopNudge(sourceChanges.length, docsRoot);
}

export function formatSessionStop(
  _root: string,
  _format: SessionHookFormat | undefined,
  _hookInput: SessionHookInput | boolean,
): string {
  return "";
}

function isAgentConfigPath(file: string): boolean {
  return file.startsWith(".claude/") || file.startsWith(".codex/") || file.startsWith(".cursor/") || file === "AGENTS.md";
}

export function parseSessionHookInput(stdinJson: string): SessionHookInput {
  const provided = stdinJson.trim().length > 0;
  if (!provided) return emptySessionHookInput();

  try {
    const parsed: unknown = JSON.parse(stdinJson);
    if (typeof parsed !== "object" || parsed === null) return { ...emptySessionHookInput(), provided: true };
    const record = parsed as Record<string, unknown>;
    return {
      provided: true,
      sessionId: firstString(record.session_id, record.sessionId, record.conversation_id, record.conversationId),
      turnId: firstString(record.turn_id, record.turnId),
      stopHookActive: record.stop_hook_active === true,
      lastAssistantMessage: firstString(record.last_assistant_message, record.lastAssistantMessage),
    };
  } catch {
    return { ...emptySessionHookInput(), provided: true };
  }
}

export function parseStopHookActive(stdinJson: string): boolean {
  return parseSessionHookInput(stdinJson).stopHookActive;
}

function sessionStopNudge(sourceChangeCount: number, docsRoot: string): string {
  return `Source files changed (${sourceChangeCount}), but no Benjamin Docs project memory was updated. Review whether the new source changes created durable facts. If they did, update the affected docs under ${docsRoot}/ (see: benjamin-docs review --changed). If they did not, do not edit memory only to satisfy this hook. Then provide a complete answer to the user's original request, preserving the substance of the answer you already drafted. Never respond only with Benjamin Docs or hook-status commentary.`;
}

function emptySessionHookInput(): SessionHookInput {
  return { provided: false, stopHookActive: false };
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}
