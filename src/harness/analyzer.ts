import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stem } from "../utils/stemmer.js";
import {
  ensureHarnessDirs,
  getHarnessConfig,
  loadClusters,
  loadLearnings,
  makeClusterId,
  makeObservationId,
  saveClusters,
  saveLearnings,
  slugify,
} from "./storage.js";
import type {
  HarnessConfig,
  IngestRunResult,
  LearningCluster,
  LearningObservation,
  SignalType,
  TranscriptSource,
} from "./types.js";

const STOP = new Set([
  "the","and","for","with","from","this","that","into","have","has","had","were","was","are","our","your","their","they","them","then","than","when","where","what","which","will","would","should","could","about","after","before","during","over","under","just","very","also","more","most","some","such","each","only","same","into","onto","across"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP.has(t))
    .map((t) => stem(t));
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const as = new Set(a);
  const bs = new Set(b);
  let inter = 0;
  for (const t of as) {
    if (bs.has(t)) inter += 1;
  }
  return inter / (as.size + bs.size - inter);
}

function extractFiles(text: string): string[] {
  const matches = text.match(/\b[\w./-]+\.(ts|tsx|js|jsx|py|go|rs|java|kt|md|json|yaml|yml)\b/g) || [];
  return unique(matches).slice(0, 10);
}

function firstSentence(text: string): string {
  return text.replace(/\s+/g, " ").trim().split(/[.!?]\s/)[0]?.slice(0, 220) || text.slice(0, 220);
}

function classifyLine(line: string): SignalType | null {
  const t = line.toLowerCase();
  if (/\b(error|failed|failure|exception|traceback|timeout|broken|regression|did not work|does not work)\b/.test(t)) return "failure_pattern";
  if (/\b(didn.t invoke|did not invoke|skill.*not used|missed skill|should have used)\b/.test(t)) return "skill_invocation_miss";
  if (/\b(violation|forbidden|policy|guardrail|must not|should not|unsafe|blocked)\b/.test(t)) return "guardrail_violation";
  if (/\b(search|grep|couldn.t find|could not find|where is|missing docs|not documented|look up)\b/.test(t)) return "context_gap";
  if (/\b(fixed|resolved|success|worked|passes|passed|correct|best practice|recommend)\b/.test(t)) return "successful_pattern";
  return null;
}

function extractObservations(
  transcript: string,
  config: HarnessConfig,
  source: TranscriptSource,
  contributor: string,
  runId: string,
  weightMultiplier = 1,
): LearningObservation[] {
  const lines = transcript.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const observations: LearningObservation[] = [];
  for (const line of lines) {
    const signalType = classifyLine(line);
    if (!signalType) continue;
    const text = firstSentence(line);
    const normalizedTokens = unique(tokenize(text)).slice(0, 64);
    if (normalizedTokens.length < 4) continue;
    const weightBase = signalType === "failure_pattern" ? 1.5 : signalType === "context_gap" ? 1.2 : signalType === "successful_pattern" ? 0.9 : 1.0;
    observations.push({
      id: makeObservationId(config.repoName, runId, signalType, text),
      repo: config.repoName,
      contributor,
      source,
      runId,
      signalType,
      text,
      normalizedTokens,
      relatedFiles: extractFiles(line),
      timestamp: Date.now(),
      weight: weightBase * weightMultiplier,
    });
  }
  return observations;
}

function scoreCluster(cluster: LearningCluster): number {
  const freq = cluster.memberIds.length;
  const runSpread = cluster.runIds.length;
  const contribSpread = cluster.contributors.length;
  const signalBoost = cluster.signalType === "failure_pattern" ? 1.4 : cluster.signalType === "context_gap" ? 1.25 : 1.0;
  const raw = (freq * 0.45 + runSpread * 0.35 + contribSpread * 0.2) * signalBoost;
  return Number(Math.min(1, raw / 5).toFixed(3));
}

function inferKeyphrase(tokens: string[]): string {
  return unique(tokens).slice(0, 6).join(" ");
}

function buildOrMergeClusters(existing: LearningCluster[], entries: LearningObservation[]): { clusters: LearningCluster[]; matched: number; created: number } {
  const clusters = [...existing];
  let matched = 0;
  let created = 0;

  for (const entry of entries) {
    let bestIndex = -1;
    let bestScore = 0;

    for (let i = 0; i < clusters.length; i += 1) {
      const c = clusters[i];
      if (c.repo !== entry.repo || c.signalType !== entry.signalType) continue;
      const s = jaccard(tokenize(c.keyphrase), entry.normalizedTokens);
      if (s > bestScore) {
        bestScore = s;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0 && bestScore >= 0.2) {
      const c = clusters[bestIndex];
      c.memberIds = unique([...c.memberIds, entry.id]);
      c.contributors = unique([...c.contributors, entry.contributor]);
      c.runIds = unique([...c.runIds, entry.runId]);
      c.lastSeen = Math.max(c.lastSeen, entry.timestamp);
      c.score = scoreCluster(c);
      matched += 1;
    } else {
      const keyphrase = inferKeyphrase(entry.normalizedTokens);
      const cluster: LearningCluster = {
        id: makeClusterId(entry.repo, entry.signalType, keyphrase),
        repo: entry.repo,
        signalType: entry.signalType,
        keyphrase,
        memberIds: [entry.id],
        contributors: [entry.contributor],
        runIds: [entry.runId],
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        score: 0,
      };
      cluster.score = scoreCluster(cluster);
      clusters.push(cluster);
      created += 1;
    }
  }

  return { clusters, matched, created };
}

function clusterToSkillTitle(cluster: LearningCluster): string {
  const raw = cluster.keyphrase.split(" ").slice(0, 5).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return raw || "Harness Learning Skill";
}

async function generateSuggestedArtifacts(
  config: HarnessConfig,
  clusters: LearningCluster[],
  entriesById: Map<string, LearningObservation>,
): Promise<{ skills: number; agents: number }> {
  let skills = 0;
  let agents = 0;

  for (const cluster of clusters) {
    const memberEntries = cluster.memberIds.map((id) => entriesById.get(id)).filter((e): e is LearningObservation => !!e);
    if (memberEntries.length === 0) continue;

    const confidenceReady = cluster.memberIds.length >= 3 && cluster.runIds.length >= 2 && cluster.score >= 0.6;

    if (confidenceReady) {
      const skillName = clusterToSkillTitle(cluster);
      const filename = `${slugify(skillName)}-${cluster.id}.md`;
      const path = join(config.suggestedSkillsDir, filename);
      if (!existsSync(path)) {
        const firstSeen = new Date(cluster.firstSeen).toISOString();
        const lastSeen = new Date(cluster.lastSeen).toISOString();
        const evidence = memberEntries.slice(0, 5).map((e) => `- ${e.text}`).join("\n");
        const markdown = `# Skill: ${skillName}\n## Source\n- Derived from ${cluster.memberIds.length} observations across ${cluster.runIds.length} sessions\n- Contributors: ${cluster.contributors.join(", ")}\n- First seen: ${firstSeen}, Last seen: ${lastSeen}\n- Confidence: ${cluster.score}\n\n## Context\nApplies when encountering this recurring ${cluster.signalType.replaceAll("_", " ")} pattern in ${cluster.repo}.\n\n## Instructions\nUse this cluster as a repeatable operating rule. Prevent regressions by applying the same successful fix/guardrail sequence before making broad changes.\n\n## Evidence\n${evidence}\n`;
        await writeFile(path, markdown, "utf8");
        skills += 1;
      }
    }

    const agentsMdReady = cluster.signalType === "context_gap" && cluster.memberIds.length >= 2 && cluster.score >= 0.6;
    if (agentsMdReady) {
      const marker = `<!-- SUGGESTION ${new Date().toISOString()} ${cluster.score} -->`;
      const source = `<!-- Source: ${cluster.memberIds.length} observations, ${cluster.runIds.length} sessions -->`;
      const suggestion = `Add explicit AGENTS.md guidance for: ${cluster.keyphrase}. Include module/file ownership, preferred commands, and guardrails.`;
      const block = `${marker}\n${source}\n${suggestion}\n<!-- END SUGGESTION -->\n\n`;
      await appendFile(config.agentsMdSuggestionsFile, block, "utf8");
      agents += 1;
    }
  }

  return { skills, agents };
}

async function readTranscript(sourceInput: string, config: HarnessConfig): Promise<string> {
  const maybePath = sourceInput.trim();
  if (existsSync(maybePath)) {
    return readFile(maybePath, "utf8");
  }

  // Persist raw transcript payload for reproducibility.
  const file = join(config.runArtifactsDir, `run-${Date.now()}-${randomUUID().slice(0, 8)}.txt`);
  await writeFile(file, sourceInput, "utf8");
  return sourceInput;
}

export async function ingestRun(params: {
  transcriptOrPath: string;
  source: TranscriptSource;
  contributor?: string;
  runId?: string;
  repoRoot?: string;
}): Promise<IngestRunResult> {
  const config = getHarnessConfig(params.repoRoot);
  await ensureHarnessDirs(config);

  const contributor = params.contributor || "unknown-agent";
  const runId = params.runId || `run-${Date.now()}`;
  const transcript = await readTranscript(params.transcriptOrPath, config);

  const existingLearnings = await loadLearnings(config);
  const observations = extractObservations(transcript, config, params.source, contributor, runId, 1);

  const dedupedNew = observations.filter((o) => !existingLearnings.some((e) => e.id === o.id));
  const mergedLearnings = [...existingLearnings, ...dedupedNew];
  await saveLearnings(config, mergedLearnings);

  const existingClusters = await loadClusters(config);
  const { clusters, matched, created } = buildOrMergeClusters(existingClusters, dedupedNew);
  await saveClusters(config, clusters);

  const byId = new Map<string, LearningObservation>(mergedLearnings.map((e) => [e.id, e]));
  const generated = await generateSuggestedArtifacts(config, clusters, byId);

  return {
    addedObservations: dedupedNew.length,
    matchedClusters: matched,
    newClusters: created,
    suggestedSkillsGenerated: generated.skills,
    agentsMdSuggestionsGenerated: generated.agents,
    summary: `Found ${dedupedNew.length} new patterns, ${matched} matched existing clusters, ${created} new clusters, ${generated.skills} suggested skills generated.`,
  };
}

export async function ingestReview(params: {
  reviewOrPath: string;
  contributor?: string;
  runId?: string;
  repoRoot?: string;
}): Promise<IngestRunResult> {
  const source = "gitlab_review" as const;
  const config = getHarnessConfig(params.repoRoot);
  await ensureHarnessDirs(config);
  const transcript = await readTranscript(params.reviewOrPath, config);

  let text = transcript;
  try {
    const parsed = JSON.parse(transcript) as any;
    if (Array.isArray(parsed?.object_attributes?.description)) {
      text = parsed.object_attributes.description.join("\n");
    } else if (typeof parsed?.object_attributes?.description === "string") {
      text = parsed.object_attributes.description;
    } else if (Array.isArray(parsed?.comments)) {
      text = parsed.comments.map((c: any) => c?.body || "").join("\n");
    }
  } catch {
    // keep raw text
  }

  const contributor = params.contributor || "gitlab-reviewer";
  const runId = params.runId || `review-${Date.now()}`;

  const existingLearnings = await loadLearnings(config);
  const extracted = extractObservations(text, config, source, contributor, runId, 2.0);
  const dedupedNew = extracted.filter((o) => !existingLearnings.some((e) => e.id === o.id));
  const mergedLearnings = [...existingLearnings, ...dedupedNew];
  await saveLearnings(config, mergedLearnings);

  const existingClusters = await loadClusters(config);
  const { clusters, matched, created } = buildOrMergeClusters(existingClusters, dedupedNew);
  await saveClusters(config, clusters);

  const byId = new Map<string, LearningObservation>(mergedLearnings.map((e) => [e.id, e]));
  const generated = await generateSuggestedArtifacts(config, clusters, byId);

  return {
    addedObservations: dedupedNew.length,
    matchedClusters: matched,
    newClusters: created,
    suggestedSkillsGenerated: generated.skills,
    agentsMdSuggestionsGenerated: generated.agents,
    summary: `Ingested review feedback: ${dedupedNew.length} weighted learnings, ${generated.skills} suggested skills generated.`,
  };
}

function relevance(queryTokens: string[], textTokens: string[]): number {
  return jaccard(queryTokens, textTokens);
}

export async function buildTaskContext(params: {
  task: string;
  repoRoot?: string;
  maxTokens?: number;
}): Promise<string> {
  const config = getHarnessConfig(params.repoRoot);
  await ensureHarnessDirs(config);
  const maxChars = (params.maxTokens || 2000) * 4;

  const learnings = await loadLearnings(config);
  const queryTokens = tokenize(params.task);

  const ranked = learnings
    .map((l) => ({ l, s: relevance(queryTokens, l.normalizedTokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  const topFailures = ranked.filter((x) => x.l.signalType === "failure_pattern").slice(0, 5);
  const topSuccess = ranked.filter((x) => x.l.signalType === "successful_pattern").slice(0, 3);
  const topGuardrails = ranked.filter((x) => x.l.signalType === "guardrail_violation").slice(0, 5);

  const lines: string[] = [
    "## Harness Task Context Injection",
    `Task: ${params.task}`,
    "",
    "### Failure Patterns To Avoid",
    ...(topFailures.length ? topFailures.map((x) => `- ${x.l.text}`) : ["- None yet."]),
    "",
    "### Successful Patterns To Follow",
    ...(topSuccess.length ? topSuccess.map((x) => `- ${x.l.text}`) : ["- None yet."]),
    "",
    "### Relevant Guardrails",
    ...(topGuardrails.length ? topGuardrails.map((x) => `- ${x.l.text}`) : ["- None yet."]),
  ];

  let output = lines.join("\n");
  if (output.length > maxChars) {
    output = output.slice(0, maxChars - 32) + "\n... (truncated)";
  }
  return output;
}

export async function harnessHealth(params?: { repoRoot?: string }): Promise<string> {
  const config = getHarnessConfig(params?.repoRoot);
  await ensureHarnessDirs(config);
  const learnings = await loadLearnings(config);
  const clusters = await loadClusters(config);

  const now = Date.now();
  const windowMs = 14 * 24 * 60 * 60 * 1000;
  const recent = learnings.filter((l) => now - l.timestamp <= windowMs);
  const older = learnings.filter((l) => now - l.timestamp > windowMs && now - l.timestamp <= 2 * windowMs);

  const countType = (arr: LearningObservation[], type: SignalType) => arr.filter((l) => l.signalType === type).length;
  const recentFailures = countType(recent, "failure_pattern");
  const olderFailures = countType(older, "failure_pattern");
  const trend = olderFailures === 0 ? "stable" : recentFailures < olderFailures ? "decreasing" : recentFailures > olderFailures ? "increasing" : "stable";

  const suggestedSkills = clusters.filter((c) => c.memberIds.length >= 3 && c.runIds.length >= 2 && c.score >= 0.7).length;
  const agentsSuggestions = clusters.filter((c) => c.signalType === "context_gap" && c.memberIds.length >= 2 && c.score >= 0.6).length;

  const topFailures = clusters
    .filter((c) => c.signalType === "failure_pattern")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((c) => `- ${c.keyphrase} (score=${c.score}, seen=${c.memberIds.length})`);

  const topGaps = clusters
    .filter((c) => c.signalType === "context_gap")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((c) => `- ${c.keyphrase} (score=${c.score}, seen=${c.memberIds.length})`);

  return [
    `Repo: ${config.repoName}`,
    `Total learnings indexed: ${learnings.length}`,
    `Suggested skills pending review: ${suggestedSkills}`,
    `AGENTS.md suggestions pending review: ${agentsSuggestions}`,
    "",
    "Top 5 failure patterns:",
    ...(topFailures.length ? topFailures : ["- None"]),
    "",
    "Top 5 context gaps:",
    ...(topGaps.length ? topGaps : ["- None"]),
    "",
    `Failure trend (last 14d vs prior 14d): ${trend}`,
  ].join("\n");
}
