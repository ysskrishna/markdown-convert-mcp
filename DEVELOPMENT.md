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
| `npm run build` | Compile `src/` → `dist/` |
| `make release` | Tag `v$(version)` from `package.json` and push (triggers CI publish) |


## Stack

- **Runtime:** Node.js ESM (`"type": "module"`)
- **Language:** TypeScript (`tsc` → `dist/`)
- **MCP:** `@modelcontextprotocol/server` v2, stdio via `serveStdio`
- **Validation:** Zod v4 (`zod/v4`)
- **Markdown:** `slackify-markdown`, `unified` + `remark-parse` + `remark-gfm`, `strip-markdown`
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

## CI

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR and push to `main` | lint, typecheck, test, build |
| `create-release.yml` | push tag `v*` | GitHub Release from `CHANGELOG.md` |
| `publish-npm.yml` | push tag `v*`, release published, manual dispatch | validate, test, `npm publish` via OIDC |

Publish uses the GitHub **`prod`** environment and [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) — no `NPM_TOKEN` secret in CI.

## Releasing

Package: [`@ysskrishna/markdown-convert-mcp`](https://www.npmjs.com/package/@ysskrishna/markdown-convert-mcp)

1. Bump `version` in `package.json` and match `src/server.ts` `McpServer` version.
2. Add a `## [x.y.z]` section to `CHANGELOG.md` (required by **Create Release**).
3. Run the full checkpoint locally.
4. Merge to `main`.
5. Tag and push:

```bash
make release
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MCP host shows no tools | Confirm `dist/index.js` exists (`npm run build`); check config path |
| Server exits immediately | Do not pipe stdout — hosts manage stdio; use `console.error` for logs |
| `Create Release` failed | Add matching `## [x.y.z]` block in `CHANGELOG.md` |
| CI publish `403` | Trusted publisher must match repo, `publish-npm.yml`, and `prod` |
| Tag ≠ `package.json` | Version on tagged commit must match tag (`v1.0.1` → `"1.0.1"`) |
| `npm publish` version exists | Bump version before tagging; cannot republish the same version |
