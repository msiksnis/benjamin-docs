import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { readJson, rootPath } from "./fsx.js";
import { getPackageVersion } from "./info.js";
import { checkInstalledSkills, formatHomePath, SKILL_NAME } from "./install-skill.js";
import { getDefaultSkillZipPath, skillZipExists } from "./package-skill.js";
import { normalizeConfig } from "./project-config.js";
import type { BenjaminDocsConfig } from "./types.js";
import { validateProject } from "./validate.js";

export interface DoctorResult {
  ok: boolean;
  output: string;
}

export interface DoctorOptions {
  cwd?: string;
  commandPath?: string;
  homeDir?: string;
}

export function runDoctor(options: DoctorOptions = {}): DoctorResult {
  const cwd = resolve(options.cwd ?? process.cwd());
  const commandPath = options.commandPath ?? process.argv[1] ?? "unknown";
  const skills = checkInstalledSkills(options.homeDir);
  const skillZipPath = getDefaultSkillZipPath(skills.homeDir);
  const project = inspectProject(cwd);
  const lines = [
    "benjamin-docs doctor",
    "",
    "CLI",
    `  version: ${getPackageVersion()}`,
    `  command: ${commandPath}`,
    "",
    "Skills",
  ];

  for (const target of skills.targets) {
    lines.push(`  ${target.status.padEnd(7)} ${target.label.padEnd(19)} ${formatHomePath(skills.homeDir, target.path)}`);
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

  lines.push("");
  lines.push("Claude Desktop");
  lines.push(`  upload folder: ${formatHomePath(skills.homeDir, join(skills.homeDir, ".claude", "skills", SKILL_NAME))}`);
  lines.push(`  upload zip: ${skillZipExists(skills.homeDir) ? "ok" : "missing"} ${formatHomePath(skills.homeDir, skillZipPath)}`);

  if (skills.targets.some((target) => target.status !== "ok")) {
    lines.push("");
    lines.push("Fix");
    lines.push("  benjamin-docs install-skill");
  }

  if (!skillZipExists(skills.homeDir)) {
    lines.push("");
    lines.push("Claude Desktop fix");
    lines.push("  benjamin-docs package-skill");
  }

  return {
    ok: project.errors.length === 0,
    output: lines.join("\n"),
  };
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
