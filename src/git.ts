import { execFileSync } from "node:child_process";
import { CONFIG_DIR } from "./constants.js";

export interface ChangedFilesResult {
  files: string[];
  ok: boolean;
  failure?: GitAnalysisFailure;
}

export interface GitAnalysisFailure {
  operation: "working-tree changes" | "committed changes" | "untracked files";
  message: string;
}

export interface LastCommitsResult {
  commits: Map<string, string>;
  ok: boolean;
}

const GIT_FILENAME_BUFFER_BYTES = 64 * 1024 * 1024;

export function getChangedFiles(root: string, since: string): ChangedFilesResult {
  try {
    const changed = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMRTD", since, "--"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: GIT_FILENAME_BUFFER_BYTES,
    });
    const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: GIT_FILENAME_BUFFER_BYTES,
    });

    return {
      files: uniqueStrings([...changed.split(/\r?\n/), ...untracked.split(/\r?\n/)].map((line) => line.trim()).filter(Boolean)),
      ok: true,
    };
  } catch (error) {
    return failedChangedFiles("working-tree changes", error);
  }
}

export function getCommittedChanges(root: string, since: string): ChangedFilesResult {
  try {
    const changed = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMRTD", since, "HEAD", "--"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: GIT_FILENAME_BUFFER_BYTES,
    });

    return { files: uniqueStrings(changed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)), ok: true };
  } catch (error) {
    return failedChangedFiles("committed changes", error);
  }
}

export function getUntrackedFiles(root: string): ChangedFilesResult {
  try {
    const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: GIT_FILENAME_BUFFER_BYTES,
    });

    return { files: untracked.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), ok: true };
  } catch (error) {
    return failedChangedFiles("untracked files", error);
  }
}

export function gitLastCommit(root: string, file: string): string | undefined {
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%H", "--", file], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return output || undefined;
  } catch {
    return undefined;
  }
}

export function gitLastCommits(root: string, files: string[]): LastCommitsResult {
  if (files.length === 0) return { commits: new Map(), ok: true };

  try {
    const marker = "__BENJAMIN_DOCS_COMMIT__";
    const requested = new Set(files);
    const output = execFileSync("git", ["log", `--format=${marker}%H`, "--name-only", "--diff-filter=ACMRT", "--", ...files], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 10 * 1024 * 1024,
    });
    const commits = new Map<string, string>();
    let currentCommit: string | undefined;

    for (const line of output.split(/\r?\n/)) {
      if (line.startsWith(marker)) {
        currentCommit = line.slice(marker.length);
        continue;
      }
      if (!currentCommit || !requested.has(line) || commits.has(line)) continue;
      commits.set(line, currentCommit);
    }

    for (const file of requested) {
      if (commits.has(file)) continue;
      const commit = gitLastCommit(root, file);
      if (commit) commits.set(file, commit);
    }

    return { commits, ok: true };
  } catch {
    return { commits: new Map(), ok: false };
  }
}

export function gitCommitCountTouching(root: string, since: string, files: string[]): number | undefined {
  if (files.length === 0) return 0;

  try {
    const output = execFileSync("git", ["rev-list", "--count", `${since}..HEAD`, "--", ...files], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    const count = Number.parseInt(output, 10);
    return Number.isNaN(count) ? undefined : count;
  } catch {
    return undefined;
  }
}

const IGNORED_SOURCE_PREFIXES = [".git/", "node_modules/", "dist/", "coverage/", "exports/"];

export function isReviewableSourceChange(file: string, docsRoot: string): boolean {
  if (file.startsWith(`${docsRoot}/`) || file.startsWith(`${CONFIG_DIR}/`)) return false;
  return !IGNORED_SOURCE_PREFIXES.some((prefix) => file.startsWith(prefix));
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function failedChangedFiles(operation: GitAnalysisFailure["operation"], error: unknown): ChangedFilesResult {
  return {
    files: [],
    ok: false,
    failure: {
      operation,
      message: error instanceof Error ? error.message : String(error),
    },
  };
}
