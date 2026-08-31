import { slackifyMarkdown } from 'slackify-markdown';

export function markdownToSlack(markdown: string): string {
  return slackifyMarkdown(markdown);
}
