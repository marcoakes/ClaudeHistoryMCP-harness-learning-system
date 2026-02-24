export type SignalType =
  | "failure_pattern"
  | "skill_invocation_miss"
  | "guardrail_violation"
  | "successful_pattern"
  | "context_gap";

export type TranscriptSource =
  | "claude_code"
  | "codex_cli"
  | "codex_app"
  | "gitlab_review"
  | "manual";

export interface LearningObservation {
  id: string;
  repo: string;
  contributor: string;
  source: TranscriptSource;
  runId: string;
  sessionId?: string;
  signalType: SignalType;
  text: string;
  normalizedTokens: string[];
  relatedFiles: string[];
  timestamp: number;
  weight: number;
}

export interface LearningCluster {
  id: string;
  repo: string;
  signalType: SignalType;
  keyphrase: string;
  memberIds: string[];
  contributors: string[];
  runIds: string[];
  firstSeen: number;
  lastSeen: number;
  score: number;
}

export interface HarnessConfig {
  repoRoot: string;
  repoName: string;
  learningsDir: string;
  rawDir: string;
  suggestedSkillsDir: string;
  agentsMdSuggestionsFile: string;
  runArtifactsDir: string;
}

export interface IngestRunResult {
  addedObservations: number;
  matchedClusters: number;
  newClusters: number;
  suggestedSkillsGenerated: number;
  agentsMdSuggestionsGenerated: number;
  summary: string;
}
