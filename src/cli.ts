#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { addAnchor, listAnchors } from "./anchors.js";
import { installAgentContracts } from "./agent-contracts.js";
import { getChatProjectGuide, type ChatProjectGuideOptions } from "./chat-project.js";
import { allCommands, getCommandsText, type CommandEntry } from "./commands.js";
import { runDoctor, type DoctorOptions, type DoctorTarget } from "./doctor.js";
import { detectDrift, formatDrift } from "./drift.js";
import {
  exportAppDocumentation,
  exportAudience,
  exportFeature,
  exportHandoff,
  exportProjectSummary,
  formatFeatureExportReadiness,
  listFeatureExportChoices,
  recordFeatureExportVerification,
  type ExportDetail,
  type ExportProfile,
} from "./export.js";
import { initProject, looksLikeCodebase, promoteToCodebase, type InitProjectOptions } from "./init.js";
import { getAnchorHelpText, getHelpText, getInitHelpText, getIntroductionText, getPackageVersion, getScopeHelpText } from "./info.js";
import { checkHooks, formatHooksResult, installHooks, knownHookTargets, uninstallHooks, type HookTargetId } from "./hooks.js";
import { formatInstallSkillResult, installSkill, knownSkillTargets, type InstallSkillOptions, type SkillTargetId } from "./install-skill.js";
import { formatSessionStart, formatSessionStop, parseSessionHookInput, type SessionHookFormat } from "./session.js";
import { checkMcp, formatMcpResult, installMcp, knownMcpTargets, uninstallMcp, type McpTargetId } from "./mcp-install.js";
import { serveMcp } from "./mcp-server.js";
import { formatNextMessage, getNextPrompt } from "./next.js";
import { formatPackageSkillResult, packageSkill, type PackageSkillOptions } from "./package-skill.js";
import { checkReady } from "./ready.js";
import { reviewProject, type ReviewOptions } from "./review.js";
import { createScope, setScopeStatus } from "./scopes.js";
import { getStatus } from "./status.js";
import { refreshUpdateCache } from "./update-check.js";
import { runUpgrade } from "./upgrade.js";
import type { FocusType } from "./types.js";
import { validateProject } from "./validate.js";
import { generateMemoryViews } from "./views.js";

export function initChoiceLabels(): string[] {
  return ["A new project or idea", "A codebase or app", "One feature, change, or plan"];
}

export function shouldOfferAgentGuidance(setup: FocusType): boolean {
  return setup === "codebase" || setup === "feature";
}

export function agentGuidancePromptLabel(): string {
  return "Add AI agent guidance for this project? Recommended.";
}

export function hooksPromptLabel(): string {
  return "Install optional session-start context hooks (Claude Code, Codex, Cursor)? They supply a compact pointer/context packet; agents still read and maintain memory during normal work. Recommended.";
}

export async function main(argv: string[] = process.argv.slice(2), cwd: string = process.cwd()): Promise<number> {
  const [command] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(getHelpText());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log(getPackageVersion());
    return 0;
  }

  if (command === "commands") {
    if (process.stdin.isTTY && process.stdout.isTTY) {
      return runCommandDrawer(cwd);
    }

    console.log(getCommandsText());
    return 0;
  }

  if (command === "introduce") {
    console.log(getIntroductionText());
    return 0;
  }

  if (command === "chat-project") {
    console.log(getChatProjectGuide(parseChatProjectArgs(argv.slice(1))));
    return 0;
  }

  if (command === "install-skill") {
    const options = parseInstallSkillArgs(argv.slice(1));
    const result = installSkill(options);
    console.log(formatInstallSkillResult(result));
    return 0;
  }

  if (command === "doctor") {
    const options = parseDoctorArgs(argv.slice(1));
    const result = runDoctor({ cwd, commandPath: process.argv[1], ...options });
    console.log(result.output);
    return result.ok ? 0 : 1;
  }

  if (command === "review") {
    const result = reviewProject(cwd, parseReviewArgs(argv.slice(1)));
    console.log(result.output);
    return result.ok ? 0 : 1;
  }

  if (command === "hooks") {
    const options = parseHooksArgs(argv.slice(1));
    if (options.action === "install") {
      console.log(formatHooksResult("install", installHooks(cwd, options.targets)));
      return 0;
    }
    if (options.action === "uninstall") {
      console.log(formatHooksResult("uninstall", uninstallHooks(cwd, options.targets)));
      return 0;
    }
    console.log(formatHooksResult("status", checkHooks(cwd, options.targets)));
    return 0;
  }

  if (command === "session-start") {
    const hookInput = parseSessionHookInput(await readStdinText());
    const output = formatSessionStart(cwd, parseSessionFormat(argv.slice(1), "session-start"), process.argv[1], hookInput);
    if (output) console.log(output);
    return 0;
  }

  if (command === "mcp") {
    const args = argv.slice(1);
    if (args.length === 0) {
      await serveMcp(cwd);
      return 0;
    }

    const options = parseMcpArgs(args);
    if (options.action === "install") {
      console.log(formatMcpResult("install", installMcp(cwd, options.targets)));
      return 0;
    }
    if (options.action === "uninstall") {
      console.log(formatMcpResult("uninstall", uninstallMcp(cwd, options.targets)));
      return 0;
    }
    console.log(formatMcpResult("status", checkMcp(cwd, options.targets)));
    return 0;
  }

  if (command === "update-cache") {
    await refreshUpdateCache(new Date().toISOString());
    return 0;
  }

  if (command === "upgrade") {
    const hooksOption = await resolveUpgradeHooksOption(argv.slice(1));
    const result = await runUpgrade(cwd, { hooks: hooksOption });
    console.log(result.output);
    return result.ok ? 0 : 1;
  }

  if (command === "session-stop") {
    const hookInput = parseSessionHookInput(await readStdinText());
    const output = formatSessionStop(cwd, parseSessionFormat(argv.slice(1), "session-stop"), hookInput);
    if (output) console.log(output);
    return 0;
  }

  if (command === "drift") {
    const options = parseDriftArgs(argv.slice(1));
    const result = detectDrift(cwd);
    console.log(options.json ? JSON.stringify(result, null, 2) : formatDrift(result));
    if (!result.initialized || result.analysisFailure) return 1;
    return options.strict && result.drifted.length > 0 ? 1 : 0;
  }

  if (command === "ready") {
    const result = checkReady({ cwd, commandPath: process.argv[1], json: parseReadyArgs(argv.slice(1)).json });
    console.log(result.output);
    return result.ok ? 0 : 1;
  }

  if (command === "package-skill") {
    const result = packageSkill(parsePackageSkillArgs(argv.slice(1)));
    console.log(formatPackageSkillResult(result));
    return 0;
  }

  if (command === "init") {
    if (hasHelpArg(argv.slice(1))) {
      console.log(getInitHelpText());
      return 0;
    }

    const options = await resolveInitOptions(argv.slice(1), cwd);
    const result = initProject(cwd, options);
    console.log(`Initialized benjamin-docs. ${result.written.length} files created.`);
    if (options.agentContract) {
      const agentResult = installAgentContracts(cwd, { children: options.childContracts });
      for (const message of agentResult.messages) console.log(message);
    }
    if (options.hooks) {
      console.log("");
      console.log(formatHooksResult("install", installHooks(cwd)));
    }
    console.log("");
    console.log(formatNextMessage(getNextPrompt(cwd)));
    return 0;
  }

  if (command === "next") {
    console.log(formatNextMessage(getNextPrompt(cwd)));
    return 0;
  }

  if (command === "status") {
    console.log(getStatus(cwd));
    return 0;
  }

  if (command === "views") {
    const written = generateMemoryViews(cwd);
    console.log(written.length === 0 ? "Memory Views are already up to date. 0 files updated." : `Generated Memory Views. ${written.length} files updated.`);
    return 0;
  }

  if (command === "scope") {
    if (hasHelpArg(argv.slice(1))) {
      console.log(getScopeHelpText());
      return 0;
    }

    if (argv[1] === "status") {
      const id = argv[2];
      const status = argv[3];
      if (!id || !status) {
        throw new Error("Usage: benjamin-docs scope status <id> <status>");
      }

      const result = setScopeStatus(cwd, id, status);
      console.log(`Set ${result.scope.kind} scope ${id} to ${status}. ${result.updatedDocs.length} docs updated.`);
      return 0;
    }

    if (argv[1] !== "create") {
      throw new Error("Usage: benjamin-docs scope create feature <slug> OR benjamin-docs scope status <id> <status>");
    }

    const kind = argv[2];
    const id = argv[3];
    if (!kind || !id) {
      throw new Error("Usage: benjamin-docs scope create feature <slug>");
    }

    const written = createScope(cwd, kind, id);
    console.log(`Created ${kind} scope ${id}. ${written.length} files created.`);
    return 0;
  }

  if (command === "anchor") {
    if (hasHelpArg(argv.slice(1))) {
      console.log(getAnchorHelpText());
      return 0;
    }

    if (argv[1] === "list") {
      console.log(listAnchors(cwd));
      return 0;
    }

    if (argv[1] !== "add") {
      throw new Error("Usage: benjamin-docs anchor add <id> <file> OR benjamin-docs anchor list");
    }

    const id = argv[2];
    const file = argv[3];
    if (!id || !file) {
      throw new Error("Usage: benjamin-docs anchor add <id> <file>");
    }

    addAnchor(cwd, id, file);
    console.log(`Added anchor ${id}.`);
    return 0;
  }

  if (command === "validate") {
    const result = validateProject(cwd);
    for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
    if (result.errors.length > 0) {
      for (const error of result.errors) console.error(`Error: ${error}`);
      return 1;
    }

    console.log("Validation passed.");
    return 0;
  }

  if (command === "export") {
    const options = parseExportArgs(argv.slice(1));
    if (options.list) {
      console.log(formatFeatureExportReadiness(cwd));
      return 0;
    }

    if (options.verify) {
      const result = recordFeatureExportVerification(cwd, options.verify, { evidence: options.evidence ?? "" });
      console.log(result.output);
      return 0;
    }

    if (options.feature) {
      const result = exportFeature(cwd, options.feature, { profile: options.profile, detail: options.detail, includeArchived: options.includeArchived });
      console.log(result.output);
      return 0;
    }

    if (options.type === "app") {
      const result = exportAppDocumentation(cwd, { profile: options.profile, detail: options.detail });
      console.log(result.output);
      return 0;
    }

    if (options.type === "handoff") {
      const result = exportHandoff(cwd, { profile: options.profile, detail: options.detail });
      console.log(result.output);
      return 0;
    }

    if (options.type === "summary") {
      const result = exportProjectSummary(cwd, { profile: options.profile, detail: options.detail });
      console.log(result.output);
      return 0;
    }

    if (options.audience) {
      const written = exportAudience(cwd, options.audience);
      console.log(`Exported ${options.audience} bundle. ${written.length} files written.`);
      return 0;
    }

    if (process.stdin.isTTY && process.stdout.isTTY) {
      return runExportDrawer(cwd);
    }

    console.log("bd export is an interactive guide. Run it in a terminal, or ask your agent to use direct export flags.");
    return 1;
  }

  if (command === "promote") {
    if (argv[1] !== "--to" || argv[2] !== "codebase") {
      throw new Error("Usage: benjamin-docs promote --to codebase");
    }

    const written = promoteToCodebase(cwd);
    console.log(`Promoted benjamin-docs to codebase mode. ${written.length} files created.`);
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  console.error("");
  console.error(getHelpText());
  return 1;
}

async function resolveInitOptions(args: string[], cwd: string): Promise<InitProjectOptions> {
  const parsed = parseInitArgs(args);
  if (parsed.setup) return applyInitDefaults(parsed);

  if (process.stdin.isTTY && process.stdout.isTTY) {
    const prompted = await promptForInitOptions();
    return applyInitDefaults({ ...prompted, ...parsed });
  }

  const setup: FocusType = looksLikeCodebase(cwd) ? "codebase" : "project";
  return applyInitDefaults({ ...parsed, setup });
}

function parseInitArgs(args: string[]): InitProjectOptions {
  const options: InitProjectOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--mode" || arg === "--type" || arg === "--setup") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs init --mode <planning|codebase|feature>");
      options.setup = parseSetup(value);
      index += 1;
      continue;
    }

    if (arg === "--feature") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs init --mode feature --feature <slug>");
      options.feature = value;
      index += 1;
      continue;
    }

    if (arg === "--docs-root") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs init --docs-root <path>");
      options.docsRoot = value;
      index += 1;
      continue;
    }

    if (arg === "--agent-contract") {
      options.agentContract = true;
      continue;
    }

    if (arg === "--no-agent-contract") {
      options.agentContract = false;
      options.childContracts = false;
      continue;
    }

    if (arg === "--children") {
      options.childContracts = true;
      continue;
    }

    if (arg === "--hooks") {
      options.hooks = true;
      continue;
    }

    if (arg === "--no-hooks") {
      options.hooks = false;
      continue;
    }

    throw new Error(`Unknown init option: ${arg}`);
  }

  if (options.childContracts && !options.agentContract) {
    throw new Error("Usage: benjamin-docs init --agent-contract --children");
  }

  return options;
}

function parseReviewArgs(args: string[]): ReviewOptions {
  const options: ReviewOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--changed") {
      options.changed = true;
      continue;
    }

    if (arg === "--since") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs review --changed --since <git-ref>");
      options.changed = true;
      options.since = value;
      index += 1;
      continue;
    }

    throw new Error("Usage: benjamin-docs review [--changed] [--since <git-ref>]");
  }

  return options;
}

async function resolveUpgradeHooksOption(args: string[]): Promise<boolean | undefined> {
  let hooks: boolean | undefined;

  for (const arg of args) {
    if (arg === "--hooks") {
      hooks = true;
      continue;
    }

    if (arg === "--no-hooks") {
      hooks = false;
      continue;
    }

    throw new Error("Usage: benjamin-docs upgrade [--hooks|--no-hooks]");
  }

  return hooks;
}

interface McpArgs {
  action: "install" | "uninstall" | "status";
  targets?: McpTargetId[];
}

function parseMcpArgs(args: string[]): McpArgs {
  const [action, ...rest] = args;
  if (action !== "install" && action !== "uninstall" && action !== "status") {
    throw new Error("Usage: benjamin-docs mcp [install|status|uninstall] [--target <claude-code|cursor|codex>]");
  }

  const options: McpArgs = { action };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--target") {
      const value = rest[index + 1];
      const ids = knownMcpTargets().map((target) => target.id);
      if (!value || !ids.includes(value as McpTargetId)) {
        throw new Error(`Usage: benjamin-docs mcp ${action} --target <${ids.join("|")}>`);
      }
      options.targets = [...(options.targets ?? []), value as McpTargetId];
      index += 1;
      continue;
    }

    throw new Error(`Unknown mcp option: ${arg}`);
  }

  return options;
}

interface HooksArgs {
  action: "install" | "uninstall" | "status";
  targets?: HookTargetId[];
}

function parseHooksArgs(args: string[]): HooksArgs {
  const [action, ...rest] = args;
  if (action !== "install" && action !== "uninstall" && action !== "status") {
    throw new Error("Usage: benjamin-docs hooks <install|status|uninstall> [--target <claude-code|codex|cursor>]");
  }

  const options: HooksArgs = { action };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--target") {
      const value = rest[index + 1];
      const ids = knownHookTargets().map((target) => target.id);
      if (!value || !ids.includes(value as HookTargetId)) {
        throw new Error(`Usage: benjamin-docs hooks ${action} --target <${ids.join("|")}>`);
      }
      options.targets = [...(options.targets ?? []), value as HookTargetId];
      index += 1;
      continue;
    }

    throw new Error(`Unknown hooks option: ${arg}`);
  }

  return options;
}

function parseSessionFormat(args: string[], command: string): SessionHookFormat | undefined {
  if (args.length === 0) return undefined;

  const [flag, value, ...rest] = args;
  if (flag !== "--format" || rest.length > 0 || (value !== "claude" && value !== "codex" && value !== "cursor")) {
    throw new Error(`Usage: benjamin-docs ${command} [--format <claude|codex|cursor>]`);
  }

  return value;
}

async function readStdinText(): Promise<string> {
  if (process.stdin.isTTY) return "";

  let data = "";
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}

function parseDriftArgs(args: string[]): { json?: boolean; strict?: boolean } {
  const options: { json?: boolean; strict?: boolean } = {};

  for (const arg of args) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    throw new Error("Usage: benjamin-docs drift [--json] [--strict]");
  }

  return options;
}

interface ExportArgs {
  audience?: string;
  feature?: string;
  profile?: ExportProfile;
  detail?: ExportDetail;
  type?: "app" | "handoff" | "summary";
  list?: boolean;
  includeArchived?: boolean;
  verify?: string;
  evidence?: string;
}

function parseExportArgs(args: string[]): ExportArgs {
  const options: ExportArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--audience") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs export --audience <audience>");
      options.audience = value;
      index += 1;
      continue;
    }

    if (arg === "--feature") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs export --feature <feature>");
      options.feature = value;
      index += 1;
      continue;
    }

    if (arg === "--verify") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs export --verify <feature> --evidence \"<what the agent checked>\"");
      options.verify = value;
      index += 1;
      continue;
    }

    if (arg === "--evidence") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs export --verify <feature> --evidence \"<what the agent checked>\"");
      options.evidence = value;
      index += 1;
      continue;
    }

    if (arg === "--profile") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs export --profile <customer|developer>");
      options.profile = parseExportProfile(value);
      index += 1;
      continue;
    }

    if (arg === "--detail") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs export --detail <brief|standard|detailed>");
      options.detail = parseExportDetail(value);
      index += 1;
      continue;
    }

    if (arg === "--type") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs export --type <app|handoff|summary>");
      options.type = parseExportType(value);
      index += 1;
      continue;
    }

    if (arg === "--include-archived") {
      options.includeArchived = true;
      continue;
    }

    if (arg === "--list") {
      options.list = true;
      continue;
    }

    throw new Error("Usage: benjamin-docs export [--audience <audience>] [--feature <feature> --profile <customer|developer>] [--verify <feature> --evidence \"<what the agent checked>\"] [--type <app|handoff|summary>]");
  }

  if (options.verify && !options.evidence) {
    throw new Error("Usage: benjamin-docs export --verify <feature> --evidence \"<what the agent checked>\"");
  }

  return options;
}

function parseExportProfile(value: string): ExportProfile {
  if (value === "customer" || value === "developer") return value;
  throw new Error("Usage: benjamin-docs export --profile <customer|developer>");
}

function parseExportDetail(value: string): ExportDetail {
  if (value === "brief" || value === "standard" || value === "detailed") return value;
  throw new Error("Usage: benjamin-docs export --detail <brief|standard|detailed>");
}

function parseExportType(value: string): "app" | "handoff" | "summary" {
  if (value === "app" || value === "handoff" || value === "summary") return value;
  throw new Error("Usage: benjamin-docs export --type <app|handoff|summary>");
}

function applyInitDefaults(options: InitProjectOptions): InitProjectOptions {
  if (options.setup === "codebase" && options.agentContract === undefined) {
    return { ...options, agentContract: true, childContracts: options.childContracts ?? true };
  }

  if (options.setup === "codebase" && options.agentContract && options.childContracts === undefined) {
    return { ...options, childContracts: true };
  }

  return options;
}

function isHelpArg(arg: string | undefined): boolean {
  return arg === "help" || arg === "--help" || arg === "-h";
}

function hasHelpArg(args: string[]): boolean {
  return args.some((arg) => isHelpArg(arg));
}

function parseSetup(value: string): FocusType {
  if (value === "planning" || value === "project") return "project";
  if (value === "codebase") return "codebase";
  if (value === "feature") return "feature";
  throw new Error("Usage: benjamin-docs init --mode <planning|codebase|feature>");
}

function parseInstallSkillArgs(args: string[]): InstallSkillOptions {
  const options: InstallSkillOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--target") {
      const value = args[index + 1];
      if (!value) throw new Error(`Usage: benjamin-docs install-skill --target <all|${knownSkillTargets().map((target) => target.id).join("|")}>`);
      options.target = parseSkillTarget(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown install-skill option: ${arg}`);
  }

  return options;
}

const DOCTOR_USAGE = "benjamin-docs doctor [--strict] [--target shared|claude-code|codex|cursor|claude-desktop]";
const DOCTOR_TARGETS: DoctorTarget[] = ["shared", "claude-code", "codex", "cursor", "claude-desktop"];

function parseDoctorArgs(args: string[]): Pick<DoctorOptions, "strict" | "target"> {
  const options: Pick<DoctorOptions, "strict" | "target"> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    if (arg === "--target") {
      const value = args[index + 1];
      if (!value || !DOCTOR_TARGETS.includes(value as DoctorTarget)) throw new Error(DOCTOR_USAGE);
      options.target = value as DoctorTarget;
      index += 1;
      continue;
    }

    throw new Error(`Unknown doctor option: ${arg}`);
  }

  return options;
}

function parseReadyArgs(args: string[]): { json: boolean } {
  let json = false;
  for (const arg of args) {
    if (arg === "--json") {
      json = true;
      continue;
    }
    throw new Error(`Unknown ready option: ${arg}`);
  }
  return { json };
}

function parseSkillTarget(value: string): SkillTargetId {
  if (value === "all") return "all";
  if (value === "shared") return "agents";
  if (value === "claude") return "claude-code";
  const ids = knownSkillTargets().map((target) => target.id);
  if (ids.includes(value as Exclude<SkillTargetId, "all">)) return value as SkillTargetId;
  throw new Error(`Usage: benjamin-docs install-skill --target <all|${ids.join("|")}>`);
}

function parsePackageSkillArgs(args: string[]): PackageSkillOptions {
  const options: PackageSkillOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--out" || arg === "--output") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs package-skill --output <file-or-folder>");
      options.out = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown package-skill option: ${arg}`);
  }

  return options;
}

function parseChatProjectArgs(args: string[]): ChatProjectGuideOptions {
  const options: ChatProjectGuideOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--name") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs chat-project --name <project-name>");
      options.name = value;
      index += 1;
      continue;
    }

    if (arg === "--path") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs chat-project --path <project-path>");
      options.path = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown chat-project option: ${arg}`);
  }

  return options;
}

async function promptForInitOptions(): Promise<InitProjectOptions> {
  const labels = initChoiceLabels();
  const choices: Array<{ label: string; setup: FocusType }> = [
    { label: labels[0] ?? "A new project or idea", setup: "project" },
    { label: labels[1] ?? "A codebase or app", setup: "codebase" },
    { label: labels[2] ?? "One feature, change, or plan", setup: "feature" },
  ];
  const selected = await selectChoice("What are you setting up?", choices.map((choice) => choice.label));
  const setup = choices[selected ?? 0]?.setup ?? "project";

  const options: InitProjectOptions = { setup };

  if (setup === "feature") {
    options.feature = await promptLine("Feature slug: ");
  }

  if (shouldOfferAgentGuidance(setup)) {
    options.agentContract = await confirmChoice(agentGuidancePromptLabel(), true);
    options.hooks = await confirmChoice(hooksPromptLabel(), true);
  }

  return options;
}

async function runCommandDrawer(cwd: string): Promise<number> {
  const selected = await promptForCommandEntry();
  if (!selected) {
    console.log("No command selected.");
    return 0;
  }

  const args = await resolveCommandEntryArgs(selected);
  console.log(`$ ${formatShellCommand(args)}`);
  console.log("");

  return main(args, cwd);
}

async function runExportDrawer(cwd: string): Promise<number> {
  const choices = [
    "Full app documentation (temporarily unavailable)",
    "Feature documentation",
    "Customer handoff (temporarily unavailable)",
    "Developer handoff",
    "Project summary (temporarily unavailable)",
  ];
  const selected = await selectChoice("What do you want to export?", choices, {
    allowCancel: true,
    hint: "Use Up/Down, j/k, or type a number. Press Enter to continue. Press q or Esc to cancel.",
  });

  if (selected === undefined) {
    console.log("No export selected.");
    return 0;
  }

  const detail = await promptForExportDetail();
  if (detail === undefined) {
    console.log("No export selected.");
    return 0;
  }

  if (selected === 0) {
    const result = exportAppDocumentation(cwd, { profile: "customer", detail });
    console.log(result.output);
    return 0;
  }

  if (selected === 2) {
    const result = exportHandoff(cwd, { profile: "customer", detail });
    console.log(result.output);
    return 0;
  }

  if (selected === 3) {
    const result = exportHandoff(cwd, { profile: "developer", detail });
    console.log(result.output);
    return 0;
  }

  if (selected === 4) {
    const result = exportProjectSummary(cwd, { profile: "customer", detail });
    console.log(result.output);
    return 0;
  }

  const features = listFeatureExportChoices(cwd);
  if (features.length === 0) {
    console.log("No feature scopes found. Create one with `bd scope create feature <slug>` or ask your agent to plan the feature first.");
    return 0;
  }

  const featureIndex = await selectChoice(
    "Which feature?",
    features.map((feature) => feature.label),
    {
      allowCancel: true,
      hint: "Use Up/Down, j/k, or type a number. Press Enter to export. Press q or Esc to cancel.",
    },
  );

  if (featureIndex === undefined) {
    console.log("No feature selected.");
    return 0;
  }

  const feature = features[featureIndex];
  if (!feature) {
    console.log("No feature selected.");
    return 0;
  }

  const result = exportFeature(cwd, feature.scope.id, { profile: "customer", detail });
  console.log(result.output);
  return 0;
}

async function promptForExportDetail(): Promise<ExportDetail | undefined> {
  const details: ExportDetail[] = ["brief", "standard", "detailed"];
  const selected = await selectChoice("How much detail?", ["Brief", "Standard", "Detailed"], {
    allowCancel: true,
    hint: "Use Up/Down, j/k, or type a number. Press Enter to continue. Press q or Esc to cancel.",
  });

  return selected === undefined ? undefined : details[selected];
}

async function promptForCommandEntry(): Promise<CommandEntry | undefined> {
  const entries = allCommands();
  const choices = entries.map((entry) => `${entry.command.padEnd(48)} ${entry.description}`);
  const selected = await selectChoice("benjamin-docs commands", choices, {
    allowCancel: true,
    hint: "Use Up/Down, j/k, or type a number. Press Enter to run. Press q or Esc to cancel.",
  });

  return selected === undefined ? undefined : entries[selected];
}

async function resolveCommandEntryArgs(entry: CommandEntry): Promise<string[]> {
  const args: string[] = [];

  for (const arg of entry.args) {
    if (arg === "<slug>") {
      args.push(await promptRequiredLine("Feature slug: "));
      continue;
    }

    if (arg === "<id>") {
      args.push(await promptRequiredLine("Anchor id: "));
      continue;
    }

    if (arg === "<file>") {
      args.push(await promptRequiredLine("Anchor file path: "));
      continue;
    }

    if (arg === "<status>") {
      args.push(await promptRequiredLine("Status (draft|review|approved|stale|archived): "));
      continue;
    }

    if (arg === "<evidence>") {
      args.push(await promptRequiredLine("Verification evidence: "));
      continue;
    }

    args.push(arg);
  }

  return args;
}

async function promptLine(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function promptRequiredLine(question: string): Promise<string> {
  while (true) {
    const answer = await promptLine(question);
    if (answer) return answer;

    process.stdout.write("Please enter a value.\n");
  }
}

async function confirmChoice(question: string, defaultValue: boolean): Promise<boolean> {
  const suffix = defaultValue ? " [Y/n]: " : " [y/N]: ";

  while (true) {
    const answer = (await promptLine(`${question}${suffix}`)).trim().toLowerCase();
    if (!answer) return defaultValue;
    if (answer === "y" || answer === "yes") return true;
    if (answer === "n" || answer === "no") return false;

    process.stdout.write("Please answer yes or no.\n");
  }
}

interface SelectChoiceOptions {
  allowCancel?: boolean;
  hint?: string;
}

async function selectChoice(question: string, choices: string[], options: SelectChoiceOptions = {}): Promise<number | undefined> {
  let selected = 0;
  let numberBuffer = "";
  let numberBufferTimer: ReturnType<typeof setTimeout> | undefined;
  const input = process.stdin;

  emitKeypressEvents(input);
  input.setRawMode(true);

  const render = (): void => {
    process.stdout.write("\x1Bc");
    process.stdout.write(`${question}\n\n`);
    choices.forEach((choice, index) => {
      const number = `${index + 1}.`.padStart(4);
      process.stdout.write(`${index === selected ? "> " : "  "}${number} ${choice}\n`);
    });
    process.stdout.write(`\n${options.hint ?? "Use Up/Down, j/k, or type a number. Press Enter to continue."}\n`);
    if (numberBuffer) process.stdout.write(`Number: ${numberBuffer}\n`);
  };

  return new Promise((resolve) => {
    const cleanup = (): void => {
      if (numberBufferTimer) clearTimeout(numberBufferTimer);
      input.setRawMode(false);
      input.off("keypress", onKeypress);
      input.pause();
      process.stdout.write("\n");
    };

    const resetNumberBufferSoon = (): void => {
      if (numberBufferTimer) clearTimeout(numberBufferTimer);
      numberBufferTimer = setTimeout(() => {
        numberBuffer = "";
        render();
      }, 1000);
    };

    const onKeypress = (str: string, key: { name?: string; ctrl?: boolean }): void => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(130);
      }

      if (options.allowCancel && (key.name === "escape" || str === "q")) {
        cleanup();
        resolve(undefined);
        return;
      }

      if (key.name === "up" || str === "k") {
        numberBuffer = "";
        selected = selected === 0 ? choices.length - 1 : selected - 1;
        render();
        return;
      }

      if (key.name === "down" || str === "j") {
        numberBuffer = "";
        selected = selected === choices.length - 1 ? 0 : selected + 1;
        render();
        return;
      }

      if (/^\d$/.test(str)) {
        const maxDigits = String(choices.length).length;
        numberBuffer = `${numberBuffer}${str}`.slice(-maxDigits);
        let index = Number(numberBuffer) - 1;

        if (index < 0 || index >= choices.length) {
          numberBuffer = str === "0" ? "" : str;
          index = Number(numberBuffer) - 1;
        }

        if (index >= 0 && index < choices.length) {
          selected = index;
        }

        resetNumberBufferSoon();
        render();
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(selected);
      }
    };

    input.resume();
    input.on("keypress", onKeypress);
    render();
  });
}

function formatShellCommand(args: string[]): string {
  return ["benjamin-docs", ...args].map(formatShellArg).join(" ");
}

function formatShellArg(arg: string): string {
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(arg)) return arg;
  return `'${arg.replaceAll("'", "'\\''")}'`;
}

function isDirectInvocation(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;

  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(invokedPath);
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
