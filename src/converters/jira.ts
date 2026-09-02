import { markdownToAdf } from 'marklassian';

export function markdownToJira(markdown: string): string {
  if (!markdown.trim()) return '';
  return JSON.stringify(markdownToAdf(markdown));
}
