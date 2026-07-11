import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  preflightExport,
  type ExportOperation,
  type ExportPolicySource,
} from "../src/export-policy.js";
import type { ReadinessDimension, ReadinessReport } from "../src/readiness.js";

const passingDimensions: ReadinessDimension[] = [
  "structure",
  "content_heuristics",
  "committed_freshness",
  "working_tree_impact",
  "agent_guidance",
].map((id) => ({
  id: id as ReadinessDimension["id"],
  status: "pass",
  blocking: true,
  summary: `${id} passes.`,
  evidence: [],
}));

const ready: ReadinessReport = {
  schemaVersion: 1,
  status: "ready",
  dimensions: passingDimensions,
  recordedEnvironmentBlockers: [],
};

const customerFeatureSources: ExportPolicySource[] = [
  {
    path: "benjamin-docs/features/owner-delete/brief.md",
    visibility: "unlisted",
    content: "# Owner Delete\n\n## What It Is\n\nRemove an owner.\n\n## How To Use It\n\nSelect Delete and confirm.",
  },
  {
    path: "benjamin-docs/features/owner-delete/handoff.md",
    visibility: "unlisted",
    content: "# Owner Delete Handoff\n\n## Implementation Verification\n\nImplementation verified: yes\n\nEvidence:\n- Checked the owner deletion flow.",
  },
];

const customerFeatureOperation: ExportOperation = {
  kind: "feature",
  profile: "customer",
};

const customerFeature = { slug: "owner-delete", scopePath: "benjamin-docs/features/owner-delete" };

function preflight(operation: ExportOperation, sources: ExportPolicySource[] = []) {
  return preflightExport({ operation, readiness: ready, sources, feature: operation.kind === "feature" ? customerFeature : undefined });
}

describe("export publication policy", () => {
  for (const kind of ["app", "handoff", "summary"] as const) {
    it(`temporarily blocks customer ${kind} exports`, () => {
      const result = preflight({ kind, profile: "customer" });

      assert.equal(result.allowed, false);
      assert.ok(result.reasons.includes(`Customer ${kind} export is disabled until the publication schema is implemented.`));
      assert.ok(result.requiredRepairs.some((repair) => repair.includes("publication schema")));
    });
  }

  for (const audience of ["public", "user"] as const) {
    it(`temporarily blocks ${audience} audience bundles`, () => {
      const result = preflight({ kind: "audience", audience });

      assert.equal(result.allowed, false);
      assert.ok(result.reasons.includes(`${audience[0]!.toUpperCase()}${audience.slice(1)} audience export is disabled until the publication schema is implemented.`));
    });
  }

  it("allows a verified customer feature when the project and sources are publication-ready", () => {
    const result = preflight(customerFeatureOperation, customerFeatureSources);

    assert.deepEqual(result, { allowed: true, reasons: [], requiredRepairs: [] });
  });

  it("requires full project readiness for customer features", () => {
    const report: ReadinessReport = {
      ...ready,
      status: "not_ready",
      dimensions: passingDimensions.map((dimension) =>
        dimension.id === "committed_freshness"
          ? { ...dimension, status: "fail", summary: "Managed docs are behind committed source.", repair: "benjamin-docs drift" }
          : dimension,
      ),
    };

    const result = preflightExport({ operation: customerFeatureOperation, readiness: report, sources: customerFeatureSources, feature: customerFeature });

    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("Project readiness is not ready: Managed docs are behind committed source."));
    assert.ok(result.requiredRepairs.includes("benjamin-docs drift"));
  });

  it("requires non-private customer feature sources, headings, and implementation evidence", () => {
    const sources: ExportPolicySource[] = [
      {
        path: "benjamin-docs/features/owner-delete/brief.md",
        visibility: "private",
        content: "# Owner Delete\n\nDescribe the feature for a future customer.",
      },
      {
        path: "benjamin-docs/features/owner-delete/handoff.md",
        visibility: "unlisted",
        content: "# Owner Delete Handoff\n\nImplementation verification is pending.",
      },
    ];

    const result = preflight(customerFeatureOperation, sources);

    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("Customer export source docs must not be private-only."));
    assert.ok(result.reasons.includes("Missing customer-facing 'What It Is' section."));
    assert.ok(result.reasons.includes("Missing customer-facing 'How To Use It' section."));
    assert.ok(result.reasons.includes("Customer-facing feature export requires an Implementation Verification section with a verified marker and at least one evidence entry."));
    assert.ok(result.requiredRepairs.includes("Add a 'What It Is' section to benjamin-docs/features/owner-delete/brief.md"));
    assert.ok(result.requiredRepairs.includes("Add a 'How To Use It' section to benjamin-docs/features/owner-delete/brief.md"));
    assert.ok(result.requiredRepairs.includes('Run: benjamin-docs export --verify owner-delete --evidence "Checked the implemented customer workflow against the current code."'));
  });

  it("rejects an implementation marker without evidence", () => {
    const sources = customerFeatureSources.map((source) =>
      source.path.endsWith("/handoff.md")
        ? { ...source, content: "# Owner Delete Handoff\n\n## Implementation Verification\n\nImplementation verified: yes" }
        : source,
    );

    const result = preflight(customerFeatureOperation, sources);

    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("Customer-facing feature export requires an Implementation Verification section with a verified marker and at least one evidence entry."));
    assert.ok(result.requiredRepairs.includes('Run: benjamin-docs export --verify owner-delete --evidence "Checked the implemented customer workflow against the current code."'));
  });

  it("rejects an empty implementation evidence entry", () => {
    const sources = customerFeatureSources.map((source) =>
      source.path.endsWith("/handoff.md")
        ? { ...source, content: "# Owner Delete Handoff\n\n## Implementation Verification\n\nImplementation verified: yes\n\nEvidence:\n-" }
        : source,
    );

    const result = preflight(customerFeatureOperation, sources);

    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("Customer-facing feature export requires an Implementation Verification section with a verified marker and at least one evidence entry."));
  });

  it("rejects prefixed, suffixed, and negated verification marker prose", () => {
    for (const marker of [
      "Status: Implementation verified: yes",
      "Implementation verified: yes please",
      "Not Implementation verified: yes",
    ]) {
      const sources = customerFeatureSources.map((source) =>
        source.path.endsWith("/handoff.md")
          ? { ...source, content: source.content.replace("Implementation verified: yes", marker) }
          : source,
      );

      const result = preflight(customerFeatureOperation, sources);

      assert.equal(result.allowed, false, marker);
      assert.ok(
        result.reasons.includes("Customer-facing feature export requires an Implementation Verification section with a verified marker and at least one evidence entry."),
        marker,
      );
    }
  });

  it("allows the standalone verification marker with surrounding whitespace and mixed case", () => {
    const sources = customerFeatureSources.map((source) =>
      source.path.endsWith("/handoff.md")
        ? { ...source, content: source.content.replace("Implementation verified: yes", "  IMPLEMENTATION VERIFIED:\tYeS  \r") }
        : source,
    );

    const result = preflight(customerFeatureOperation, sources);

    assert.deepEqual(result, { allowed: true, reasons: [], requiredRepairs: [] });
  });

  it("uses exact scope paths when required feature sources are missing", () => {
    const result = preflight(customerFeatureOperation, []);

    assert.equal(result.allowed, false);
    assert.ok(result.requiredRepairs.includes("Create or repair benjamin-docs/features/owner-delete/brief.md"));
    assert.ok(result.requiredRepairs.includes("Create or repair benjamin-docs/features/owner-delete/handoff.md"));
  });

  it("allows developer and agent exports when structural validation passes", () => {
    const staleReport: ReadinessReport = {
      ...ready,
      status: "not_ready",
      dimensions: passingDimensions.map((dimension) =>
        dimension.id === "committed_freshness" ? { ...dimension, status: "fail", summary: "Docs are stale." } : dimension,
      ),
    };

    const developer = preflightExport({
      operation: { kind: "handoff", profile: "developer" },
      readiness: staleReport,
      sources: [{ path: "benjamin-docs/handoff/agent-brief.md", visibility: "private", content: "Continue from /Users/alice/project." }],
    });
    const agent = preflightExport({
      operation: { kind: "audience", audience: "agent" },
      readiness: staleReport,
      sources: [{ path: "benjamin-docs/handoff/agent-brief.md", visibility: "private", content: "Continue from /Users/alice/project." }],
    });

    assert.equal(developer.allowed, true);
    assert.equal(agent.allowed, true);
  });

  it("blocks internal exports when structural validation fails", () => {
    const invalidReport: ReadinessReport = {
      ...ready,
      status: "not_ready",
      dimensions: passingDimensions.map((dimension) =>
        dimension.id === "structure"
          ? { ...dimension, status: "fail", summary: "Repository memory structure has validation findings.", repair: "benjamin-docs validate" }
          : dimension,
      ),
    };

    const result = preflightExport({
      operation: { kind: "feature", profile: "developer" },
      readiness: invalidReport,
      sources: [],
      feature: customerFeature,
    });

    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("Structural validation failed: Repository memory structure has validation findings."));
    assert.ok(result.requiredRepairs.includes("benjamin-docs validate"));
  });

  for (const path of ["/Users/alice/project", "/home/alice/project", "C:\\Users\\alice\\project"] as const) {
    it(`blocks customer output containing the absolute path ${path}`, () => {
      const sources = customerFeatureSources.map((source, index) =>
        index === 0 ? { ...source, content: `${source.content}\n\nLocal checkout: ${path}` } : source,
      );

      const result = preflight(customerFeatureOperation, sources);

      assert.equal(result.allowed, false);
      assert.ok(result.reasons.some((reason) => reason.includes("absolute user path")));
      assert.ok(result.requiredRepairs.some((repair) => repair.includes("brief.md")));
    });
  }

  for (const [label, pathText] of [
    ["backticked macOS path", "Local checkout: `/Users/alice/project`"],
    ["quoted Linux path", 'Local checkout: "/home/alice/project"'],
    ["Markdown link target", "[local checkout](/Users/alice/project)"],
    ["punctuation-delimited path", "Local checkout (/home/alice/project), do not publish."],
    ["quoted Windows backslash path", "Local checkout: 'C:\\Users\\alice\\project'"],
    ["Windows forward-slash path", "Local checkout: C:/Users/alice/project."],
  ] as const) {
    it(`blocks customer output containing a ${label}`, () => {
      const sources = customerFeatureSources.map((source, index) =>
        index === 0 ? { ...source, content: `${source.content}\n\n${pathText}` } : source,
      );

      const result = preflight(customerFeatureOperation, sources);

      assert.equal(result.allowed, false);
      assert.ok(result.reasons.some((reason) => reason.includes("absolute user path")));
    });
  }

  for (const [label, pathText] of [
    ["lowercase backslash path in backticks", "Local checkout: `c:\\users\\alice\\project`"],
    ["mixed-case backslash path in quotes", 'Local checkout: "c:\\UsErS\\alice\\project"'],
    ["lowercase forward-slash path with punctuation", "Local checkout (c:/users/alice/project), do not publish."],
    ["mixed-case forward-slash path in backticks", "Local checkout: `C:/uSeRs/alice/project`"],
  ] as const) {
    it(`blocks customer output containing a ${label}`, () => {
      const sources = customerFeatureSources.map((source, index) =>
        index === 0 ? { ...source, content: `${source.content}\n\n${pathText}` } : source,
      );

      const result = preflight(customerFeatureOperation, sources);

      assert.equal(result.allowed, false);
      assert.ok(result.reasons.some((reason) => reason.includes("absolute user path")));
    });
  }

  it("does not treat ordinary URLs, relative paths, or empty home roots as absolute user-home paths", () => {
    for (const text of [
      "Reference: https://example.com/Users/alice/project",
      "Reference: docs/C:/Users/alice/project",
      "Reference: Users/alice/project",
      "Reference roots: /Users/ and /home/",
    ]) {
      const sources = customerFeatureSources.map((source, index) =>
        index === 0 ? { ...source, content: `${source.content}\n\n${text}` } : source,
      );

      assert.equal(preflight(customerFeatureOperation, sources).allowed, true, text);
    }
  });

  it("blocks untouched starter content", () => {
    const sources = customerFeatureSources.map((source, index) =>
      index === 0 ? { ...source, content: `${source.content}\n\nCapture what this feature is meant to accomplish.` } : source,
    );

    const result = preflight(customerFeatureOperation, sources);

    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes("Customer export source still contains untouched starter content."));
    assert.ok(result.requiredRepairs.some((repair) => repair.includes("brief.md")));
  });
});
