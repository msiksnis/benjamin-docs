import { existsSync } from "node:fs";
import { CONFIG_DIR } from "./constants.js";
import { detectDrift } from "./drift.js";
import { getChangedFiles, isReviewableSourceChange } from "./git.js";
import { rootPath } from "./fsx.js";
import { getPackageVersion } from "./info.js";
import { readConfig } from "./project-config.js";
import { compareVersions, getCachedUpdateInfo, spawnBackgroundUpdateRefresh } from "./update-check.js";
import type { BenjaminDocsConfig } from "./types.js";

export type SessionHookFormat = "claude" | "codex" | "cursor";

const DRIFT_LINE_LIMIT = 3;

export function getSessionStartContext(root: string, commandPath?: string): string {
  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) return "";

  let config: BenjaminDocsConfig;
  try {
    config = readConfig(root);
  } catch {
    return "";
  }
  const docsRoot = config.docsRoot;

  const lines = [`Benjamin Docs project memory is active in this repo (${docsRoot}/).`];

  const readFirst = [`${docsRoot}/handoff/agent-brief.md`, `${docsRoot}/views/agent-continuation.md`].filter((doc) => {
    try {
      return existsSync(rootPath(root, doc));
    } catch {
      return false;
    }
  });
  if (readFirst.length > 0) {
    lines.push(`Read first: ${readFirst.join(", ")}`);
  }

  const drift = detectDrift(root);
  if (drift.gitAvailable && drift.drifted.length > 0) {
    const top = drift.drifted.slice(0, DRIFT_LINE_LIMIT).map((entry) => entry.doc);
    const more = drift.drifted.length - top.length;
    lines.push(
      `Drift: ${drift.drifted.length} ${drift.drifted.length === 1 ? "doc is" : "docs are"} behind watched code changes: ${top.join(", ")}${more > 0 ? ` (+${more} more)` : ""}. Re-verify and update them while you work. Details: benjamin-docs drift`,
    );
  }

  const currentVersion = getPackageVersion();
  if (!config.bdVersion || compareVersions(currentVersion, config.bdVersion) > 0) {
    lines.push(
      `This repo's Benjamin Docs setup was last upgraded ${config.bdVersion ? `at ${config.bdVersion}` : "before 0.10.0"}; the CLI is ${currentVersion}. Run: benjamin-docs upgrade`,
    );
  }

  const update = getCachedUpdateInfo();
  if (update?.updateAvailable) {
    lines.push(
      `benjamin-docs ${update.latest} is available (installed ${update.installed}). Suggest to the user: pnpm update -g benjamin-docs, then benjamin-docs upgrade.`,
    );
  }

  lines.push("Keep project memory updated as durable facts change. Before handoff run: benjamin-docs ready");

  spawnBackgroundUpdateRefresh(commandPath, Date.now());

  return lines.join("\n");
}

export function formatSessionStart(root: string, format?: SessionHookFormat, commandPath?: string): string {
  const context = getSessionStartContext(root, commandPath);
  if (!context) return "";
  if (format === "codex") {
    return JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } });
  }
  if (format === "cursor") {
    return JSON.stringify({ additional_context: context });
  }
  return context;
}

export function getSessionStopNudge(root: string): string {
  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) return "";

  let docsRoot: string;
  try {
    docsRoot = readConfig(root).docsRoot;
  } catch {
    return "";
  }

  const changed = getChangedFiles(root, "HEAD");
  if (!changed.ok) return "";

  const sourceChanges = changed.files.filter((file) => isReviewableSourceChange(file, docsRoot) && !isAgentConfigPath(file));
  const memoryChanges = changed.files.filter((file) => file.startsWith(`${docsRoot}/`) && file.endsWith(".md"));
  if (sourceChanges.length === 0 || memoryChanges.length > 0) return "";

  return `Source files changed (${sourceChanges.length}), but no Benjamin Docs project memory was updated. If durable facts changed, update the affected docs under ${docsRoot}/ (see: benjamin-docs review --changed). If no memory update is needed, state why briefly and finish.`;
}

export function formatSessionStop(root: string, format: SessionHookFormat | undefined, stopHookActive: boolean): string {
  if (stopHookActive) return "";

  const nudge = getSessionStopNudge(root);
  if (!nudge) return "";

  if (format === "cursor") {
    return JSON.stringify({ followup_message: nudge });
  }

  return JSON.stringify({ decision: "block", reason: nudge });
}

function isAgentConfigPath(file: string): boolean {
  return file.startsWith(".claude/") || file.startsWith(".codex/") || file.startsWith(".cursor/") || file === "AGENTS.md";
}

export function parseStopHookActive(stdinJson: string): boolean {
  if (!stdinJson.trim()) return false;

  try {
    const parsed: unknown = JSON.parse(stdinJson);
    if (typeof parsed !== "object" || parsed === null) return false;
    return (parsed as Record<string, unknown>).stop_hook_active === true;
  } catch {
    return false;
  }
}
