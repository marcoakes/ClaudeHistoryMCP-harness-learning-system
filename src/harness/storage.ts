import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import type { HarnessConfig, LearningCluster, LearningObservation } from "./types.js";

const LEARNINGS_REL = ".harness/learnings";

function hash(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

export function detectRepoRoot(startDir = process.cwd()): string {
  let current = resolve(startDir);
  while (true) {
    if (existsSync(join(current, ".git"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(startDir);
    current = parent;
  }
}

export function getHarnessConfig(repoRoot?: string): HarnessConfig {
  const root = resolve(repoRoot || detectRepoRoot());
  const learningsDir = join(root, LEARNINGS_REL);
  return {
    repoRoot: root,
    repoName: basename(root),
    learningsDir,
    rawDir: join(learningsDir, "raw"),
    suggestedSkillsDir: join(learningsDir, "suggested-skills"),
    agentsMdSuggestionsFile: join(learningsDir, "agents-md-suggestions.md"),
    runArtifactsDir: join(learningsDir, "runs"),
  };
}

export async function ensureHarnessDirs(config: HarnessConfig): Promise<void> {
  await mkdir(config.rawDir, { recursive: true });
  await mkdir(config.suggestedSkillsDir, { recursive: true });
  await mkdir(config.runArtifactsDir, { recursive: true });

  if (!existsSync(config.agentsMdSuggestionsFile)) {
    await writeFile(config.agentsMdSuggestionsFile, "# AGENTS.md Suggestions\n\n", "utf8");
  }

  // Keep raw artifacts private by default, suggestions reviewable/committable.
  const gitignorePath = join(config.repoRoot, ".gitignore");
  const required = [
    ".harness/learnings/raw/",
    ".harness/learnings/runs/",
  ];
  let content = "";
  if (existsSync(gitignorePath)) {
    content = await readFile(gitignorePath, "utf8");
  }
  let changed = false;
  for (const entry of required) {
    if (!content.includes(entry)) {
      content += `${content.endsWith("\n") || content.length === 0 ? "" : "\n"}${entry}\n`;
      changed = true;
    }
  }
  if (changed) {
    await writeFile(gitignorePath, content, "utf8");
  }
}

function learningsPath(config: HarnessConfig): string {
  return join(config.rawDir, "learnings.json");
}

function clustersPath(config: HarnessConfig): string {
  return join(config.rawDir, "clusters.json");
}

export async function loadLearnings(config: HarnessConfig): Promise<LearningObservation[]> {
  const p = learningsPath(config);
  if (!existsSync(p)) return [];
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as LearningObservation[];
}

export async function saveLearnings(config: HarnessConfig, entries: LearningObservation[]): Promise<void> {
  await writeFile(learningsPath(config), JSON.stringify(entries, null, 2), "utf8");
}

export async function loadClusters(config: HarnessConfig): Promise<LearningCluster[]> {
  const p = clustersPath(config);
  if (!existsSync(p)) return [];
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as LearningCluster[];
}

export async function saveClusters(config: HarnessConfig, clusters: LearningCluster[]): Promise<void> {
  await writeFile(clustersPath(config), JSON.stringify(clusters, null, 2), "utf8");
}

export function makeObservationId(repo: string, runId: string, signal: string, text: string): string {
  return `obs-${hash(`${repo}|${runId}|${signal}|${text}`)}`;
}

export function makeClusterId(repo: string, signal: string, keyphrase: string): string {
  return `cluster-${hash(`${repo}|${signal}|${keyphrase}`)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "skill";
}
