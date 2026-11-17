# Markdown Convert MCP tools

The server registers four tools. Each takes the same input, one `markdown` string (CommonMark or GitHub-Flavored Markdown), and returns the converted text as a single `text` content item. None of the tools send messages or create issues.

| Tool | Returns | Send the result to |
| --- | --- | --- |
| `markdown_to_slack` | Slack mrkdwn | Slack API or Slack MCP `text` (mrkdwn) fields |
| `markdown_to_teams` | HTML with inline CSS | Teams paste, or Microsoft Graph with `contentType: html` |
| `markdown_to_jira` | Atlassian Document Format (ADF) JSON string | Jira Cloud REST v3 rich-text fields (description, comment, environment) |
| `markdown_to_plaintext` | Plain text | Any destination that needs text without formatting |

## Run the server

```bash
npx -y @ysskrishna/markdown-convert-mcp
```

The server speaks MCP over stdio and needs Node.js 22 or later. A global install (`npm install -g @ysskrishna/markdown-convert-mcp`) provides the `markdown-convert-mcp` command.

```json
{
  "mcpServers": {
    "markdown-convert": {
      "command": "npx",
      "args": ["-y", "@ysskrishna/markdown-convert-mcp"]
    }
  }
}
```

## Input schema

```json
{
  "type": "object",
  "properties": {
    "markdown": { "type": "string", "description": "Source Markdown (CommonMark/GFM)" }
  },
  "required": ["markdown"]
}
```

## Limits and errors

- Whitespace-only input returns a successful result with an empty string.
- Input longer than 200,000 characters returns a tool error (`isError: true`) with the text `Markdown exceeds 200000 characters.`
- A converter failure returns a tool error whose text starts with `Conversion failed:`.
- Slack may truncate the `text` field at around 40,000 characters.

## Example input

Every example below converts this Markdown:

```markdown
## Deploy done

**Status:** green. See [runbook](https://example.com/runbook).

- api: `v2.4.1`
- web: `v1.9.0`
```

## markdown_to_slack

Tool call:

```json
{
  "name": "markdown_to_slack",
  "arguments": { "markdown": "## Deploy done\n\n**Status:** green. See [runbook](https://example.com/runbook).\n\n- api: `v2.4.1`\n- web: `v1.9.0`" }
}
```

Result text (headings become bold lines, links become `<url|label>`, list items start with `•`):

```text
*Deploy done*

*Status:* green. See <https://example.com/runbook|runbook>.

•   api: `v2.4.1`
•   web: `v1.9.0`
```

The real output also places zero-width spaces (U+200B) around some bold and italic markers. Keep the string as returned.

Do not use this tool for Slack composer clipboard paste, or when the next tool expects a `markdown_text` field. Pass the original Markdown through in that case.

## markdown_to_teams

Result text (HTML with inline styles, shortened here):

```html
<h2 style="font-family:'Segoe UI',system-ui,sans-serif;font-size:18px;font-weight:600;margin:16px 0 8px;color:#171717;">Deploy done</h2><p style="font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;line-height:1.5;color:#242424;margin:10px 0;"><b>Status:</b> green. See <a href="https://example.com/runbook" style="color:#0f6cbd;text-decoration:underline;">runbook</a>.</p><ul style="font-family:'Segoe UI',system...
```

Microsoft Graph may strip inline CSS. The output is HTML, not an Adaptive Card.

## markdown_to_jira

The result is a JSON string in Atlassian Document Format. Parse it, or pass it unchanged, as the rich-text value of a Jira Cloud REST v3 field. It is not Jira wiki markup and does not work with the Server/Data Center v2 API.

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {
        "level": 2
      },
      "content": [
        {
          "type": "text",
          "text": "Deploy done"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Status:",
          "marks": [
            {
              "type": "strong"
            }
          ]
        },
        {
          "type": "text",
          "text": " green. See "
        },
        {
          "type": "text",
          "text": "runbook",
          "marks": [
            {
              "type": "link",
              "attrs": {
                "href": "https://example.com/runbook"
              }
            }
          ]
        },
        {
          "type": "text",
          "text": "."
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "api: "
                },
                {
                  "type": "text",
                  "text": "v2.4.1",
                  "marks": [
                    {
                      "type": "code"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "web: "
                },
                {
                  "type": "text",
                  "text": "v1.9.0",
                  "marks": [
                    {
                      "type": "code"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## markdown_to_plaintext

```text
Deploy done

Status: green. See runbook.

api: v2.4.1

web: v1.9.0
```
