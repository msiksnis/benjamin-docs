import type { ReadinessDimension, ReadinessReport } from "./readiness.js";
import type { Audience, Visibility } from "./types.js";

export type ExportOperation =
  | { kind: "feature"; profile: "customer" | "developer" }
  | { kind: "app" | "handoff" | "summary"; profile: "customer" | "developer" }
  | { kind: "audience"; audience: Audience };

export interface ExportPolicySource {
  path: string;
  visibility: Visibility;
  content: string;
}

export interface ExportPreflightRequest {
  operation: ExportOperation;
  readiness: ReadinessReport;
  sources: ExportPolicySource[];
  blockedPhrases?: string[];
  feature?: {
    slug: string;
    scopePath: string;
  };
}

export interface ExportPreflightResult {
  allowed: boolean;
  reasons: string[];
  requiredRepairs: string[];
}

const ABSOLUTE_PATH_PATTERNS = [
  /(?:^|[\s(])\/Users\/[^\s)]+/m,
  /(?:^|[\s(])\/home\/[^\s)]+/m,
  /(?:^|[\s(])[A-Za-z]:\\Users\\[^\s)]+/m,
];

const STARTER_PHRASES = [
  "Capture what this project is, who it serves, and why it matters.",
  "Capture the current MVP, near-term next steps, and deferred ideas.",
  "Track decisions that are not settled yet.",
  "Use this for a concise handoff to another person.",
  "Use this to orient future AI agents quickly.",
  "Capture the planned or current system shape, major boundaries, and important constraints.",
  "Capture important files, modules, routes, schemas, and tests when code exists.",
  "Track feature scopes that are planned, in progress, shipped, or deferred.",
  "Track notable changes.",
  "Capture what this feature is meant to accomplish.",
  "Capture the implementation or execution plan.",
  "Capture durable decisions, rejected options, and reasoning.",
  "Capture status, open questions, and next actions for this feature.",
];

const DEFAULT_BLOCKED_PHRASES = [
  "AGENTS.md",
  "agent-only",
  "api key",
  "internal only",
  "password",
  "private key",
  "process.env",
  "secret",
  "stack trace",
  "token",
  ".env",
];

export function preflightExport(request: ExportPreflightRequest): ExportPreflightResult {
  const reasons: string[] = [];
  const requiredRepairs: string[] = [];
  const publicationOutput = isPublicationOutput(request.operation);

  addTemporaryPublicationBlock(request.operation, reasons, requiredRepairs);

  if (publicationOutput) {
    addPublicationSourceFailures(request.sources, request.blockedPhrases ?? [], reasons, requiredRepairs);
    addReadinessFailures(request.readiness, reasons, requiredRepairs);
  } else {
    addStructuralFailure(request.readiness, reasons, requiredRepairs);
  }

  if (request.operation.kind === "feature" && request.operation.profile === "customer") {
    addCustomerFeatureFailures(request.feature, request.sources, reasons, requiredRepairs);
  }

  return {
    allowed: reasons.length === 0,
    reasons: unique(reasons),
    requiredRepairs: unique(requiredRepairs),
  };
}

function isPublicationOutput(operation: ExportOperation): boolean {
  if (operation.kind === "audience") return operation.audience === "public" || operation.audience === "user";
  return operation.profile === "customer";
}

function addTemporaryPublicationBlock(operation: ExportOperation, reasons: string[], repairs: string[]): void {
  if (operation.kind === "audience") {
    if (operation.audience === "public" || operation.audience === "user") {
      const label = `${operation.audience[0]!.toUpperCase()}${operation.audience.slice(1)}`;
      reasons.push(`${label} audience export is disabled until the publication schema is implemented.`);
      repairs.push("Implement the publication schema in docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md before enabling public or user audience export.");
    }
    return;
  }

  if (operation.kind !== "feature" && operation.profile === "customer") {
    reasons.push(`Customer ${operation.kind} export is disabled until the publication schema is implemented.`);
    repairs.push(`Implement the publication schema in docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md before enabling customer ${operation.kind} export.`);
  }
}

function addReadinessFailures(report: ReadinessReport, reasons: string[], repairs: string[]): void {
  if (report.status === "ready") return;

  for (const dimension of report.dimensions) {
    if (!dimension.blocking || dimension.status === "pass") continue;
    reasons.push(`Project readiness is not ready: ${dimension.summary}`);
    addDimensionRepair(dimension, repairs);
  }
}

function addStructuralFailure(report: ReadinessReport, reasons: string[], repairs: string[]): void {
  const structure = report.dimensions.find((dimension) => dimension.id === "structure");
  if (structure?.status === "pass") return;

  reasons.push(`Structural validation failed: ${structure?.summary ?? "The structure dimension is missing from the readiness report."}`);
  repairs.push(structure?.repair ?? "benjamin-docs validate");
}

function addDimensionRepair(dimension: ReadinessDimension, repairs: string[]): void {
  if (dimension.repair) repairs.push(dimension.repair);
  else repairs.push("benjamin-docs ready");
}

function addPublicationSourceFailures(sources: ExportPolicySource[], blockedPhrases: string[], reasons: string[], repairs: string[]): void {
  const privateSources = sources.filter((source) => source.visibility === "private");
  if (privateSources.length > 0) {
    reasons.push("Customer export source docs must not be private-only.");
    repairs.push(...privateSources.map((source) => `Review and change visibility only if publication is intended: ${source.path}`));
  }

  const pathSources = sources.filter((source) => ABSOLUTE_PATH_PATTERNS.some((pattern) => pattern.test(source.content)));
  if (pathSources.length > 0) {
    reasons.push("Customer or public export source contains an absolute user path.");
    repairs.push(...pathSources.map((source) => `Remove or replace absolute user paths in ${source.path}`));
  }

  const starterSources = sources.filter((source) => STARTER_PHRASES.some((phrase) => source.content.includes(phrase)));
  if (starterSources.length > 0) {
    reasons.push("Customer export source still contains untouched starter content.");
    repairs.push(...starterSources.map((source) => `Capture real project context in ${source.path}`));
  }

  const leakPhrases = [...DEFAULT_BLOCKED_PHRASES, ...blockedPhrases];
  const leakSources = sources.filter((source) => leakPhrases.some((phrase) => phrase && source.content.toLowerCase().includes(phrase.toLowerCase())));
  for (const source of leakSources) {
    for (const phrase of leakPhrases) {
      if (!phrase || !source.content.toLowerCase().includes(phrase.toLowerCase())) continue;
      reasons.push(`Possible customer-facing leak risk: ${phrase}.`);
      repairs.push(`Remove customer-facing leak risk '${phrase}' from ${source.path}`);
    }
  }
}

function addCustomerFeatureFailures(
  feature: ExportPreflightRequest["feature"],
  sources: ExportPolicySource[],
  reasons: string[],
  repairs: string[],
): void {
  const brief = sources.find((source) => source.path.endsWith("/brief.md"));
  const handoff = sources.find((source) => source.path.endsWith("/handoff.md"));
  const combined = sources.map((source) => source.content).join("\n\n");
  const inferredScopePath = brief?.path.replace(/\/brief\.md$/, "") ?? handoff?.path.replace(/\/handoff\.md$/, "");
  const scopePath = feature?.scopePath ?? inferredScopePath ?? "the feature source directory";
  const briefPath = `${scopePath}/brief.md`;
  const handoffPath = `${scopePath}/handoff.md`;

  if (!brief) {
    reasons.push("Missing feature brief.");
    repairs.push(`Create or repair ${briefPath}`);
  }
  if (!handoff) {
    reasons.push("Missing feature handoff.");
    repairs.push(`Create or repair ${handoffPath}`);
  }
  if (!hasHeading(combined, "What It Is")) {
    reasons.push("Missing customer-facing 'What It Is' section.");
    repairs.push(`Add a 'What It Is' section to ${briefPath}`);
  }
  if (!hasHeading(combined, "How To Use It")) {
    reasons.push("Missing customer-facing 'How To Use It' section.");
    repairs.push(`Add a 'How To Use It' section to ${briefPath}`);
  }
  const verification = handoff ? extractSection(handoff.content, "Implementation Verification") : "";
  if (!hasVerifiedMarker(verification) || !hasEvidenceEntry(verification)) {
    reasons.push("Customer-facing feature export requires an Implementation Verification section with a verified marker and at least one evidence entry.");
    repairs.push(
      feature
        ? `Run: benjamin-docs export --verify ${feature.slug} --evidence "Checked the implemented customer workflow against the current code."`
        : `Add a verified marker and non-empty evidence entry to ${handoffPath}`,
    );
  }
}

function hasVerifiedMarker(verification: string): boolean {
  return /^[ \t]*implementation verified:[ \t]*yes[ \t]*\r?$/im.test(verification);
}

function hasHeading(content: string, heading: string): boolean {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\n)#{1,6}\\s+${escaped}\\s*(?:\\n|$)`, "i").test(content);
}

function extractSection(content: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`(?:^|\\n)#{1,6}\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{1,6}\\s+|$)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function hasEvidenceEntry(verification: string): boolean {
  return /(?:^|\n)Evidence:\s*\n(?:[ \t]*\n)*[ \t]*[-*]\s+\S[^\n]*/i.test(verification);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
