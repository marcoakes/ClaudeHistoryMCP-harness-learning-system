import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ingestRun, buildTaskContext, harnessHealth } from "../../src/harness/analyzer.js";

async function makeRepoRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "harness-learning-"));
}

describe("harness learning system", () => {
  it("ingests runs and generates suggested skill after confidence threshold", async () => {
    const repoRoot = await makeRepoRoot();

    const transcript = [
      "Error: deployment failed because terraform state lock timed out.",
      "Fix: use retry with backoff and verify lock owner before force-unlock.",
      "Could not find deployment guardrail docs in AGENTS.md",
    ].join("\n");

    await ingestRun({ transcriptOrPath: transcript, source: "codex_cli", contributor: "agent-a", runId: "run-1", repoRoot });
    await ingestRun({ transcriptOrPath: transcript, source: "claude_code", contributor: "agent-b", runId: "run-2", repoRoot });
    const third = await ingestRun({ transcriptOrPath: transcript, source: "codex_app", contributor: "agent-c", runId: "run-3", repoRoot });

    expect(third.addedObservations).toBeGreaterThan(0);

    const suggestedDir = join(repoRoot, ".harness", "learnings", "suggested-skills");
    const files = await readdir(suggestedDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it("builds token-budgeted task context", async () => {
    const repoRoot = await makeRepoRoot();
    await ingestRun({
      transcriptOrPath: "Error: test failed due to missing migration. Fix: run migration before tests.",
      source: "manual",
      contributor: "human",
      runId: "run-ctx-1",
      repoRoot,
    });

    const context = await buildTaskContext({
      task: "Fix failing migration tests in CI",
      repoRoot,
      maxTokens: 200,
    });

    expect(context).toContain("Harness Task Context Injection");
    expect(context).toContain("Failure Patterns To Avoid");
  });

  it("reports harness health metrics", async () => {
    const repoRoot = await makeRepoRoot();
    await ingestRun({
      transcriptOrPath: "Error: lint failed. Fix: run formatter before commit.",
      source: "manual",
      contributor: "human",
      runId: "run-health-1",
      repoRoot,
    });

    const report = await harnessHealth({ repoRoot });
    expect(report).toContain("Total learnings indexed");
    expect(report).toContain("Top 5 failure patterns");

    const agentsSuggestions = await readFile(
      join(repoRoot, ".harness", "learnings", "agents-md-suggestions.md"),
      "utf8",
    );
    expect(agentsSuggestions.startsWith("# AGENTS.md Suggestions")).toBe(true);
  });
});
