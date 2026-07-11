import { existsSync } from "node:fs";
import { hasAgentContractMarkers, installAgentContracts } from "./agent-contracts.js";
import { CONFIG_DIR, CONFIG_FILE } from "./constants.js";
import { rootPath, writeGeneratedJson } from "./fsx.js";
import { checkHooks, installHooks } from "./hooks.js";
import { checkMcp } from "./mcp-install.js";
import { getPackageVersion } from "./info.js";
import { installSkill } from "./install-skill.js";
import { readConfig } from "./project-config.js";
import type { BenjaminDocsConfig } from "./types.js";
import { compareVersions, refreshUpdateCache, updateChecksEnabled } from "./update-check.js";
import { generateMemoryViews, renderMemoryViews } from "./views.js";

const METADATA_LABEL = "Metadata path";

export interface UpgradeOptions {
  hooks?: boolean;
}

export interface UpgradeResult {
  ok: boolean;
  output: string;
}

export async function runUpgrade(root: string, options: UpgradeOptions = {}): Promise<UpgradeResult> {
  if (!existsSync(rootPath(root, CONFIG_DIR, CONFIG_FILE))) {
    return {
      ok: false,
      output: ["benjamin-docs upgrade", "", "benjamin-docs is not initialized here. Run: benjamin-docs init"].join("\n"),
    };
  }

  const currentVersion = getPackageVersion();
  const lines = ["benjamin-docs upgrade", ""];
  const config = readConfig(root);
  const previousVersion = config.bdVersion;

  stampConfigVersion(root, config, currentVersion);
  lines.push(
    previousVersion === currentVersion
      ? `Project metadata already records CLI ${currentVersion}.`
      : `Project metadata: ${previousVersion ?? "recorded before 0.10.0"} -> ${currentVersion}.`,
  );

  lines.push(refreshAgentGuidance(root));
  lines.push(refreshSkills());
  lines.push(...refreshViews(root));
  lines.push(...resolveHooks(root, options.hooks));
  lines.push(reportMcpRegistration(root));
  lines.push(...(await reportUpdateAvailability(currentVersion)));

  lines.push("");
  lines.push("Next");
  lines.push("  benjamin-docs drift    see docs whose watched code moved on");
  lines.push("  benjamin-docs ready    run the repository readiness dimensions");

  return { ok: true, output: lines.join("\n") };
}

function stampConfigVersion(root: string, config: BenjaminDocsConfig, currentVersion: string): void {
  if (config.bdVersion === currentVersion) return;
  writeGeneratedJson(root, `${CONFIG_DIR}/${CONFIG_FILE}`, { ...config, bdVersion: currentVersion }, METADATA_LABEL);
}

function refreshAgentGuidance(root: string): string {
  if (!hasAgentContractMarkers(root)) {
    return "Agent guidance: no Benjamin-owned AGENTS.md section found; leaving AGENTS.md alone. Install with: benjamin-docs init";
  }

  const result = installAgentContracts(root, {});
  return result.written.length > 0
    ? "Agent guidance: refreshed the Benjamin-owned AGENTS.md section."
    : "Agent guidance: AGENTS.md already up to date.";
}

function refreshSkills(): string {
  const result = installSkill({});
  const refreshed = result.targets.filter((target) => target.status === "installed" || target.status === "updated").length;
  return refreshed > 0 ? `Skills: refreshed ${refreshed} local skill ${refreshed === 1 ? "install" : "installs"}.` : "Skills: local skill installs already current.";
}

function refreshViews(root: string): string[] {
  let anyViewExists = false;
  try {
    anyViewExists = renderMemoryViews(root).some((view) => {
      try {
        return existsSync(rootPath(root, view.relativePath));
      } catch {
        return false;
      }
    });
  } catch {
    return ["Views: skipped (project metadata could not be read for views)."];
  }

  if (!anyViewExists) return ["Views: none generated yet; run benjamin-docs views when source docs are captured."];

  const written = generateMemoryViews(root);
  return [written.length > 0 ? `Views: regenerated ${written.length} Memory Views.` : "Views: already current."];
}

function resolveHooks(root: string, hooksOption: boolean | undefined): string[] {
  const status = checkHooks(root);
  const installed = status.targets.filter((target) => target.status === "installed");
  if (installed.length > 0) {
    const refreshed = installHooks(root, installed.map((target) => target.id));
    const changed = refreshed.targets.filter((target) => target.status === "installed").length;
    return [
      changed > 0
        ? `Hooks: refreshed ${changed} agent session hook ${changed === 1 ? "target" : "targets"}.`
        : `Hooks: installed for ${installed.map((target) => target.label).join(", ")}.`,
    ];
  }

  if (hooksOption === true) {
    const result = installHooks(root);
    const changed = result.targets.filter((target) => target.status === "installed").length;
    return [
      `Hooks: installed for ${changed} agent ${changed === 1 ? "target" : "targets"} (Claude Code, Codex, Cursor).`,
      "  Codex: enable hooks with features.hooks = true in ~/.codex/config.toml, then trust them via /hooks in Codex.",
    ];
  }

  if (hooksOption === false) {
    return ["Hooks: skipped (--no-hooks)."];
  }

  return [
    "Hooks: not installed. Optional session-start context: benjamin-docs hooks install",
    "  Hooks supply a compact pointer/context packet; agents still read and maintain memory during normal work.",
  ];
}

function reportMcpRegistration(root: string): string {
  const registered = checkMcp(root).targets.filter((target) => target.status === "registered");
  if (registered.length > 0) {
    return `MCP: memory server registered for ${registered.map((target) => target.label).join(", ")}.`;
  }

  return "MCP: memory server not registered. Agents get memory tools once you run: benjamin-docs mcp install";
}

async function reportUpdateAvailability(currentVersion: string): Promise<string[]> {
  if (!updateChecksEnabled()) return [];

  const info = await refreshUpdateCache(new Date().toISOString());
  if (!info) return ["Update check: could not reach the npm registry (skipped)."];

  if (compareVersions(info.latest, currentVersion) > 0) {
    return [
      `Update available: benjamin-docs ${info.latest} (installed ${currentVersion}).`,
      "  Update with: pnpm update -g benjamin-docs   (or npm update -g benjamin-docs), then rerun: benjamin-docs upgrade",
    ];
  }

  return [`Update check: no newer version than ${currentVersion} is published on npm.`];
}
