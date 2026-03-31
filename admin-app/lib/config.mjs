import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { fileURLToPath } from "node:url";

export const TASK_STATES = ["open", "done", "pending"];
export const AUTO_RESUME_THRESHOLD = 45;
export const NEW_TASK_THRESHOLD = 35;
export const DOMINANCE_MARGIN = 15;
export const RECENT_INPUT_LIMIT = 100;
export const MAX_INPUT_DESCRIPTION = 40000;

export function getProjectRoot(metaUrl) {
  return path.resolve(path.dirname(fileURLToPath(metaUrl)), "..", "..");
}

export function createContext(workspaceRoot) {
  const root = path.resolve(workspaceRoot);
  const tasksRoot = path.join(root, "workspaces", "tasks");
  return {
    root,
    workspacesRoot: path.join(root, "workspaces"),
    tasksRoot,
    openRoot: path.join(tasksRoot, "open"),
    doneRoot: path.join(tasksRoot, "done"),
    pendingRoot: path.join(tasksRoot, "pending"),
    indexesRoot: path.join(tasksRoot, "indexes"),
    adminAppRoot: path.join(root, "admin-app"),
    adminPublicRoot: path.join(root, "admin-app", "public"),
    adminLibRoot: path.join(root, "admin-app", "lib"),
    localRoot: path.join(root, "local"),
    dashboardSnapshotPath: path.join(root, "local", "dashboard.html"),
    sessionStateTemplatePath: path.join(root, "session-state.template.json"),
    sessionStatePath: path.join(root, "session-state.json"),
    tasklogPath: path.join(root, "tasklog.md"),
    claudePath: path.join(root, "CLAUDE.md"),
  };
}

export async function exists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath) {
  await mkdir(targetPath, { recursive: true });
}

export async function readText(targetPath, fallback = "") {
  try {
    return await readFile(targetPath, "utf8");
  } catch {
    return fallback;
  }
}

export async function writeText(targetPath, contents) {
  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, contents, "utf8");
}

export async function readJson(targetPath, fallback = null) {
  try {
    const raw = await readFile(targetPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJson(targetPath, value) {
  await writeText(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

export function dateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function timestampStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function splitTokens(value) {
  return Array.from(
    new Set(
      normalizeText(value)
        .replace(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 3),
    ),
  );
}

export function slugify(value, fallback = "task") {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
  return slug || fallback;
}

export function mergeObjects(base, overlay) {
  if (Array.isArray(base) || Array.isArray(overlay)) {
    return overlay ?? base;
  }

  if (typeof base !== "object" || base === null) {
    return overlay ?? base;
  }

  if (typeof overlay !== "object" || overlay === null) {
    return overlay ?? base;
  }

  const merged = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    merged[key] = key in merged ? mergeObjects(merged[key], value) : value;
  }
  return merged;
}

export function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { metadata: {}, body: markdown };
  }

  const metadata = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    metadata[key] = value.includes("|")
      ? value
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean)
      : value;
  }

  return {
    metadata,
    body: markdown.slice(match[0].length),
  };
}

export function serializeFrontmatter(metadata) {
  const lines = Object.entries(metadata).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: ${value.join("|")}`;
    }
    return `${key}: ${String(value ?? "")}`;
  });
  return `---\n${lines.join("\n")}\n---\n`;
}
