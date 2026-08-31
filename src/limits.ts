export const MAX_MARKDOWN_CHARS = 200_000;

export type PrepareMarkdownResult =
  | { kind: 'empty' }
  | { kind: 'ok'; value: string }
  | { kind: 'too_large' };

export function prepareMarkdown(markdown: string): PrepareMarkdownResult {
  if (markdown.trim().length === 0) {
    return { kind: 'empty' };
  }

  if (markdown.length > MAX_MARKDOWN_CHARS) {
    return { kind: 'too_large' };
  }

  return { kind: 'ok', value: markdown };
}
