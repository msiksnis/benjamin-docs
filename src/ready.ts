import { getPackageVersion } from "./info.js";
import { readConfig } from "./project-config.js";
import { analyzeReadiness, type ReadinessDimension, type ReadinessReport } from "./readiness.js";
import { compareVersions } from "./update-check.js";

export interface ReadyResult {
  ok: boolean;
  output: string;
  report: ReadinessReport;
}

export interface ReadyOptions {
  cwd?: string;
  commandPath?: string;
  json?: boolean;
}

export function checkReady(options: ReadyOptions = {}): ReadyResult {
  const cwd = options.cwd ?? process.cwd();
  const report = analyzeReadiness({ cwd });
  return {
    ok: report.status === "ready",
    output: options.json ? JSON.stringify(report, null, 2) : formatReadiness(report, cwd),
    report,
  };
}

function formatReadiness(report: ReadinessReport, cwd: string): string {
  const lines = ["benjamin-docs ready", "", `status: ${report.status === "ready" ? "ready" : "not ready"}`, "", "Checks"];
  for (const dimension of report.dimensions) lines.push(formatDimensionCheck(dimension));

  for (const dimension of report.dimensions) {
    if (dimension.evidence.length === 0) continue;
    lines.push("");
    lines.push(dimensionTitle(dimension.id));
    for (const evidence of dimension.evidence) lines.push(`  - ${evidence}`);
    if (dimension.status !== "pass" && dimension.blocking && dimension.repair) lines.push(`  repair: ${dimension.repair}`);
  }

  const upgradeHint = getUpgradeHint(cwd);
  if (upgradeHint) {
    lines.push("");
    lines.push("Upgrade (advisory)");
    lines.push(`  ${upgradeHint}`);
  }

  if (report.recordedEnvironmentBlockers.length > 0) {
    lines.push("");
    lines.push("Recorded Environment / Tooling Blockers");
    for (const blocker of report.recordedEnvironmentBlockers) lines.push(`  - ${blocker.path}: ${blocker.message}`);
    lines.push("  These are local prerequisites recorded by project docs; they are not BD setup failures unless a check above failed.");
  }

  lines.push("");
  if (report.status === "ready") {
    lines.push("Repository memory passes the configured structural, heuristic, freshness, and guidance checks.");
    lines.push("These deterministic checks do not prove semantic truth; implementation verification remains an agent responsibility.");
  } else {
    lines.push("Fix each failed blocking dimension using its repair command, then run: benjamin-docs ready");
  }

  return lines.join("\n");
}

function formatDimensionCheck(dimension: ReadinessDimension): string {
  const result =
    dimension.status === "pass"
      ? "ok  "
      : dimension.status === "fail" || (dimension.status === "unavailable" && dimension.blocking)
        ? "fail"
        : "skip";
  return `  ${result}  ${dimensionLabel(dimension.id)} - ${dimension.summary}`;
}

function dimensionLabel(id: ReadinessDimension["id"]): string {
  if (id === "structure") return "validate";
  if (id === "content_heuristics") return "review";
  if (id === "committed_freshness") return "committed freshness";
  if (id === "working_tree_impact") return "working-tree impact";
  return "agent guidance";
}

function dimensionTitle(id: ReadinessDimension["id"]): string {
  return dimensionLabel(id)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getUpgradeHint(cwd: string): string | undefined {
  let recorded: string | undefined;
  try {
    recorded = readConfig(cwd).bdVersion;
  } catch {
    return undefined;
  }

  const currentVersion = getPackageVersion();
  if (recorded && compareVersions(currentVersion, recorded) <= 0) return undefined;
  return `This repo's Benjamin Docs setup was last upgraded ${recorded ? `at ${recorded}` : "before 0.10.0"}; the CLI is ${currentVersion}. Refresh Benjamin-owned surfaces with: benjamin-docs upgrade`;
}
