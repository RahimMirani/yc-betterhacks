export interface NotebookCell {
  cell_type: "markdown" | "code";
  source: string[];
  metadata: Record<string, unknown>;
  execution_count?: number | null;
  outputs?: unknown[];
}

export interface Notebook {
  nbformat: number;
  nbformat_minor: number;
  metadata: Record<string, unknown>;
  cells: NotebookCell[];
}

/**
 * Converts markdown text containing fenced code blocks (e.g. ```python ... ```)
 * into a valid Jupyter notebook JSON. Sequential markdown and code segments
 * become alternating markdown and code cells.
 */
export function markdownToNotebook(markdown: string): Notebook {
  const cells: NotebookCell[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastEnd = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const [, _lang, code] = match;
    const markdownSegment = markdown.slice(lastEnd, match.index).trim();
    if (markdownSegment) {
      cells.push({
        cell_type: "markdown",
        source: linesToSource(markdownSegment),
        metadata: {},
      });
    }
    cells.push({
      cell_type: "code",
      source: linesToSource(code.trimEnd()),
      metadata: {},
      execution_count: null,
      outputs: [],
    });
    lastEnd = codeBlockRegex.lastIndex;
  }

  const trailingMarkdown = markdown.slice(lastEnd).trim();
  if (trailingMarkdown) {
    cells.push({
      cell_type: "markdown",
      source: linesToSource(trailingMarkdown),
      metadata: {},
    });
  }

  return {
    nbformat: 4,
    nbformat_minor: 4,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: {
        name: "python",
        version: "3.10.0",
      },
    },
    cells,
  };
}

/**
 * Jupyter source: array of lines, each line ending with \n except the last.
 */
function linesToSource(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  return lines.map((line, i) =>
    i < lines.length - 1 ? line + "\n" : line
  );
}
