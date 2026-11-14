# Changelog

All notable changes to `@ysskrishna/markdown-convert-mcp` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-15

### Added

- README installation guide with host-specific `<details>` sections, MCP Registry badge, and maintainer footer
- `scripts/validate-release.sh` to keep `package.json`, `server.json`, and `src/server.ts` versions in sync
- `SECURITY.md` and `docs/contributing/release-state.md` for maintainers
- OpenClaw distribution: `openclaw.plugin.json`, `.mcp.json`, `.cursor-plugin/plugin.json`, `assets/icon.png`, and `skills/markdown-convert/SKILL.md`
- `scripts/publish_clawhub.py` for ClawHub per-skill and `bundle-plugin` publishes
- Host plugin manifests (Claude, Codex, Cursor, Kimi, Gemini, Agent Plugins 1.0) and `index.js` for OpenCode
- Option B brand assets (`assets/icon.png`, `logo.png`, `logo-lockup.png`) and README distribution sections
- AGENTS.md **Releases** section and expanded DEVELOPMENT releasing steps (npm, MCP Registry, ClawHub)

### Changed

- Synced MCP server version in `src/server.ts` with package and registry metadata
- npm package now includes `skills/` so `openclaw.plugin.json` and `index.js` resolve the skill
- `scripts/validate-release.sh` also checks `package-lock.json` and `.claude-plugin/marketplace.json` versions
- Plugin `.mcp.json` uses `@latest` to avoid an `npx` exit-127 failure when the host runs inside this repo
- README states which plugins register the MCP server (Claude Code does, Codex does not)
- `scripts/publish_clawhub.py` fails on a skill folder without a slug mapping instead of skipping it

[1.2.0]: https://github.com/ysskrishna/markdown-convert-mcp/compare/v1.1.1...v1.2.0

## [1.1.1] - 2026-11-14

### Added

- `server.json` and `mcpName` for the [official MCP Registry](https://modelcontextprotocol.io/registry/quickstart).

[1.1.1]: https://github.com/ysskrishna/markdown-convert-mcp/compare/v1.1.0...v1.1.1

## [1.1.0] - 2026-09-02

### Changed

- `markdown_to_jira` now returns **Jira Cloud ADF JSON** instead of Atlassian wiki markup. If you relied on wiki markup (`h1.`, `{code}`), stay on v1.0.x.

### Added

- `marklassian` dependency for Markdown → ADF conversion
- [docs/E2E-TESTING.md](docs/E2E-TESTING.md) — optional platform MCP integration tests
- [docs/mcp.json.example](docs/mcp.json.example) and optional `scripts/e2e/slack-post.mjs`

[1.1.0]: https://github.com/ysskrishna/markdown-convert-mcp/compare/v1.0.1...v1.1.0

## [1.0.1] - 2026-08-31

### Added

- README install and MCP setup for Cursor, and Claude Code
- npm package badge and link on README

### Changed

- First CI/CD release via trusted publishing (GitHub Actions)

[1.0.1]: https://github.com/ysskrishna/markdown-convert-mcp/releases/tag/v1.0.1

## [1.0.0] - 2026-08-31

First stable release.

### Added

- MCP server (`markdown-convert-mcp` CLI) over stdio via `@modelcontextprotocol/server` v2
- `markdown_to_slack` — CommonMark/GFM to Slack mrkdwn (`slackify-markdown`)
- `markdown_to_teams` — Markdown to HTML with inline CSS for Teams paste or Graph `contentType: html`
- `markdown_to_jira` — Markdown to Atlassian wiki markup for Jira Server/Data Center fields
- `markdown_to_plaintext` — Markdown stripped to plain text
- Input limits: whitespace-only input returns empty string; input over 200,000 characters returns a tool error (`isError: true`)
- Converter failures returned as tool errors, not MCP transport failures

[1.0.0]: https://github.com/ysskrishna/markdown-convert-mcp/releases/tag/v1.0.0