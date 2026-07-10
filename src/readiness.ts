import { checkAgentContracts } from "./agent-contracts.js";
import { detectDrift, summarizeDrift, type DriftResult } from "./drift.js";
import { findEnvironmentBlockers } from "./environment.js";
import { readConfig } from "./project-config.js";
import { reviewProject, type ReviewIssue } from "./review.js";
import { validateProject } from "./validate.js";

export type ReadinessDimensionId =
  | "structure"
  | "content_heuristics"
  | "committed_freshness"
  | "working_tree_impact"
  | "agent_guidance";

export interface ReadinessDimension {
  id: ReadinessDimensionId;
  status: "pass" | "fail" | "unavailable" | "not_configured";
  blocking: boolean;
  summary: string;
  evidence: string[];
  repair?: string;
}

export interface ReadinessReport {
  schemaVersion: 1;
  status: "ready" | "not_ready";
  dimensions: ReadinessDimension[];
  recordedEnvironmentBlockers: Array<{ path: string; message: string }>;
}

export interface AnalyzeReadinessOptions {
  cwd?: string;
}

export function analyzeReadiness(options: AnalyzeReadinessOptions = {}): ReadinessReport {
  const cwd = options.cwd ?? process.cwd();
  const validation = validateProject(cwd);
  const review = reviewProject(cwd, { changed: true, since: "HEAD", validation });
  const drift = safeDetectDrift(cwd);
  const agentGuidance = checkAgentContracts(cwd);
  const planningMode = readMode(cwd) === "planning";
  const baselineWarnings = review.warnings.slice(0, review.warnings.length - review.changedWarnings.length);

  const structureIssues = [
    ...validation.errors.map((message) => `error: ${message}`),
    ...validation.warnings.map((message) => `warning: ${message}`),
  ];
  const contentIssues = [
    ...review.errors.map((issue) => `error: ${formatReviewIssue(issue)}`),
    ...baselineWarnings.map((issue) => `warning: ${formatReviewIssue(issue)}`),
  ];

  const dimensions: ReadinessDimension[] = [
    dimensionFromIssues(
      "structure",
      structureIssues,
      "Repository memory structure passes validation.",
      "Repository memory structure has validation findings.",
      "benjamin-docs validate",
    ),
    dimensionFromIssues(
      "content_heuristics",
      contentIssues,
      `${review.docsChecked} managed docs pass deterministic content heuristics.`,
      "Managed docs have deterministic content-quality findings.",
      "benjamin-docs review",
    ),
    committedFreshnessDimension(drift, planningMode),
    workingTreeDimension(review.changedWarnings, drift.gitAvailable, planningMode),
    agentGuidanceDimension(agentGuidance),
  ];

  const ready = dimensions.every((dimension) => !dimension.blocking || dimension.status === "pass");
  return {
    schemaVersion: 1,
    status: ready ? "ready" : "not_ready",
    dimensions,
    recordedEnvironmentBlockers: findEnvironmentBlockers(cwd),
  };
}

function dimensionFromIssues(
  id: "structure" | "content_heuristics",
  evidence: string[],
  passingSummary: string,
  failingSummary: string,
  repair: string,
): ReadinessDimension {
  return evidence.length === 0
    ? { id, status: "pass", blocking: true, summary: passingSummary, evidence }
    : { id, status: "fail", blocking: true, summary: failingSummary, evidence, repair };
}

function committedFreshnessDimension(drift: DriftResult, planningMode: boolean): ReadinessDimension {
  if (!drift.gitAvailable) {
    return {
      id: "committed_freshness",
      status: "unavailable",
      blocking: !planningMode,
      summary: planningMode
        ? "Committed freshness is unavailable without Git history; planning mode remains usable."
        : "Committed freshness cannot be established without Git history.",
      evidence: ["Git history is unavailable."],
      ...(!planningMode && { repair: "git init, commit the repository baseline, then run: benjamin-docs ready" }),
    };
  }

  if (drift.drifted.length > 0) {
    return {
      id: "committed_freshness",
      status: "fail",
      blocking: true,
      summary: `${drift.drifted.length} managed ${drift.drifted.length === 1 ? "doc is" : "docs are"} behind committed watched source.`,
      evidence: drift.drifted.map((entry) => `${entry.doc}: ${summarizeDrift(entry)}; files: ${entry.changedFiles.join(", ")}`),
      repair: "benjamin-docs drift",
    };
  }

  return {
    id: "committed_freshness",
    status: "pass",
    blocking: true,
    summary: "Managed docs are current with committed watched source.",
    evidence: [],
  };
}

function workingTreeDimension(changedWarnings: ReviewIssue[], gitAvailable: boolean, planningMode: boolean): ReadinessDimension {
  if (!gitAvailable) {
    return {
      id: "working_tree_impact",
      status: "unavailable",
      blocking: !planningMode,
      summary: planningMode
        ? "Working-tree impact is unavailable without Git; planning mode remains usable."
        : "Working-tree impact cannot be established without Git.",
      evidence: ["Git working-tree change accounting is unavailable."],
      ...(!planningMode && { repair: "git init, commit the repository baseline, then run: benjamin-docs ready" }),
    };
  }

  const evidence = changedWarnings.map((issue) => `warning: ${formatReviewIssue(issue)}`);
  return evidence.length === 0
    ? {
        id: "working_tree_impact",
        status: "pass",
        blocking: true,
        summary: "Current working-tree changes have no unresolved memory-impact findings.",
        evidence,
      }
    : {
        id: "working_tree_impact",
        status: "fail",
        blocking: true,
        summary: "Current working-tree changes have unresolved memory-impact findings.",
        evidence,
        repair: "benjamin-docs review --changed --since HEAD",
      };
}

function agentGuidanceDimension(result: ReturnType<typeof checkAgentContracts>): ReadinessDimension {
  const evidence = [
    ...result.errors.map((message) => `error: ${message}`),
    ...result.warnings.map((message) => `warning: ${message}`),
  ];

  if (!result.enabled) {
    return {
      id: "agent_guidance",
      status: "not_configured",
      blocking: false,
      summary: result.summary,
      evidence,
    };
  }

  if (!result.ok) {
    return {
      id: "agent_guidance",
      status: "fail",
      blocking: true,
      summary: result.summary,
      evidence,
      repair: "benjamin-docs upgrade",
    };
  }

  return {
    id: "agent_guidance",
    status: "pass",
    blocking: true,
    summary: result.summary,
    evidence,
  };
}

function safeDetectDrift(cwd: string): DriftResult {
  try {
    return detectDrift(cwd);
  } catch {
    return { ok: false, gitAvailable: false, initialized: false, docsChecked: 0, drifted: [], skipped: [] };
  }
}

function readMode(cwd: string): "planning" | "codebase" | "feature" | undefined {
  try {
    return readConfig(cwd).mode;
  } catch {
    return undefined;
  }
}

function formatReviewIssue(issue: ReviewIssue): string {
  return issue.path ? `${issue.path}: ${issue.message}` : issue.message;
}
