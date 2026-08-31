import { describe, expect, it } from 'vitest';
import { markdownToTeamsHtml } from '../../src/converters/teams/html.ts';

const BOLD_GOLDEN =
  '<p style="font-family:\'Segoe UI\',system-ui,sans-serif;font-size:14px;line-height:1.5;color:#242424;margin:10px 0;"><b>bold</b></p>';

const LINK_GOLDEN =
  '<p style="font-family:\'Segoe UI\',system-ui,sans-serif;font-size:14px;line-height:1.5;color:#242424;margin:10px 0;"><a href="https://e.com" style="color:#0f6cbd;text-decoration:underline;">a</a></p>';

const FENCED_CODE_GOLDEN =
  '<pre style="font-family:\'Segoe UI\',system-ui,sans-serif;font-size:13px;line-height:1.4;margin:10px 0;padding:12px;background:#f5f5f5;border:1px solid #e1dfdd;border-radius:4px;white-space:pre-wrap;"><code>const x = 1</code></pre>';

describe('markdownToTeamsHtml', () => {
  it('returns empty string for empty or whitespace-only input', () => {
    expect(markdownToTeamsHtml('')).toBe('');
    expect(markdownToTeamsHtml('   ')).toBe('');
  });

  it('converts bold to <b>', () => {
    expect(markdownToTeamsHtml('**bold**')).toContain('<b>');
    expect(markdownToTeamsHtml('**bold**')).toBe(BOLD_GOLDEN);
  });

  it('converts links to <a href=...>', () => {
    expect(markdownToTeamsHtml('[a](https://e.com)')).toContain('<a href=');
    expect(markdownToTeamsHtml('[a](https://e.com)')).toBe(LINK_GOLDEN);
  });

  it('escapes fenced code inside <pre>', () => {
    const html = markdownToTeamsHtml('```js\nconst x = 1\n```');
    expect(html).toContain('<pre');
    expect(html).toContain('<code>const x = 1</code>');
    expect(html).not.toContain('<script');
    expect(html).toBe(FENCED_CODE_GOLDEN);
  });

  it('drops raw HTML mdast nodes (script tags not unescaped)', () => {
    const html = markdownToTeamsHtml('<script>x</script>');
    expect(html).toBe('');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('x</script>');
  });
});
