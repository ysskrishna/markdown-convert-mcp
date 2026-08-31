# Changelog

All notable changes to `@ysskrishna/markdown-convert-mcp` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
