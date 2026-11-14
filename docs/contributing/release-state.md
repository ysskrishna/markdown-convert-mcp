# Release state

For maintainers and coding agents. Update this file **after** each tagged release is pushed, npm publish succeeds, and registry/ClawHub steps are done.

| Field | Value |
| --- | --- |
| Last shipped version | 1.2.0 |
| Last tag | `v1.2.0` |
| Tagged from `main` at | _pending after ship_ |
| GitHub Release | _pending after ship_ |
| npm | https://www.npmjs.com/package/@ysskrishna/markdown-convert-mcp/v/1.2.0 |
| MCP Registry | https://registry.modelcontextprotocol.io/?q=io.github.ysskrishna%2Fmarkdown-convert-mcp |

**Next release:** bump version in `package.json`, `server.json`, `src/server.ts`, `openclaw.plugin.json`, and `.cursor-plugin/plugin.json`; add a `CHANGELOG.md` section; run `bash scripts/validate-release.sh` and the full checkpoint; merge to `main`; `make release`. See [DEVELOPMENT.md](../../DEVELOPMENT.md#releasing) and [AGENTS.md](../../AGENTS.md#releases).