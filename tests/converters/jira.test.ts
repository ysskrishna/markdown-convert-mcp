import { describe, expect, it } from 'vitest';
import { markdownToJira } from '../../src/converters/jira.ts';

describe('markdownToJira', () => {
  it('returns empty string for empty or whitespace-only input', () => {
    expect(markdownToJira('')).toBe('');
    expect(markdownToJira('   ')).toBe('');
    expect(markdownToJira('\n\t')).toBe('');
  });

  it('ignores raw HTML mdast nodes', () => {
    expect(markdownToJira('<script>x</script>')).toBe('');
    expect(markdownToJira('hello<br>world')).toBe('helloworld');
  });

  describe('headings', () => {
    it('converts h1 through h6 to hN. prefix', () => {
      expect(markdownToJira('# One')).toBe('h1. One');
      expect(markdownToJira('## Two')).toBe('h2. Two');
      expect(markdownToJira('### Three')).toBe('h3. Three');
      expect(markdownToJira('#### Four')).toBe('h4. Four');
      expect(markdownToJira('##### Five')).toBe('h5. Five');
      expect(markdownToJira('###### Six')).toBe('h6. Six');
    });
  });

  describe('bold', () => {
    it('converts **x** to *x*', () => {
      expect(markdownToJira('**bold**')).toBe('*bold*');
    });

    it('converts __x__ to *x*', () => {
      expect(markdownToJira('__bold__')).toBe('*bold*');
    });
  });

  describe('italic', () => {
    it('converts *x* to _x_', () => {
      expect(markdownToJira('*italic*')).toBe('_italic_');
    });

    it('converts _x_ to _x_', () => {
      expect(markdownToJira('_italic_')).toBe('_italic_');
    });
  });

  describe('strikethrough', () => {
    it('converts ~~x~~ to -x-', () => {
      expect(markdownToJira('~~strike~~')).toBe('-strike-');
    });
  });

  describe('inline code', () => {
    it('converts `x` to {{x}}', () => {
      expect(markdownToJira('`code`')).toBe('{{code}}');
    });
  });

  describe('links', () => {
    it('converts [label](url) to [label|url]', () => {
      expect(markdownToJira('[label](https://example.com)')).toBe(
        '[label|https://example.com]',
      );
    });
  });

  describe('unordered lists', () => {
    it('converts items with * prefix', () => {
      expect(markdownToJira('- one\n- two')).toBe('* one\n* two');
    });

    it('nests with extra * per level', () => {
      const md = '- parent\n  - child';
      expect(markdownToJira(md)).toBe('* parent\n** child');
    });
  });

  describe('ordered lists', () => {
    it('converts items with # prefix', () => {
      expect(markdownToJira('1. one\n2. two')).toBe('# one\n# two');
    });

    it('nests with extra # per level', () => {
      const md = '1. parent\n   1. child';
      expect(markdownToJira(md)).toBe('# parent\n## child');
    });
  });

  describe('tables', () => {
    it('converts GFM table with ||header|| and |body| rows', () => {
      const md = '| H1 | H2 |\n| --- | --- |\n| A | B |';
      expect(markdownToJira(md)).toBe('||H1||H2||\n|A|B|');
    });
  });

  describe('code blocks', () => {
    it('converts fenced code to {code} block', () => {
      expect(markdownToJira('```\nline1\nline2\n```')).toBe(
        '{code}\nline1\nline2\n{code}',
      );
    });

    it('uses {code:lang} when language matches [A-Za-z0-9_+-]+', () => {
      expect(markdownToJira('```javascript\nconst x = 1\n```')).toBe(
        '{code:javascript}\nconst x = 1\n{code}',
      );
      expect(markdownToJira('```c++\nint x;\n```')).toBe(
        '{code:c++}\nint x;\n{code}',
      );
    });

    it('omits language tag when lang is invalid', () => {
      expect(markdownToJira('```not-valid!\nfoo\n```')).toBe(
        '{code}\nfoo\n{code}',
      );
    });

    it('converts indented code to {code} block', () => {
      expect(markdownToJira('    indented\n    line')).toBe(
        '{code}\nindented\nline\n{code}',
      );
    });
  });

  describe('blockquote', () => {
    it('wraps content in {quote} block', () => {
      expect(markdownToJira('> quoted')).toBe('{quote}\nquoted\n{quote}');
    });

    it('joins multiple quoted paragraphs with newline', () => {
      const md = '> line one\n>\n> line two';
      expect(markdownToJira(md)).toBe('{quote}\nline one\nline two\n{quote}');
    });
  });

  describe('thematic break', () => {
    it('converts horizontal rule to ----', () => {
      expect(markdownToJira('---')).toBe('----');
      expect(markdownToJira('***')).toBe('----');
    });
  });

  describe('images', () => {
    it('converts ![alt](url) to !url!', () => {
      expect(markdownToJira('![alt text](https://img.com/p.png)')).toBe(
        '!https://img.com/p.png!',
      );
    });
  });
});
