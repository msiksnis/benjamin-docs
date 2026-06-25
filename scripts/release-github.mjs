#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const command = process.argv[2] ?? "help";
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;
const tag = `v${version}`;
const repo = repoSlug(pkg.repository?.url);

function repoSlug(url) {
  const match = String(url ?? "").match(/github\.com[:/](.+?\/.+?)(?:\.git)?$/);
  if (!match) {
    throw new Error("Could not derive GitHub repo from package.json repository.url");
  }
  return match[1];
}

function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(`${bin} failed to start: ${result.error.message}`);
  }
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(
      `${bin} ${args.join(" ")} failed\n${result.stdout}${result.stderr}`,
    );
  }
  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function packageVersionAt(ref) {
  const source = run("git", ["show", `${ref}:package.json`]).stdout;
  return JSON.parse(source).version;
}

function localTagCommit() {
  const result = run("git", ["rev-list", "-n", "1", tag], { allowFailure: true });
  return result.ok && result.stdout ? result.stdout : null;
}

function remoteTagCommit() {
  const peeled = run("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}^{}`], {
    allowFailure: true,
  });
  if (peeled.ok && peeled.stdout) {
    return peeled.stdout.split(/\s+/)[0];
  }

  const direct = run("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`], {
    allowFailure: true,
  });
  return direct.ok && direct.stdout ? direct.stdout.split(/\s+/)[0] : null;
}

function ensureNpmVersionExists() {
  const result = run("npm", ["view", `${pkg.name}@${version}`, "version"], {
    allowFailure: true,
  });
  if (!result.ok || result.stdout !== version) {
    throw new Error(
      `npm does not report ${pkg.name}@${version}. Publish npm first, then run pnpm run release:github.`,
    );
  }
  console.log(`ok npm ${pkg.name}@${version}`);
}

function ensureCleanWorktreeForNewTag() {
  const status = run("git", ["status", "--short"]).stdout;
  if (status) {
    throw new Error(`Refusing to create ${tag} with a dirty worktree:\n${status}`);
  }
}

function ensureLocalTagFromRemoteIfNeeded() {
  if (localTagCommit()) return;
  if (!remoteTagCommit()) return;

  run("git", ["fetch", "origin", "tag", tag]);
}

function ensureTag() {
  ensureLocalTagFromRemoteIfNeeded();

  const localCommit = localTagCommit();
  const remoteCommit = remoteTagCommit();

  if (localCommit) {
    const tagVersion = packageVersionAt(tag);
    if (tagVersion !== version) {
      throw new Error(`${tag} points at package version ${tagVersion}, not ${version}.`);
    }

    if (remoteCommit && remoteCommit !== localCommit) {
      throw new Error(`${tag} differs between local (${localCommit}) and origin (${remoteCommit}).`);
    }

    if (!remoteCommit) {
      run("git", ["push", "origin", tag]);
      console.log(`pushed ${tag}`);
    } else {
      console.log(`ok tag ${tag}`);
    }
    return;
  }

  ensureCleanWorktreeForNewTag();

  const headVersion = packageVersionAt("HEAD");
  if (headVersion !== version) {
    throw new Error(`HEAD package version is ${headVersion}, but working package.json is ${version}.`);
  }

  run("git", ["tag", "-a", tag, "-m", tag]);
  run("git", ["push", "origin", tag]);
  console.log(`created and pushed ${tag}`);
}

function releaseView() {
  const result = run(
    "gh",
    [
      "release",
      "view",
      tag,
      "--repo",
      repo,
      "--json",
      "tagName,isDraft,isPrerelease,url",
    ],
    { allowFailure: true },
  );
  return result.ok && result.stdout ? JSON.parse(result.stdout) : null;
}

function ensureGithubRelease() {
  const existing = releaseView();
  if (existing) {
    if (existing.isDraft || existing.isPrerelease) {
      throw new Error(`${tag} exists but is draft or prerelease: ${existing.url}`);
    }
    console.log(`ok GitHub Release ${existing.url}`);
    return;
  }

  const notes = `Published npm package: ${pkg.name}@${version}`;
  const create = run(
    "gh",
    [
      "release",
      "create",
      tag,
      "--repo",
      repo,
      "--verify-tag",
      "--title",
      tag,
      "--notes",
      notes,
      "--generate-notes",
      "--latest",
    ],
    { allowFailure: true },
  );

  if (!create.ok && !releaseView()) {
    throw new Error(`Could not create GitHub Release ${tag}\n${create.stdout}${create.stderr}`);
  }

  const created = releaseView();
  console.log(`created GitHub Release ${created.url}`);
}

function ensureLatestRelease() {
  const latest = run("gh", ["api", `repos/${repo}/releases/latest`, "--jq", ".tag_name"]).stdout;
  if (latest !== tag) {
    throw new Error(`GitHub latest release is ${latest}, expected ${tag}.`);
  }
  console.log(`ok latest ${tag}`);
}

function verify() {
  ensureNpmVersionExists();
  ensureLocalTagFromRemoteIfNeeded();

  const localCommit = localTagCommit();
  if (!localCommit) {
    throw new Error(`Missing local git tag ${tag}.`);
  }

  const remoteCommit = remoteTagCommit();
  if (!remoteCommit) {
    throw new Error(`Missing origin git tag ${tag}.`);
  }
  if (remoteCommit !== localCommit) {
    throw new Error(`${tag} differs between local (${localCommit}) and origin (${remoteCommit}).`);
  }

  const tagVersion = packageVersionAt(tag);
  if (tagVersion !== version) {
    throw new Error(`${tag} points at package version ${tagVersion}, not ${version}.`);
  }

  ensureGithubRelease();
  ensureLatestRelease();
}

function help() {
  console.log(`Usage:
  node scripts/release-github.mjs release
  node scripts/release-github.mjs verify

release:
  Run after npm publish. Confirms ${pkg.name}@${version} exists on npm,
  creates/pushes ${tag} when needed, and creates the GitHub Release.

verify:
  Read-only public release check for npm, local tag, origin tag,
  GitHub Release, and GitHub latest release.`);
}

try {
  if (command === "release") {
    ensureNpmVersionExists();
    ensureTag();
    ensureGithubRelease();
    ensureLatestRelease();
  } else if (command === "verify") {
    verify();
  } else {
    help();
    if (command !== "help" && command !== "--help" && command !== "-h") {
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
