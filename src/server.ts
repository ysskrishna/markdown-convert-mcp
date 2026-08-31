import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import { markdownToJira } from './converters/jira.js';
import { markdownToPlaintext } from './converters/plaintext.js';
import { markdownToSlack } from './converters/slack.js';
import { markdownToTeamsHtml } from './converters/teams/html.js';
import { prepareMarkdown } from './limits.js';
import { errorText, okText } from './tool-result.js';

export const TOOL_NAMES = [
  'markdown_to_slack',
  'markdown_to_teams',
  'markdown_to_jira',
  'markdown_to_plaintext',
] as const;

const inputSchema = z.object({
  markdown: z.string().describe('Source Markdown (CommonMark/GFM)'),
});

export function runConvert(
  markdown: string,
  convert: (s: string) => string,
) {
  const prepared = prepareMarkdown(markdown);
  if (prepared.kind === 'empty') return okText('');
  if (prepared.kind === 'too_large') {
    return errorText('Markdown exceeds 200000 characters.');
  }
  try {
    return okText(convert(prepared.value));
  } catch (e) {
    return errorText(
      `Conversion failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

export function createServer(): McpServer {
  const server = new McpServer({ name: 'markdown-convert', version: '1.0.1' });

  server.registerTool(
    'markdown_to_slack',
    {
      description:
        'Convert CommonMark/GFM to Slack mrkdwn for Slack API or Slack MCP `text` (mrkdwn). Do not use for Slack composer clipboard paste. Do not use when the next hop expects `markdown_text` (pass Markdown through instead). This tool does not send Slack messages. Slack may truncate around 40k characters.',
      inputSchema,
    },
    async ({ markdown }) => runConvert(markdown, markdownToSlack),
  );

  server.registerTool(
    'markdown_to_teams',
    {
      description:
        'Convert Markdown to HTML for Teams paste or Graph `contentType: html`. Inline CSS may be stripped by Graph. Not Adaptive Cards. Does not send Teams messages.',
      inputSchema,
    },
    async ({ markdown }) => runConvert(markdown, markdownToTeamsHtml),
  );

  server.registerTool(
    'markdown_to_jira',
    {
      description:
        'Convert Markdown to Atlassian wiki markup (`h1.`, `{code}`, `||header||`) for Jira Server/Data Center or wiki markup fields. Do not use for Jira Cloud REST v3 ADF. Does not create Jira issues.',
      inputSchema,
    },
    async ({ markdown }) => runConvert(markdown, markdownToJira),
  );

  server.registerTool(
    'markdown_to_plaintext',
    {
      description: 'Strip Markdown to plain text. Does not send anywhere.',
      inputSchema,
    },
    async ({ markdown }) => runConvert(markdown, markdownToPlaintext),
  );

  return server;
}
