#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const limits = {
  sessionStartCharacters: 400,
  sessionStartEstimatedTokens: 100,
};

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {
  ...process.env,
  BENJAMIN_DOCS_NO_UPDATE_CHECK: "1",
  NO_COLOR: "1",
};

let packDirectory;
let projectDirectory;
let homeDirectory;

function isNpmCliPath(path) {
  return /[/\\]npm[/\\]bin[/\\]npm-cli\.js$/i.test(path);
}

async function resolveNpmCli() {
  const executableDirectory = dirname(process.execPath);
  const candidates = [];

  if (process.env.npm_execpath && isNpmCliPath(process.env.npm_execpath)) {
    candidates.push(resolve(process.env.npm_execpath));
  }

  const pathValue = process.env.PATH ?? process.env.Path ?? "";
  if (process.platform !== "win32") {
    for (const directory of pathValue.split(delimiter).filter(Boolean)) {
      try {
        const resolvedNpm = await realpath(join(directory, "npm"));
        if (isNpmCliPath(resolvedNpm)) candidates.push(resolvedNpm);
      } catch {
        // This PATH entry does not contain npm.
      }
    }
  }

  candidates.push(
    resolve(executableDirectory, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
    resolve(executableDirectory, "node_modules", "npm", "bin", "npm-cli.js"),
    resolve(executableDirectory, "..", "node_modules", "npm", "bin", "npm-cli.js"),
  );

  const uniqueCandidates = [...new Set(candidates)];
  for (const candidate of uniqueCandidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Try the next standard Node/npm layout.
    }
  }

  throw new Error(
    `Unable to locate npm's JavaScript CLI (npm-cli.js). Checked:\n${uniqueCandidates.map((candidate) => `- ${candidate}`).join("\n")}`,
  );
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env,
    shell: false,
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
  packDirectory = await mkdtemp(join(tmpdir(), "benjamin docs pack -"));
  projectDirectory = await mkdtemp(join(tmpdir(), "benjamin docs smoke -"));
  homeDirectory = await mkdtemp(join(tmpdir(), "benjamin docs home -"));
  env.BENJAMIN_DOCS_HOME = homeDirectory;
  const npmCliPath = await resolveNpmCli();
  const runNpm = (args, cwd) => run(process.execPath, [npmCliPath, ...args], cwd);

  if (!packDirectory.includes(" ") || !projectDirectory.includes(" ")) {
    throw new Error("packed CLI smoke paths must contain spaces for cross-platform coverage");
  }

  const packOutput = runNpm(
    ["pack", "--json", "--pack-destination", packDirectory],
    repositoryRoot,
  );
  const packResult = JSON.parse(packOutput);
  const filename = packResult[0]?.filename;
  if (!filename) throw new Error("npm pack did not report a tarball filename");

  const tarballPath = join(packDirectory, filename);
  if (!tarballPath.includes(" ")) {
    throw new Error("packed tarball path must contain spaces for cross-platform coverage");
  }
  runNpm(
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
  const upgradeOutput = runBd(["upgrade"]);
  if (!upgradeOutput.includes("Hooks: installed")) {
    throw new Error(`plain packed upgrade did not install hooks:\n${upgradeOutput}`);
  }
  for (const [relativePath, format] of [
    [".claude/settings.json", "claude"],
    [".codex/hooks.json", "codex"],
    [".cursor/hooks.json", "cursor"],
  ]) {
    const hookText = await readFile(join(projectDirectory, relativePath), "utf8");
    if (!hookText.includes(`benjamin-docs session-start --format ${format}`)) {
      throw new Error(`${relativePath} does not contain the expected ${format} session-start hook`);
    }
  }
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
    [packDirectory, projectDirectory, homeDirectory]
      .filter(Boolean)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
}
