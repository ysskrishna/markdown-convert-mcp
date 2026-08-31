import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import stripMarkdown from 'strip-markdown';
import { unified } from 'unified';

export function markdownToPlaintext(markdown: string): string {
  if (!markdown.trim()) return '';
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(stripMarkdown)
    .use(remarkStringify)
    .processSync(markdown);
  return String(file).trimEnd();
}
