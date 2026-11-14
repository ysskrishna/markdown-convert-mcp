# Development

Guide for contributors and maintainers. End-user install and MCP host setup live in [README.md](README.md).

## Prerequisites

- **Node.js** ≥ 22
- **npm** (ships with Node)

## Getting started

```bash
git clone https://github.com/ysskrishna/markdown-convert-mcp.git
cd markdown-convert-mcp
npm ci
```

Run the full checkpoint before opening a PR or cutting a release:

```bash
npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm ci` | Install from lockfile (CI and clean installs) |
| `npm run lint` | ESLint on `src` and `tests` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (`vitest run`) |
| `npm run test:e2e` | Optional Slack + Jira E2E (needs `.env`; not CI) |
| `npm run test:e2e:slack` | Slack E2E only |
| `npm run test:e2e:jira` | Jira E2E only |
| `npm run build` | Compile `src/` → `dist/` |
| `make release` | Tag `v$(version)` from `package.json` and push (triggers CI publish) |
| `bash scripts/validate-release.sh` | Verify release version sync across manifests |
| `python3 scripts/publish_clawhub.py plan` | ClawHub per-skill sync status |
| `python3 scripts/publish_clawhub.py publish` | Publish skill(s) to ClawHub |
| `python3 scripts/publish_clawhub.py package plan` | ClawHub bundle package sync |
| `python3 scripts/publish_clawhub.py package publish` | Publish OpenClaw bundle to ClawHub |


## Stack

- **Runtime:** Node.js ESM (`"type": "module"`)
- **Language:** TypeScript (`tsc` → `dist/`)
- **MCP:** `@modelcontextprotocol/server` v2, stdio via `serveStdio`
- **Validation:** Zod v4 (`zod/v4`)
- **Markdown:** `slackify-markdown`, `unified` + `remark-parse` + `remark-gfm`, `marklassian`, `strip-markdown`
- **Tests:** Vitest
- **CI:** GitHub Actions on `pull_request` and `push` to `main`

AI agents working in this repo should also read [AGENTS.md](AGENTS.md).

## Conventions

- Log diagnostics with `console.error` only — **never** `console.log` (stdout is JSON-RPC on the stdio transport).
- Keep converters pure; use a per-call `unified()` pipeline (no shared mutable processor).
- Use `.js` extensions in `src/` imports for NodeNext emit.
- Return oversize input and converter failures as tool results with `isError: true`, not MCP transport errors.
- This server is **convert-only** — it does not post to Slack, Teams, or Jira.

## Local MCP testing

Build first, then point your host at the compiled entry:

```bash
npm run build
node dist/index.js
```

Example **Cursor** / **Claude Desktop** config (use an absolute path):

```json
{
  "mcpServers": {
    "markdown-convert": {
      "command": "node",
      "args": ["/absolute/path/to/markdown-convert-mcp/dist/index.js"]
    }
  }
}
```

- **Cursor:** `~/.cursor/mcp.json` or `.cursor/mcp.json`
- **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

Restart the host or reload MCP after config changes.

**Plugin `.mcp.json`:** it uses `@latest` on purpose. Plain `npx -y @ysskrishna/markdown-convert-mcp` fails with exit 127 when the host's working directory is this repo, because npx resolves the local package and its own bin is not on `PATH`. The `@latest` spec forces a registry fetch. It does mean plugin installs track the newest npm release.

**MCP Inspector:** `npx @modelcontextprotocol/inspector npx -y @ysskrishna/markdown-convert-mcp` (or `node` on `dist/index.js` after `npm run build`).

## Testing

- **Unit tests (no credentials):** `npm test`
- **Optional E2E (your tokens):** see [docs/E2E-TESTING.md](docs/E2E-TESTING.md)

Optional scripts (after `npm run build`):

```bash
cp .env.example .env   # fill in credentials
npm run test:e2e              # Slack then Jira
npm run test:e2e:slack        # Slack only
npm run test:e2e:jira         # Jira only
```

## CI

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR and push to `main` | lint, typecheck, test, build |
| `create-release.yml` | push tag `v*` | GitHub Release from `CHANGELOG.md` |
| `publish-npm.yml` | push tag `v*`, release published, manual dispatch | validate, test, `npm publish` via OIDC |

Publish uses the GitHub **`prod`** environment and [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) — no `NPM_TOKEN` secret in CI.

## Releasing

Package: [`@ysskrishna/markdown-convert-mcp`](https://www.npmjs.com/package/@ysskrishna/markdown-convert-mcp)

Version sync (all must match before tagging):

- `package.json` `version`
- `package-lock.json` root and `packages[""].version`
- `server.json` `version` and `packages[0].version`
- `src/server.ts` `McpServer` `version`
- `openclaw.plugin.json`, `plugin.json`, `gemini-extension.json`
- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`, `.kimi-plugin/plugin.json`
- `skills/markdown-convert/SKILL.md` `version`

Run `bash scripts/validate-release.sh` to verify the list above.

1. Bump versions and update `CHANGELOG.md` (required by **Create Release**).
2. Run the full checkpoint locally.
3. Merge to `main`.
4. Tag and push:

```bash
make release
```

### After npm publish (same tagged commit)

**MCP Registry** (publish after npm):

```bash
mcp-publisher login github
mcp-publisher publish
```

**ClawHub** (skill + OpenClaw bundle-plugin):

```bash
python3 scripts/publish_clawhub.py plan
python3 scripts/publish_clawhub.py publish
python3 scripts/publish_clawhub.py package plan
python3 scripts/publish_clawhub.py package publish
```

Requires the `clawhub` CLI and a logged-in session. Bundle publish stages `skills/`, `assets/`, `index.js`, `openclaw.plugin.json`, `.mcp.json`, and `.cursor-plugin/plugin.json` only (not the full repo).

Update [docs/contributing/release-state.md](docs/contributing/release-state.md) when npm, registry, and ClawHub are live.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MCP host shows no tools | Confirm `dist/index.js` exists (`npm run build`); check config path |
| Server exits immediately | Do not pipe stdout — hosts manage stdio; use `console.error` for logs |
| `Create Release` failed | Add matching `## [x.y.z]` block in `CHANGELOG.md` |
| CI publish `403` | Trusted publisher must match repo, `publish-npm.yml`, and `prod` |
| Tag ≠ `package.json` | Version on tagged commit must match tag (`v1.0.1` → `"1.0.1"`) |
| `npm publish` version exists | Bump version before tagging; cannot republish the same version |
