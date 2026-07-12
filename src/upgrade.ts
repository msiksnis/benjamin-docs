import { existsSync, readFileSync } from "node:fs";
import { hasAgentContractMarkers, installAgentContracts } from "./agent-contracts.js";
import { CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { rootPath, writeGeneratedJson, writeGeneratedTextIfMissing } from "./fsx.js";
import { installHooks } from "./hooks.js";
import { checkMcp } from "./mcp-install.js";
import { getPackageVersion } from "./info.js";
import { installSkill } from "./install-skill.js";
import { readConfig } from "./project-config.js";
import type { BenjaminDocsConfig, ManifestFile, ScopesFile, WatchRule } from "./types.js";
import { compareVersions, refreshUpdateCache, updateChecksEnabled } from "./update-check.js";
import { generateMemoryViews, renderMemoryViews } from "./views.js";
import { workspaceDocs } from "./templates.js";
import { defaultWatchRules } from "./watch.js";

const METADATA_LABEL = "Metadata path";

export interface UpgradeOptions {
  hooks?: boolean;
  dryRun?: boolean;
}

export interface UpgradeResult {
  ok: boolean;
  output: string;
}

interface UpgradeStepResult {
  ok: boolean;
  lines: string[];
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
  let config = readConfig(root);
  const previousVersion = config.bdVersion;
  const stepLines: string[] = [];

  if (options.dryRun) {
    lines.push(...previewLightweightMigration(root, config));
    lines.push("Dry run: no files, skills, views, or hooks were changed.");
    return { ok: true, output: lines.join("\n") };
  }

  stepLines.push(...migrateLightweightDefaults(root, config));
  config = readConfig(root);
  stepLines.push(refreshAgentGuidance(root));
  stepLines.push(refreshSkills());
  stepLines.push(...refreshViews(root));
  const hookStep = resolveHooks(root, options.hooks);
  stepLines.push(...hookStep.lines);

  if (hookStep.ok) stampConfigVersion(root, config, currentVersion);
  lines.push(
    hookStep.ok
      ? previousVersion === currentVersion
        ? `Project metadata already records CLI ${currentVersion}.`
        : `Project metadata: ${previousVersion ?? "recorded before 0.10.0"} -> ${currentVersion}.`
      : `Project metadata: unchanged at ${previousVersion ?? "a pre-0.10.0 setup"} because required hook migration failed.`,
  );
  lines.push(...stepLines);
  lines.push(reportMcpRegistration(root));
  lines.push(...(await reportUpdateAvailability(currentVersion)));

  lines.push("");
  lines.push("Next");
  lines.push("  benjamin-docs drift    see docs whose watched code moved on");
  lines.push("  benjamin-docs ready    run the repository readiness dimensions");

  return { ok: hookStep.ok, output: lines.join("\n") };
}

function previewLightweightMigration(root: string, config: BenjaminDocsConfig): string[] {
  const lines = ["Lightweight migration report:"];
  const contextPath = `${config.docsRoot}/project/agent-context.md`;
  lines.push(existsSync(rootPath(root, contextPath)) ? `  Routing context: current (${contextPath}).` : `  Routing context: would add ${contextPath}.`);
  const legacy = (config.watch ?? []).filter(isLegacyDefaultRule);
  const archived = archivedFeatureRuleLabels(root);
  lines.push(legacy.length > 0 ? `  Watch rules: would narrow ${legacy.length} legacy default ${legacy.length === 1 ? "rule" : "rules"}; custom rules stay unchanged.` : "  Watch rules: no legacy default rules detected.");
  if (archived.length > 0) lines.push(`  Archived scopes: would remove ${archived.length} stale feature watch ${archived.length === 1 ? "rule" : "rules"}.`);
  lines.push(hasAgentContractMarkers(root) ? "  Agent guidance: would replace the Benjamin-owned section with task-scoped guidance." : "  Agent guidance: no Benjamin-owned section to change.");
  return lines;
}

function migrateLightweightDefaults(root: string, config: BenjaminDocsConfig): string[] {
  const lines: string[] = [];
  const context = workspaceDocs(config.docsRoot).find((doc) => doc.path.endsWith("/project/agent-context.md"));
  if (context && writeGeneratedTextIfMissing(root, context.path, context.content, "Project memory path")) {
    lines.push(`Routing context: added ${context.path}.`);
    const manifestPath = `${CONFIG_DIR}/${MANIFEST_FILE}`;
    if (existsSync(rootPath(root, manifestPath))) {
      const manifest = JSON.parse(readFileSync(rootPath(root, manifestPath), "utf8")) as ManifestFile;
      if (!manifest.docs.includes(context.path)) {
        manifest.docs.push(context.path);
        writeGeneratedJson(root, manifestPath, manifest, "Metadata path");
      }
    }
  }

  if (config.watch) {
    const defaults = new Map(defaultWatchRules(config.docsRoot).map((rule) => [rule.label, rule]));
    const archived = new Set(archivedFeatureRuleLabels(root));
    const migrated = config.watch
      .map((rule) => (isLegacyDefaultRule(rule) ? (defaults.get(rule.label) ?? rule) : rule))
      .map((rule) => ({ ...rule, docs: rule.docs.filter((doc) => !isArchivedScopeDoc(doc, archived)) }))
      .filter((rule) => !archived.has(rule.label ?? "") && rule.docs.length > 0);
    const count = config.watch.filter(isLegacyDefaultRule).length;
    const removedArchivedRules = config.watch.length - migrated.length;
    const removedArchivedDocs = config.watch.reduce((total, rule) => total + rule.docs.length, 0) - migrated.reduce((total, rule) => total + rule.docs.length, 0);
    if (count > 0 || removedArchivedDocs > 0) {
      writeGeneratedJson(root, `${CONFIG_DIR}/${CONFIG_FILE}`, { ...config, watch: migrated }, METADATA_LABEL);
      if (count > 0) lines.push(`Watch rules: narrowed ${count} legacy default ${count === 1 ? "rule" : "rules"}; custom rules preserved.`);
      if (removedArchivedDocs > 0) lines.push(`Archived scopes: removed ${removedArchivedDocs} stale watched ${removedArchivedDocs === 1 ? "document" : "documents"}${removedArchivedRules > 0 ? ` and ${removedArchivedRules} empty feature ${removedArchivedRules === 1 ? "rule" : "rules"}` : ""}.`);
    }
  }
  if (lines.length === 0) lines.push("Lightweight migration: already current or no default-derived files found.");
  return lines;
}

function isLegacyDefaultRule(rule: WatchRule): boolean {
  return ["database/schema", "application code", "tests", "configuration/workflow", "project memory/status"].includes(rule.label ?? "") && rule.docs.length > 2;
}

function archivedFeatureRuleLabels(root: string): string[] {
  const scopesPath = `${CONFIG_DIR}/${SCOPES_FILE}`;
  if (!existsSync(rootPath(root, scopesPath))) return [];
  try {
    const scopes = JSON.parse(readFileSync(rootPath(root, scopesPath), "utf8")) as ScopesFile;
    return scopes.scopes.filter((scope) => scope.kind === "feature" && scope.status === "archived").map((scope) => `feature/${scope.id}`);
  } catch {
    return [];
  }
}

function isArchivedScopeDoc(doc: string, archivedRuleLabels: Set<string>): boolean {
  for (const label of archivedRuleLabels) {
    const id = label.slice("feature/".length);
    if (doc.includes(`/features/${id}/`)) return true;
  }
  return false;
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

function resolveHooks(root: string, hooksOption: boolean | undefined): UpgradeStepResult {
  if (hooksOption === false) return { ok: true, lines: ["Hooks: skipped (--no-hooks)."] };

  const result = installHooks(root);
  const installed = result.targets.filter((target) => target.status === "installed");
  const repaired = result.targets.filter((target) => target.status === "repaired");
  const current = result.targets.filter((target) => target.status === "already installed");
  const skipped = result.targets.filter((target) => target.status === "skipped");
  const lines: string[] = [];

  if (installed.length > 0) lines.push(`Hooks: installed for ${installed.map((target) => target.label).join(", ")}.`);
  if (repaired.length > 0) lines.push(`Hooks: repaired for ${repaired.map((target) => target.label).join(", ")}.`);
  if (current.length > 0) lines.push(`Hooks: already current for ${current.map((target) => target.label).join(", ")}.`);
  for (const target of skipped) lines.push(`Hooks: failed for ${target.label}: ${target.note ?? target.path}.`);
  lines.push("  Codex: enable hooks with features.hooks = true in ~/.codex/config.toml, then trust them via /hooks in Codex.");

  return { ok: skipped.length === 0, lines };
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
