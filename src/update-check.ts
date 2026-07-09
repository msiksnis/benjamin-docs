import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { getPackageVersion } from "./info.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 3000;
const DEFAULT_REGISTRY_URL = "https://registry.npmjs.org/benjamin-docs/latest";

export interface UpdateCache {
  lastChecked: string;
  latest: string;
}

export interface UpdateInfo {
  installed: string;
  latest: string;
  updateAvailable: boolean;
}

export function updateChecksEnabled(): boolean {
  return process.env.BENJAMIN_DOCS_NO_UPDATE_CHECK !== "1";
}

export function updateCachePath(): string {
  const homeDir = resolve(process.env.BENJAMIN_DOCS_HOME ?? homedir());
  return join(homeDir, ".benjamin-docs", "update-check.json");
}

export function readUpdateCache(): UpdateCache | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(updateCachePath(), "utf8"));
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const cache = parsed as Record<string, unknown>;
    if (typeof cache.lastChecked !== "string" || typeof cache.latest !== "string") return undefined;
    return { lastChecked: cache.lastChecked, latest: cache.latest };
  } catch {
    return undefined;
  }
}

export function writeUpdateCache(cache: UpdateCache): void {
  const path = updateCachePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

export function isUpdateCacheStale(cache: UpdateCache | undefined, nowMs: number): boolean {
  if (!cache) return true;
  const lastChecked = Date.parse(cache.lastChecked);
  if (Number.isNaN(lastChecked)) return true;
  return nowMs - lastChecked > CACHE_TTL_MS;
}

export function getCachedUpdateInfo(): UpdateInfo | undefined {
  if (!updateChecksEnabled()) return undefined;

  const cache = readUpdateCache();
  if (!cache) return undefined;

  const installed = getPackageVersion();
  return { installed, latest: cache.latest, updateAvailable: compareVersions(cache.latest, installed) > 0 };
}

export async function refreshUpdateCache(nowIso: string): Promise<UpdateInfo | undefined> {
  if (!updateChecksEnabled()) return undefined;

  const latest = await fetchLatestVersion();
  if (!latest) return undefined;

  writeUpdateCache({ lastChecked: nowIso, latest });
  const installed = getPackageVersion();
  return { installed, latest, updateAvailable: compareVersions(latest, installed) > 0 };
}

export function spawnBackgroundUpdateRefresh(commandPath: string | undefined, nowMs: number): void {
  if (!updateChecksEnabled() || !commandPath) return;
  if (!isUpdateCacheStale(readUpdateCache(), nowMs)) return;

  try {
    const child = spawn(process.execPath, [commandPath, "update-cache"], { detached: true, stdio: "ignore" });
    child.unref();
  } catch {
    // Update refresh is best-effort; never let it interfere with the calling command.
  }
}

export function compareVersions(a: string, b: string): number {
  const partsA = parseVersion(a);
  const partsB = parseVersion(b);
  if (!partsA || !partsB) return 0;

  for (let index = 0; index < 3; index += 1) {
    const diff = (partsA[index] ?? 0) - (partsB[index] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
}

function parseVersion(version: string): number[] | undefined {
  const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

async function fetchLatestVersion(): Promise<string | undefined> {
  const url = process.env.BENJAMIN_DOCS_REGISTRY_URL ?? DEFAULT_REGISTRY_URL;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return undefined;

    const parsed: unknown = await response.json();
    if (typeof parsed !== "object" || parsed === null) return undefined;

    const version = (parsed as Record<string, unknown>).version;
    return typeof version === "string" && parseVersion(version) ? version : undefined;
  } catch {
    return undefined;
  }
}
