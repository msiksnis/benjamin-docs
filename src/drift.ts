import { existsSync, lstatSync, readFileSync } from "node:fs";
import { CONFIG_DIR } from "./constants.js";
import { parseMarkdown } from "./frontmatter.js";
import {
  getChangedFiles,
  getCommittedChanges,
  getUntrackedFiles,
  gitCommitCountTouching,
  gitLastCommit,
  gitLastCommits,
  isReviewableSourceChange,
  uniqueStrings,
  type ChangedFilesResult,
  type GitAnalysisFailure,
} from "./git.js";
import { rootPath } from "./fsx.js";
import { readConfig } from "./project-config.js";
import type { WatchRule } from "./types.js";
import { matchesAnyGlob, resolveWatchRules } from "./watch.js";

const SAMPLE_FILE_LIMIT = 5;

export interface DriftedDoc {
  doc: string;
  areas: string[];
  changedFiles: string[];
  commitsBehind?: number;
}

export interface SkippedDoc {
  doc: string;
  reason: string;
}

export interface DriftResult {
  ok: boolean;
  gitAvailable: boolean;
  initialized: boolean;
  docsChecked: number;
  drifted: DriftedDoc[];
  skipped: SkippedDoc[];
  analysisFailure?: GitAnalysisFailure;
}

export interface DriftOptions {
  strict?: boolean;
}

export interface DriftDependencies {
  getChangedFiles?: typeof getChangedFiles;
}

export function detectDrift(root: string, dependencies: DriftDependencies = {}): DriftResult {
  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) {
    return { ok: false, gitAvailable: false, initialized: false, docsChecked: 0, drifted: [], skipped: [] };
  }

  const config = readConfig(root);
  const docsRoot = config.docsRoot;
  const rules = resolveWatchRules(config);

  const workingChanges = (dependencies.getChangedFiles ?? getChangedFiles)(root, "HEAD");
  if (!workingChanges.ok) {
    if (workingChanges.unavailable) {
      return { ok: true, gitAvailable: false, initialized: true, docsChecked: 0, drifted: [], skipped: [] };
    }
    return {
      ok: false,
      gitAvailable: true,
      initialized: true,
      docsChecked: 0,
      drifted: [],
      skipped: [],
      ...(workingChanges.failure ? { analysisFailure: workingChanges.failure } : {}),
    };
  }

  const untracked = new Set(getUntrackedFiles(root).files);
  const rulesByDoc = groupRulesByDoc(rules);
  const drifted: DriftedDoc[] = [];
  const skipped: SkippedDoc[] = [];
  const candidates: Array<{ doc: string; docRules: WatchRule[] }> = [];
  let docsChecked = 0;

  for (const [doc, docRules] of rulesByDoc) {
    let fullPath;
    try {
      fullPath = rootPath(root, doc);
    } catch {
      skipped.push({ doc, reason: "watch rule references an unsafe doc path" });
      continue;
    }

    if (!existsSync(fullPath) || !lstatSync(fullPath).isFile()) {
      skipped.push({ doc, reason: "doc does not exist" });
      continue;
    }

    if (isInactiveDoc(fullPath)) continue;

    if (workingChanges.files.includes(doc)) {
      skipped.push({ doc, reason: "doc has uncommitted updates" });
      continue;
    }

    if (untracked.has(doc)) {
      skipped.push({ doc, reason: "doc is not committed yet" });
      continue;
    }

    candidates.push({ doc, docRules });
  }

  const batchedLastCommits = gitLastCommits(
    root,
    candidates.map((candidate) => candidate.doc),
  );
  const committedChangesByRef = new Map<string, ChangedFilesResult>();
  const commitCountsByQuery = new Map<string, number | undefined>();

  for (const { doc, docRules } of candidates) {
    const lastCommit = batchedLastCommits.ok ? batchedLastCommits.commits.get(doc) : gitLastCommit(root, doc);
    if (!lastCommit) {
      skipped.push({ doc, reason: "doc has no git history yet" });
      continue;
    }

    docsChecked += 1;

    let changedSinceDoc = committedChangesByRef.get(lastCommit);
    if (!changedSinceDoc) {
      changedSinceDoc = getCommittedChanges(root, lastCommit);
      committedChangesByRef.set(lastCommit, changedSinceDoc);
    }
    if (!changedSinceDoc.ok) {
      return {
        ok: false,
        gitAvailable: true,
        initialized: true,
        docsChecked,
        drifted: [],
        skipped,
        analysisFailure: changedSinceDoc.failure ?? {
          operation: "committed changes",
          message: `Could not enumerate committed changes since ${lastCommit}.`,
        },
      };
    }

    const watchedChanges = uniqueStrings(
      changedSinceDoc.files
        .filter((file) => isReviewableSourceChange(file, docsRoot))
        .filter((file) => docRules.some((rule) => matchesAnyGlob(rule.paths, file))),
    ).sort();

    if (watchedChanges.length === 0) continue;

    const areas = uniqueStrings(
      docRules
        .filter((rule) => watchedChanges.some((file) => matchesAnyGlob(rule.paths, file)))
        .map((rule) => rule.label ?? "watched files"),
    );
    const commitCountKey = [lastCommit, ...watchedChanges].join("\0");
    let commitsBehind: number | undefined;
    if (commitCountsByQuery.has(commitCountKey)) {
      commitsBehind = commitCountsByQuery.get(commitCountKey);
    } else {
      commitsBehind = gitCommitCountTouching(root, lastCommit, watchedChanges);
      commitCountsByQuery.set(commitCountKey, commitsBehind);
    }

    drifted.push({
      doc,
      areas,
      changedFiles: watchedChanges,
      commitsBehind,
    });
  }

  drifted.sort((a, b) => b.changedFiles.length - a.changedFiles.length || a.doc.localeCompare(b.doc));

  return { ok: true, gitAvailable: true, initialized: true, docsChecked, drifted, skipped };
}

export function formatDrift(result: DriftResult): string {
  if (!result.initialized) {
    return ["benjamin-docs drift", "", "status: failed", "", "benjamin-docs is not initialized. Run: benjamin-docs init"].join("\n");
  }

  if (!result.gitAvailable) {
    return [
      "benjamin-docs drift",
      "",
      "status: unavailable",
      "",
      "Drift detection needs git history. Run it inside a git repository with at least one commit.",
    ].join("\n");
  }

  if (result.analysisFailure) {
    return [
      "benjamin-docs drift",
      "",
      "status: failed",
      "",
      `Git ${result.analysisFailure.operation} analysis failed: ${result.analysisFailure.message}`,
      "Rerun: benjamin-docs drift",
    ].join("\n");
  }

  const status = result.drifted.length > 0 ? "drift detected" : "no drift";
  const lines = [
    "benjamin-docs drift",
    "",
    `status: ${status}`,
    `docs checked: ${result.docsChecked}`,
    `drifted docs: ${result.drifted.length}`,
  ];

  if (result.drifted.length > 0) {
    lines.push("");
    lines.push("Drifted");
    for (const entry of result.drifted) {
      lines.push(`  - ${entry.doc}`);
      lines.push(`      behind: ${summarizeDrift(entry)}`);
      lines.push(`      files: ${sampleFiles(entry.changedFiles)}`);
    }
  }

  const notableSkips = result.skipped.filter((entry) => entry.reason !== "doc has uncommitted updates");
  if (notableSkips.length > 0) {
    lines.push("");
    lines.push("Skipped");
    for (const entry of notableSkips) lines.push(`  - ${entry.doc}: ${entry.reason}.`);
  }

  lines.push("");
  lines.push("Next");
  lines.push(
    result.drifted.length > 0
      ? "  Re-verify each drifted doc against the current code, update it or restate why it still holds, then rerun: benjamin-docs drift"
      : "  Project memory is current with watched code.",
  );

  return lines.join("\n");
}

export function summarizeDrift(entry: DriftedDoc): string {
  const files = `${entry.changedFiles.length} watched ${entry.changedFiles.length === 1 ? "file" : "files"} changed`;
  const commits =
    entry.commitsBehind === undefined || entry.commitsBehind === 0
      ? ""
      : ` across ${entry.commitsBehind} ${entry.commitsBehind === 1 ? "commit" : "commits"}`;
  return `${files}${commits} (${entry.areas.join(", ")})`;
}

function sampleFiles(files: string[]): string {
  const sample = files.slice(0, SAMPLE_FILE_LIMIT).join(", ");
  const remaining = files.length - SAMPLE_FILE_LIMIT;
  return remaining > 0 ? `${sample} (+${remaining} more)` : sample;
}

function groupRulesByDoc(rules: WatchRule[]): Map<string, WatchRule[]> {
  const byDoc = new Map<string, WatchRule[]>();

  for (const rule of rules) {
    for (const doc of rule.docs) {
      const existing = byDoc.get(doc);
      if (existing) {
        existing.push(rule);
      } else {
        byDoc.set(doc, [rule]);
      }
    }
  }

  return byDoc;
}

function isInactiveDoc(fullPath: string): boolean {
  try {
    const parsed = parseMarkdown(readFileSync(fullPath, "utf8"));
    return parsed.frontmatter.status === "archived" || parsed.frontmatter.status === "stale";
  } catch {
    return false;
  }
}
