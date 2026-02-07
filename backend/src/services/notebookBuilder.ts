/**
 * Helpers for constructing valid Jupyter Notebook (.ipynb) JSON.
 *
 * The .ipynb format is a JSON file with a specific structure.
 * This builder takes simple cell definitions and wraps them
 * into a fully valid notebook that Colab can open.
 */

export interface NotebookCell {
  cell_type: 'markdown' | 'code';
  source: string;
}

export interface NotebookJson {
  nbformat: number;
  nbformat_minor: number;
  metadata: Record<string, unknown>;
  cells: Array<{
    cell_type: string;
    metadata: Record<string, unknown>;
    source: string[];
    execution_count?: null;
    outputs?: unknown[];
  }>;
}

/**
 * Builds a valid .ipynb JSON object from an array of simple cell definitions.
 * Colab expects source lines to end with \n (except the last line).
 */
export function buildNotebook(cells: NotebookCell[], title?: string): NotebookJson {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.10.0',
        mimetype: 'text/x-python',
        file_extension: '.py',
      },
      colab: {
        provenance: [],
        ...(title ? { name: `${title}.ipynb` } : {}),
      },
    },
    cells: cells.map((cell) => {
      // Split source into lines, each ending with \n (except the last)
      const lines = cell.source.split('\n');
      const sourceLines = lines.map((line, i) =>
        i < lines.length - 1 ? line + '\n' : line
      );

      const base: {
        cell_type: string;
        metadata: Record<string, unknown>;
        source: string[];
        execution_count?: null;
        outputs?: unknown[];
      } = {
        cell_type: cell.cell_type,
        metadata: {},
        source: sourceLines,
      };

      // Code cells need execution_count and outputs
      if (cell.cell_type === 'code') {
        base.execution_count = null;
        base.outputs = [];
      }

      return base;
    }),
  };
}

/**
 * Converts a NotebookJson object to a formatted JSON string
 * suitable for uploading as a .ipynb file.
 */
export function notebookToString(notebook: NotebookJson): string {
  return JSON.stringify(notebook, null, 1);
}
