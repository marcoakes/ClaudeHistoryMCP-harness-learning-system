import { ingestReview } from "../../harness/analyzer.js";

export async function handleIngestReview(args: {
  review_or_path: string;
  contributor?: string;
  run_id?: string;
  repo_root?: string;
}): Promise<string> {
  const result = await ingestReview({
    reviewOrPath: args.review_or_path,
    contributor: args.contributor,
    runId: args.run_id,
    repoRoot: args.repo_root,
  });

  return [
    "Harness ingest_review summary:",
    `- Added observations: ${result.addedObservations}`,
    `- Matched existing clusters: ${result.matchedClusters}`,
    `- New clusters: ${result.newClusters}`,
    `- Suggested skills generated: ${result.suggestedSkillsGenerated}`,
    `- AGENTS.md suggestions generated: ${result.agentsMdSuggestionsGenerated}`,
    `- ${result.summary}`,
  ].join("\n");
}
