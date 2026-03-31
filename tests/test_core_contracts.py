import json
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class CoreContractsTest(unittest.TestCase):
    def test_required_paths_exist(self) -> None:
        required = [
            ROOT / "CLAUDE.md",
            ROOT / "CONSTITUTION.md",
            ROOT / "profiles" / "desktop" / "claude_desktop_config.template.json",
            ROOT / "profiles" / "claude" / "settings.template.json",
            ROOT / "profiles" / "claude" / "settings.local.template.json",
            ROOT / "profiles" / "codex" / "config.template.toml",
            ROOT / "profiles" / "capabilities" / "capability-manifest.json",
            ROOT / "contracts" / "shared-sync-allowlist.json",
            ROOT / "contracts" / "notebook-capability.schema.json",
            ROOT / "references" / "external-inventory.md",
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
        self.assertIn("local/**", data["denylist"])


if __name__ == "__main__":
    unittest.main()
