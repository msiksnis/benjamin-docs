import { CONFIG_DIR, MANIFEST_FILE } from "./constants.js";
import { readGeneratedJson } from "./fsx.js";
import { readConfig } from "./project-config.js";
import type { ManifestFile } from "./types.js";

const METADATA_LABEL = "Metadata path";
const FINALIZE_FLOW = "After updating docs, run `benjamin-docs views`, then `benjamin-docs ready`.";

export function getNextPrompt(root: string): string {
  const config = readConfig(root);
  const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, METADATA_LABEL);
  const docsRoot = config.docsRoot;

  if (config.focus === "feature") {
    const feature = config.feature ?? findLatestFeature(manifest, docsRoot);
    if (feature) return featurePrompt(docsRoot, feature, config.mode === "codebase");
  }

  if (config.focus === "codebase" || config.mode === "codebase") {
    return codebasePrompt(docsRoot);
  }

  return planningPrompt(docsRoot);
}

export function formatNextMessage(prompt: string): string {
  return ["Next, ask your agent:", "", prompt].join("\n");
}

function planningPrompt(docsRoot: string): string {
  return [
    "Capture the current project plan with benjamin-docs.",
    `Update ${docsRoot}/project/brief.md, ${docsRoot}/project/roadmap.md,`,
    `${docsRoot}/project/open-questions.md, and ${docsRoot}/handoff/agent-brief.md.`,
    "Read repo-local agent guidance and .benjamin-docs/config.json first when present.",
    "Use plain language. Summarize decisions, rejected options, risks, and next steps.",
    "Make agent-brief.md a continuation proof: read-first docs, current state, commands/checks, risks/hazards, and next actions.",
    "Mark uncertain items clearly.",
    FINALIZE_FLOW,
  ].join("\n");
}

function codebasePrompt(docsRoot: string): string {
  return [
    "Capture the current project baseline with benjamin-docs.",
    "Read the existing codebase and any existing docs as context. Then update",
    `${docsRoot}/project/brief.md, ${docsRoot}/project/roadmap.md,`,
    `${docsRoot}/project/open-questions.md, ${docsRoot}/engineering/architecture.md,`,
    `${docsRoot}/engineering/code-map.md, ${docsRoot}/handoff/human-brief.md,`,
    `and ${docsRoot}/handoff/agent-brief.md.`,
    "Read repo-local agent guidance and .benjamin-docs/config.json first when present.",
    "Keep project docs understandable for non-technical readers.",
    "Make human-brief.md a short plain-language summary for the owner or teammate.",
    "Make agent-brief.md a continuation proof: read-first docs, current state, commands/checks, risks/hazards, and next actions.",
    "Mark uncertain items, call out risks, and add useful code anchors where relevant.",
    FINALIZE_FLOW,
  ].join("\n");
}

function featurePrompt(docsRoot: string, feature: string, codebaseMode: boolean): string {
  const codebaseInstruction = codebaseMode
    ? "First read the existing codebase and Benjamin docs."
    : "First read the current Benjamin docs and any planning notes.";

  return [
    `Capture the ${feature} feature with benjamin-docs.`,
    codebaseInstruction,
    `Then update ${docsRoot}/project/roadmap.md, ${docsRoot}/project/open-questions.md,`,
    `${docsRoot}/handoff/agent-brief.md, and the feature docs under`,
    `${docsRoot}/features/${feature}/.`,
    "Read repo-local agent guidance and .benjamin-docs/config.json first when present.",
    "Include decisions, rejected options, risks, implementation notes, and next steps.",
    "Make agent-brief.md a continuation proof: read-first docs, current state, commands/checks, risks/hazards, and next actions.",
    "Keep the brief and handoff understandable for non-technical readers.",
    "Mark uncertain items clearly.",
    FINALIZE_FLOW,
  ].join("\n");
}

function findLatestFeature(manifest: ManifestFile, docsRoot: string): string | undefined {
  const prefix = `${docsRoot}/features/`;
  const featurePaths = manifest.docs.filter((doc) => doc.startsWith(prefix) && doc !== `${docsRoot}/features/index.md`);
  const latest = featurePaths.at(-1);
  if (!latest) return undefined;

  return latest.slice(prefix.length).split("/", 1)[0];
}
