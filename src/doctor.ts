import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { readJson, rootPath } from "./fsx.js";
import { checkHooks } from "./hooks.js";
import { getPackageVersion } from "./info.js";
import { checkInstalledSkills, formatHomePath, SKILL_NAME, type SkillTargetId } from "./install-skill.js";
import { getDefaultSkillZipPath, skillZipExists } from "./package-skill.js";
import { normalizeConfig } from "./project-config.js";
import type { BenjaminDocsConfig } from "./types.js";
import { validateProject } from "./validate.js";

export interface DoctorResult {
  ok: boolean;
  output: string;
}

export type DoctorTarget = "shared" | "claude-code" | "codex" | "cursor" | "claude-desktop";

export interface DoctorOptions {
  cwd?: string;
  commandPath?: string;
  homeDir?: string;
  strict?: boolean;
  target?: DoctorTarget;
}

export function runDoctor(options: DoctorOptions = {}): DoctorResult {
  const cwd = resolve(options.cwd ?? process.cwd());
  const commandPath = options.commandPath ?? process.argv[1] ?? "unknown";
  const project = inspectProject(cwd);
  const skillTarget = doctorSkillTarget(options.target);
  const skills = !options.strict || skillTarget
    ? checkInstalledSkills(options.homeDir, skillTarget ? [skillTarget] : undefined)
    : undefined;
  const inspectDesktop = !options.strict || options.target === "claude-desktop";
  const desktopHomeDir = inspectDesktop
    ? resolve(options.homeDir ?? process.env.BENJAMIN_DOCS_HOME ?? homedir())
    : undefined;
  const skillZipPath = inspectDesktop ? getDefaultSkillZipPath(desktopHomeDir) : undefined;
  const hasSkillZip = inspectDesktop ? skillZipExists(desktopHomeDir) : undefined;
  const strictErrors = options.strict
    ? strictDoctorErrors(cwd, project, skills?.targets ?? [], hasSkillZip, options.target)
    : [];
  const command = ["benjamin-docs doctor", options.strict ? "--strict" : undefined, options.target ? `--target ${options.target}` : undefined]
    .filter((part): part is string => part !== undefined)
    .join(" ");
  const lines = [
    command,
    "",
    "CLI",
    `  version: ${getPackageVersion()}`,
    `  command: ${commandPath}`,
  ];

  if (!options.strict && skills) {
    lines.push("");
    lines.push("Skills");
    for (const target of skills.targets) {
      lines.push(`  ${target.status.padEnd(7)} ${target.label.padEnd(19)} ${formatHomePath(skills.homeDir, target.path)}`);
    }
  }

  lines.push("");
  lines.push("Project");
  lines.push(`  status: ${project.status}`);

  if (project.status === "initialized") {
    lines.push(`  mode: ${project.mode ?? "unknown"}`);
    lines.push(`  docs root: ${project.docsRoot ? `${project.docsRoot}/` : "unknown"}`);
    lines.push(`  validation: ${project.validation}`);
  }

  if (project.errors.length > 0) {
    lines.push("");
    lines.push("Errors");
    for (const error of project.errors) lines.push(`  - ${error}`);
  }

  if (project.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings");
    for (const warning of project.warnings) lines.push(`  - ${warning}`);
  }

  if (options.strict && options.target === "claude-desktop") {
    lines.push("");
    lines.push("Claude Desktop");
    lines.push(`  upload zip: ${hasSkillZip ? "ok" : "missing"} ${formatHomePath(desktopHomeDir!, skillZipPath!)}`);
  }

  if (options.strict && options.target && options.target !== "claude-desktop") {
    const skill = skills?.targets[0];
    if (skill) {
      lines.push("");
      lines.push(skill.label);
      lines.push(`  skill: ${skill.status} ${formatHomePath(skills!.homeDir, skill.path)}`);
    }

    if (options.target !== "shared") {
      const hook = checkHooks(cwd, [options.target]).targets[0];
      if (hook) lines.push(`  session hook: ${hook.status} ${hook.path}`);
    }
  }

  if (strictErrors.length > 0) {
    lines.push("");
    lines.push("Strict");
    for (const error of strictErrors) lines.push(`  - ${error}`);
  }

  if (!options.strict && skills) {
    lines.push("");
    lines.push("Claude Desktop");
    lines.push(`  upload folder: ${formatHomePath(skills.homeDir, join(skills.homeDir, ".claude", "skills", SKILL_NAME))}`);
    lines.push(`  upload zip: ${hasSkillZip ? "ok" : "missing"} ${formatHomePath(skills.homeDir, skillZipPath!)}`);

    if (skills.targets.some((target) => target.status !== "ok")) {
      lines.push("");
      lines.push("Fix");
      lines.push("  benjamin-docs install-skill");
    }

    if (!hasSkillZip) {
      lines.push("");
      lines.push("Claude Desktop fix");
      lines.push("  benjamin-docs package-skill");
    }
  }

  return {
    ok: project.errors.length === 0 && strictErrors.length === 0,
    output: lines.join("\n"),
  };
}

function strictDoctorErrors(
  root: string,
  project: ProjectInspection,
  targets: ReturnType<typeof checkInstalledSkills>["targets"],
  hasSkillZip: boolean | undefined,
  target?: DoctorTarget,
): string[] {
  const errors: string[] = [];

  if (project.status !== "initialized") {
    errors.push("Project is not initialized. Run: benjamin-docs init");
  }

  if (project.warnings.length > 0) {
    errors.push("Validation warnings are present.");
  }

  if (project.errors.length > 0) {
    errors.push("Validation errors are present.");
  }

  if (target === "claude-desktop" && !hasSkillZip) {
    errors.push("Claude Desktop upload zip is missing. Run: benjamin-docs package-skill");
  }

  if (target && target !== "claude-desktop") {
    const skillTargetId = target === "shared" ? "agents" : target;
    const skill = targets.find((candidate) => candidate.id === skillTargetId);
    if (skill && skill.status !== "ok") {
      errors.push(`${skill.label} skill is ${skill.status}. Run: benjamin-docs install-skill --target ${target}`);
    }

    if (target !== "shared") {
      const hook = checkHooks(root, [target]).targets[0];
      if (hook && hook.status !== "installed") {
        errors.push(`${hook.label} session hook is ${hook.status}. Run: benjamin-docs hooks install --target ${target}`);
      }
      if (hook?.unsafeStop) {
        errors.push(hook.legacyStop
          ? `${hook.label} legacy Benjamin stop hook detected. Run: benjamin-docs hooks install --target ${target}`
          : `${hook.label} unsafe Benjamin command detected in Stop event. Run: benjamin-docs hooks install --target ${target}`);
      }
    }
  }

  return errors;
}

function doctorSkillTarget(target: DoctorTarget | undefined): Exclude<SkillTargetId, "all"> | undefined {
  if (!target || target === "claude-desktop") return undefined;
  return target === "shared" ? "agents" : target;
}

interface ProjectInspection {
  status: "initialized" | "not initialized";
  mode?: BenjaminDocsConfig["mode"];
  docsRoot?: string;
  validation?: "passed" | "passed with warnings" | "failed";
  warnings: string[];
  errors: string[];
}

function inspectProject(root: string): ProjectInspection {
  const configPath = rootPath(root, CONFIG_DIR, CONFIG_FILE);
  const manifestPath = rootPath(root, CONFIG_DIR, MANIFEST_FILE);
  const scopesPath = rootPath(root, CONFIG_DIR, SCOPES_FILE);

  if (!existsSync(configPath) || !existsSync(manifestPath) || !existsSync(scopesPath)) {
    return { status: "not initialized", warnings: [], errors: [] };
  }

  let config: BenjaminDocsConfig | undefined;
  const errors: string[] = [];

  try {
    config = normalizeConfig(readJson<BenjaminDocsConfig>(configPath));
  } catch (error) {
    errors.push(`Cannot read config: ${error instanceof Error ? error.message : String(error)}`);
  }

  const validation = validateProject(root);
  errors.push(...validation.errors);

  return {
    status: "initialized",
    mode: config?.mode,
    docsRoot: config?.docsRoot,
    validation: errors.length > 0 ? "failed" : validation.warnings.length > 0 ? "passed with warnings" : "passed",
    warnings: validation.warnings,
    errors,
  };
}
