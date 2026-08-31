import type {
  BlockContent,
  Content,
  Heading,
  List,
  ListItem,
  PhrasingContent,
  Root,
  RootContent,
  Table,
  TableCell,
  TableRow,
} from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

function phrasing(nodes: PhrasingContent[] | undefined): string {
  if (!nodes?.length) return '';
  return nodes.map(phrasingNode).join('');
}

function phrasingNode(node: PhrasingContent): string {
  switch (node.type) {
    case 'text':
      return node.value;
    case 'strong':
      return `*${phrasing(node.children)}*`;
    case 'emphasis':
      return `_${phrasing(node.children)}_`;
    case 'delete':
      return `-${phrasing(node.children)}-`;
    case 'inlineCode':
      return `{{${node.value}}}`;
    case 'link': {
      const label = phrasing(node.children);
      return `[${label}|${node.url}]`;
    }
    case 'break':
      return '\n';
    case 'image':
      return `!${node.url}!`;
    case 'html':
      return '';
    default:
      if ('children' in node && Array.isArray(node.children)) {
        return phrasing(node.children as PhrasingContent[]);
      }
      return '';
  }
}

function headingWiki(node: Heading): string {
  const level = Math.min(Math.max(node.depth, 1), 6);
  return `h${level}. ${phrasing(node.children)}`;
}

function listItemWiki(
  item: ListItem,
  depth: number,
  ordered: boolean,
): string {
  const marker = ordered ? '#'.repeat(depth + 1) : '*'.repeat(depth + 1);
  const parts: string[] = [];
  const nested: string[] = [];

  for (const child of item.children) {
    if (child.type === 'paragraph') {
      parts.push(phrasing(child.children));
    } else if (child.type === 'list') {
      nested.push(listWiki(child, depth + 1));
    } else {
      parts.push(blockWiki(child as BlockContent));
    }
  }

  const line = `${marker} ${parts.join(' ')}`.trimEnd();
  if (!nested.length) return line;
  return `${line}\n${nested.join('\n')}`;
}

function listWiki(list: List, depth = 0): string {
  const ordered = list.ordered ?? false;
  return list.children
    .map((item) => listItemWiki(item, depth, ordered))
    .join('\n');
}

function tableRowWiki(row: TableRow, header: boolean): string {
  const cells = row.children.map((cell: TableCell) => phrasing(cell.children));
  if (header) {
    return `||${cells.join('||')}||`;
  }
  return `|${cells.join('|')}|`;
}

function tableWiki(table: Table): string {
  const [head, ...body] = table.children;
  const lines: string[] = [];
  if (head) lines.push(tableRowWiki(head, true));
  for (const row of body) {
    lines.push(tableRowWiki(row, false));
  }
  return lines.join('\n');
}

function codeWiki(value: string, lang: string | null | undefined): string {
  const open =
    lang && /^[A-Za-z0-9_+-]+$/.test(lang) ? `{code:${lang}}` : '{code}';
  return `${open}\n${value}\n{code}`;
}

function blockWiki(node: BlockContent | Content): string {
  switch (node.type) {
    case 'heading':
      return headingWiki(node);
    case 'paragraph':
      return phrasing(node.children);
    case 'list':
      return listWiki(node);
    case 'blockquote': {
      const inner = node.children
        .map((child) => {
          if (child.type === 'paragraph') {
            return phrasing(child.children);
          }
          return blockWiki(child as BlockContent);
        })
        .filter(Boolean)
        .join('\n');
      return `{quote}\n${inner}\n{quote}`;
    }
    case 'code':
      return codeWiki(node.value, node.lang);
    case 'thematicBreak':
      return '----';
    case 'table':
      return tableWiki(node);
    case 'html':
      return '';
    default:
      if (
        'children' in node &&
        Array.isArray((node as { children: unknown }).children)
      ) {
        return ((node as { children: RootContent[] }).children)
          .map((child) => blockWiki(child as BlockContent))
          .filter(Boolean)
          .join('\n\n');
      }
      return '';
  }
}

export function markdownToJira(markdown: string): string {
  if (!markdown.trim()) return '';
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const parts: string[] = [];

  for (const child of tree.children) {
    const wiki = blockWiki(child as BlockContent);
    if (wiki) parts.push(wiki);
  }

  return parts.join('\n\n');
}
