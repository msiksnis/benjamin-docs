import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMarkdown, serializeMarkdown } from "../src/frontmatter.js";

describe("frontmatter", () => {
  it("parses markdown with yaml-like frontmatter", () => {
    const parsed = parseMarkdown(`---\ntitle: Test Doc\nscope: feature\nscope_id: booking-capacity\naudience: [developer, agent]\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: session-capture\n---\n\n# Test Doc\n`);

    assert.equal(parsed.frontmatter.title, "Test Doc");
    assert.equal(parsed.frontmatter.scope, "feature");
    assert.deepEqual(parsed.frontmatter.audience, ["developer", "agent"]);
    assert.equal(parsed.body.trim(), "# Test Doc");
  });

  it("parses markdown with CRLF frontmatter", () => {
    const parsed = parseMarkdown("---\r\ntitle: Test Doc\r\nscope: project\r\nscope_id: project\r\naudience: [developer]\r\nstatus: draft\r\nvisibility: private\r\nupdated: 2026-06-03\r\nsource: manual\r\n---\r\n\r\n# Test Doc\r\n");

    assert.equal(parsed.frontmatter.scope, "project");
    assert.deepEqual(parsed.frontmatter.audience, ["developer"]);
    assert.equal(parsed.body.trim(), "# Test Doc");
  });

  it("throws when a required frontmatter field is missing", () => {
    assert.throws(
      () => parseMarkdown(`---\ntitle: Missing Scope\nscope_id: missing-scope\naudience: [developer]\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: manual\n---\n\n# Missing Scope\n`),
      /Missing required frontmatter field: scope/,
    );
  });

  it("throws when audience is scalar", () => {
    assert.throws(
      () => parseMarkdown(`---\ntitle: Scalar Audience\nscope: project\nscope_id: project\naudience: developer\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: manual\n---\n\n# Scalar Audience\n`),
      /Frontmatter field audience must be an array/,
    );
  });

  it("throws when audience is empty", () => {
    assert.throws(
      () => parseMarkdown(`---\ntitle: Empty Audience\nscope: project\nscope_id: project\naudience: []\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: manual\n---\n\n# Empty Audience\n`),
      /Frontmatter field audience must include at least one value/,
    );
  });

  it("throws when scope is unknown", () => {
    assert.throws(
      () => parseMarkdown(`---\ntitle: Unknown Scope\nscope: workspace\nscope_id: unknown-scope\naudience: [developer]\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: manual\n---\n\n# Unknown Scope\n`),
      /Unknown frontmatter scope: workspace/,
    );
  });

  it("throws when audience contains an unknown value", () => {
    assert.throws(
      () => parseMarkdown(`---\ntitle: Unknown Audience\nscope: project\nscope_id: project\naudience: [developer, investor]\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: manual\n---\n\n# Unknown Audience\n`),
      /Unknown frontmatter audience: investor/,
    );
  });

  it("throws when updated is not YYYY-MM-DD", () => {
    assert.throws(
      () => parseMarkdown(`---\ntitle: Bad Updated\nscope: project\nscope_id: project\naudience: [developer]\nstatus: draft\nvisibility: private\nupdated: 2026-6-3\nsource: manual\n---\n\n# Bad Updated\n`),
      /Frontmatter field updated must be YYYY-MM-DD/,
    );
  });

  it("throws when updated is not a real calendar date", () => {
    assert.throws(
      () => parseMarkdown(`---\ntitle: Impossible Updated\nscope: project\nscope_id: project\naudience: [developer]\nstatus: draft\nvisibility: private\nupdated: 2026-02-30\nsource: manual\n---\n\n# Impossible Updated\n`),
      /Frontmatter field updated must be YYYY-MM-DD/,
    );
  });

  it("serializes markdown frontmatter deterministically", () => {
    const output = serializeMarkdown(
      {
        title: "Agent Brief",
        scope: "handoff",
        scope_id: "agent-brief",
        audience: ["agent"],
        status: "draft",
        visibility: "private",
        updated: "2026-06-03",
        source: "session-capture",
      },
      "# Agent Brief\n\nCurrent state.\n",
    );

    assert.match(output, /^---\ntitle: Agent Brief\nscope: handoff\n/);
    assert.match(output, /audience: \[agent\]/);
    assert.match(output, /\n---\n\n# Agent Brief/);
  });
});
