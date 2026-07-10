import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { getChangedFiles, isReviewableSourceChange } from "./git.js";
import { rootPath } from "./fsx.js";

export interface SessionHookInput {
  provided: boolean;
  sessionId?: string;
  turnId?: string;
  stopHookActive: boolean;
  lastAssistantMessage?: string;
}

export type FileFingerprint =
  | { state: "present"; hash: string; size: number; modifiedMs: number }
  | { state: "deleted" };

interface WorkingTreeSnapshot {
  source: Record<string, FileFingerprint>;
  memory: Record<string, FileFingerprint>;
}

interface StoredSessionState {
  version: 1;
  baseline: WorkingTreeSnapshot;
  pending?: WorkingTreeSnapshot;
  updatedAt: string;
}

const SESSION_STATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionStopEvaluation {
  tracked: boolean;
  sourceChanges: string[];
}

export function beginSessionTracking(root: string, docsRoot: string, format: string | undefined, input: SessionHookInput): void {
  if (!input.provided) return;

  const snapshot = captureWorkingTreeSnapshot(root, docsRoot);
  if (!snapshot) return;
  pruneExpiredSessionStates(Date.now());
  writeSessionState(root, format, input, {
    version: 1,
    baseline: snapshot,
    updatedAt: new Date().toISOString(),
  });
}

export function evaluateSessionStop(
  root: string,
  docsRoot: string,
  format: string | undefined,
  input: SessionHookInput,
): SessionStopEvaluation {
  if (!input.provided) return { tracked: false, sourceChanges: [] };

  const current = captureWorkingTreeSnapshot(root, docsRoot);
  if (!current) return { tracked: true, sourceChanges: [] };

  const state = readSessionState(root, format, input);
  if (!state) {
    writeSessionState(root, format, input, stateWithBaseline(current));
    return { tracked: true, sourceChanges: [] };
  }

  if (input.stopHookActive || (state.pending && snapshotsEqual(state.pending, current))) {
    writeSessionState(root, format, input, stateWithBaseline(current));
    return { tracked: true, sourceChanges: [] };
  }

  const sourceChanges = changedEntries(state.baseline.source, current.source);
  const memoryChanges = changedEntries(state.baseline.memory, current.memory);
  if (sourceChanges.length === 0 || memoryChanges.length > 0) {
    writeSessionState(root, format, input, stateWithBaseline(current));
    return { tracked: true, sourceChanges: [] };
  }

  writeSessionState(root, format, input, {
    ...state,
    pending: current,
    updatedAt: new Date().toISOString(),
  });
  return { tracked: true, sourceChanges };
}

function captureWorkingTreeSnapshot(root: string, docsRoot: string): WorkingTreeSnapshot | undefined {
  const changed = getChangedFiles(root, "HEAD");
  if (!changed.ok) return undefined;

  const snapshot: WorkingTreeSnapshot = { source: {}, memory: {} };
  for (const file of changed.files) {
    if (file.startsWith(`${docsRoot}/`) && file.endsWith(".md")) {
      const fingerprint = fingerprintFile(root, file);
      if (fingerprint) snapshot.memory[file] = fingerprint;
      continue;
    }

    if (!isReviewableSourceChange(file, docsRoot) || isAgentConfigPath(file)) continue;
    const fingerprint = fingerprintFile(root, file);
    if (fingerprint) snapshot.source[file] = fingerprint;
  }

  return snapshot;
}

function fingerprintFile(root: string, file: string): FileFingerprint | undefined {
  try {
    const path = rootPath(root, file);
    if (!existsSync(path)) return { state: "deleted" };
    const stat = statSync(path);
    if (!stat.isFile()) return undefined;
    return {
      state: "present",
      hash: createHash("sha256").update(String(stat.mode)).update("\0").update(readFileSync(path)).digest("hex"),
      size: stat.size,
      modifiedMs: stat.mtimeMs,
    };
  } catch {
    return undefined;
  }
}

function changedEntries(previous: Record<string, FileFingerprint>, current: Record<string, FileFingerprint>): string[] {
  return Object.entries(current)
    .filter(([file, fingerprint]) => !fingerprintsEqual(previous[file], fingerprint))
    .map(([file]) => file);
}

function snapshotsEqual(a: WorkingTreeSnapshot, b: WorkingTreeSnapshot): boolean {
  return recordsEqual(a.source, b.source) && recordsEqual(a.memory, b.memory);
}

function recordsEqual(a: Record<string, FileFingerprint>, b: Record<string, FileFingerprint>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return keysA.length === keysB.length && keysA.every((key) => fingerprintsEqual(a[key], b[key]));
}

function fingerprintsEqual(a: FileFingerprint | undefined, b: FileFingerprint | undefined): boolean {
  if (!a || !b || a.state !== b.state) return a === b;
  if (a.state === "deleted" || b.state === "deleted") return true;
  return a.hash === b.hash && a.size === b.size && a.modifiedMs === b.modifiedMs;
}

function stateWithBaseline(baseline: WorkingTreeSnapshot): StoredSessionState {
  return { version: 1, baseline, updatedAt: new Date().toISOString() };
}

function sessionStatePath(root: string, format: string | undefined, input: SessionHookInput): string {
  const identity = `${resolve(root)}\0${format ?? "plain"}\0${input.sessionId ?? "default"}`;
  const key = createHash("sha256").update(identity).digest("hex");
  return join(sessionStateDir(), `${key}.json`);
}

function sessionStateDir(): string {
  const home = resolve(process.env.BENJAMIN_DOCS_HOME ?? homedir());
  return join(home, ".benjamin-docs", "session-hooks");
}

function pruneExpiredSessionStates(nowMs: number): void {
  try {
    const dir = sessionStateDir();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const path = join(dir, entry.name);
      const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
      const updatedAt =
        typeof parsed === "object" && parsed !== null ? Date.parse(String((parsed as Record<string, unknown>).updatedAt ?? "")) : Number.NaN;
      if (Number.isNaN(updatedAt) || nowMs - updatedAt > SESSION_STATE_TTL_MS) unlinkSync(path);
    }
  } catch {
    // Cache cleanup is best-effort and must not interfere with session start.
  }
}

function readSessionState(root: string, format: string | undefined, input: SessionHookInput): StoredSessionState | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(sessionStatePath(root, format, input), "utf8"));
    if (!isStoredSessionState(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function writeSessionState(root: string, format: string | undefined, input: SessionHookInput, state: StoredSessionState): void {
  try {
    const path = sessionStatePath(root, format, input);
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    renameSync(temporary, path);
  } catch {
    // Session tracking is best-effort. Hook state must never block the agent by itself.
  }
}

function isStoredSessionState(value: unknown): value is StoredSessionState {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.version === 1 && isSnapshot(record.baseline) && (record.pending === undefined || isSnapshot(record.pending));
}

function isSnapshot(value: unknown): value is WorkingTreeSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return isFingerprintRecord(record.source) && isFingerprintRecord(record.memory);
}

function isFingerprintRecord(value: unknown): value is Record<string, FileFingerprint> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(isFileFingerprint);
}

function isFileFingerprint(value: unknown): value is FileFingerprint {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.state === "deleted") return true;
  return (
    record.state === "present" &&
    typeof record.hash === "string" &&
    typeof record.size === "number" &&
    typeof record.modifiedMs === "number"
  );
}

function isAgentConfigPath(file: string): boolean {
  return file.startsWith(".claude/") || file.startsWith(".codex/") || file.startsWith(".cursor/") || file === "AGENTS.md";
}
