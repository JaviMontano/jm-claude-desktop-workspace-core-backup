Feature: Master Claude Desktop workspace

  Scenario: Bootstrapping a local workspace
    Given a clean clone of the core repository
    When the bootstrap script creates a workspace instance
    Then the workspace contains runtime assets, state files, and local profile snapshots

  Scenario: Desktop parity contract
    Given the desktop profile template
    When it is validated
    Then it includes playwright, notebooklm, and tessl as MCP servers

  Scenario: Portable export
    Given the canonical core
    When the Antigravity export runs
    Then it produces a compatibility report and a portable ruleset without mutating the core
