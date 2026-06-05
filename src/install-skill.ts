import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

export const SKILL_NAME = "benjamin-docs";

const TARGETS = [
  {
    id: "agents",
    label: "Shared Agent Skills",
    relativePath: `.agents/skills/${SKILL_NAME}/SKILL.md`,
  },
  {
    id: "codex",
    label: "Codex",
    relativePath: `.codex/skills/${SKILL_NAME}/SKILL.md`,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    relativePath: `.claude/skills/${SKILL_NAME}/SKILL.md`,
  },
  {
    id: "cursor",
    label: "Cursor",
    relativePath: `.cursor/skills/${SKILL_NAME}/SKILL.md`,
  },
] as const;

export type SkillTargetId = (typeof TARGETS)[number]["id"] | "all";
export type InstallSkillStatus = "installed" | "updated" | "unchanged" | "would-install" | "would-update" | "would-keep";

export interface InstallSkillOptions {
  homeDir?: string;
  target?: SkillTargetId;
  dryRun?: boolean;
}

export interface InstallSkillResult {
  skillSourcePath: string;
  homeDir: string;
  dryRun: boolean;
  targets: Array<{
    id: Exclude<SkillTargetId, "all">;
    label: string;
    path: string;
    status: InstallSkillStatus;
  }>;
}

export function installSkill(options: InstallSkillOptions = {}): InstallSkillResult {
  const homeDir = resolve(options.homeDir ?? process.env.BENJAMIN_DOCS_HOME ?? homedir());
  const target = options.target ?? "all";
  const skillSourcePath = getBundledSkillPath();
  const skill = readFileSync(skillSourcePath, "utf8");
  const targets = resolveTargets(target).map((entry) => {
    const destination = resolveSkillPath(homeDir, entry.relativePath);
    const existing = readExistingSkill(destination);
    const status = statusFor(existing, skill, options.dryRun === true);

    if (!options.dryRun && existing !== skill) {
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, skill, "utf8");
    }

    return {
      id: entry.id,
      label: entry.label,
      path: destination,
      status,
    };
  });

  return { skillSourcePath, homeDir, dryRun: options.dryRun === true, targets };
}

export function formatInstallSkillResult(result: InstallSkillResult): string {
  const verb = result.dryRun ? "Skill install plan" : "Installed benjamin-docs skill";
  const lines = [verb, ""];

  for (const target of result.targets) {
    lines.push(`${target.status.padEnd(13)} ${target.label.padEnd(19)} ${formatHomePath(result.homeDir, target.path)}`);
  }

  lines.push("");
  lines.push("Claude Desktop / Claude.ai:");
  lines.push(`  Upload the ${SKILL_NAME} skill folder through Claude's Skills UI.`);
  lines.push(`  After this command, use: ${formatHomePath(result.homeDir, resolve(dirname(result.targets.find((target) => target.id === "claude-code")?.path ?? join(result.homeDir, ".claude/skills", SKILL_NAME, "SKILL.md"))))}`);
  lines.push("");
  lines.push("Then ask your agent:");
  lines.push(`  Use the ${SKILL_NAME} skill to create a project from this chat.`);

  return lines.join("\n");
}

export function knownSkillTargets(): Array<{ id: Exclude<SkillTargetId, "all">; label: string; relativePath: string }> {
  return TARGETS.map((target) => ({ ...target }));
}

function getBundledSkillPath(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return join(currentDir, "..", "..", "skills", SKILL_NAME, "SKILL.md");
}

function resolveTargets(target: SkillTargetId): Array<(typeof TARGETS)[number]> {
  if (target === "all") return [...TARGETS];
  const resolved = TARGETS.find((entry) => entry.id === target);
  if (!resolved) throw new Error(`Unknown skill target: ${target}`);
  return [resolved];
}

function resolveSkillPath(homeDir: string, relativePath: string): string {
  const destination = resolve(homeDir, relativePath);
  const relativePathFromHome = relative(homeDir, destination);

  if (relativePathFromHome === ".." || relativePathFromHome.startsWith(`..${sep}`) || relativePathFromHome === "" || relativePathFromHome.startsWith("/")) {
    throw new Error(`Refusing to install skill outside home directory: ${relativePath}`);
  }

  return destination;
}

function readExistingSkill(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

function statusFor(existing: string | undefined, next: string, dryRun: boolean): InstallSkillStatus {
  if (existing === undefined) return dryRun ? "would-install" : "installed";
  if (existing === next) return dryRun ? "would-keep" : "unchanged";
  return dryRun ? "would-update" : "updated";
}

function formatHomePath(homeDir: string, path: string): string {
  const relativePathFromHome = relative(homeDir, path);
  if (relativePathFromHome && !relativePathFromHome.startsWith(`..${sep}`) && relativePathFromHome !== "..") {
    return `~/${relativePathFromHome}`;
  }
  return path;
}
