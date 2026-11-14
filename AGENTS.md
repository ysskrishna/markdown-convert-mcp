# AGENTS.md

Operating manual for AI agents working in this repository.

## Stack

- **Runtime:** Node.js >= 22, ESM (`"type": "module"`)
- **Language:** TypeScript (`tsc` → `dist/`)
- **MCP:** `@modelcontextprotocol/server` v2, stdio transport via `serveStdio`
- **Validation:** Zod v4 (`zod/v4`)
- **Markdown:** `slackify-markdown` (Slack), `unified` + `remark-parse` + `remark-gfm` (Teams/plaintext), `marklassian` (Jira ADF JSON), `strip-markdown` (plaintext)
- **Tests:** Vitest
- **CI:** GitHub Actions on `pull_request` and `push` to `main`

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

Full checkpoint before merge:

```bash
npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

## Always

- Run `npm test` (and the full checkpoint when changing behavior) before committing.
- Log diagnostics with `console.error` only. **Never** `console.log` — stdout is reserved for JSON-RPC on the MCP stdio transport.
- Return oversize input and converter failures as tool results with `isError: true`, not protocol/transport errors.
- Keep converters pure; use per-call `unified()` pipelines (no shared mutable processor).
- Use `.js` extensions in `src/` imports for NodeNext emit.
- Match existing code style and keep diffs minimal.

## Ask first

- Adding a new output dialect or MCP tool (e.g. WhatsApp, Telegram).
- Publishing to npm or changing `"private"` in `package.json`.
- Bumping `@modelcontextprotocol/server` across a major version.
- Large refactors that touch multiple converters or the MCP wiring.

## Never

- Add Docker or container-based distribution in v1.
- Add a second in-repo Slack converter alongside `slackify-markdown`.
- Commit secrets, tokens, or `.env` files.
- Emit MCP protocol errors for oversize markdown or converter throws (use `errorText` with `isError: true`).
- Post to Slack/Teams/Jira from this server — convert-only.
- Use `console.log` in server code.

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup, CI, and release workflow.

## Releases

What is **already published** is recorded in [docs/contributing/release-state.md](docs/contributing/release-state.md). When the owner asks to ship a release:

1. Bump version in `package.json`, `server.json` (root and npm package entry), `src/server.ts` `McpServer` version, `openclaw.plugin.json`, and `.cursor-plugin/plugin.json`. Run `bash scripts/validate-release.sh`.
2. Add a `## [x.y.z]` section to `CHANGELOG.md` with a footer compare link.
3. Run the full checkpoint locally (`npm ci && npm run lint && npm run typecheck && npm test && npm run build`).
4. Merge to `main`.
5. Tag and push: `make release` (creates `v$(package.json version)` and triggers GitHub Release + npm publish).

After **npm** publish succeeds on the tagged commit:

6. Publish to the [MCP Registry](https://modelcontextprotocol.io/registry): `mcp-publisher login github` (once), then `mcp-publisher publish` from the repo root with matching `server.json`.
7. Publish the OpenClaw bundle to ClawHub: `python3 scripts/publish_clawhub.py plan`, then `python3 scripts/publish_clawhub.py publish` (requires `clawhub` CLI logged in). Uses `clawhub package publish --family bundle-plugin`.

Update `docs/contributing/release-state.md` after npm, registry, and ClawHub versions are confirmed.

Do not create tags or GitHub releases unless the owner asks.
