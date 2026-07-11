#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const limits = {
  sessionStartCharacters: 400,
  sessionStartEstimatedTokens: 100,
};

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const env = {
  ...process.env,
  BENJAMIN_DOCS_NO_UPDATE_CHECK: "1",
  NO_COLOR: "1",
};

let packDirectory;
let projectDirectory;

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env,
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited ${result.status}\n${result.stderr.trim()}`,
    );
  }

  return result.stdout;
}

try {
  packDirectory = await mkdtemp(join(tmpdir(), "benjamin-docs-pack-"));
  projectDirectory = await mkdtemp(join(tmpdir(), "benjamin-docs-smoke-"));

  const packOutput = run(
    npmCommand,
    ["pack", "--json", "--pack-destination", packDirectory],
    repositoryRoot,
  );
  const packResult = JSON.parse(packOutput);
  const filename = packResult[0]?.filename;
  if (!filename) throw new Error("npm pack did not report a tarball filename");

  const tarballPath = join(packDirectory, filename);
  run(
    npmCommand,
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-save", tarballPath],
    projectDirectory,
  );

  const installedPackageRoot = join(projectDirectory, "node_modules", "benjamin-docs");
  const installedPackage = JSON.parse(
    await readFile(join(installedPackageRoot, "package.json"), "utf8"),
  );
  const cliRelativePath = installedPackage.bin?.bd;
  if (!cliRelativePath) throw new Error("installed package does not expose the bd binary");

  const cliPath = resolve(installedPackageRoot, cliRelativePath);
  const runBd = (args) => run(process.execPath, [cliPath, ...args], projectDirectory);

  const version = runBd(["--version"]).trim();
  if (version !== installedPackage.version) {
    throw new Error(`bd --version reported ${version}; expected ${installedPackage.version}`);
  }

  runBd(["init", "--mode", "planning", "--no-agent-contract"]);
  runBd(["validate"]);

  const sessionStart = runBd(["session-start"]).trimEnd();
  const estimatedTokens = Math.ceil(sessionStart.length / 4);
  if (sessionStart.length > limits.sessionStartCharacters) {
    throw new Error(
      `bd session-start emitted ${sessionStart.length} characters; limit is ${limits.sessionStartCharacters}`,
    );
  }
  if (estimatedTokens > limits.sessionStartEstimatedTokens) {
    throw new Error(
      `bd session-start emitted ${estimatedTokens} estimated tokens; limit is ${limits.sessionStartEstimatedTokens}`,
    );
  }

  console.log(
    `Packed CLI smoke passed for benjamin-docs@${version} (${sessionStart.length} characters, ${estimatedTokens} estimated tokens).`,
  );
} finally {
  await Promise.all(
    [packDirectory, projectDirectory]
      .filter(Boolean)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
}
