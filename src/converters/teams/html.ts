// Copyright (c) 2026 Y. Siva Sai Krishna. Ported from yssk markdown-to-teams. MIT.

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

import {
  TEAMS_BLOCKQUOTE,
  TEAMS_HEADING,
  TEAMS_HR,
  TEAMS_INLINE_CODE,
  TEAMS_LI,
  TEAMS_LINK,
  TEAMS_OL,
  TEAMS_PARAGRAPH,
  TEAMS_PRE,
  TEAMS_TABLE,
  TEAMS_TD,
  TEAMS_TH,
  TEAMS_UL,
} from './styles.js';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function phrasing(nodes: PhrasingContent[] | undefined): string {
  if (!nodes?.length) return '';
  return nodes.map(phrasingNode).join('');
}

function phrasingNode(node: PhrasingContent): string {
  switch (node.type) {
    case 'text':
      return escapeHtml(node.value).replaceAll(/\r?\n/g, '<br>');
    case 'strong':
      return `<b>${phrasing(node.children)}</b>`;
    case 'emphasis':
      return `<i>${phrasing(node.children)}</i>`;
    case 'delete':
      return `<s>${phrasing(node.children)}</s>`;
    case 'inlineCode':
      return `<code style="${TEAMS_INLINE_CODE}">${escapeHtml(node.value)}</code>`;
    case 'link': {
      const href = escapeHtml(node.url);
      const label = phrasing(node.children) || href;
      return `<a href="${href}" style="${TEAMS_LINK}">${label}</a>`;
    }
    case 'break':
      return '<br>';
    case 'image': {
      const alt = escapeHtml(node.alt || '');
      const url = escapeHtml(node.url);
      return alt ? `${alt} (${url})` : url;
    }
    default:
      if ('children' in node && Array.isArray(node.children)) {
        return phrasing(node.children as PhrasingContent[]);
      }
      return '';
  }
}

function headingHtml(node: Heading): string {
  const level = Math.min(Math.max(node.depth, 1), 6);
  const style = TEAMS_HEADING[level] ?? TEAMS_HEADING[6];
  const content = phrasing(node.children);
  return `<h${level} style="${style}">${content}</h${level}>`;
}

function listItemHtml(item: ListItem): string {
  const parts: string[] = [];
  const nested: string[] = [];

  for (const child of item.children) {
    if (child.type === 'paragraph') {
      parts.push(phrasing(child.children));
    } else if (child.type === 'list') {
      nested.push(listHtml(child));
    } else {
      parts.push(blockHtml(child as BlockContent));
    }
  }

  return `<li style="${TEAMS_LI}">${parts.join(' ')}${nested.join('')}</li>`;
}

function listHtml(list: List): string {
  if (list.ordered) {
    return `<ol style="${TEAMS_OL}">${list.children.map(listItemHtml).join('')}</ol>`;
  }
  return `<ul style="${TEAMS_UL}">${list.children.map(listItemHtml).join('')}</ul>`;
}

function tableCellHtml(cell: TableCell, tag: 'th' | 'td'): string {
  const style = tag === 'th' ? TEAMS_TH : TEAMS_TD;
  return `<${tag} style="${style}">${phrasing(cell.children)}</${tag}>`;
}

function tableRowHtml(row: TableRow, header: boolean): string {
  const tag = header ? 'th' : 'td';
  return `<tr>${row.children.map((cell) => tableCellHtml(cell, tag)).join('')}</tr>`;
}

function tableHtml(table: Table): string {
  const [head, ...body] = table.children;
  const headHtml = head ? tableRowHtml(head, true) : '';
  const bodyHtml = body.map((row) => tableRowHtml(row, false)).join('');
  return `<table style="${TEAMS_TABLE}"><thead>${headHtml}</thead><tbody>${bodyHtml}</tbody></table>`;
}

function blockHtml(node: BlockContent | Content): string {
  switch (node.type) {
    case 'heading':
      return headingHtml(node);
    case 'paragraph':
      return `<p style="${TEAMS_PARAGRAPH}">${phrasing(node.children)}</p>`;
    case 'list':
      return listHtml(node);
    case 'blockquote': {
      const inner = node.children
        .map((child) => {
          if (child.type === 'paragraph') {
            return phrasing(child.children);
          }
          return blockHtml(child as BlockContent);
        })
        .filter(Boolean)
        .join('<br>');
      return `<blockquote style="${TEAMS_BLOCKQUOTE}">${inner}</blockquote>`;
    }
    case 'code':
      return `<pre style="${TEAMS_PRE}"><code>${escapeHtml(node.value)}</code></pre>`;
    case 'thematicBreak':
      return `<hr style="${TEAMS_HR}">`;
    case 'table':
      return tableHtml(node);
    case 'html':
      return '';
    default:
      if (
        'children' in node &&
        Array.isArray((node as { children: unknown }).children)
      ) {
        return ((node as { children: RootContent[] }).children)
          .map((c) => blockHtml(c as BlockContent))
          .filter(Boolean)
          .join('');
      }
      return '';
  }
}

type BlockPiece = {
  html: string;
  startsAtLine?: number;
  endsAtLine?: number;
};

/** Inline-styled blocks already have margins; only add &lt;br&gt; for extra blank lines. */
function separatorAfter(previous: BlockPiece, next: BlockPiece): string {
  const lineBreaks =
    previous.endsAtLine && next.startsAtLine
      ? Math.max(1, next.startsAtLine - previous.endsAtLine)
      : 2;
  const brCount = Math.max(0, lineBreaks - 2);
  return brCount > 0 ? '<br>'.repeat(brCount) : '';
}

function joinPieces(pieces: BlockPiece[]): string {
  if (!pieces.length) return '';
  let out = pieces[0].html;
  for (let i = 1; i < pieces.length; i++) {
    const gap = separatorAfter(pieces[i - 1], pieces[i]);
    out += (gap ? gap : '') + pieces[i].html;
  }
  return out;
}

/**
 * HTML for Teams rich paste + matching in-app preview.
 * Inline-styled blocks; one markdown blank line is covered by element margins.
 * Extra blank lines add &lt;br&gt; between blocks.
 */
export function markdownToTeamsHtml(markdown: string): string {
  if (!markdown.trim()) return '';
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const pieces: BlockPiece[] = [];

  for (const child of tree.children) {
    const html = blockHtml(child as BlockContent);
    if (!html) continue;
    pieces.push({
      html,
      startsAtLine: child.position?.start.line,
      endsAtLine: child.position?.end.line,
    });
  }

  return joinPieces(pieces);
}
