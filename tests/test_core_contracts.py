import json
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class CoreContractsTest(unittest.TestCase):
    def test_required_paths_exist(self) -> None:
        required = [
            ROOT / "CLAUDE.md",
            ROOT / "CONSTITUTION.md",
            ROOT / "admin-app" / "server.mjs",
            ROOT / "admin-app" / "public" / "dashboard.html",
            ROOT / "admin-app" / "public" / "app.js",
            ROOT / "admin-app" / "public" / "styles.css",
            ROOT / "admin-app" / "lib" / "cli.mjs",
            ROOT / "admin-app" / "lib" / "config.mjs",
            ROOT / "admin-app" / "lib" / "render.mjs",
            ROOT / "admin-app" / "lib" / "store.mjs",
            ROOT / "assets" / "acceptance-matrix.md",
            ROOT / "assets" / "system-map.md",
            ROOT / "agents" / "dashboard-operator.md",
            ROOT / "agents" / "memory-curator.md",
            ROOT / "agents" / "profile-doctor.md",
            ROOT / "agents" / "shared-sync-guardian.md",
            ROOT / "agents" / "task-closer.md",
            ROOT / "agents" / "task-resolver.md",
            ROOT / "agents" / "workspace-architect.md",
            ROOT / "profiles" / "desktop" / "claude_desktop_config.template.json",
            ROOT / "profiles" / "claude" / "settings.template.json",
            ROOT / "profiles" / "claude" / "settings.local.template.json",
            ROOT / "profiles" / "codex" / "config.template.toml",
            ROOT / "profiles" / "capabilities" / "capability-manifest.json",
            ROOT / "contracts" / "shared-sync-allowlist.json",
            ROOT / "contracts" / "notebook-capability.schema.json",
            ROOT / "references" / "external-inventory.md",
            ROOT / "scripts" / "capture-local-profiles.sh",
            ROOT / "scripts" / "dashboard-build.sh",
            ROOT / "scripts" / "dashboard-doctor.sh",
            ROOT / "scripts" / "dashboard-repair.sh",
            ROOT / "scripts" / "dashboard-serve.sh",
            ROOT / "scripts" / "doctor.sh",
            ROOT / "scripts" / "init-task-orchestrator.sh",
            ROOT / "scripts" / "refresh-from-core.sh",
            ROOT / "scripts" / "task-close.sh",
            ROOT / "scripts" / "task-index-sync.sh",
            ROOT / "scripts" / "task-intake.sh",
            ROOT / "scripts" / "task-open.sh",
            ROOT / "scripts" / "task-resume.sh",
            ROOT / "scripts" / "tasklog-sync.sh",
            ROOT / "skills" / "admin-dashboard-operator" / "SKILL.md",
            ROOT / "skills" / "desktop-parity-auditor" / "SKILL.md",
            ROOT / "skills" / "rag-memory-curator" / "SKILL.md",
            ROOT / "skills" / "task-orchestration-governor" / "SKILL.md",
            ROOT / "skills" / "workspace-governor" / "SKILL.md",
        ]
        for path in required:
            self.assertTrue(path.exists(), f"missing required path: {path}")

    def test_desktop_profile_has_required_mcps(self) -> None:
        data = json.loads(
            (ROOT / "profiles" / "desktop" / "claude_desktop_config.template.json").read_text()
        )
        self.assertEqual(
            sorted(data["mcpServers"].keys()),
            ["notebooklm", "playwright", "tessl"],
        )

    def test_capability_manifest_matches_notebook_schema(self) -> None:
        manifest = json.loads(
            (ROOT / "profiles" / "capabilities" / "capability-manifest.json").read_text()
        )
        self.assertEqual(manifest["canonicalEnvironment"], "claude-desktop")
        self.assertEqual(manifest["notebook"]["primaryMode"], "claude-desktop-mcp")
        self.assertIn("query.ask", manifest["notebook"]["operations"])
        self.assertTrue(manifest["capabilities"]["supportsRepoSkills"])
        self.assertTrue(manifest["capabilities"]["supportsRepoAgents"])
        self.assertTrue(manifest["capabilities"]["supportsDoctorScript"])

    def test_codex_template_enables_google_and_github(self) -> None:
        config_text = (ROOT / "profiles" / "codex" / "config.template.toml").read_text()
        self.assertIn('[plugins."github@openai-curated"]', config_text)
        self.assertIn('[plugins."gmail@openai-curated"]', config_text)
        self.assertIn('[plugins."google-drive@openai-curated"]', config_text)
        self.assertIn('[plugins."google-calendar@openai-curated"]', config_text)
        self.assertEqual(config_text.count("enabled = true"), 4)

    def test_allowlist_has_core_paths(self) -> None:
        data = json.loads((ROOT / "contracts" / "shared-sync-allowlist.json").read_text())
        self.assertIn("CLAUDE.md", data["allowlist"])
        self.assertIn("profiles/**", data["allowlist"])
        self.assertIn("assets/**", data["allowlist"])
        self.assertIn("admin-app/**", data["allowlist"])
        self.assertIn("skills/**", data["allowlist"])
        self.assertIn("agents/**", data["allowlist"])
        self.assertIn("local/**", data["denylist"])
        self.assertIn("workspaces/**", data["denylist"])

    def test_session_state_template_has_task_fields(self) -> None:
        data = json.loads((ROOT / "session-state.template.json").read_text())
        self.assertIn("current_task_id", data)
        self.assertIn("current_task_path", data)
        self.assertIn("last_input_at", data)
        self.assertIn("last_resolution_mode", data)
        self.assertIn("pending_ambiguous_matches", data)


if __name__ == "__main__":
    unittest.main()
