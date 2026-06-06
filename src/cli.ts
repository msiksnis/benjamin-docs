#!/usr/bin/env node
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { addAnchor } from "./anchors.js";
import { getChatProjectGuide, type ChatProjectGuideOptions } from "./chat-project.js";
import { runDoctor } from "./doctor.js";
import { exportAudience } from "./export.js";
import { initProject, promoteToCodebase, type InitProjectOptions } from "./init.js";
import { getHelpText, getIntroductionText, getPackageVersion } from "./info.js";
import { formatInstallSkillResult, installSkill, knownSkillTargets, type InstallSkillOptions, type SkillTargetId } from "./install-skill.js";
import { formatNextMessage, getNextPrompt } from "./next.js";
import { formatPackageSkillResult, packageSkill, type PackageSkillOptions } from "./package-skill.js";
import { reviewProject } from "./review.js";
import { createScope } from "./scopes.js";
import { getStatus } from "./status.js";
import type { FocusType } from "./types.js";
import { validateProject } from "./validate.js";

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
    const result = reviewProject(cwd);
    console.log(result.output);
    return result.ok ? 0 : 1;
  }

  if (command === "package-skill") {
    const result = packageSkill(parsePackageSkillArgs(argv.slice(1)));
    console.log(formatPackageSkillResult(result));
    return 0;
  }

  if (command === "init") {
    const options = await resolveInitOptions(argv.slice(1));
    const result = initProject(cwd, options);
    console.log(`Initialized benjamin-docs. ${result.written.length} files created.`);
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

  if (command === "scope") {
    if (argv[1] !== "create") {
      throw new Error("Usage: benjamin-docs scope create feature <slug>");
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
    if (argv[1] !== "add") {
      throw new Error("Usage: benjamin-docs anchor add <id> <file>");
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
    const audienceIndex = argv.indexOf("--audience");
    const audience = audienceIndex === -1 ? undefined : argv[audienceIndex + 1];
    if (!audience) {
      throw new Error("Usage: benjamin-docs export --audience <audience>");
    }

    const written = exportAudience(cwd, audience);
    console.log(`Exported ${audience} bundle. ${written.length} files written.`);
    return 0;
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

async function resolveInitOptions(args: string[]): Promise<InitProjectOptions> {
  const parsed = parseInitArgs(args);
  if (parsed.setup) return parsed;

  if (process.stdin.isTTY && process.stdout.isTTY) {
    return promptForInitOptions();
  }

  return { setup: "project" };
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

    throw new Error(`Unknown init option: ${arg}`);
  }

  return options;
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

function parseDoctorArgs(args: string[]): { strict?: boolean } {
  const options: { strict?: boolean } = {};

  for (const arg of args) {
    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    throw new Error(`Unknown doctor option: ${arg}`);
  }

  return options;
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

    if (arg === "--out") {
      const value = args[index + 1];
      if (!value) throw new Error("Usage: benjamin-docs package-skill --out <file-or-folder>");
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
  const choices: Array<{ label: string; setup: FocusType }> = [
    { label: "Planning a new project", setup: "project" },
    { label: "Documenting an existing codebase", setup: "codebase" },
    { label: "Planning/documenting one feature", setup: "feature" },
  ];
  const selected = await selectChoice("What are you setting up?", choices.map((choice) => choice.label));
  const setup = choices[selected]?.setup ?? "project";

  if (setup !== "feature") return { setup };

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const feature = (await rl.question("Feature slug: ")).trim();
    return { setup, feature };
  } finally {
    rl.close();
  }
}

async function selectChoice(question: string, choices: string[]): Promise<number> {
  let selected = 0;
  const input = process.stdin;

  emitKeypressEvents(input);
  input.setRawMode(true);

  const render = (): void => {
    process.stdout.write("\x1Bc");
    process.stdout.write(`${question}\n\n`);
    choices.forEach((choice, index) => {
      process.stdout.write(`${index === selected ? "> " : "  "}${choice}\n`);
    });
    process.stdout.write("\nNavigate to select. Press Enter to continue.\n");
  };

  return new Promise((resolve) => {
    const cleanup = (): void => {
      input.setRawMode(false);
      input.off("keypress", onKeypress);
      process.stdout.write("\n");
    };

    const onKeypress = (str: string, key: { name?: string; ctrl?: boolean }): void => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(130);
      }

      if (key.name === "up" || str === "k") {
        selected = selected === 0 ? choices.length - 1 : selected - 1;
        render();
        return;
      }

      if (key.name === "down" || str === "j") {
        selected = selected === choices.length - 1 ? 0 : selected + 1;
        render();
        return;
      }

      if (/^[1-9]$/.test(str)) {
        const index = Number(str) - 1;
        if (index >= 0 && index < choices.length) {
          selected = index;
          render();
        }
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(selected);
      }
    };

    input.on("keypress", onKeypress);
    render();
  });
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
