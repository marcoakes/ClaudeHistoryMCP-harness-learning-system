import { harnessHealth, buildTaskContext } from "../../harness/analyzer.js";

export async function handleHarnessHealth(args: { repo_root?: string }): Promise<string> {
  return harnessHealth({ repoRoot: args.repo_root });
}

export async function handleGetTaskContext(args: {
  task: string;
  repo_root?: string;
  max_tokens?: number;
}): Promise<string> {
  return buildTaskContext({
    task: args.task,
    repoRoot: args.repo_root,
    maxTokens: args.max_tokens,
  });
}
