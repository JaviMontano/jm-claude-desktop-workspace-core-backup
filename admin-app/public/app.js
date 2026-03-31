const state = {
  summary: null,
  health: null,
  config: null,
  filesystem: null,
  selectedTaskId: null,
  tasks: {
    open: [],
    pending: [],
    done: [],
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show${isError ? " error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function renderSummaryCards() {
  const summaryRoot = document.getElementById("summary-cards");
  const summary = state.summary || {};
  const cards = [
    ["Open", summary.open_count ?? 0],
    ["Done", summary.done_count ?? 0],
    ["Pending", summary.pending_count ?? 0],
    ["Current", summary.currentTaskId || "—"],
  ];

  summaryRoot.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="summary-card">
          <small>${label}</small>
          <strong>${value}</strong>
        </article>`,
    )
    .join("");

  document.getElementById("open-count").textContent = summary.open_count ?? 0;
  document.getElementById("done-count").textContent = summary.done_count ?? 0;
  document.getElementById("pending-count").textContent = summary.pending_count ?? 0;
}

function taskButton(task) {
  return `
    <button class="task-item${state.selectedTaskId === task.task_id ? " active" : ""}" data-task-id="${task.task_id}">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <span class="task-meta">${escapeHtml(task.task_id)} · ${escapeHtml(task.updated_at || "sin timestamp")}</span>
      <span class="task-meta">${escapeHtml(task.next_step || "Sin siguiente paso")}</span>
    </button>`;
}

function renderTaskLists() {
  for (const key of ["open", "pending", "done"]) {
    const root = document.getElementById(`${key}-tasks`);
    const tasks = state.tasks[key] || [];
    root.innerHTML = tasks.length
      ? tasks.map(taskButton).join("")
      : `<div class="empty">No hay tareas ${key}.</div>`;
  }

  document.querySelectorAll("[data-task-id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedTaskId = element.dataset.taskId;
      refreshTaskDetail();
      renderTaskLists();
    });
  });
}

function renderHealth() {
  const root = document.getElementById("health-summary");
  const health = state.health || { checks: [] };
  root.innerHTML = health.checks
    .slice(0, 8)
    .map(
      (check) => `
        <div class="health-row">
          <span>${check.label}</span>
          <strong class="${check.ok ? "ok" : "bad"}">${check.ok ? "OK" : "FAIL"}</strong>
        </div>`,
    )
    .join("");
}

function renderPanels() {
  document.getElementById("config-panel").textContent = JSON.stringify(
    state.config || {},
    null,
    2,
  );
  document.getElementById("filesystem-panel").textContent = JSON.stringify(
    state.filesystem || {},
    null,
    2,
  );
}

async function refreshTaskDetail() {
  const detailRoot = document.getElementById("task-detail");
  const badge = document.getElementById("detail-task-id");

  if (!state.selectedTaskId) {
    detailRoot.innerHTML = "Selecciona una tarea para ver su detalle.";
    badge.textContent = "—";
    return;
  }

  const [detail, memories] = await Promise.all([
    fetchJson(`/api/tasks/${encodeURIComponent(state.selectedTaskId)}`),
    fetchJson(`/api/tasks/${encodeURIComponent(state.selectedTaskId)}/memories`),
  ]);
  const candidateMatches = detail.candidate_matches || [];
  const pendingActions =
    detail.state === "pending"
      ? `
        <div class="detail-actions">
          <button id="promote-pending" class="action primary">Abrir como tarea nueva</button>
        </div>
        ${
          candidateMatches.length
            ? `<div class="candidate-list">
                ${candidateMatches
                  .map(
                    (candidate) => `
                      <article class="candidate-card">
                        <div class="candidate-head">
                          <strong>${escapeHtml(candidate.title || candidate.task_id)}</strong>
                          <span class="pill">${escapeHtml(candidate.state)}</span>
                        </div>
                        <p class="task-meta">${escapeHtml(candidate.task_id)} · score ${escapeHtml(candidate.score ?? "0")}</p>
                        <p class="task-meta">${escapeHtml((candidate.reasons || []).join(", ") || "sin razones registradas")}</p>
                        <button class="action" data-resume-candidate="${escapeHtml(candidate.task_id)}">Reanudar en esta tarea</button>
                      </article>`,
                  )
                  .join("")}
              </div>`
            : `<div class="empty">No hay candidatos persistidos para este ambiguo.</div>`
        }`
      : "";

  badge.textContent = detail.task_id;
  detailRoot.innerHTML = `
    <div class="stack">
      <div class="detail-meta">
        <h4>${escapeHtml(detail.title)}</h4>
        <p>${escapeHtml(detail.summary || "Sin resumen.")}</p>
        <div class="tag-row">
          <span class="pill">${escapeHtml(detail.state)}</span>
          <span class="pill">${escapeHtml(detail.resolution_mode)}</span>
          <span class="pill">${escapeHtml(detail.memory_count)} memories</span>
        </div>
      </div>
      <details open>
        <summary>Task markdown</summary>
        <pre class="code-block">${escapeHtml(detail.task_markdown)}</pre>
      </details>
      <details>
        <summary>Definition of done</summary>
        <pre class="code-block">${escapeHtml(detail.definition_of_done)}</pre>
      </details>
      <details>
        <summary>Conversation log</summary>
        <pre class="code-block">${escapeHtml(detail.conversation_log)}</pre>
      </details>
      ${pendingActions}
      <div class="memory-list">
        ${memories
          .map(
            (memory) => `
              <details>
                <summary>${escapeHtml(memory.memory_id)} · ${escapeHtml(memory.created_at || "")}</summary>
                <pre class="code-block">${escapeHtml(memory.content)}</pre>
              </details>`,
          )
          .join("")}
      </div>
      ${
        detail.state === "open"
          ? `<button id="close-task" class="action danger">Cerrar tarea seleccionada</button>`
          : ""
      }
    </div>`;

  const closeButton = document.getElementById("close-task");
  if (closeButton) {
    closeButton.addEventListener("click", async () => {
      try {
        await fetchJson(`/api/tasks/${encodeURIComponent(detail.task_id)}/close`, {
          method: "POST",
          body: JSON.stringify({ confirmed: true }),
        });
        showToast("Tarea cerrada.");
        state.selectedTaskId = null;
        await refreshAll();
      } catch (error) {
        showToast(error.message, true);
      }
    });
  }

  const promoteButton = document.getElementById("promote-pending");
  if (promoteButton) {
    promoteButton.addEventListener("click", async () => {
      try {
        const response = await fetchJson("/api/tasks/open", {
          method: "POST",
          body: JSON.stringify({ fromPending: detail.task_id, title: detail.title }),
        });
        state.selectedTaskId = response.task_id;
        showToast("Pendiente promovido a tarea nueva.");
        await refreshAll();
      } catch (error) {
        showToast(error.message, true);
      }
    });
  }

  document.querySelectorAll("[data-resume-candidate]").forEach((element) => {
    element.addEventListener("click", async () => {
      try {
        const response = await fetchJson("/api/tasks/resume", {
          method: "POST",
          body: JSON.stringify({
            taskId: element.dataset.resumeCandidate,
            pendingId: detail.task_id,
          }),
        });
        state.selectedTaskId = response.task_id;
        showToast("Pendiente anexado a tarea existente.");
        await refreshAll();
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });
}

async function refreshAll() {
  const [summary, health, config, filesystem, openTasks, pendingTasks, doneTasks] =
    await Promise.all([
      fetchJson("/api/summary"),
      fetchJson("/api/health"),
      fetchJson("/api/config/mcp"),
      fetchJson("/api/filesystem"),
      fetchJson("/api/tasks?state=open"),
      fetchJson("/api/tasks?state=pending"),
      fetchJson("/api/tasks?state=done"),
    ]);

  state.summary = summary;
  state.health = health;
  state.config = config;
  state.filesystem = filesystem;
  state.tasks.open = openTasks.tasks || [];
  state.tasks.pending = pendingTasks.tasks || [];
  state.tasks.done = doneTasks.tasks || [];

  if (!state.selectedTaskId && state.tasks.open[0]) {
    state.selectedTaskId = state.tasks.open[0].task_id;
  }

  document.getElementById("session-state").textContent = JSON.stringify(
    {
      current_task_id: summary.currentTaskId || null,
      current_task_path: summary.currentTaskPath || null,
      pending_ambiguous_matches: summary.pendingAmbiguousMatches || [],
      dashboard_snapshot: summary.dashboard_snapshot || null,
    },
    null,
    2,
  );

  renderSummaryCards();
  renderTaskLists();
  renderHealth();
  renderPanels();
  await refreshTaskDetail();
}

async function submitIntake(forceNew = false) {
  const text = document.getElementById("intake-text").value.trim();
  const title = document.getElementById("intake-title").value.trim();
  if (!text) {
    showToast("Escribe un input antes de registrarlo.", true);
    return;
  }

  try {
    const response = await fetchJson("/api/tasks/intake", {
      method: "POST",
      body: JSON.stringify({ text, title, forceNew }),
    });
    showToast(`Input registrado como ${response.mode}.`);
    document.getElementById("intake-text").value = "";
    if (response.task_id) {
      state.selectedTaskId = response.task_id;
    }
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
}

document.getElementById("refresh-all").addEventListener("click", () => {
  refreshAll().catch((error) => showToast(error.message, true));
});

document.getElementById("run-repair").addEventListener("click", async () => {
  try {
    await fetchJson("/api/repair", { method: "POST" });
    showToast("Repair ejecutado.");
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("submit-intake").addEventListener("click", async () => {
  await submitIntake(false);
});

document.getElementById("force-new").addEventListener("click", async () => {
  await submitIntake(true);
});

refreshAll().catch((error) => showToast(error.message, true));
setInterval(() => {
  refreshAll().catch(() => {});
}, 15000);
