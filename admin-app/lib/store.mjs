import path from "node:path";
import {
  AUTO_RESUME_THRESHOLD,
  DOMINANCE_MARGIN,
  MAX_INPUT_DESCRIPTION,
  NEW_TASK_THRESHOLD,
  RECENT_INPUT_LIMIT,
  TASK_STATES,
  createContext,
  dateStamp,
  ensureDir,
  exists,
  mergeObjects,
  normalizeText,
  parseFrontmatter,
  readJson,
  readText,
  serializeFrontmatter,
  slugify,
  splitTokens,
  timestampStamp,
  writeJson,
  writeText,
} from "./config.mjs";
import { buildStaticDashboardHtml } from "./render.mjs";
import {
  copyFile,
  cp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";

function headingBlock(title, body) {
  return `## ${title}\n${body.trim()}\n`;
}

function overviewList(items, emptyFallback) {
  if (!items.length) {
    return `- ${emptyFallback}`;
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function parseSection(markdown, heading) {
  const pattern = new RegExp(
    `## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`,
    "i",
  );
  const match = markdown.match(pattern);
  return match ? match[1].trim() : "";
}

function firstLine(value, fallback = "") {
  const line = String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .find(Boolean);
  return line || fallback;
}

async function pathExists(targetPath) {
  return exists(targetPath);
}

async function assertWorkspaceContext(ctx) {
  if (
    !(await pathExists(path.join(ctx.root, "local", "profiles"))) &&
    process.env.ALLOW_CORE_TASK_ORCHESTRATION !== "1"
  ) {
    throw new Error(
      "Task orchestration is intended for the workspace instance. Set ALLOW_CORE_TASK_ORCHESTRATION=1 only if you intentionally want local task state inside this repo.",
    );
  }
}

async function ensureSessionState(ctx) {
  const template = (await readJson(ctx.sessionStateTemplatePath, {})) || {};
  const current = (await readJson(ctx.sessionStatePath, {})) || {};
  const merged = mergeObjects(template, current);
  await writeJson(ctx.sessionStatePath, merged);
  return merged;
}

function withTaskContext(ctx, state, taskId) {
  const stateRoot =
    state === "open" ? ctx.openRoot : state === "done" ? ctx.doneRoot : ctx.pendingRoot;
  return path.join(stateRoot, taskId);
}

async function ensureTaskStructure(ctx) {
  await ensureDir(ctx.workspacesRoot);
  await ensureDir(ctx.tasksRoot);
  await ensureDir(ctx.openRoot);
  await ensureDir(ctx.doneRoot);
  await ensureDir(ctx.pendingRoot);
  await ensureDir(ctx.indexesRoot);
  await ensureDir(ctx.localRoot);
  await ensureDir(path.join(ctx.root, "workspaces"));
  await ensureDir(path.join(ctx.root, "workspaces", "tasks"));
  await ensureSessionState(ctx);
}

async function listTaskIds(ctx, state) {
  const stateRoot =
    state === "open" ? ctx.openRoot : state === "done" ? ctx.doneRoot : ctx.pendingRoot;
  if (!(await pathExists(stateRoot))) {
    return [];
  }

  const entries = await readdir(stateRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function findTaskById(ctx, taskId) {
  for (const state of TASK_STATES) {
    const taskDir = withTaskContext(ctx, state, taskId);
    if (await pathExists(taskDir)) {
      return { state, taskDir };
    }
  }
  return null;
}

function renderTaskMarkdown({
  title,
  summary,
  slug,
  taskId,
  state,
  createdAt,
  updatedAt,
}) {
  return `# ${title}

${headingBlock("Summary", summary || "Pending summary.")}

${headingBlock(
  "Context",
  overviewList(
    [
      `Task ID: \`${taskId}\``,
      `Slug: \`${slug}\``,
      `State: \`${state}\``,
      `Created at: \`${createdAt}\``,
      `Updated at: \`${updatedAt}\``,
    ],
    "No context yet.",
  ),
)}

${headingBlock(
  "Links",
  overviewList(
    [
      "`definition-of-done.md`",
      "`conversation-log.md`",
      "`attachments/`",
      "`artifacts/`",
    ],
    "No linked artifacts yet.",
  ),
)}`;
}

function renderDodMarkdown() {
  return `# Definition of done

- [ ] Outcome delivered or decision recorded
- [ ] Relevant artifacts saved in this task folder if applicable
- [ ] User explicitly confirmed closure
`;
}

function renderConversationSeed({ title, taskId, createdAt }) {
  return `# Conversation log

## ${createdAt}

- Task created: \`${taskId}\`
- Title: ${title}
`;
}

function deriveTitleFromInput(rawText, explicitTitle = "") {
  if (explicitTitle.trim()) {
    return explicitTitle.trim();
  }

  const candidate = firstLine(rawText, "");
  if (!candidate) {
    return "Untitled task";
  }

  return candidate.split(/\s+/).slice(0, 10).join(" ").replace(/[.:;,-]+$/, "");
}

function summarizeInput(rawText, fallbackTitle) {
  const normalized = String(rawText || "").trim();
  const lines = normalized
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 12);
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 12);
  const source = lines.length ? lines : sentences;
  const insights = source.slice(0, 3);
  const takeaways = source.slice(3, 6);
  const summary = firstLine(source.join("\n"), fallbackTitle);

  return {
    summary,
    insights: insights.length ? insights : [summary],
    takeaways: takeaways.length ? takeaways : insights.slice(0, 2),
  };
}

async function loadInputPayload(text, filePath) {
  if (text && text.trim()) {
    return {
      sourceType: "text",
      rawText: text.trim(),
      filePath: null,
      fileMetadata: null,
    };
  }

  if (!filePath) {
    throw new Error("Provide --text or --file.");
  }

  const fileStat = await stat(filePath);
  let rawText = "";
  try {
    rawText = await readFile(filePath, "utf8");
  } catch {
    rawText = `Binary or non-UTF8 input received.\nFile name: ${path.basename(filePath)}\nSize: ${fileStat.size} bytes\nSource path: ${filePath}`;
  }

  if (rawText.length > MAX_INPUT_DESCRIPTION) {
    rawText = `${rawText.slice(0, MAX_INPUT_DESCRIPTION)}\n\n[Truncated at ${MAX_INPUT_DESCRIPTION} characters]`;
  }

  return {
    sourceType: "file",
    rawText,
    filePath,
    fileMetadata: {
      name: path.basename(filePath),
      size: fileStat.size,
      source_path: filePath,
    },
  };
}

async function copyAttachmentIfNeeded(taskDir, payload) {
  if (!payload.filePath) {
    return [];
  }

  const attachmentsDir = path.join(taskDir, "attachments");
  await ensureDir(attachmentsDir);
  const targetName = `${timestampStamp()}-${path.basename(payload.filePath)}`;
  const targetPath = path.join(attachmentsDir, targetName);
  await copyFile(payload.filePath, targetPath);
  return [path.relative(taskDir, targetPath)];
}

async function listArtifactPaths(taskDir) {
  const results = [];
  for (const folderName of ["attachments", "artifacts"]) {
    const folder = path.join(taskDir, folderName);
    if (!(await pathExists(folder))) {
      continue;
    }
    const entries = await readdir(folder, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        results.push(path.posix.join(folderName, entry.name));
      }
    }
  }
  return results.sort();
}

async function nextMemoryNumber(taskDir) {
  const entries = await readdir(taskDir, { withFileTypes: true });
  const existing = entries
    .filter((entry) => entry.isFile() && /^rag-memory-\d{3}\.md$/.test(entry.name))
    .map((entry) => Number(entry.name.match(/\d{3}/)?.[0] || "0"));
  return String((Math.max(0, ...existing) || 0) + 1).padStart(3, "0");
}

function renderMemoryMarkdown({
  metadata,
  insights,
  takeaways,
  rawText,
}) {
  const frontmatter = serializeFrontmatter(metadata);
  return `${frontmatter}
# ${metadata.memory_id}

${headingBlock("Key Insights", overviewList(insights, "No key insights extracted."))}

${headingBlock("Key Takeaways", overviewList(takeaways, "No key takeaways extracted."))}

${headingBlock("Input transcription or description", rawText || "No input content recorded.")}`;
}

async function appendConversationLog(taskDir, lines) {
  const filePath = path.join(taskDir, "conversation-log.md");
  const current = await readText(filePath, "# Conversation log\n");
  const block = `\n## ${new Date().toISOString()}\n\n${lines.map((line) => `- ${line}`).join("\n")}\n`;
  await writeText(filePath, `${current.trimEnd()}\n${block}`);
}

function parseTitleFromTaskMarkdown(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

async function listMemoryFiles(taskDir) {
  const entries = await readdir(taskDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^rag-memory-\d{3}\.md$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function buildTaskView(ctx, state, taskId) {
  const taskDir = withTaskContext(ctx, state, taskId);
  const status = (await readJson(path.join(taskDir, "status.json"), {})) || {};
  const taskMarkdown = await readText(path.join(taskDir, "task.md"), "");
  const title = parseTitleFromTaskMarkdown(taskMarkdown, taskId);
  const summary = parseSection(taskMarkdown, "Summary") || firstLine(taskMarkdown, title);
  const nextStep = firstLine(
    (await readText(path.join(taskDir, "definition-of-done.md"), ""))
      .split("\n")
      .find((line) => /^\s*-\s+\[\s\]/.test(line))
      ?.replace(/^\s*-\s+\[\s\]\s*/, "") || "",
    "Review task context",
  );
  const memoryFiles = await listMemoryFiles(taskDir);
  const activeArtifacts = await listArtifactPaths(taskDir);

  return {
    task_id: status.task_id || taskId,
    title,
    slug: status.slug || slugify(title),
    state,
    resolution_mode: status.resolution_mode || "new",
    created_at: status.created_at || null,
    updated_at: status.updated_at || null,
    last_input_at: status.last_input_at || null,
    done_confirmed: Boolean(status.done_confirmed),
    active_artifacts: activeArtifacts,
    candidate_matches: status.candidate_matches || [],
    path: path.relative(ctx.root, taskDir),
    summary,
    next_step: nextStep,
    memory_count: memoryFiles.length,
    latest_memory_id: memoryFiles.length ? memoryFiles[memoryFiles.length - 1].replace(/\.md$/, "") : null,
  };
}

async function readLatestMemoryExcerpt(taskDir) {
  const memories = await listMemoryFiles(taskDir);
  if (!memories.length) {
    return "";
  }
  const latest = await readText(path.join(taskDir, memories[memories.length - 1]), "");
  const { body } = parseFrontmatter(latest);
  return body.slice(0, 600);
}

function scoreOverlap(inputTokens, candidateTokens, weight, maxScore) {
  const overlap = candidateTokens.filter((token) => inputTokens.includes(token)).length;
  return Math.min(overlap * weight, maxScore);
}

async function resolveTask(ctx, payload, options = {}) {
  const sessionState = await ensureSessionState(ctx);
  if (options.taskId) {
    const match = await findTaskById(ctx, options.taskId);
    if (!match) {
      throw new Error(`Unknown task_id: ${options.taskId}`);
    }
    return {
      mode: "resume",
      task: await buildTaskView(ctx, match.state, options.taskId),
      candidates: [],
    };
  }

  if (options.forceNew) {
    return { mode: "new", task: null, candidates: [] };
  }

  const inputTokens = splitTokens(payload.rawText);
  const candidateViews = [];

  for (const state of ["open", "done"]) {
    const taskIds = await listTaskIds(ctx, state);
    for (const taskId of taskIds) {
      const task = await buildTaskView(ctx, state, taskId);
      const memoryExcerpt = await readLatestMemoryExcerpt(withTaskContext(ctx, state, taskId));
      const slugTokens = splitTokens(task.slug);
      const titleTokens = splitTokens(task.title);
      const summaryTokens = splitTokens(task.summary);
      const artifactTokens = splitTokens(task.active_artifacts.join(" "));

      let score = state === "open" ? 10 : 0;
      const reasons = [];

      if (normalizeText(payload.rawText).includes(normalizeText(task.task_id))) {
        score += 80;
        reasons.push("explicit-task-id");
      }

      if (normalizeText(payload.rawText).includes(normalizeText(task.slug))) {
        score += 40;
        reasons.push("explicit-slug");
      }

      const titleScore = scoreOverlap(inputTokens, titleTokens, 6, 30);
      if (titleScore) {
        score += titleScore;
        reasons.push("title-overlap");
      }

      const slugScore = scoreOverlap(inputTokens, slugTokens, 4, 20);
      if (slugScore) {
        score += slugScore;
        reasons.push("slug-overlap");
      }

      const summaryScore = scoreOverlap(inputTokens, summaryTokens, 3, 18);
      if (summaryScore) {
        score += summaryScore;
        reasons.push("summary-overlap");
      }

      const memoryScore = scoreOverlap(inputTokens, splitTokens(memoryExcerpt), 3, 24);
      if (memoryScore) {
        score += memoryScore;
        reasons.push("memory-overlap");
      }

      const artifactScore = scoreOverlap(inputTokens, artifactTokens, 5, 20);
      if (artifactScore) {
        score += artifactScore;
        reasons.push("artifact-overlap");
      }

      if (
        sessionState.current_task_id &&
        sessionState.current_task_id === task.task_id &&
        /(retomar|continuar|seguir|eso|aquello|lo anterior|this|continue)/i.test(payload.rawText)
      ) {
        score += 25;
        reasons.push("session-continuity");
      }

      candidateViews.push({
        ...task,
        score,
        reasons,
      });
    }
  }

  candidateViews.sort((left, right) => right.score - left.score);
  const best = candidateViews[0];
  const second = candidateViews[1];

  if (!best || best.score < NEW_TASK_THRESHOLD) {
    return { mode: "new", task: null, candidates: [] };
  }

  if (
    best.score >= AUTO_RESUME_THRESHOLD &&
    (!second || best.score - second.score >= DOMINANCE_MARGIN)
  ) {
    return {
      mode: "resume",
      task: best,
      candidates: candidateViews.slice(0, 3),
    };
  }

  return {
    mode: "ambiguous",
    task: null,
    candidates: candidateViews
      .slice(0, 3)
      .filter((candidate) => candidate.score >= NEW_TASK_THRESHOLD),
  };
}

async function findAvailableTaskId(ctx, slug) {
  let suffix = "";
  let counter = 2;
  while (true) {
    const candidate = `${dateStamp()}-${slug}${suffix}`;
    if (!(await findTaskById(ctx, candidate))) {
      return candidate;
    }
    suffix = `-${counter}`;
    counter += 1;
  }
}

async function writeTaskStatus(taskDir, status) {
  await writeJson(path.join(taskDir, "status.json"), status);
}

async function createTaskFolder(ctx, {
  state,
  title,
  summary,
  resolutionMode,
  candidateMatches = [],
  rawText = "",
}) {
  const slug = slugify(title);
  const taskId = await findAvailableTaskId(ctx, slug);
  const createdAt = new Date().toISOString();
  const taskDir = withTaskContext(ctx, state, taskId);

  await ensureDir(taskDir);
  await ensureDir(path.join(taskDir, "attachments"));
  await ensureDir(path.join(taskDir, "artifacts"));

  const status = {
    task_id: taskId,
    slug,
    state,
    resolution_mode: resolutionMode,
    created_at: createdAt,
    updated_at: createdAt,
    last_input_at: createdAt,
    done_confirmed: false,
    active_artifacts: [],
    candidate_matches: candidateMatches.map((candidate) => ({
      task_id: candidate.task_id,
      title: candidate.title,
      state: candidate.state,
      score: candidate.score,
      reasons: candidate.reasons,
    })),
  };

  await writeTaskStatus(taskDir, status);
  await writeText(
    path.join(taskDir, "task.md"),
    renderTaskMarkdown({
      title,
      summary,
      slug,
      taskId,
      state,
      createdAt,
      updatedAt: createdAt,
    }),
  );
  await writeText(path.join(taskDir, "definition-of-done.md"), renderDodMarkdown());
  await writeText(
    path.join(taskDir, "conversation-log.md"),
    renderConversationSeed({ title, taskId, createdAt }),
  );

  if (rawText) {
    await appendConversationLog(taskDir, [
      `Initial resolution: \`${resolutionMode}\``,
      `Initial summary: ${summary}`,
    ]);
  }

  return { taskId, taskDir, status };
}

async function createMemory(taskDir, {
  taskId,
  resolutionMode,
  payload,
  title,
  candidateTaskIds = [],
}) {
  const memoryNumber = await nextMemoryNumber(taskDir);
  const memoryId = `rag-memory-${memoryNumber}`;
  const summary = summarizeInput(payload.rawText, title);
  const attachmentPaths = await copyAttachmentIfNeeded(taskDir, payload);
  const metadata = {
    task_id: taskId,
    memory_id: memoryId,
    created_at: new Date().toISOString(),
    resolution_mode: resolutionMode,
    input_source: payload.sourceType,
    input_title: title,
    attachment_paths: attachmentPaths.length ? attachmentPaths : ["none"],
    candidate_task_ids: candidateTaskIds.length ? candidateTaskIds : ["none"],
  };

  const markdown = renderMemoryMarkdown({
    metadata,
    insights: summary.insights,
    takeaways: summary.takeaways,
    rawText: payload.rawText,
  });
  const memoryPath = path.join(taskDir, `${memoryId}.md`);
  await writeText(memoryPath, markdown);
  return {
    memoryId,
    memoryPath,
    summary,
    attachmentPaths,
  };
}

async function updateStatusAfterMemory(taskDir, status, memory, overrides = {}) {
  const merged = {
    ...status,
    updated_at: new Date().toISOString(),
    last_input_at: new Date().toISOString(),
    active_artifacts: await listArtifactPaths(taskDir),
    ...overrides,
  };
  await writeTaskStatus(taskDir, merged);
  return merged;
}

async function relocateTask(ctx, taskId, sourceState, targetState) {
  const sourcePath = withTaskContext(ctx, sourceState, taskId);
  let targetId = taskId;
  let targetPath = withTaskContext(ctx, targetState, targetId);

  if (await pathExists(targetPath)) {
    targetId = await findAvailableTaskId(ctx, slugify(taskId, "task"));
    targetPath = withTaskContext(ctx, targetState, targetId);
  }

  await rename(sourcePath, targetPath);
  const status =
    (await readJson(path.join(targetPath, "status.json"), {})) || {};
  status.task_id = targetId;
  status.state = targetState;
  status.updated_at = new Date().toISOString();
  await writeTaskStatus(targetPath, status);

  const taskMarkdown = await readText(path.join(targetPath, "task.md"), "");
  if (taskMarkdown) {
    const title = parseTitleFromTaskMarkdown(taskMarkdown, targetId);
    const summary = parseSection(taskMarkdown, "Summary") || firstLine(taskMarkdown, title);
    await writeText(
      path.join(targetPath, "task.md"),
      renderTaskMarkdown({
        title,
        summary,
        slug: status.slug || slugify(title),
        taskId: targetId,
        state: targetState,
        createdAt: status.created_at || new Date().toISOString(),
        updatedAt: status.updated_at,
      }),
    );
  }
  return { taskId: targetId, taskDir: targetPath };
}

async function mergePendingIntoTask(ctx, pendingId, targetTaskId) {
  const pending = await findTaskById(ctx, pendingId);
  const target = await findTaskById(ctx, targetTaskId);
  if (!pending || pending.state !== "pending") {
    throw new Error(`Pending task not found: ${pendingId}`);
  }
  if (!target) {
    throw new Error(`Target task not found: ${targetTaskId}`);
  }

  const pendingDir = pending.taskDir;
  const targetDir = target.taskDir;
  const pendingMemories = await listMemoryFiles(pendingDir);
  for (const memoryName of pendingMemories) {
    const raw = await readText(path.join(pendingDir, memoryName), "");
    const { metadata, body } = parseFrontmatter(raw);
    const nextNumber = await nextMemoryNumber(targetDir);
    const newId = `rag-memory-${nextNumber}`;
    const nextFrontmatter = serializeFrontmatter({
      ...metadata,
      task_id: targetTaskId,
      memory_id: newId,
      resolution_mode: "resume",
    });
    await writeText(path.join(targetDir, `${newId}.md`), `${nextFrontmatter}${body}`);
  }

  for (const folderName of ["attachments", "artifacts"]) {
    const sourceFolder = path.join(pendingDir, folderName);
    const targetFolder = path.join(targetDir, folderName);
    if (await pathExists(sourceFolder)) {
      await ensureDir(targetFolder);
      await cp(sourceFolder, targetFolder, { recursive: true, force: false });
    }
  }

  await appendConversationLog(targetDir, [
    `Merged pending ambiguous intake \`${pendingId}\` into this task.`,
  ]);

  await rm(pendingDir, { recursive: true, force: true });
}

export async function syncTasklog(ctx) {
  const openIds = await listTaskIds(ctx, "open");
  const openTasks = [];
  for (const taskId of openIds) {
    openTasks.push(await buildTaskView(ctx, "open", taskId));
  }

  let body = `# Task Log

Generated from \`workspaces/tasks/open\`. This file lists open tasks only.

`;

  if (!openTasks.length) {
    body += "No open tasks.\n";
    await writeText(ctx.tasklogPath, body);
    return;
  }

  body += "| Task ID | Title | Updated | State | Next step |\n";
  body += "| --- | --- | --- | --- | --- |\n";
  for (const task of openTasks) {
    body += `| \`${task.task_id}\` | ${task.title} | ${task.updated_at || "—"} | ${task.state} | ${task.next_step || "—"} |\n`;
  }
  await writeText(ctx.tasklogPath, body);
}

async function buildRecentInputs(ctx) {
  const items = [];
  for (const state of TASK_STATES) {
    const taskIds = await listTaskIds(ctx, state);
    for (const taskId of taskIds) {
      const taskDir = withTaskContext(ctx, state, taskId);
      const taskView = await buildTaskView(ctx, state, taskId);
      const memories = await listMemoryFiles(taskDir);
      for (const memoryName of memories) {
        const raw = await readText(path.join(taskDir, memoryName), "");
        const { metadata, body } = parseFrontmatter(raw);
        items.push({
          task_id: taskId,
          state,
          memory_id: metadata.memory_id || memoryName.replace(/\.md$/, ""),
          created_at: metadata.created_at || taskView.updated_at,
          resolution_mode: metadata.resolution_mode || taskView.resolution_mode,
          title: metadata.input_title || taskView.title,
          excerpt: firstLine(parseSection(body, "Input transcription or description"), ""),
          path: path.relative(ctx.root, path.join(taskDir, memoryName)),
        });
      }
    }
  }

  return items
    .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
    .slice(0, RECENT_INPUT_LIMIT);
}

function buildTreeNode(name, type, children = []) {
  return { name, type, children };
}

async function buildFilesystemNode(targetPath, depth = 0) {
  const itemStat = await stat(targetPath);
  const name = path.basename(targetPath);
  if (!itemStat.isDirectory() || depth >= 2) {
    return buildTreeNode(name, itemStat.isDirectory() ? "directory" : "file");
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  const children = [];
  for (const entry of entries.slice(0, 40)) {
    children.push(await buildFilesystemNode(path.join(targetPath, entry.name), depth + 1));
  }
  return buildTreeNode(name, "directory", children);
}

export async function syncIndexes(ctx) {
  const summary = {
    generated_at: new Date().toISOString(),
  };
  const views = {};
  for (const state of TASK_STATES) {
    views[state] = [];
    for (const taskId of await listTaskIds(ctx, state)) {
      views[state].push(await buildTaskView(ctx, state, taskId));
    }
  }

  const sessionState = await ensureSessionState(ctx);
  const filesystemRoots = [
    path.join(ctx.root, "scripts"),
    path.join(ctx.root, "admin-app"),
    path.join(ctx.root, "assets"),
    path.join(ctx.root, "agents"),
    path.join(ctx.root, "skills"),
    ctx.tasksRoot,
  ];
  const filesystem = {
    generated_at: new Date().toISOString(),
    roots: [],
  };

  for (const rootPath of filesystemRoots) {
    if (await pathExists(rootPath)) {
      filesystem.roots.push(await buildFilesystemNode(rootPath));
    }
  }

  summary.open_count = views.open.length;
  summary.done_count = views.done.length;
  summary.pending_count = views.pending.length;
  summary.currentTaskId = sessionState.current_task_id || null;
  summary.currentTaskPath = sessionState.current_task_path || null;
  summary.lastInputAt = sessionState.last_input_at || null;
  summary.lastResolutionMode = sessionState.last_resolution_mode || null;
  summary.pendingAmbiguousMatches = sessionState.pending_ambiguous_matches || [];

  await writeJson(path.join(ctx.indexesRoot, "open-tasks.json"), views.open);
  await writeJson(path.join(ctx.indexesRoot, "done-tasks.json"), views.done);
  await writeJson(path.join(ctx.indexesRoot, "pending-tasks.json"), views.pending);
  await writeJson(
    path.join(ctx.indexesRoot, "task-catalog.json"),
    [...views.open, ...views.pending, ...views.done],
  );
  await writeJson(path.join(ctx.indexesRoot, "recent-inputs.json"), await buildRecentInputs(ctx));
  await writeJson(path.join(ctx.indexesRoot, "filesystem-summary.json"), filesystem);
  await writeJson(path.join(ctx.indexesRoot, "summary.json"), summary);

  return { summary, views, filesystem, sessionState };
}

async function buildDashboardPayload(ctx) {
  const summary = (await readJson(path.join(ctx.indexesRoot, "summary.json"), null)) || {};
  const openTasks =
    (await readJson(path.join(ctx.indexesRoot, "open-tasks.json"), [])) || [];
  const doneTasks =
    (await readJson(path.join(ctx.indexesRoot, "done-tasks.json"), [])) || [];
  const pendingTasks =
    (await readJson(path.join(ctx.indexesRoot, "pending-tasks.json"), [])) || [];
  const filesystem =
    (await readJson(path.join(ctx.indexesRoot, "filesystem-summary.json"), {})) || {};
  const sessionState = await ensureSessionState(ctx);
  const config = await getSafeConfig(ctx);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    openTasks,
    doneTasks,
    pendingTasks,
    filesystem,
    sessionState,
    config,
  };
}

export async function buildDashboardSnapshot(ctx) {
  const payload = await buildDashboardPayload(ctx);
  await writeText(ctx.dashboardSnapshotPath, buildStaticDashboardHtml(payload));
  return ctx.dashboardSnapshotPath;
}

async function syncAll(ctx) {
  await syncIndexes(ctx);
  await syncTasklog(ctx);
  await buildDashboardSnapshot(ctx);
}

function createCandidatePreview(candidates) {
  return candidates.map((candidate) => ({
    task_id: candidate.task_id,
    title: candidate.title,
    state: candidate.state,
    score: candidate.score,
    reasons: candidate.reasons,
    path: candidate.path,
  }));
}

export async function initOrchestrator(workspaceRoot) {
  const ctx = createContext(workspaceRoot);
  await assertWorkspaceContext(ctx);
  await ensureTaskStructure(ctx);
  await syncAll(ctx);
  return {
    workspace_root: ctx.root,
    tasklog_path: ctx.tasklogPath,
    dashboard_snapshot: ctx.dashboardSnapshotPath,
  };
}

export async function intakeTask(workspaceRoot, options) {
  const ctx = createContext(workspaceRoot);
  await assertWorkspaceContext(ctx);
  await ensureTaskStructure(ctx);

  const payload = await loadInputPayload(options.text, options.file);
  const title = deriveTitleFromInput(payload.rawText, options.title || "");
  const resolution = await resolveTask(ctx, payload, options);

  if (resolution.mode === "new") {
    const created = await createTaskFolder(ctx, {
      state: "open",
      title,
      summary: summarizeInput(payload.rawText, title).summary,
      resolutionMode: "new",
      rawText: payload.rawText,
    });
    const memory = await createMemory(created.taskDir, {
      taskId: created.taskId,
      resolutionMode: "new",
      payload,
      title,
    });
    await updateStatusAfterMemory(created.taskDir, created.status, memory);
    await appendConversationLog(created.taskDir, [
      `Input registered as new task.`,
      `Memory created: \`${memory.memoryId}\``,
    ]);

    const sessionState = await ensureSessionState(ctx);
    sessionState.current_task_id = created.taskId;
    sessionState.current_task_path = path.relative(ctx.root, created.taskDir);
    sessionState.last_input_at = new Date().toISOString();
    sessionState.last_resolution_mode = "new";
    sessionState.pending_ambiguous_matches = [];
    await writeJson(ctx.sessionStatePath, sessionState);
    await syncAll(ctx);

    return {
      mode: "new",
      task_id: created.taskId,
      task_path: path.relative(ctx.root, created.taskDir),
      memory_id: memory.memoryId,
    };
  }

  if (resolution.mode === "resume") {
    let location = await findTaskById(ctx, resolution.task.task_id);
    if (!location) {
      throw new Error(`Resolved task vanished: ${resolution.task.task_id}`);
    }

    if (location.state === "done") {
      location = {
        state: "open",
        ...(await relocateTask(ctx, resolution.task.task_id, "done", "open")),
      };
    }

    const status =
      (await readJson(path.join(location.taskDir, "status.json"), {})) || {};
    const memory = await createMemory(location.taskDir, {
      taskId: resolution.task.task_id,
      resolutionMode: "resume",
      payload,
      title,
      candidateTaskIds: createCandidatePreview(resolution.candidates).map(
        (candidate) => candidate.task_id,
      ),
    });
    await updateStatusAfterMemory(location.taskDir, status, memory, {
      state: "open",
      resolution_mode: "resume",
      done_confirmed: false,
      candidate_matches: [],
    });
    await appendConversationLog(location.taskDir, [
      `Input registered as resume.`,
      `Memory created: \`${memory.memoryId}\``,
    ]);

    const sessionState = await ensureSessionState(ctx);
    sessionState.current_task_id = resolution.task.task_id;
    sessionState.current_task_path = path.relative(ctx.root, location.taskDir);
    sessionState.last_input_at = new Date().toISOString();
    sessionState.last_resolution_mode = "resume";
    sessionState.pending_ambiguous_matches = [];
    await writeJson(ctx.sessionStatePath, sessionState);
    await syncAll(ctx);

    return {
      mode: "resume",
      task_id: resolution.task.task_id,
      task_path: path.relative(ctx.root, location.taskDir),
      memory_id: memory.memoryId,
      reopened: location.state === "open" && resolution.task.state === "done",
    };
  }

  const pending = await createTaskFolder(ctx, {
    state: "pending",
    title,
    summary: summarizeInput(payload.rawText, title).summary,
    resolutionMode: "ambiguous",
    candidateMatches: resolution.candidates,
    rawText: payload.rawText,
  });
  const memory = await createMemory(pending.taskDir, {
    taskId: pending.taskId,
    resolutionMode: "ambiguous",
    payload,
    title,
    candidateTaskIds: createCandidatePreview(resolution.candidates).map(
      (candidate) => candidate.task_id,
    ),
  });
  await updateStatusAfterMemory(pending.taskDir, pending.status, memory, {
    state: "pending",
    resolution_mode: "ambiguous",
  });
  await appendConversationLog(pending.taskDir, [
    `Input registered as ambiguous.`,
    `Candidates: ${createCandidatePreview(resolution.candidates)
      .map((candidate) => candidate.task_id)
      .join(", ")}`,
  ]);

  const sessionState = await ensureSessionState(ctx);
  sessionState.last_input_at = new Date().toISOString();
  sessionState.last_resolution_mode = "ambiguous";
  sessionState.pending_ambiguous_matches = [
    {
      pending_task_id: pending.taskId,
      candidates: createCandidatePreview(resolution.candidates),
    },
  ];
  await writeJson(ctx.sessionStatePath, sessionState);
  await syncAll(ctx);

  return {
    mode: "ambiguous",
    pending_task_id: pending.taskId,
    pending_task_path: path.relative(ctx.root, pending.taskDir),
    memory_id: memory.memoryId,
    candidates: createCandidatePreview(resolution.candidates),
  };
}

export async function openTask(workspaceRoot, options) {
  const ctx = createContext(workspaceRoot);
  await assertWorkspaceContext(ctx);
  await ensureTaskStructure(ctx);

  if (options.fromPending) {
    const pending = await findTaskById(ctx, options.fromPending);
    if (!pending || pending.state !== "pending") {
      throw new Error(`Pending task not found: ${options.fromPending}`);
    }

    const pendingStatus =
      (await readJson(path.join(pending.taskDir, "status.json"), {})) || {};
    const taskMarkdown = await readText(path.join(pending.taskDir, "task.md"), "");
    const newTitle = options.title || parseTitleFromTaskMarkdown(taskMarkdown, options.fromPending);

    const moved = await relocateTask(ctx, options.fromPending, "pending", "open");
    const nextStatus = {
      ...pendingStatus,
      task_id: moved.taskId,
      state: "open",
      resolution_mode: "new",
      updated_at: new Date().toISOString(),
      last_input_at: new Date().toISOString(),
      done_confirmed: false,
      candidate_matches: [],
    };
    await writeTaskStatus(moved.taskDir, nextStatus);
    await writeText(
      path.join(moved.taskDir, "task.md"),
      renderTaskMarkdown({
        title: newTitle,
        summary: parseSection(taskMarkdown, "Summary") || firstLine(taskMarkdown, newTitle),
        slug: nextStatus.slug || slugify(newTitle),
        taskId: moved.taskId,
        state: "open",
        createdAt: nextStatus.created_at || new Date().toISOString(),
        updatedAt: nextStatus.updated_at,
      }),
    );
    await appendConversationLog(moved.taskDir, [
      `Pending ambiguous intake promoted to a new open task.`,
    ]);
    const sessionState = await ensureSessionState(ctx);
    sessionState.current_task_id = moved.taskId;
    sessionState.current_task_path = path.relative(ctx.root, moved.taskDir);
    sessionState.last_resolution_mode = "new";
    sessionState.pending_ambiguous_matches = [];
    await writeJson(ctx.sessionStatePath, sessionState);
    await syncAll(ctx);
    return {
      mode: "new",
      task_id: moved.taskId,
      task_path: path.relative(ctx.root, moved.taskDir),
    };
  }

  if (!options.title) {
    throw new Error("task-open requires --title.");
  }

  const created = await createTaskFolder(ctx, {
    state: "open",
    title: options.title,
    summary: options.summary || options.title,
    resolutionMode: "new",
  });
  const sessionState = await ensureSessionState(ctx);
  sessionState.current_task_id = created.taskId;
  sessionState.current_task_path = path.relative(ctx.root, created.taskDir);
  sessionState.last_input_at = new Date().toISOString();
  sessionState.last_resolution_mode = "new";
  sessionState.pending_ambiguous_matches = [];
  await writeJson(ctx.sessionStatePath, sessionState);
  await syncAll(ctx);

  return {
    mode: "new",
    task_id: created.taskId,
    task_path: path.relative(ctx.root, created.taskDir),
  };
}

export async function resumeTask(workspaceRoot, options) {
  const ctx = createContext(workspaceRoot);
  await assertWorkspaceContext(ctx);
  await ensureTaskStructure(ctx);

  if (!options.taskId) {
    throw new Error("task-resume requires --task-id.");
  }

  let target = await findTaskById(ctx, options.taskId);
  if (!target) {
    throw new Error(`Task not found: ${options.taskId}`);
  }

  if (target.state === "done") {
    target = {
      state: "open",
      ...(await relocateTask(ctx, options.taskId, "done", "open")),
    };
  }

  if (options.pendingId) {
    await mergePendingIntoTask(ctx, options.pendingId, options.taskId);
  }

  const status =
    (await readJson(path.join(target.taskDir, "status.json"), {})) || {};
  status.state = "open";
  status.done_confirmed = false;
  status.updated_at = new Date().toISOString();
  status.last_input_at = new Date().toISOString();
  status.resolution_mode = "resume";
  await writeTaskStatus(target.taskDir, status);
  await appendConversationLog(target.taskDir, [
    `Task resumed explicitly by operator.`,
  ]);

  const sessionState = await ensureSessionState(ctx);
  sessionState.current_task_id = options.taskId;
  sessionState.current_task_path = path.relative(ctx.root, target.taskDir);
  sessionState.last_input_at = new Date().toISOString();
  sessionState.last_resolution_mode = "resume";
  sessionState.pending_ambiguous_matches = [];
  await writeJson(ctx.sessionStatePath, sessionState);
  await syncAll(ctx);

  return {
    mode: "resume",
    task_id: options.taskId,
    task_path: path.relative(ctx.root, target.taskDir),
  };
}

function findUncheckedDodItems(markdown) {
  return markdown
    .split("\n")
    .filter((line) => /^\s*-\s+\[\s\]/.test(line))
    .map((line) => line.replace(/^\s*-\s+\[\s\]\s*/, "").trim());
}

export async function closeTask(workspaceRoot, options) {
  const ctx = createContext(workspaceRoot);
  await assertWorkspaceContext(ctx);
  await ensureTaskStructure(ctx);

  if (!options.taskId) {
    throw new Error("task-close requires --task-id.");
  }
  if (!options.confirmed) {
    throw new Error("task-close requires --confirm.");
  }

  const target = await findTaskById(ctx, options.taskId);
  if (!target || target.state !== "open") {
    throw new Error(`Open task not found: ${options.taskId}`);
  }

  const dodPath = path.join(target.taskDir, "definition-of-done.md");
  const dod = await readText(dodPath, "");
  const unchecked = findUncheckedDodItems(dod);
  if (unchecked.length) {
    throw new Error(
      `Definition of done is incomplete for ${options.taskId}: ${unchecked.join("; ")}`,
    );
  }

  const status =
    (await readJson(path.join(target.taskDir, "status.json"), {})) || {};
  status.state = "done";
  status.done_confirmed = true;
  status.updated_at = new Date().toISOString();
  status.last_input_at = new Date().toISOString();
  status.resolution_mode = "close";
  await writeTaskStatus(target.taskDir, status);
  await appendConversationLog(target.taskDir, [
    `Task closed after explicit user confirmation.`,
  ]);

  const moved = await relocateTask(ctx, options.taskId, "open", "done");
  const sessionState = await ensureSessionState(ctx);
  if (sessionState.current_task_id === options.taskId) {
    sessionState.current_task_id = null;
    sessionState.current_task_path = null;
  }
  sessionState.last_input_at = new Date().toISOString();
  sessionState.last_resolution_mode = "close";
  sessionState.pending_ambiguous_matches = [];
  await writeJson(ctx.sessionStatePath, sessionState);
  await syncAll(ctx);

  return {
    mode: "done",
    task_id: moved.taskId,
    task_path: path.relative(ctx.root, moved.taskDir),
  };
}

export async function getTaskDetail(workspaceRoot, taskId) {
  const ctx = createContext(workspaceRoot);
  await ensureTaskStructure(ctx);
  const match = await findTaskById(ctx, taskId);
  if (!match) {
    return null;
  }
  const view = await buildTaskView(ctx, match.state, taskId);
  return {
    ...view,
    task_markdown: await readText(path.join(match.taskDir, "task.md"), ""),
    definition_of_done: await readText(path.join(match.taskDir, "definition-of-done.md"), ""),
    conversation_log: await readText(path.join(match.taskDir, "conversation-log.md"), ""),
  };
}

export async function getTaskMemories(workspaceRoot, taskId) {
  const ctx = createContext(workspaceRoot);
  await ensureTaskStructure(ctx);
  const match = await findTaskById(ctx, taskId);
  if (!match) {
    return [];
  }
  const taskDir = match.taskDir;
  const memories = [];
  for (const memoryFile of await listMemoryFiles(taskDir)) {
    const raw = await readText(path.join(taskDir, memoryFile), "");
    const { metadata, body } = parseFrontmatter(raw);
    memories.push({
      ...metadata,
      path: path.relative(ctx.root, path.join(taskDir, memoryFile)),
      content: body.trim(),
    });
  }
  return memories;
}

async function parseCodexConfig(raw) {
  const pluginMatches = Array.from(
    raw.matchAll(/\[plugins\."([^"]+)"\]\s+enabled = true/g),
  ).map((match) => match[1]);
  const mcpMatches = Array.from(raw.matchAll(/\[mcp_servers\.([^\]]+)\]/g)).map(
    (match) => match[1],
  );
  const modelMatch = raw.match(/model = "([^"]+)"/);
  return {
    model: modelMatch ? modelMatch[1] : null,
    plugins: pluginMatches,
    mcp_servers: mcpMatches,
  };
}

export async function getSafeConfig(workspaceRoot) {
  const ctx =
    typeof workspaceRoot === "string" ? createContext(workspaceRoot) : workspaceRoot;
  const localDesktop = path.join(ctx.root, "local", "profiles", "desktop", "claude_desktop_config.json");
  const localClaude = path.join(ctx.root, "local", "profiles", "claude", "settings.json");
  const localClaudeLocal = path.join(ctx.root, "local", "profiles", "claude", "settings.local.json");
  const localCodex = path.join(ctx.root, "local", "profiles", "codex", "config.toml");

  const desktopPath = (await pathExists(localDesktop))
    ? localDesktop
    : path.join(process.env.HOME || "", "Library/Application Support/Claude/claude_desktop_config.json");
  const claudePath = (await pathExists(localClaude))
    ? localClaude
    : path.join(process.env.HOME || "", ".claude/settings.json");
  const claudeLocalPath = (await pathExists(localClaudeLocal))
    ? localClaudeLocal
    : path.join(process.env.HOME || "", ".claude/settings.local.json");
  const codexPath = (await pathExists(localCodex))
    ? localCodex
    : path.join(process.env.HOME || "", ".codex/config.toml");

  const desktop = (await readJson(desktopPath, {})) || {};
  const claude = (await readJson(claudePath, {})) || {};
  const claudeLocal = (await readJson(claudeLocalPath, {})) || {};
  const codex = await parseCodexConfig(await readText(codexPath, ""));

  return {
    desktop: {
      file: desktopPath,
      mcp_servers: Object.keys(desktop.mcpServers || {}),
      trusted_folders:
        desktop.preferences?.localAgentModeTrustedFolders || [],
    },
    claude: {
      file: claudePath,
      enabled_plugins: Object.entries(claude.enabledPlugins || {})
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key),
    },
    claude_local: {
      file: claudeLocalPath,
      active_mcp_servers: Object.keys(claudeLocal.mcpServers || {}),
      inactive_mcp_servers: Object.keys(claudeLocal.mcpServersInactive || {}),
    },
    codex: {
      file: codexPath,
      model: codex.model,
      plugins: codex.plugins,
      mcp_servers: codex.mcp_servers,
    },
  };
}

export async function getFilesystemSummary(workspaceRoot) {
  const ctx = createContext(workspaceRoot);
  await ensureTaskStructure(ctx);
  return (
    (await readJson(path.join(ctx.indexesRoot, "filesystem-summary.json"), null)) ||
    (await syncIndexes(ctx)).filesystem
  );
}

export async function getSummary(workspaceRoot) {
  const ctx = createContext(workspaceRoot);
  await ensureTaskStructure(ctx);
  const payload = await buildDashboardPayload(ctx);
  const sourceFiles = [
    path.join(ctx.adminAppRoot, "server.mjs"),
    path.join(ctx.adminPublicRoot, "dashboard.html"),
    path.join(ctx.adminPublicRoot, "app.js"),
    path.join(ctx.adminPublicRoot, "styles.css"),
    path.join(ctx.adminLibRoot, "cli.mjs"),
    path.join(ctx.adminLibRoot, "config.mjs"),
    path.join(ctx.adminLibRoot, "store.mjs"),
    path.join(ctx.adminLibRoot, "render.mjs"),
  ];
  const missingSourceFiles = [];
  for (const source of sourceFiles) {
    if (!(await pathExists(source))) {
      missingSourceFiles.push(path.relative(ctx.root, source));
    }
  }

  return {
    ...payload.summary,
    currentTaskPath: payload.sessionState.current_task_path || null,
    dashboard_snapshot: (await pathExists(ctx.dashboardSnapshotPath))
      ? path.relative(ctx.root, ctx.dashboardSnapshotPath)
      : null,
    missing_admin_source_files: missingSourceFiles,
  };
}

export async function doctorDashboard(workspaceRoot) {
  const ctx = createContext(workspaceRoot);
  await assertWorkspaceContext(ctx);
  await ensureTaskStructure(ctx);
  await syncAll(ctx);
  const checks = [];

  const required = [
    ctx.adminAppRoot,
    path.join(ctx.adminAppRoot, "server.mjs"),
    path.join(ctx.adminPublicRoot, "dashboard.html"),
    path.join(ctx.adminPublicRoot, "app.js"),
    path.join(ctx.adminPublicRoot, "styles.css"),
    path.join(ctx.adminLibRoot, "cli.mjs"),
    path.join(ctx.adminLibRoot, "config.mjs"),
    path.join(ctx.adminLibRoot, "store.mjs"),
    path.join(ctx.adminLibRoot, "render.mjs"),
    ctx.openRoot,
    ctx.doneRoot,
    ctx.pendingRoot,
    ctx.indexesRoot,
    ctx.sessionStatePath,
    ctx.tasklogPath,
    ctx.dashboardSnapshotPath,
    path.join(ctx.indexesRoot, "summary.json"),
    path.join(ctx.indexesRoot, "open-tasks.json"),
    path.join(ctx.indexesRoot, "done-tasks.json"),
    path.join(ctx.indexesRoot, "pending-tasks.json"),
    path.join(ctx.indexesRoot, "task-catalog.json"),
    path.join(ctx.indexesRoot, "recent-inputs.json"),
    path.join(ctx.indexesRoot, "filesystem-summary.json"),
  ];

  for (const requiredPath of required) {
    const ok = await pathExists(requiredPath);
    checks.push({
      label: path.relative(ctx.root, requiredPath) || ".",
      ok,
    });
  }

  const sessionState = await readJson(ctx.sessionStatePath, {});
  for (const key of [
    "current_task_id",
    "current_task_path",
    "last_input_at",
    "last_resolution_mode",
    "pending_ambiguous_matches",
  ]) {
    checks.push({
      label: `session-state:${key}`,
      ok: Object.prototype.hasOwnProperty.call(sessionState, key),
    });
  }

  for (const state of TASK_STATES) {
    for (const taskId of await listTaskIds(ctx, state)) {
      const taskDir = withTaskContext(ctx, state, taskId);
      for (const fileName of [
        "task.md",
        "status.json",
        "definition-of-done.md",
        "conversation-log.md",
      ]) {
        checks.push({
          label: path.relative(ctx.root, path.join(taskDir, fileName)),
          ok: await pathExists(path.join(taskDir, fileName)),
        });
      }
    }
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export async function repairDashboard(workspaceRoot) {
  const ctx = createContext(workspaceRoot);
  await assertWorkspaceContext(ctx);
  await ensureTaskStructure(ctx);
  await syncAll(ctx);
  return doctorDashboard(ctx.root);
}
