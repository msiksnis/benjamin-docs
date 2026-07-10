#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const runs = 20;
const assertLimits = process.argv.includes("--assert");
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = resolve(repositoryRoot, "dist/src/cli.js");
const env = {
  ...process.env,
  BENJAMIN_DOCS_NO_UPDATE_CHECK: "1",
  NO_COLOR: "1",
};

const limits = {
  sessionStartP95Ms: process.env.CI ? 750 : 400,
  sessionStopP95Ms: process.env.CI ? 750 : 400,
  sessionStartCharacters: 400,
  sessionStartEstimatedTokens: 100,
  silentStopCharacters: 0,
};

function runSessionCommand(command) {
  const startedAt = process.hrtime.bigint();
  const result = spawnSync(process.execPath, [cliPath, command], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env,
  });
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited ${result.status}: ${result.stderr.trim()}`);
  }

  return {
    durationMs,
    output: result.stdout.trimEnd(),
  };
}

function percentile(sorted, value) {
  return sorted[Math.ceil(sorted.length * value) - 1];
}

function benchmark(command) {
  runSessionCommand(command);

  const samples = Array.from({ length: runs }, () => runSessionCommand(command));
  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const characters = Math.max(...samples.map((sample) => sample.output.length));

  return {
    p50Ms: roundMilliseconds(percentile(durations, 0.5)),
    p95Ms: roundMilliseconds(percentile(durations, 0.95)),
    characters,
    estimatedTokens: Math.ceil(characters / 4),
  };
}

function roundMilliseconds(value) {
  return Math.round(value * 1000) / 1000;
}

const sessionStart = benchmark("session-start");
const sessionStop = benchmark("session-stop");
const violations = [];

if (sessionStart.p95Ms > limits.sessionStartP95Ms) {
  violations.push(`session-start p95 ${sessionStart.p95Ms}ms exceeds ${limits.sessionStartP95Ms}ms`);
}
if (sessionStop.p95Ms > limits.sessionStopP95Ms) {
  violations.push(`session-stop p95 ${sessionStop.p95Ms}ms exceeds ${limits.sessionStopP95Ms}ms`);
}
if (sessionStart.characters > limits.sessionStartCharacters) {
  violations.push(`session-start output ${sessionStart.characters} characters exceeds ${limits.sessionStartCharacters}`);
}
if (sessionStart.estimatedTokens > limits.sessionStartEstimatedTokens) {
  violations.push(`session-start output ${sessionStart.estimatedTokens} estimated tokens exceeds ${limits.sessionStartEstimatedTokens}`);
}
if (sessionStop.characters > limits.silentStopCharacters) {
  violations.push(`session-stop output ${sessionStop.characters} characters exceeds ${limits.silentStopCharacters}`);
}

console.log(
  JSON.stringify({
    runs,
    limits,
    sessionStart,
    sessionStop,
    assertion: {
      enabled: assertLimits,
      passed: violations.length === 0,
      violations,
    },
  }),
);

if (assertLimits && violations.length > 0) process.exitCode = 1;
