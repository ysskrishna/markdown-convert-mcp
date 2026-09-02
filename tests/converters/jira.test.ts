import { describe, expect, it } from 'vitest';
import { markdownToJira } from '../../src/converters/jira.ts';

type AdfDoc = {
  type: string;
  version: number;
  content: unknown[];
};

function parseAdf(markdown: string): AdfDoc {
  return JSON.parse(markdownToJira(markdown)) as AdfDoc;
}

describe('markdownToJira', () => {
  it('returns empty string for empty or whitespace-only input', () => {
    expect(markdownToJira('')).toBe('');
    expect(markdownToJira('   ')).toBe('');
    expect(markdownToJira('\n\t')).toBe('');
  });

  it('returns a Jira Cloud ADF doc root', () => {
    const doc = parseAdf('hello');
    expect(doc).toEqual({
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello' }],
        },
      ],
    });
  });

  it('drops raw HTML mdast nodes', () => {
    expect(parseAdf('<script>x</script>')).toEqual({
      type: 'doc',
      version: 1,
      content: [],
    });
  });

  describe('headings', () => {
    it('converts h1 through h6 to ADF heading nodes', () => {
      expect(parseAdf('# One').content[0]).toEqual({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'One' }],
      });
      expect(parseAdf('## Two').content[0]).toMatchObject({
        type: 'heading',
        attrs: { level: 2 },
      });
      expect(parseAdf('###### Six').content[0]).toMatchObject({
        type: 'heading',
        attrs: { level: 6 },
      });
    });
  });

  describe('inline marks', () => {
    it('converts **x** to strong mark', () => {
      const doc = parseAdf('**bold**');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'bold',
            marks: [{ type: 'strong' }],
          },
        ],
      });
    });

    it('converts *x* to emphasis mark', () => {
      const paragraph = parseAdf('*italic*').content[0] as {
        content: { marks: { type: string }[] }[];
      };
      expect(paragraph.content[0].marks).toEqual([{ type: 'em' }]);
    });

    it('converts ~~x~~ to strike mark', () => {
      const paragraph = parseAdf('~~strike~~').content[0] as {
        content: { marks: { type: string }[] }[];
      };
      expect(paragraph.content[0].marks).toEqual([{ type: 'strike' }]);
    });

    it('converts `x` to code mark', () => {
      const paragraph = parseAdf('`code`').content[0] as {
        content: { marks: { type: string }[] }[];
      };
      expect(paragraph.content[0].marks).toEqual([{ type: 'code' }]);
    });
  });

  describe('links', () => {
    it('converts [label](url) to ADF link mark', () => {
      const doc = parseAdf('[label](https://example.com)');
      expect(doc.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'label',
            marks: [
              {
                type: 'link',
                attrs: { href: 'https://example.com' },
              },
            ],
          },
        ],
      });
    });
  });

  describe('lists', () => {
    it('converts unordered lists to bulletList', () => {
      const doc = parseAdf('- one\n- two');
      expect(doc.content[0]).toMatchObject({ type: 'bulletList' });
      const list = doc.content[0] as { content: { type: string }[] };
      expect(list.content).toHaveLength(2);
      expect(list.content.every((item) => item.type === 'listItem')).toBe(true);
    });

    it('converts ordered lists to orderedList', () => {
      const doc = parseAdf('1. one\n2. two');
      expect(doc.content[0]).toMatchObject({
        type: 'orderedList',
        attrs: { order: 1 },
      });
    });
  });

  describe('tables', () => {
    it('converts GFM tables to ADF table nodes', () => {
      const md = '| H1 | H2 |\n| --- | --- |\n| A | B |';
      const doc = parseAdf(md);
      expect(doc.content[0]).toMatchObject({ type: 'table' });
    });
  });

  describe('code blocks', () => {
    it('converts fenced code to codeBlock', () => {
      const doc = parseAdf('```javascript\nconst x = 1\n```');
      expect(doc.content[0]).toEqual({
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'const x = 1' }],
      });
    });
  });

  describe('blockquote', () => {
    it('wraps content in blockquote node', () => {
      const doc = parseAdf('> quoted');
      expect(doc.content[0]).toMatchObject({ type: 'blockquote' });
    });
  });
});
