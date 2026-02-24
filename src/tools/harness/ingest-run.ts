import { ingestRun } from "../../harness/analyzer.js";
import type { TranscriptSource } from "../../harness/types.js";

export async function handleIngestRun(args: {
  transcript_or_path: string;
  source: TranscriptSource;
  contributor?: string;
  run_id?: string;
  repo_root?: string;
}): Promise<string> {
  const result = await ingestRun({
    transcriptOrPath: args.transcript_or_path,
    source: args.source,
    contributor: args.contributor,
    runId: args.run_id,
    repoRoot: args.repo_root,
  });

  return [
    "Harness ingest_run summary:",
    `- Added observations: ${result.addedObservations}`,
    `- Matched existing clusters: ${result.matchedClusters}`,
    `- New clusters: ${result.newClusters}`,
    `- Suggested skills generated: ${result.suggestedSkillsGenerated}`,
    `- AGENTS.md suggestions generated: ${result.agentsMdSuggestionsGenerated}`,
    `- ${result.summary}`,
  ].join("\n");
}
