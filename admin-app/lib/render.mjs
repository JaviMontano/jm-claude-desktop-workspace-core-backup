function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(items) {
  return items
    .map(
      (item) => `
        <tr>
          <td>${esc(item.task_id)}</td>
          <td>${esc(item.title)}</td>
          <td>${esc(item.state)}</td>
          <td>${esc(item.updated_at || "")}</td>
          <td>${esc(item.next_step || "")}</td>
        </tr>`,
    )
    .join("");
}

export function buildStaticDashboardHtml(payload) {
  const openTasks = payload.openTasks || [];
  const doneTasks = payload.doneTasks || [];
  const pendingTasks = payload.pendingTasks || [];
  const filesystem = JSON.stringify(payload.filesystem || {}, null, 2);
  const config = JSON.stringify(payload.config || {}, null, 2);
  const sessionState = JSON.stringify(payload.sessionState || {}, null, 2);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JM Labs Task Dashboard Snapshot</title>
  <style>
    :root {
      --ink: #10172b;
      --paper: #f4efe6;
      --panel: #fffaf2;
      --line: #d7c9ae;
      --accent: #d78b28;
      --accent-strong: #9f4f18;
      --success: #1c7c54;
      --danger: #9b2c2c;
      --muted: #60594f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "Trebuchet MS", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(215,139,40,0.12), transparent 30%),
        linear-gradient(180deg, #f8f4ec 0%, var(--paper) 100%);
      color: var(--ink);
      min-height: 100vh;
    }
    header {
      padding: 28px 32px 18px;
      border-bottom: 1px solid rgba(16,23,43,0.08);
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 24px;
    }
    h1, h2, h3 {
      font-family: "Iowan Old Style", "Palatino Linotype", serif;
      margin: 0;
    }
    h1 { font-size: 34px; }
    h2 { font-size: 22px; margin-bottom: 12px; }
    h3 { font-size: 18px; margin-bottom: 10px; }
    main {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 20px;
      padding: 24px 32px 40px;
    }
    .stack {
      display: grid;
      gap: 20px;
    }
    .panel {
      background: rgba(255,250,242,0.92);
      border: 1px solid rgba(16,23,43,0.08);
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 18px 40px rgba(16,23,43,0.08);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .card {
      background: var(--ink);
      color: white;
      border-radius: 14px;
      padding: 14px;
    }
    .card small {
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      opacity: 0.65;
      margin-bottom: 8px;
    }
    .card strong {
      font-size: 26px;
      display: block;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      text-align: left;
      padding: 10px 8px;
      border-bottom: 1px solid rgba(16,23,43,0.08);
      vertical-align: top;
    }
    th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    pre {
      margin: 0;
      padding: 14px;
      background: #191f31;
      color: #eef2ff;
      border-radius: 14px;
      overflow: auto;
      font-size: 12px;
      line-height: 1.45;
    }
    .meta {
      color: var(--muted);
      font-size: 14px;
      line-height: 1.5;
    }
    .meta strong {
      color: var(--accent-strong);
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(215,139,40,0.14);
      color: var(--accent-strong);
      margin-right: 6px;
    }
    @media (max-width: 980px) {
      main { grid-template-columns: 1fr; }
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>JM Labs admin snapshot</h1>
      <div class="meta">
        Snapshot local del entorno. Generado el
        <strong>${esc(payload.generatedAt || "")}</strong>.
      </div>
    </div>
    <div>
      <span class="tag">local only</span>
      <span class="tag">task orchestration</span>
      <span class="tag">static snapshot</span>
    </div>
  </header>
  <main>
    <section class="stack">
      <div class="panel">
        <h2>Resumen</h2>
        <div class="cards">
          <div class="card"><small>Open</small><strong>${openTasks.length}</strong></div>
          <div class="card"><small>Done</small><strong>${doneTasks.length}</strong></div>
          <div class="card"><small>Pending</small><strong>${pendingTasks.length}</strong></div>
          <div class="card"><small>Current task</small><strong>${esc(payload.summary?.currentTaskId || "—")}</strong></div>
        </div>
      </div>
      <div class="panel">
        <h2>Tareas abiertas</h2>
        <table>
          <thead><tr><th>ID</th><th>Título</th><th>Estado</th><th>Actualizada</th><th>Siguiente paso</th></tr></thead>
          <tbody>${renderRows(openTasks) || '<tr><td colspan="5">No hay tareas abiertas.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="panel">
        <h2>Tareas pendientes ambiguas</h2>
        <table>
          <thead><tr><th>ID</th><th>Título</th><th>Estado</th><th>Actualizada</th><th>Siguiente paso</th></tr></thead>
          <tbody>${renderRows(pendingTasks) || '<tr><td colspan="5">No hay pendientes ambiguos.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="panel">
        <h2>Histórico done</h2>
        <table>
          <thead><tr><th>ID</th><th>Título</th><th>Estado</th><th>Actualizada</th><th>Siguiente paso</th></tr></thead>
          <tbody>${renderRows(doneTasks.slice(0, 20)) || '<tr><td colspan="5">No hay tareas cerradas.</td></tr>'}</tbody>
        </table>
      </div>
    </section>
    <section class="stack">
      <div class="panel">
        <h2>Session state</h2>
        <pre>${esc(sessionState)}</pre>
      </div>
      <div class="panel">
        <h2>Config visible</h2>
        <pre>${esc(config)}</pre>
      </div>
      <div class="panel">
        <h2>Filesystem summary</h2>
        <pre>${esc(filesystem)}</pre>
      </div>
    </section>
  </main>
</body>
</html>`;
}
