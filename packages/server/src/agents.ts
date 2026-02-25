import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import type { AgentItem } from "./types.js";
import { parseFrontmatter, buildFrontmatter } from "./frontmatter.js";
import { exists } from "./utils.js";
import { validateSkillName } from "./validators.js";
import { ApiError } from "./errors.js";
import { projectAgentsDir } from "./workspace-files.js";

async function findWorkspaceRoots(workspaceRoot: string): Promise<string[]> {
  const roots: string[] = [];
  let current = resolve(workspaceRoot);
  while (true) {
    roots.push(current);
    const gitPath = join(current, ".git");
    if (await exists(gitPath)) break;
    const parent = resolve(current, "..");
    if (parent === current) break;
    current = parent;
  }
  return roots;
}

const extractTriggerFromBody = (body: string) => {
  const lines = body.split(/\r?\n/);
  let inWhenSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^#{1,6}\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,6}\s+/, "").trim();
      inWhenSection = /^when to use$/i.test(heading);
      continue;
    }

    if (!inWhenSection) continue;

    const cleaned = trimmed
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .trim();

    if (cleaned) return cleaned;
  }

  return "";
};

const extractAgentFields = (data: Record<string, unknown>): Partial<AgentItem> => {
  const fields: Partial<AgentItem> = {};

  if (typeof data.model === "string") {
    fields.model = data.model;
  }
  if (Array.isArray(data.subAgents)) {
    fields.subAgents = data.subAgents.filter((v): v is string => typeof v === "string");
  }
  if (Array.isArray(data.skills)) {
    fields.skills = data.skills.filter((v): v is string => typeof v === "string");
  }
  if (typeof data.maxTurns === "number") {
    fields.maxTurns = data.maxTurns;
  }
  if (typeof data.systemPrompt === "string") {
    fields.systemPrompt = data.systemPrompt;
  }

  return fields;
};

async function parseAgentEntry(
  agentPath: string,
  entryName: string,
  scope: "project" | "global",
): Promise<AgentItem | null> {
  const content = await readFile(agentPath, "utf8");
  const { data, body } = parseFrontmatter(content);
  const name = typeof data.name === "string" ? data.name : entryName;
  const description = typeof data.description === "string" ? data.description : "";
  const trigger =
    typeof data.trigger === "string"
      ? data.trigger
      : typeof data.when === "string"
        ? data.when
        : extractTriggerFromBody(body);
  try {
    validateSkillName(name);
  } catch {
    return null;
  }
  if (name !== entryName) return null;

  const agentFields = extractAgentFields(data);

  return {
    name,
    description,
    path: agentPath,
    scope,
    trigger: trigger.trim() || undefined,
    ...agentFields,
  };
}

async function listAgentsInDir(dir: string, scope: "project" | "global"): Promise<AgentItem[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const items: AgentItem[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const agentPath = join(dir, entry.name, "AGENT.md");
    if (await exists(agentPath)) {
      const item = await parseAgentEntry(agentPath, entry.name, scope);
      if (item) items.push(item);
    } else {
      const domainDir = join(dir, entry.name);
      let subEntries: Dirent[];
      try {
        subEntries = await readdir(domainDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const subEntry of subEntries) {
        if (!subEntry.isDirectory()) continue;
        const subAgentPath = join(domainDir, subEntry.name, "AGENT.md");
        if (!(await exists(subAgentPath))) continue;
        const item = await parseAgentEntry(subAgentPath, subEntry.name, scope);
        if (item) items.push(item);
      }
    }
  }
  return items;
}

export async function listAgents(workspaceRoot: string, includeGlobal: boolean): Promise<AgentItem[]> {
  const roots = await findWorkspaceRoots(workspaceRoot);
  const items: AgentItem[] = [];
  for (const root of roots) {
    const opencodeDir = join(root, ".opencode", "agents");
    items.push(...(await listAgentsInDir(opencodeDir, "project")));
  }

  if (includeGlobal) {
    const globalOpenWork = join(homedir(), ".config", "opencode", "agents");
    const globalClaude = join(homedir(), ".claude", "agents");
    items.push(...(await listAgentsInDir(globalOpenWork, "global")));
    items.push(...(await listAgentsInDir(globalClaude, "global")));
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

export async function upsertAgent(
  workspaceRoot: string,
  payload: {
    name: string;
    content: string;
    description?: string;
    model?: string;
    subAgents?: string[];
    skills?: string[];
    maxTurns?: number;
  },
): Promise<{ path: string; action: "added" | "updated" }> {
  const name = payload.name.trim();
  validateSkillName(name);
  if (!payload.content) {
    throw new ApiError(400, "invalid_agent_content", "Agent content is required");
  }

  let content = payload.content;
  const { data, body } = parseFrontmatter(payload.content);
  if (Object.keys(data).length > 0) {
    const frontmatterName = typeof data.name === "string" ? data.name : "";
    const frontmatterDescription = typeof data.description === "string" ? data.description : "";
    if (frontmatterName && frontmatterName !== name) {
      throw new ApiError(400, "invalid_agent_name", "Agent frontmatter name must match payload name");
    }
    const nextDescription = frontmatterDescription || payload.description || "";
    const frontmatter = buildFrontmatter({
      ...data,
      name,
      description: nextDescription,
    });
    content = frontmatter + body.replace(/^\n/, "");
  } else {
    const frontmatter = buildFrontmatter({
      name,
      description: payload.description,
      model: payload.model,
      subAgents: payload.subAgents,
      skills: payload.skills,
      maxTurns: payload.maxTurns,
    });
    content = frontmatter + payload.content.replace(/^\n/, "");
  }

  const baseDir = projectAgentsDir(workspaceRoot);
  const agentDir = join(baseDir, name);
  await mkdir(agentDir, { recursive: true });
  const agentPath = join(agentDir, "AGENT.md");
  const existed = await exists(agentPath);
  await writeFile(agentPath, content.endsWith("\n") ? content : content + "\n", "utf8");
  return { path: agentPath, action: existed ? "updated" : "added" };
}

export async function deleteAgent(workspaceRoot: string, name: string): Promise<{ path: string }> {
  const trimmed = name.trim();
  validateSkillName(trimmed);
  const baseDir = projectAgentsDir(workspaceRoot);
  const agentDir = join(baseDir, trimmed);
  const agentPath = join(agentDir, "AGENT.md");
  if (!(await exists(agentPath))) {
    throw new ApiError(404, "agent_not_found", `Agent not found: ${trimmed}`);
  }
  await rm(agentDir, { recursive: true, force: true });
  return { path: agentDir };
}

export async function getAgentContent(workspaceRoot: string, name: string, includeGlobal: boolean): Promise<{ item: AgentItem; content: string }> {
  const trimmed = name.trim();
  validateSkillName(trimmed);
  const items = await listAgents(workspaceRoot, includeGlobal);
  const item = items.find((agent) => agent.name === trimmed);
  if (!item) {
    throw new ApiError(404, "agent_not_found", `Agent not found: ${trimmed}`);
  }
  const content = await readFile(item.path, "utf8");
  return { item, content };
}
