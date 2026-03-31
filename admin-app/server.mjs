import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import {
  closeTask,
  doctorDashboard,
  getFilesystemSummary,
  getSafeConfig,
  getSummary,
  getTaskDetail,
  getTaskMemories,
  initOrchestrator,
  intakeTask,
  openTask,
  repairDashboard,
  resumeTask,
} from "./lib/store.mjs";
import { createContext, getProjectRoot } from "./lib/config.mjs";

const workspaceRoot =
  process.env.JM_WORKSPACE_ROOT || getProjectRoot(import.meta.url);
const ctx = createContext(workspaceRoot);
const port = Number(process.env.ADMIN_APP_PORT || "4173");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(response, filePath, contentType) {
  const file = await readFile(filePath);
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(file);
}

function apiError(response, error) {
  sendJson(response, 400, { ok: false, error: error.message });
}

await initOrchestrator(workspaceRoot);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  try {
    if (url.pathname === "/" || url.pathname === "/dashboard.html") {
      await serveStatic(
        response,
        path.join(ctx.adminPublicRoot, "dashboard.html"),
        "text/html; charset=utf-8",
      );
      return;
    }

    if (url.pathname === "/app.js") {
      await serveStatic(
        response,
        path.join(ctx.adminPublicRoot, "app.js"),
        "text/javascript; charset=utf-8",
      );
      return;
    }

    if (url.pathname === "/styles.css") {
      await serveStatic(
        response,
        path.join(ctx.adminPublicRoot, "styles.css"),
        "text/css; charset=utf-8",
      );
      return;
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      sendJson(response, 200, { ok: true, ...(await doctorDashboard(workspaceRoot)) });
      return;
    }

    if (url.pathname === "/api/summary" && request.method === "GET") {
      sendJson(response, 200, await getSummary(workspaceRoot));
      return;
    }

    if (url.pathname === "/api/filesystem" && request.method === "GET") {
      sendJson(response, 200, await getFilesystemSummary(workspaceRoot));
      return;
    }

    if (url.pathname === "/api/config/mcp" && request.method === "GET") {
      sendJson(response, 200, await getSafeConfig(workspaceRoot));
      return;
    }

    if (url.pathname === "/api/tasks" && request.method === "GET") {
      const state = url.searchParams.get("state");
      const summary = await getSummary(workspaceRoot);
      const indexes = await import("node:fs/promises");
      const filePath =
        state === "done"
          ? path.join(ctx.indexesRoot, "done-tasks.json")
          : state === "pending"
            ? path.join(ctx.indexesRoot, "pending-tasks.json")
            : path.join(ctx.indexesRoot, "open-tasks.json");
      const raw = await indexes.readFile(filePath, "utf8");
      sendJson(response, 200, {
        summary,
        state: state || "open",
        tasks: JSON.parse(raw),
      });
      return;
    }

    if (url.pathname === "/api/tasks/intake" && request.method === "POST") {
      const body = await readBody(request);
      sendJson(
        response,
        200,
        await intakeTask(workspaceRoot, {
          text: body.text || "",
          title: body.title || "",
          taskId: body.taskId || "",
          forceNew: Boolean(body.forceNew),
        }),
      );
      return;
    }

    if (url.pathname === "/api/repair" && request.method === "POST") {
      sendJson(response, 200, await repairDashboard(workspaceRoot));
      return;
    }

    const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch && request.method === "GET") {
      const detail = await getTaskDetail(workspaceRoot, decodeURIComponent(taskMatch[1]));
      if (!detail) {
        sendJson(response, 404, { ok: false, error: "Task not found." });
        return;
      }
      sendJson(response, 200, detail);
      return;
    }

    const memoryMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/memories$/);
    if (memoryMatch && request.method === "GET") {
      sendJson(
        response,
        200,
        await getTaskMemories(workspaceRoot, decodeURIComponent(memoryMatch[1])),
      );
      return;
    }

    const closeMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/close$/);
    if (closeMatch && request.method === "POST") {
      const body = await readBody(request);
      sendJson(
        response,
        200,
        await closeTask(workspaceRoot, {
          taskId: decodeURIComponent(closeMatch[1]),
          confirmed: Boolean(body.confirmed),
        }),
      );
      return;
    }

    const openMatch = url.pathname === "/api/tasks/open" && request.method === "POST";
    if (openMatch) {
      const body = await readBody(request);
      sendJson(
        response,
        200,
        await openTask(workspaceRoot, {
          title: body.title || "",
          summary: body.summary || "",
          fromPending: body.fromPending || "",
        }),
      );
      return;
    }

    const resumeMatch = url.pathname === "/api/tasks/resume" && request.method === "POST";
    if (resumeMatch) {
      const body = await readBody(request);
      sendJson(
        response,
        200,
        await resumeTask(workspaceRoot, {
          taskId: body.taskId || "",
          pendingId: body.pendingId || "",
        }),
      );
      return;
    }

    sendJson(response, 404, { ok: false, error: "Not found." });
  } catch (error) {
    apiError(response, error);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`JM Labs admin app listening on http://127.0.0.1:${port}/dashboard.html`);
});
