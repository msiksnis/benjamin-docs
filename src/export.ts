import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { CONFIG_DIR, KNOWN_AUDIENCES, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { assertGeneratedPathSafe, ensureGeneratedDir, lstatIfExists, readGeneratedJson, rootPath, writeGeneratedText } from "./fsx.js";
import { parseMarkdown, serializeMarkdown } from "./frontmatter.js";
import { readConfig } from "./project-config.js";
import { today } from "./templates.js";
import type { Audience, BenjaminDocsConfig, ManifestFile, ParsedMarkdown, ScopeRecord, ScopesFile } from "./types.js";
import { validateProject } from "./validate.js";

export type ExportProfile = "customer" | "developer";
export type ExportDetail = "brief" | "standard" | "detailed";

export interface ExportFeatureOptions {
  profile?: ExportProfile;
  detail?: ExportDetail;
  includeArchived?: boolean;
}

export interface ExportDocumentOptions {
  profile?: ExportProfile;
  detail?: ExportDetail;
}

export interface RecordFeatureVerificationOptions {
  evidence: string;
  date?: string;
}

export interface ExportResult {
  written: string[];
  output: string;
}

export interface FeatureExportChoice {
  scope: ScopeRecord;
  readiness: FeatureExportReadiness;
  label: string;
}

export interface FeatureExportReadiness {
  status: "ready" | "blocked" | "archived";
  messages: string[];
}

interface SourceDoc {
  relativePath: string;
  parsed: ParsedMarkdown;
}

interface FeatureMatch {
  scope?: ScopeRecord;
  suggestion?: ScopeRecord;
}

interface GitState {
  commit: string;
  dirty: boolean | "unknown";
}

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

export function exportAudience(root: string, audience: string): string[] {
  const selectedAudience = parseAudience(audience);
  assertProjectExportable(root);

  const config = readConfig(root);
  const docsRoot = rootPath(root, config.docsRoot);
  const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, "Metadata path");
  const docs = findManagedMarkdownFiles(config.docsRoot, manifest, docsRoot);
  const bundleRelativeRoot = `exports/${selectedAudience}`;
  prepareCleanBundleDirectory(root, selectedAudience);
  const written: string[] = [];

  for (const { docPath, relativePath } of docs) {
    const content = readFileSync(docPath, "utf8");
    const parsed = parseMarkdown(content);
    if (!parsed.frontmatter.audience.includes(selectedAudience)) continue;

    const targetRelativePath = `${bundleRelativeRoot}/${relativePath}`;
    const targetPath = rootPath(root, ...targetRelativePath.split("/"));
    writeGeneratedText(root, targetRelativePath, content);
    written.push(targetPath);
  }

  return written;
}

export function listFeatureExportChoices(root: string): FeatureExportChoice[] {
  const config = readConfig(root);
  return readFeatureScopes(root)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((scope) => {
      const readiness = getFeatureExportReadiness(root, scope, config);
      return { scope, readiness, label: formatFeatureChoiceLabel(scope, readiness) };
    });
}

export function formatFeatureExportReadiness(root: string): string {
  const choices = listFeatureExportChoices(root);
  if (choices.length === 0) return "No feature scopes found.";

  return ["Feature export readiness", "", ...choices.map((choice) => `- ${choice.label}`)].join("\n");
}

export function exportFeature(root: string, query: string, options: ExportFeatureOptions = {}): ExportResult {
  const profile = options.profile ?? "customer";
  const detail = options.detail ?? "standard";
  assertFeatureQuerySafe(query);
  assertProjectExportable(root);

  const match = findFeatureMatch(root, query);
  if (!match.scope) {
    if (match.suggestion) {
      throw new Error(
        [
          `Feature "${query}" was not found.`,
          "",
          `Did you mean "${match.suggestion.id}"?`,
          "",
          "Run:",
          `  bd export --feature ${match.suggestion.id}`,
        ].join("\n"),
      );
    }

    throw new Error(
      [
        `Feature "${query}" does not exist in Benjamin Docs yet.`,
        "",
        "Next prompt:",
        `  Create a Benjamin Docs feature scope for ${query}, plan the feature,`,
        "  and make it export-ready for concise customer documentation.",
      ].join("\n"),
    );
  }

  if (match.scope.status === "archived" && !options.includeArchived) {
    throw new Error(
      [
        `Feature "${match.scope.id}" is archived.`,
        "",
        "Run with --include-archived if you intentionally need to export archived feature documentation.",
      ].join("\n"),
    );
  }

  const config = readConfig(root);
  const allSources = readFeatureSourceDocs(root, config.docsRoot, match.scope);
  const sources = profile === "customer" ? allSources.filter((source) => isCustomerFeatureSource(source.relativePath)) : allSources;
  if (profile === "customer") {
    assertCustomerFeatureReady(root, match.scope, sources, config);
  }

  const content =
    profile === "customer"
      ? renderCustomerFeatureExport(root, match.scope, sources, detail)
      : renderDeveloperFeatureExport(root, match.scope, sources, detail);
  const relativePath = `exports/features/${match.scope.id}-${profile}${detailSuffix(detail)}.md`;
  writeGeneratedText(root, relativePath, content);

  return {
    written: [rootPath(root, ...relativePath.split("/"))],
    output: `Exported feature documentation to ${relativePath}`,
  };
}

export function exportAppDocumentation(root: string, options: ExportDocumentOptions = {}): ExportResult {
  const profile = options.profile ?? "customer";
  const detail = options.detail ?? "standard";
  assertProjectExportable(root);

  const config = readConfig(root);
  const sources = profile === "customer" ? readCustomerProjectSources(root, config) : readDeveloperProjectSources(root, config);
  if (profile === "customer") assertCustomerDocumentReady(root, "Full app documentation", sources, config);

  const content =
    profile === "customer"
      ? renderCustomerAppDocumentation(root, config, sources, detail)
      : renderDeveloperAppDocumentation(root, config, sources, detail);
  const relativePath = `exports/app/${profile}-app-documentation${detailSuffix(detail)}.md`;
  writeGeneratedText(root, relativePath, content);

  return {
    written: [rootPath(root, ...relativePath.split("/"))],
    output: `Exported ${profile} app documentation to ${relativePath}`,
  };
}

export function exportHandoff(root: string, options: ExportDocumentOptions = {}): ExportResult {
  const profile = options.profile ?? "customer";
  const detail = options.detail ?? "standard";
  assertProjectExportable(root);

  const config = readConfig(root);
  const sources = profile === "customer" ? readCustomerHandoffSources(root, config) : readDeveloperHandoffSources(root, config);
  if (profile === "customer") assertCustomerDocumentReady(root, "Customer handoff", sources, config);

  const content =
    profile === "customer"
      ? renderCustomerHandoff(root, config, sources, detail)
      : renderDeveloperHandoff(root, config, sources, detail);
  const relativePath = `exports/handoff/${profile}-handoff${detailSuffix(detail)}.md`;
  writeGeneratedText(root, relativePath, content);

  return {
    written: [rootPath(root, ...relativePath.split("/"))],
    output: `Exported ${profile} handoff to ${relativePath}`,
  };
}

export function exportProjectSummary(root: string, options: ExportDocumentOptions = {}): ExportResult {
  const profile = options.profile ?? "customer";
  const detail = options.detail ?? "brief";
  assertProjectExportable(root);

  const config = readConfig(root);
  const sources = profile === "customer" ? readCustomerProjectSources(root, config) : readDeveloperProjectSources(root, config);
  if (profile === "customer") assertCustomerDocumentReady(root, "Project summary", sources, config);

  const content = renderProjectSummary(root, config, sources, profile, detail);
  const relativePath = `exports/summary/${profile}-project-summary${detailSuffix(detail)}.md`;
  writeGeneratedText(root, relativePath, content);

  return {
    written: [rootPath(root, ...relativePath.split("/"))],
    output: `Exported ${profile} project summary to ${relativePath}`,
  };
}

export function recordFeatureExportVerification(root: string, query: string, options: RecordFeatureVerificationOptions): ExportResult {
  assertFeatureQuerySafe(query);
  assertVerificationEvidence(options.evidence);
  assertProjectExportable(root);

  const match = findFeatureMatch(root, query);
  if (!match.scope) {
    if (match.suggestion) {
      throw new Error(
        [
          `Feature "${query}" was not found.`,
          "",
          `Did you mean "${match.suggestion.id}"?`,
          "",
          "Run:",
          `  bd export --verify ${match.suggestion.id} --evidence "<what the agent checked>"`,
        ].join("\n"),
      );
    }

    throw new Error(
      [
        `Feature "${query}" does not exist in Benjamin Docs yet.`,
        "",
        "Next prompt:",
        `  Create a Benjamin Docs feature scope for ${query}, plan the feature,`,
        "  verify it against the implementation, and make it export-ready for concise customer documentation.",
      ].join("\n"),
    );
  }

  if (match.scope.status === "archived") {
    throw new Error(`Feature "${match.scope.id}" is archived. Reactivate it before recording new export verification.`);
  }

  const relativePath = `${match.scope.path}/handoff.md`;
  const handoff = readSourceDoc(root, relativePath);
  if (!handoff) {
    throw new Error(
      [
        `Feature "${match.scope.id}" is missing its handoff doc: ${relativePath}`,
        "",
        "Next prompt:",
        `  Create or repair ${relativePath}, then verify the feature implementation before export.`,
      ].join("\n"),
    );
  }

  const date = options.date ?? today();
  const verification = [
    "Implementation verified: yes",
    "",
    `Verified on ${date}.`,
    "",
    "Evidence:",
    `- ${normalizeVerificationEvidence(options.evidence)}`,
  ].join("\n");
  const body = replaceOrAppendSection(handoff.parsed.body, "Implementation Verification", verification);
  const frontmatter = { ...handoff.parsed.frontmatter, updated: date };
  writeGeneratedText(root, relativePath, serializeMarkdown(frontmatter, body));

  return {
    written: [rootPath(root, ...relativePath.split("/"))],
    output: [
      `Recorded export verification for ${match.scope.id} in ${relativePath}`,
      "",
      "Next:",
      `  bd export --feature ${match.scope.id} --profile customer`,
    ].join("\n"),
  };
}

function assertProjectExportable(root: string): void {
  const validation = validateProject(root);
  if (validation.errors.length > 0) {
    throw new Error(["Cannot export while validation has errors:", ...validation.errors.map((error) => `- ${error}`)].join("\n"));
  }
}

function assertVerificationEvidence(evidence: string): void {
  if (!evidence.trim()) {
    throw new Error("Usage: benjamin-docs export --verify <feature> --evidence \"<what the agent checked>\"");
  }
}

function parseAudience(audience: string): Audience {
  if (!KNOWN_AUDIENCES.includes(audience as Audience)) {
    throw new Error(`Unknown audience: ${audience}. Expected one of: ${KNOWN_AUDIENCES.join(", ")}`);
  }

  return audience as Audience;
}

function assertFeatureQuerySafe(query: string): void {
  if (/[\\/]/.test(query) || query.split(/[^a-zA-Z0-9]+/).includes("..")) {
    throw new Error("Feature must be a feature slug or title, not a path.");
  }
}

function prepareCleanBundleDirectory(root: string, audience: Audience): string {
  const parts = ["exports", audience];
  const relativePath = parts.join("/");
  const bundleRoot = rootPath(root, ...parts);
  assertGeneratedPathSafe(root, parts, "Generated output path", "directory");

  const stat = lstatIfExists(bundleRoot);
  if (stat) {
    rmSync(bundleRoot, { recursive: true, force: true });
  }

  ensureGeneratedDir(root, relativePath);
  return bundleRoot;
}

function findFeatureMatch(root: string, query: string): FeatureMatch {
  const features = readFeatureScopes(root);
  const normalizedQuery = normalizeFeatureKey(query);
  const exact = features.find((scope) => scope.id === normalizedQuery || normalizeFeatureKey(scope.title) === normalizedQuery);
  if (exact) return { scope: exact };

  const suggestion = features
    .map((scope) => ({ scope, distance: editDistance(normalizedQuery, scope.id) }))
    .sort((a, b) => a.distance - b.distance)[0];
  const maxDistance = Math.max(2, Math.ceil(normalizedQuery.length * 0.25));
  if (suggestion && suggestion.distance <= maxDistance) return { suggestion: suggestion.scope };

  return {};
}

function readFeatureScopes(root: string): ScopeRecord[] {
  const scopes = readGeneratedJson<ScopesFile>(root, `${CONFIG_DIR}/${SCOPES_FILE}`, "Metadata path");
  return scopes.scopes.filter((scope) => scope.kind === "feature");
}

function readFeatureSourceDocs(root: string, docsRoot: string, scope: ScopeRecord): SourceDoc[] {
  const paths = ["brief.md", "handoff.md", "decisions.md", "plan.md"].map((file) => `${scope.path}/${file}`);
  const docs: SourceDoc[] = [];

  for (const relativePath of paths) {
    const doc = readSourceDoc(root, relativePath);
    if (doc) docs.push(doc);
  }

  return docs.filter((doc) => doc.relativePath.startsWith(`${docsRoot}/`));
}

function readCustomerProjectSources(root: string, config: BenjaminDocsConfig): SourceDoc[] {
  return readSources(root, [
    `${config.docsRoot}/project/brief.md`,
    `${config.docsRoot}/features/index.md`,
    `${config.docsRoot}/handoff/human-brief.md`,
    `${config.docsRoot}/project/roadmap.md`,
    `${config.docsRoot}/releases/changelog.md`,
    `${config.docsRoot}/project/open-questions.md`,
  ]);
}

function readDeveloperProjectSources(root: string, config: BenjaminDocsConfig): SourceDoc[] {
  return readSources(root, [
    `${config.docsRoot}/project/brief.md`,
    `${config.docsRoot}/project/roadmap.md`,
    `${config.docsRoot}/project/open-questions.md`,
    `${config.docsRoot}/features/index.md`,
    `${config.docsRoot}/engineering/architecture.md`,
    `${config.docsRoot}/engineering/code-map.md`,
    `${config.docsRoot}/releases/changelog.md`,
    `${config.docsRoot}/handoff/agent-brief.md`,
  ]);
}

function readCustomerHandoffSources(root: string, config: BenjaminDocsConfig): SourceDoc[] {
  return readSources(root, [
    `${config.docsRoot}/handoff/human-brief.md`,
    `${config.docsRoot}/project/brief.md`,
    `${config.docsRoot}/features/index.md`,
    `${config.docsRoot}/releases/changelog.md`,
    `${config.docsRoot}/project/open-questions.md`,
  ]);
}

function readDeveloperHandoffSources(root: string, config: BenjaminDocsConfig): SourceDoc[] {
  return readSources(root, [
    `${config.docsRoot}/handoff/agent-brief.md`,
    `${config.docsRoot}/project/brief.md`,
    `${config.docsRoot}/project/roadmap.md`,
    `${config.docsRoot}/engineering/architecture.md`,
    `${config.docsRoot}/engineering/code-map.md`,
    `${config.docsRoot}/features/index.md`,
  ]);
}

function readSources(root: string, relativePaths: string[]): SourceDoc[] {
  return relativePaths.map((relativePath) => readSourceDoc(root, relativePath)).filter((doc): doc is SourceDoc => Boolean(doc));
}

function readSourceDoc(root: string, relativePath: string): SourceDoc | undefined {
  const fullPath = rootPath(root, ...relativePath.split("/"));
  if (!existsSync(fullPath)) return undefined;
  return { relativePath, parsed: parseMarkdown(readFileSync(fullPath, "utf8")) };
}

function isCustomerFeatureSource(relativePath: string): boolean {
  return relativePath.endsWith("/brief.md") || relativePath.endsWith("/handoff.md");
}

function getFeatureExportReadiness(root: string, scope: ScopeRecord, config: BenjaminDocsConfig): FeatureExportReadiness {
  if (scope.status === "archived") return { status: "archived", messages: ["archived"] };

  const sources = readFeatureSourceDocs(root, config.docsRoot, scope).filter((source) => isCustomerFeatureSource(source.relativePath));
  const messages = customerFeatureReadinessMessages(scope, sources, config);
  return messages.length > 0 ? { status: "blocked", messages } : { status: "ready", messages: [] };
}

function formatFeatureChoiceLabel(scope: ScopeRecord, readiness: FeatureExportReadiness): string {
  if (readiness.status === "ready") return `${scope.title} (${scope.id}) - ready`;
  if (readiness.status === "archived") return `${scope.title} (${scope.id}) - archived`;
  return `${scope.title} (${scope.id}) - blocked: ${readiness.messages[0] ?? "not export-ready"}`;
}

function assertCustomerFeatureReady(root: string, scope: ScopeRecord, sources: SourceDoc[], config: BenjaminDocsConfig): void {
  const messages = customerFeatureReadinessMessages(scope, sources, config);
  if (messages.length === 0) return;

  throw new Error(
    [
      "Feature export readiness: blocked",
      "",
      ...messages.map((message) => `- ${message}`),
      "",
      "Next prompt:",
      `  Verify the ${scope.id} feature implementation against its Benjamin Docs.`,
      "  Check whether the documented behavior, limitations, roles, UI flow, and edge",
      "  cases match the actual code. If anything is stale or missing, update the docs",
      "  before export.",
    ].join("\n"),
  );
}

function customerFeatureReadinessMessages(scope: ScopeRecord, sources: SourceDoc[], config: BenjaminDocsConfig): string[] {
  const messages: string[] = [];
  const sourcePaths = new Set(sources.map((source) => source.relativePath));
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const normalized = normalizeContent(combined);

  if (!sourcePaths.has(`${scope.path}/brief.md`)) messages.push("Missing feature brief.");
  if (!sourcePaths.has(`${scope.path}/handoff.md`)) messages.push("Missing feature handoff.");
  if (sources.some((source) => source.parsed.frontmatter.visibility === "private")) {
    messages.push("Customer export source docs must not be private-only.");
  }
  if (!normalized.includes("what it is")) messages.push("Missing customer-facing 'What It Is' section.");
  if (!normalized.includes("how to use")) messages.push("Missing customer-facing 'How To Use It' section.");
  if (!/implementation verified:\s*yes/i.test(combined)) {
    messages.push("Customer-facing feature export should be verified against implementation first.");
  }

  for (const leak of findLeakRisks(combined, config)) {
    messages.push(`Possible customer-facing leak risk: ${leak}.`);
  }

  return messages;
}

function assertCustomerDocumentReady(root: string, label: string, sources: SourceDoc[], config: BenjaminDocsConfig): void {
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const messages: string[] = [];

  if (sources.length === 0) messages.push("No customer-relevant source docs were found.");
  for (const leak of findLeakRisks(combined, config)) {
    messages.push(`Possible customer-facing leak risk: ${leak}.`);
  }

  if (messages.length === 0) return;

  throw new Error(
    [
      `${label} export readiness: blocked`,
      "",
      ...messages.map((message) => `- ${message}`),
      "",
      "Next prompt:",
      "  Review the customer-facing Benjamin Docs source files, remove internal-only",
      "  language, and rerun bd export.",
    ].join("\n"),
  );
}

function renderCustomerFeatureExport(root: string, scope: ScopeRecord, sources: SourceDoc[], detail: ExportDetail): string {
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const sections = detailSections(
    [
      ["What It Is", extractSection(combined, "What It Is") || firstParagraph(combined)],
      ["When To Use It", extractSection(combined, "When To Use It")],
      ["How To Use It", extractSection(combined, "How To Use It")],
      ["What Happens", extractSection(combined, "What Happens") || extractSection(combined, "Outcome")],
      ["Known Limits", extractSection(combined, "Known Limits") || extractSection(combined, "Known Limitations")],
      ["Support Notes", extractSection(combined, "Support Notes")],
      ["Verification", extractSection(combined, "Implementation Verification")],
    ],
    detail,
  );

  return renderExportDocument({
    root,
    title: scope.title,
    exportType: "feature",
    profile: "customer",
    detail,
    sources,
    extraFrontmatter: [`source_scope: ${scope.id}`, "implementation_verified: true"],
    sections,
  });
}

function renderDeveloperFeatureExport(root: string, scope: ScopeRecord, sources: SourceDoc[], detail: ExportDetail): string {
  const sections = sources.map((source) => [
    source.parsed.frontmatter.title,
    [`Source: \`${source.relativePath}\``, "", source.parsed.body.trim()].join("\n"),
  ] satisfies [string, string]);

  return renderExportDocument({
    root,
    title: scope.title,
    exportType: "feature",
    profile: "developer",
    detail,
    sources,
    extraFrontmatter: [`source_scope: ${scope.id}`],
    sections: detailSections(sections, detail),
  });
}

function renderCustomerAppDocumentation(root: string, config: BenjaminDocsConfig, sources: SourceDoc[], detail: ExportDetail): string {
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const sections = detailSections(
    [
      ["Overview", extractAnySection(combined, ["Current State", "Overview", "Summary"]) || firstParagraph(combined)],
      ["Core Workflows", featureSummary(root, config, { includeReasons: false })],
      ["How To Use It", extractAnySection(combined, ["How To Use It", "How To Use", "Common Tasks"]) || "Use the workflows listed below as the starting point for customer onboarding and support."],
      ["Roles And Permissions", extractAnySection(combined, ["Roles And Permissions", "Roles", "Permissions", "Access"])],
      ["Known Limits", extractAnySection(combined, ["Known Limits", "Known Limitations", "Non-Goals", "Open Questions"])],
      ["Support Notes", extractAnySection(combined, ["Support Notes", "Risks / Open Questions", "Next Actions"])],
      ["Recent Changes", extractAnySection(combined, ["Changelog", "Recent Changes", "Notable Changes"])],
    ],
    detail,
  );

  return renderExportDocument({
    root,
    title: "App Documentation",
    exportType: "app_documentation",
    profile: "customer",
    detail,
    sources,
    sections,
  });
}

function renderDeveloperAppDocumentation(root: string, config: BenjaminDocsConfig, sources: SourceDoc[], detail: ExportDetail): string {
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const sections = detailSections(
    [
      ["Overview", extractAnySection(combined, ["Current State", "Overview", "Summary"]) || firstParagraph(combined)],
      ["Feature Map", featureSummary(root, config, { includeReasons: true })],
      ["Architecture", extractAnySection(combined, ["Architecture", "System Shape"])],
      ["Code Map", extractAnySection(combined, ["Code Map", "Important Files"])],
      ["Commands And Checks", extractAnySection(combined, ["Commands And Checks", "Validation"])],
      ["Risks And Open Questions", extractAnySection(combined, ["Risks / Hazards", "Risks", "Open Questions"])],
      ["Recent Changes", extractAnySection(combined, ["Changelog", "Recent Changes", "Notable Changes"])],
    ],
    detail,
  );

  return renderExportDocument({
    root,
    title: "Developer App Documentation",
    exportType: "app_documentation",
    profile: "developer",
    detail,
    sources,
    sections,
  });
}

function renderCustomerHandoff(root: string, config: BenjaminDocsConfig, sources: SourceDoc[], detail: ExportDetail): string {
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const sections = detailSections(
    [
      ["Overview", extractAnySection(combined, ["Current State", "Overview", "Summary"]) || firstParagraph(combined)],
      ["Key Workflows", featureSummary(root, config, { includeReasons: false })],
      ["How To Use It", extractAnySection(combined, ["How To Use It", "How To Use", "Common Tasks"])],
      ["Known Limits", extractAnySection(combined, ["Known Limits", "Known Limitations", "Open Questions", "Non-Goals"])],
      ["Support Notes", extractAnySection(combined, ["Support Notes", "Next Actions", "Risks / Open Questions"])],
      ["Recent Changes", extractAnySection(combined, ["Changelog", "Recent Changes", "Notable Changes"])],
    ],
    detail,
  );

  return renderExportDocument({
    root,
    title: "Customer Handoff",
    exportType: "handoff",
    profile: "customer",
    detail,
    sources,
    sections,
  });
}

function renderDeveloperHandoff(root: string, config: BenjaminDocsConfig, sources: SourceDoc[], detail: ExportDetail): string {
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const sections = detailSections(
    [
      ["Current State", extractAnySection(combined, ["Current State", "Continuation Proof", "Overview"]) || firstParagraph(combined)],
      ["Read First", extractAnySection(combined, ["Read First"])],
      ["Feature Map", featureSummary(root, config, { includeReasons: true })],
      ["Architecture And Code Map", [extractAnySection(combined, ["Architecture"]), extractAnySection(combined, ["Code Map"])].filter(Boolean).join("\n\n")],
      ["Commands And Checks", extractAnySection(combined, ["Commands And Checks", "Validation"])],
      ["Risks And Next Actions", [extractAnySection(combined, ["Risks / Hazards", "Risks"]), extractAnySection(combined, ["Next Actions"])].filter(Boolean).join("\n\n")],
    ],
    detail,
  );

  return renderExportDocument({
    root,
    title: "Developer Handoff",
    exportType: "handoff",
    profile: "developer",
    detail,
    sources,
    sections,
  });
}

function renderProjectSummary(
  root: string,
  config: BenjaminDocsConfig,
  sources: SourceDoc[],
  profile: ExportProfile,
  detail: ExportDetail,
): string {
  const combined = sources.map((source) => source.parsed.body).join("\n\n");
  const sections = detailSections(
    [
      ["Summary", extractAnySection(combined, ["Current State", "Overview", "Summary"]) || firstParagraph(combined)],
      ["Features", featureSummary(root, config, { includeReasons: profile === "developer" })],
      ["Next", extractAnySection(combined, ["Next", "Next Actions"])],
      ["Known Limits", extractAnySection(combined, ["Known Limits", "Open Questions", "Risks / Hazards"])],
    ],
    detail,
  );

  return renderExportDocument({
    root,
    title: "Project Summary",
    exportType: "summary",
    profile,
    detail,
    sources,
    sections,
  });
}

function renderExportDocument(options: {
  root: string;
  title: string;
  exportType: string;
  profile: ExportProfile;
  detail: ExportDetail;
  sources: SourceDoc[];
  sections: Array<[string, string]>;
  extraFrontmatter?: string[];
}): string {
  const git = getGitState(options.root);
  const sections = options.sections.filter((section): section is [string, string] => Boolean(section[1]?.trim()));

  return [
    "---",
    `title: ${options.title}`,
    `export_type: ${options.exportType}`,
    `export_profile: ${options.profile}`,
    `export_detail: ${options.detail}`,
    `source_docs: [${options.sources.map((source) => source.relativePath).join(", ")}]`,
    `source_docs_updated: ${latestSourceUpdate(options.sources)}`,
    `source_commit: ${git.commit}`,
    `source_dirty: ${git.dirty}`,
    `exported_at: "${new Date().toISOString()}"`,
    "generated: true",
    "refresh: Regenerate this file with bd export after Benjamin Docs source docs or implementation changes.",
    ...(options.extraFrontmatter ?? []),
    "---",
    "",
    `# ${options.title}`,
    "",
    "> Generated snapshot. Benjamin Docs source files remain the source of truth; rerun `bd export` after docs or implementation changes.",
    "",
    ...sections.flatMap(([heading, body]) => [`## ${heading}`, "", formatSectionBody(body, options.detail), ""]),
  ].join("\n");
}

function detailSections(sections: Array<[string, string | undefined]>, detail: ExportDetail): Array<[string, string]> {
  const present = sections.filter((section): section is [string, string] => Boolean(section[1]?.trim()));
  if (detail === "detailed") return present;
  if (detail === "brief") return present.slice(0, 4);
  return present.slice(0, 6);
}

function formatSectionBody(body: string, detail: ExportDetail): string {
  const trimmed = body.trim();
  if (detail === "detailed") return trimmed;
  const lines = trimmed.split("\n");
  const maxLines = detail === "brief" ? 8 : 16;
  if (lines.length <= maxLines) return trimmed;
  return `${lines.slice(0, maxLines).join("\n")}\n\n...`;
}

function featureSummary(root: string, config: BenjaminDocsConfig, options: { includeReasons: boolean }): string {
  const features = readFeatureScopes(root).sort((a, b) => a.title.localeCompare(b.title));
  if (features.length === 0) return "";

  return features
    .map((scope) => {
      const readiness = getFeatureExportReadiness(root, scope, config);
      const status =
        readiness.status === "blocked" && options.includeReasons
          ? `blocked: ${readiness.messages[0] ?? "not export-ready"}`
          : readiness.status === "blocked"
            ? "blocked: not export-ready"
            : readiness.status;
      return `- ${scope.title}: ${status}`;
    })
    .join("\n");
}

function extractAnySection(markdown: string, headings: string[]): string {
  for (const heading of headings) {
    const section = extractSection(markdown, heading);
    if (section) return section;
  }
  return "";
}

function extractSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`(?:^|\\n)##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{1,6}\\s+|$)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function replaceOrAppendSection(markdown: string, heading: string, body: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionPattern = new RegExp(`(^|\\n)##\\s+${escaped}\\s*\\n[\\s\\S]*?(?=\\n#{1,6}\\s+|$)`, "i");
  const nextSection = `## ${heading}\n\n${body.trim()}`;
  const trimmed = markdown.trimEnd();

  if (sectionPattern.test(trimmed)) {
    return trimmed.replace(sectionPattern, (match, prefix: string) => `${prefix}${nextSection}`);
  }

  return `${trimmed}\n\n${nextSection}`;
}

function normalizeVerificationEvidence(evidence: string): string {
  return evidence
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\s*[-*]\s+/, "");
}

function firstParagraph(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("#")) ?? "";
}

function findLeakRisks(markdown: string, config: BenjaminDocsConfig): string[] {
  const normalized = markdown.toLowerCase();
  const phrases = [...DEFAULT_BLOCKED_PHRASES, ...(config.export?.blockedPhrases ?? [])];
  const found = new Set<string>();

  for (const phrase of phrases) {
    if (phrase && normalized.includes(phrase.toLowerCase())) found.add(phrase);
  }

  return [...found];
}

function latestSourceUpdate(sources: SourceDoc[]): string {
  return sources.map((source) => source.parsed.frontmatter.updated).sort().at(-1) ?? "unknown";
}

function getGitState(root: string): GitState {
  try {
    const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const status = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return { commit: commit || "unknown", dirty: Boolean(status) };
  } catch {
    return { commit: "unknown", dirty: "unknown" };
  }
}

function detailSuffix(detail: ExportDetail): string {
  return detail === "standard" ? "" : `-${detail}`;
}

function normalizeContent(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeFeatureKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let index = 0; index <= a.length; index += 1) rows[index]![0] = index;
  for (let index = 0; index <= b.length; index += 1) rows[0]![index] = index;

  for (let aIndex = 1; aIndex <= a.length; aIndex += 1) {
    for (let bIndex = 1; bIndex <= b.length; bIndex += 1) {
      const cost = a[aIndex - 1] === b[bIndex - 1] ? 0 : 1;
      rows[aIndex]![bIndex] = Math.min(
        rows[aIndex - 1]![bIndex]! + 1,
        rows[aIndex]![bIndex - 1]! + 1,
        rows[aIndex - 1]![bIndex - 1]! + cost,
      );
    }
  }

  return rows[a.length]![b.length]!;
}

function findManagedMarkdownFiles(docsRootName: string, manifest: ManifestFile, docsRoot: string): Array<{ docPath: string; relativePath: string }> {
  const docsRootPrefix = `${docsRootName}/`;

  return manifest.docs
    .filter((doc) => doc.startsWith(docsRootPrefix) && doc.endsWith(".md"))
    .map((doc) => ({
      docPath: rootPath(docsRoot, ...doc.slice(docsRootPrefix.length).split("/")),
      relativePath: doc.slice(docsRootPrefix.length),
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
