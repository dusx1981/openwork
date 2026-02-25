import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { HubSkillItem } from "./types.js";
import { ApiError } from "./errors.js";
import { parseFrontmatter } from "./frontmatter.js";
import { exists } from "./utils.js";
import { validateSkillName } from "./validators.js";
import { projectSkillsDir } from "./workspace-files.js";
import { BUILTIN_SKILLS } from "./builtin-skills.js";
import type { HubAgentItem } from "./types.js";

import { projectAgentsDir } from "./workspace-files.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type HubRepo = { owner: string; repo: string; ref: string };

const DEFAULT_HUB_REPO: HubRepo = {
  owner: "different-ai",
  repo: "openwork-hub",
  ref: "main",
};

const CATALOG_TTL_MS = 5 * 60 * 1000;
let cachedCatalog: { at: number; items: HubSkillItem[] } | null = null;

function hubApiBase(repo: HubRepo) {
  return `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
}

function hubRawBase(repo: HubRepo) {
  return `https://raw.githubusercontent.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/${encodeURIComponent(repo.ref)}`;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "openwork-server",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(502, "hub_fetch_failed", `Failed to fetch hub data (${res.status}): ${text || url}`);
  }
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      Accept: "text/plain",
      "User-Agent": "openwork-server",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(502, "hub_fetch_failed", `Failed to fetch hub data (${res.status}): ${text || url}`);
  }
  return res.text();
}

function extractTriggerFromBody(body: string) {
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
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current]!, current);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function listHubSkills(repo: HubRepo = DEFAULT_HUB_REPO): Promise<HubSkillItem[]> {
  const now = Date.now();
  if (cachedCatalog && now - cachedCatalog.at < CATALOG_TTL_MS) {
    return cachedCatalog.items;
  }

  const listing = await fetchJson(`${hubApiBase(repo)}/contents/skills?ref=${encodeURIComponent(repo.ref)}`);
  const dirs = Array.isArray(listing)
    ? listing
        .filter((entry) => entry && typeof entry === "object" && entry.type === "dir" && typeof entry.name === "string")
        .map((entry) => String(entry.name))
    : [];

  const rawBase = hubRawBase(repo);
  const items = await mapWithConcurrency<string, HubSkillItem | null>(dirs, 6, async (dirName) => {
    try {
      const skillName = dirName.trim();
      validateSkillName(skillName);
      const skillMd = await fetchText(`${rawBase}/skills/${encodeURIComponent(skillName)}/SKILL.md`);
      const { data, body } = parseFrontmatter(skillMd);
      const name = typeof data.name === "string" ? data.name : skillName;
      const descriptionRaw = typeof data.description === "string" ? data.description : "";
      const triggerRaw =
        typeof data.trigger === "string"
          ? data.trigger
          : typeof data.when === "string"
            ? data.when
            : extractTriggerFromBody(body);

      if (name !== skillName) {
        return null;
      }

      const description = descriptionRaw.replace(/\s+/g, " ").trim().slice(0, 1024);
      const trigger = triggerRaw?.trim() || "";
      const item: HubSkillItem = {
        name,
        description,
        ...(trigger ? { trigger } : {}),
        source: {
          owner: repo.owner,
          repo: repo.repo,
          ref: repo.ref,
          path: `skills/${skillName}`,
        },
      };
      return item;
    } catch {
      return null;
    }
  });

  const sorted = items
    .filter((item): item is HubSkillItem => item != null)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  cachedCatalog = { at: now, items: sorted };
  return sorted;
}

type HubTreeEntry = {
  path?: string;
  mode?: string;
  type?: string;
};

function resolveSafeChild(baseDir: string, child: string): string {
  const base = resolve(baseDir);
  const target = resolve(baseDir, child);
  if (target === base) return target;
  if (!target.startsWith(base + "/") && !target.startsWith(base + "\\")) {
    throw new ApiError(400, "invalid_path", "Invalid file path");
  }
  return target;
}

export async function installHubSkill(
  workspaceRoot: string,
  input: { name: string; overwrite?: boolean; repo?: Partial<HubRepo> },
): Promise<{ name: string; path: string; action: "added" | "updated"; written: number; skipped: number }> {
  const name = input.name.trim();
  validateSkillName(name);
  const overwrite = Boolean(input.overwrite);

  // Special case for local builtin skills
  if (input.repo?.owner === "local" && input.repo?.repo === "builtin") {
    return await installLocalBuiltinSkill(workspaceRoot, name, overwrite);
  }

  const repo: HubRepo = {
    owner: input.repo?.owner?.trim() || DEFAULT_HUB_REPO.owner,
    repo: input.repo?.repo?.trim() || DEFAULT_HUB_REPO.repo,
    ref: input.repo?.ref?.trim() || DEFAULT_HUB_REPO.ref,
  };

  const prefix = `skills/${name}/`;
  const baseDir = join(projectSkillsDir(workspaceRoot), name);
  const skillMdPath = join(baseDir, "SKILL.md");
  const existedBefore = await exists(skillMdPath);

  await mkdir(baseDir, { recursive: true });

  const tree = await fetchJson(`${hubApiBase(repo)}/git/trees/${encodeURIComponent(repo.ref)}?recursive=1`);
  const entries: HubTreeEntry[] = Array.isArray(tree?.tree) ? tree.tree : [];
  const files = entries
    .filter((entry) => entry && entry.type === "blob" && typeof entry.path === "string" && entry.path.startsWith(prefix))
    .map((entry) => ({
      path: String(entry.path),
      mode: typeof entry.mode === "string" ? entry.mode : "100644",
    }));

  if (!files.length) {
    throw new ApiError(404, "hub_skill_not_found", `Hub skill not found: ${name}`);
  }

  let written = 0;
  let skipped = 0;
  const rawBase = hubRawBase(repo);

  for (const file of files) {
    const rel = file.path.slice(prefix.length);
    if (!rel || rel.startsWith("/") || rel.includes("..")) {
      continue;
    }

    const destPath = resolveSafeChild(baseDir, rel);
    if (!overwrite && (await exists(destPath))) {
      skipped += 1;
      continue;
    }

    await mkdir(dirname(destPath), { recursive: true });
    const res = await fetch(`${rawBase}/${file.path}`, {
      headers: { "User-Agent": "openwork-server" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(502, "hub_fetch_failed", `Failed to fetch hub file (${res.status}): ${text || file.path}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    await writeFile(destPath, buf);

    // Best-effort executable bit.
    if (file.mode === "100755") {
      await chmod(destPath, 0o755).catch(() => undefined);
    }

    written += 1;
  }

  // Ensure the canonical entrypoint exists.
  if (!(await exists(skillMdPath))) {
    throw new ApiError(502, "hub_install_failed", `Hub skill install failed (missing SKILL.md): ${name}`);
  }

  return {
    name,
    path: baseDir,
    action: existedBefore ? "updated" : "added",
    written,
    skipped,
  };
}

async function installLocalBuiltinSkill(
  workspaceRoot: string,
  name: string,
  overwrite: boolean,
): Promise<{ name: string; path: string; action: "added" | "updated"; written: number; skipped: number }> {
  const baseDir = join(projectSkillsDir(workspaceRoot), name);
  const skillMdPath = join(baseDir, "SKILL.md");
  const existedBefore = await exists(skillMdPath);

  const skillContent = BUILTIN_SKILLS[name];
  if (!skillContent) {
    const available = Object.keys(BUILTIN_SKILLS).join(", ");
    throw new ApiError(404, "hub_skill_not_found", `Local builtin skill not found: ${name}. Available: ${available}`);
  }

  if (!overwrite && existedBefore) {
    return {
      name,
      path: baseDir,
      action: "updated",
      written: 0,
      skipped: 1,
    };
  }

  await mkdir(baseDir, { recursive: true });
  await writeFile(skillMdPath, skillContent);

  return {
    name,
    path: baseDir,
    action: existedBefore ? "updated" : "added",
    written: 1,
    skipped: 0,
  };
}


// Agent Hub functions

const CATALOG_TTL_MS_AGENTS = 5 * 60 * 1000;
let cachedAgentCatalog: { at: number; items: HubAgentItem[] } | null = null;

export async function listHubAgents(repo: HubRepo = DEFAULT_HUB_REPO): Promise<HubAgentItem[]> {
  const now = Date.now();
  if (cachedAgentCatalog && now - cachedAgentCatalog.at < CATALOG_TTL_MS_AGENTS) {
    return cachedAgentCatalog.items;
  }

  const listing = await fetchJson(`${hubApiBase(repo)}/contents/agents?ref=${encodeURIComponent(repo.ref)}`);
  const dirs = Array.isArray(listing)
    ? listing
        .filter((entry) => entry && typeof entry === "object" && entry.type === "dir" && typeof entry.name === "string")
        .map((entry) => String(entry.name))
    : [];

  const rawBase = hubRawBase(repo);
  const items = await mapWithConcurrency<string, HubAgentItem | null>(dirs, 6, async (dirName) => {
    try {
      const agentName = dirName.trim();
      validateSkillName(agentName);
      const agentMd = await fetchText(`${rawBase}/agents/${encodeURIComponent(agentName)}/AGENT.md`);
      const { data, body } = parseFrontmatter(agentMd);
      const name = typeof data.name === "string" ? data.name : agentName;
      const descriptionRaw = typeof data.description === "string" ? data.description : "";
      const triggerRaw =
        typeof data.trigger === "string"
          ? data.trigger
          : typeof data.when === "string"
            ? data.when
            : extractTriggerFromBody(body);

      if (name !== agentName) {
        return null;
      }

      const description = descriptionRaw.replace(/\s+/g, " ").trim().slice(0, 1024);
      const trigger = triggerRaw?.trim() || "";

      const extractArrayField = (field: unknown): string[] | undefined => {
        if (Array.isArray(field)) {
          return field.filter((v): v is string => typeof v === "string");
        }
        return undefined;
      };

      const item: HubAgentItem = {
        name,
        description,
        ...(trigger ? { trigger } : {}),
        source: {
          owner: repo.owner,
          repo: repo.repo,
          ref: repo.ref,
          path: `agents/${agentName}`,
        },
        model: typeof data.model === "string" ? data.model : undefined,
        subAgents: extractArrayField(data.subAgents),
        skills: extractArrayField(data.skills),
        maxTurns: typeof data.maxTurns === "number" ? data.maxTurns : undefined,
      };
      return item;
    } catch {
      return null;
    }
  });

  const sorted = items
    .filter((item): item is HubAgentItem => item != null)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  cachedAgentCatalog = { at: now, items: sorted };
  return sorted;
}

export async function installHubAgent(
  workspaceRoot: string,
  input: { name: string; overwrite?: boolean; repo?: Partial<HubRepo> },
): Promise<{ name: string; path: string; action: "added" | "updated"; written: number; skipped: number }> {
  const name = input.name.trim();
  validateSkillName(name);
  const overwrite = Boolean(input.overwrite);

  const repo: HubRepo = {
    owner: input.repo?.owner?.trim() || DEFAULT_HUB_REPO.owner,
    repo: input.repo?.repo?.trim() || DEFAULT_HUB_REPO.repo,
    ref: input.repo?.ref?.trim() || DEFAULT_HUB_REPO.ref,
  };

  const prefix = `agents/${name}/`;
  const baseDir = join(projectAgentsDir(workspaceRoot), name);
  const agentMdPath = join(baseDir, "AGENT.md");
  const existedBefore = await exists(agentMdPath);

  await mkdir(baseDir, { recursive: true });

  const tree = await fetchJson(`${hubApiBase(repo)}/git/trees/${encodeURIComponent(repo.ref)}?recursive=1`);
  const entries: HubTreeEntry[] = Array.isArray(tree?.tree) ? tree.tree : [];
  const files = entries
    .filter((entry) => entry && entry.type === "blob" && typeof entry.path === "string" && entry.path.startsWith(prefix))
    .map((entry) => ({
      path: String(entry.path),
      mode: typeof entry.mode === "string" ? entry.mode : "100644",
    }));

  if (!files.length) {
    throw new ApiError(404, "hub_agent_not_found", `Hub agent not found: ${name}`);
  }

  let written = 0;
  let skipped = 0;
  const rawBase = hubRawBase(repo);

  for (const file of files) {
    const rel = file.path.slice(prefix.length);
    if (!rel || rel.startsWith("/") || rel.includes("..")) {
      continue;
    }

    const destPath = resolveSafeChild(baseDir, rel);
    if (!overwrite && (await exists(destPath))) {
      skipped += 1;
      continue;
    }

    await mkdir(dirname(destPath), { recursive: true });
    const res = await fetch(`${rawBase}/${file.path}`, {
      headers: { "User-Agent": "openwork-server" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(502, "hub_fetch_failed", `Failed to fetch hub file (${res.status}): ${text || file.path}`);
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    await writeFile(destPath, buf);

    if (file.mode === "100755") {
      await chmod(destPath, 0o755).catch(() => undefined);
    }

    written += 1;
  }

  if (!(await exists(agentMdPath))) {
    throw new ApiError(502, "hub_install_failed", `Hub agent install failed (missing AGENT.md): ${name}`);
  }

  return {
    name,
    path: baseDir,
    action: existedBefore ? "updated" : "added",
    written,
    skipped,
  };
}


