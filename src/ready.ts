import { checkAgentContracts } from "./agent-contracts.js";
import { runDoctor } from "./doctor.js";
import { reviewProject, type ReviewIssue } from "./review.js";
import { validateProject } from "./validate.js";

export interface ReadyResult {
  ok: boolean;
  output: string;
}

export interface ReadyOptions {
  cwd?: string;
  commandPath?: string;
}

export function checkReady(options: ReadyOptions = {}): ReadyResult {
  const cwd = options.cwd ?? process.cwd();
  const validation = validateProject(cwd);
  const review = reviewProject(cwd);
  const doctor = runDoctor({ cwd, commandPath: options.commandPath, strict: true });
  const agentContracts = checkAgentContracts(cwd);

  const validationOk = validation.errors.length === 0 && validation.warnings.length === 0;
  const reviewOk = review.errors.length === 0 && review.warnings.length === 0;
  const doctorOk = doctor.ok;
  const agentContractsOk = agentContracts.ok;
  const ok = validationOk && reviewOk && doctorOk && (!agentContracts.enabled || agentContractsOk);

  const checks = [
    formatCheck("validate", validationOk, summarizeValidation(validation)),
    formatCheck("review", reviewOk, summarizeReview(review)),
    formatCheck("doctor --strict", doctorOk, doctorOk ? "setup ok" : "setup gaps found"),
  ];

  if (agentContracts.enabled) {
    checks.push(formatCheck("agent guidance", agentContractsOk, agentContracts.summary));
  }

  const lines = [
    "benjamin-docs ready",
    "",
    `status: ${ok ? "ready" : "not ready"}`,
    "",
    "Checks",
    ...checks,
  ];

  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    lines.push("");
    lines.push("Validation");
    for (const error of validation.errors) lines.push(`  - error: ${error}`);
    for (const warning of validation.warnings) lines.push(`  - warning: ${warning}`);
  }

  if (review.errors.length > 0 || review.warnings.length > 0) {
    lines.push("");
    lines.push("Review");
    for (const issue of review.errors) lines.push(`  - error: ${formatReviewIssue(issue)}`);
    for (const issue of review.warnings) lines.push(`  - warning: ${formatReviewIssue(issue)}`);
  }

  if (!doctorOk) {
    lines.push("");
    lines.push("Doctor");
    lines.push(indent(doctor.output));
  }

  if (agentContracts.enabled && (agentContracts.errors.length > 0 || agentContracts.warnings.length > 0)) {
    lines.push("");
    lines.push("Agent Guidance");
    for (const error of agentContracts.errors) lines.push(`  - error: ${error}`);
    for (const warning of agentContracts.warnings) lines.push(`  - warning: ${warning}`);
  }

  lines.push("");
  lines.push("Next");
  lines.push(ok ? "  Project memory is ready for handoff." : "  Fix the failed checks, then run: benjamin-docs ready");

  return { ok, output: lines.join("\n") };
}

function formatCheck(label: string, ok: boolean, summary: string): string {
  return `  ${ok ? "ok  " : "fail"}  ${label} - ${summary}`;
}

function summarizeValidation(result: ReturnType<typeof validateProject>): string {
  if (result.errors.length === 0 && result.warnings.length === 0) return "structure ok";
  return `${result.errors.length} errors, ${result.warnings.length} warnings`;
}

function summarizeReview(result: ReturnType<typeof reviewProject>): string {
  if (result.errors.length === 0 && result.warnings.length === 0) return `${result.docsChecked} docs useful`;
  return `${result.errors.length} errors, ${result.warnings.length} warnings`;
}

function formatReviewIssue(issue: ReviewIssue): string {
  return issue.path ? `${issue.path}: ${issue.message}` : issue.message;
}

function indent(text: string): string {
  return text.split("\n").map((line) => `  ${line}`).join("\n");
}
