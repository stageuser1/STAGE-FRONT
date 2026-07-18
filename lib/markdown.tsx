import type { ReactNode } from "react";

/**
 * Minimal, safe markdown renderer for requirement/repertoire prose.
 * Builds React nodes directly (no raw HTML), so injected markup in the
 * data can never execute. Supports: paragraphs, ####/### headings,
 * ordered + unordered lists (one nesting level), GFM tables, blockquotes,
 * bold, italics, inline code, and links.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\((?:https?:\/\/)[^)\s]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyBase}-${index++}`;
    if (token.startsWith("**")) {
      nodes.push(
        <strong className="font-semibold text-ink-900" key={key}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          className="rounded bg-ink-100 px-1 py-0.5 text-[13px] text-ink-700"
          key={key}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const split = token.indexOf("](");
      const label = token.slice(1, split);
      const url = token.slice(split + 2, -1);
      nodes.push(
        <a
          className="text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700"
          href={url}
          key={key}
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

interface ListItem {
  text: string;
  children: string[];
}

function parseListItems(
  lines: string[],
  start: number,
  matcher: RegExp,
): { items: ListItem[]; next: number } {
  const items: ListItem[] = [];
  let i = start;
  while (i < lines.length) {
    const top = matcher.exec(lines[i]);
    if (top) {
      items.push({ text: top[1], children: [] });
      i += 1;
      continue;
    }
    const nested = /^\s{2,}(?:[-*•]|\d+[.)])\s+(.*)$/.exec(lines[i]);
    if (nested && items.length > 0) {
      items[items.length - 1].children.push(nested[1]);
      i += 1;
      continue;
    }
    break;
  }
  return { items, next: i };
}

function renderList(
  items: ListItem[],
  ordered: boolean,
  key: string,
): ReactNode {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={`space-y-1.5 pl-5 text-sm leading-6 text-ink-700 ${
        ordered ? "list-decimal marker:font-medium" : "list-disc"
      } marker:text-brand-600`}
      key={key}
    >
      {items.map((item, index) => (
        <li key={`${key}-${index}`}>
          {inline(item.text, `${key}-${index}`)}
          {item.children.length > 0 ? (
            <ul className="mt-1 list-[circle] space-y-1 pl-4 marker:text-ink-400">
              {item.children.map((child, childIndex) => (
                <li key={`${key}-${index}-${childIndex}`}>
                  {inline(child, `${key}-${index}-${childIndex}`)}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </Tag>
  );
}

function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(lines: string[], key: string): ReactNode {
  const [headerLine, ...rest] = lines;
  const bodyLines = rest.filter(
    (line) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(line) || !line.includes("-"),
  );
  const header = tableCells(headerLine);
  return (
    <div className="overflow-x-auto" key={key}>
      <table className="w-full min-w-[360px] border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th
                className="border-b border-line bg-ink-50 px-3 py-2 text-left text-xs font-semibold text-ink-700"
                key={`${key}-h-${index}`}
              >
                {inline(cell, `${key}-h-${index}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyLines.map((line, rowIndex) => (
            <tr key={`${key}-r-${rowIndex}`}>
              {tableCells(line).map((cell, cellIndex) => (
                <td
                  className="border-b border-line-subtle px-3 py-2 align-top leading-5 text-ink-700"
                  key={`${key}-r-${rowIndex}-${cellIndex}`}
                >
                  {inline(cell, `${key}-r-${rowIndex}-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function renderMarkdown(text: string): ReactNode {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      blocks.push(
        <h4
          className="pt-1 text-sm font-semibold leading-6 text-ink-900"
          key={`h-${key++}`}
        >
          {inline(heading[2], `h-${key}`)}
        </h4>,
      );
      i += 1;
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const { items, next } = parseListItems(lines, i, /^\s{0,1}[-*•]\s+(.*)$/);
      blocks.push(renderList(items, false, `ul-${key++}`));
      i = next;
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const { items, next } = parseListItems(
        lines,
        i,
        /^\s{0,1}\d+[.)]\s+(.*)$/,
      );
      blocks.push(renderList(items, true, `ol-${key++}`));
      i = next;
      continue;
    }

    if (isTableLine(line) && i + 1 < lines.length && isTableLine(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const dividerFiltered = tableLines.filter(
        (row, index) => !(index === 1 && /^[\s:|-]+$/.test(row)),
      );
      blocks.push(renderTable(dividerFiltered, `t-${key++}`));
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          className="border-l-2 border-brand-300 pl-3 text-sm leading-6 text-ink-500"
          key={`q-${key++}`}
        >
          {inline(quoteLines.join(" "), `q-${key}`)}
        </blockquote>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6})\s+/.test(lines[i].trim()) &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+[.)]\s+/.test(lines[i].trim()) &&
      !isTableLine(lines[i]) &&
      !lines[i].trim().startsWith(">")
    ) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p className="text-sm leading-6 text-ink-700" key={`p-${key++}`}>
        {inline(paragraphLines.join(" "), `p-${key}`)}
      </p>,
    );
  }

  return <div className="space-y-2.5">{blocks}</div>;
}
