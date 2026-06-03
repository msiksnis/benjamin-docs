import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "agent-docs-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function runCli(args: string[], cwd: string): string {
  return execFileSync("node", [join(process.cwd(), "dist/src/cli.js"), ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

export function runCliResult(args: string[], cwd: string): CliResult {
  const result = spawnSync("node", [join(process.cwd(), "dist/src/cli.js"), ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
