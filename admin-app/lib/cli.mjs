import {
  closeTask,
  doctorDashboard,
  getSummary,
  initOrchestrator,
  intakeTask,
  openTask,
  repairDashboard,
  resumeTask,
  syncIndexes,
  syncTasklog,
  buildDashboardSnapshot,
} from "./store.mjs";
import { createContext, getProjectRoot } from "./config.mjs";

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--")) {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    } else {
      args._.push(value);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const workspaceRoot =
    args["workspace-root"] || process.env.JM_WORKSPACE_ROOT || getProjectRoot(import.meta.url);
  let result;

  switch (command) {
    case "init":
      result = await initOrchestrator(workspaceRoot);
      break;
    case "intake":
      result = await intakeTask(workspaceRoot, {
        text: args.text || "",
        file: args.file || "",
        title: args.title || "",
        taskId: args["task-id"] || "",
        forceNew: Boolean(args["force-new"]),
      });
      break;
    case "open":
      result = await openTask(workspaceRoot, {
        title: args.title || "",
        summary: args.summary || "",
        fromPending: args["from-pending"] || "",
      });
      break;
    case "resume":
      result = await resumeTask(workspaceRoot, {
        taskId: args["task-id"] || "",
        pendingId: args["pending-id"] || "",
      });
      break;
    case "close":
      result = await closeTask(workspaceRoot, {
        taskId: args["task-id"] || "",
        confirmed: Boolean(args.confirm),
      });
      break;
    case "sync-indexes":
      result = await syncIndexes(createContext(workspaceRoot));
      break;
    case "sync-tasklog":
      await syncTasklog(createContext(workspaceRoot));
      result = { ok: true };
      break;
    case "build-dashboard":
      result = {
        snapshot: await buildDashboardSnapshot(createContext(workspaceRoot)),
      };
      break;
    case "doctor":
      result = await doctorDashboard(workspaceRoot);
      if (!result.ok) {
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
        return;
      }
      break;
    case "repair":
      result = await repairDashboard(workspaceRoot);
      if (!result.ok) {
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
        return;
      }
      break;
    case "summary":
      result = await getSummary(workspaceRoot);
      break;
    default:
      console.error(
        "usage: node admin-app/lib/cli.mjs <init|intake|open|resume|close|sync-indexes|sync-tasklog|build-dashboard|doctor|repair|summary> [--workspace-root PATH]",
      );
      process.exitCode = 1;
      return;
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
