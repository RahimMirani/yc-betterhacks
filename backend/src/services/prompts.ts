/**
 * Prompt for explaining research paper content at a given comprehension level.
 */
export function explainPrompt(text: string, level: string): string {
    const levelGuidance: Record<string, string> = {
      beginner:
        "Assume the reader has no prior background. Use plain language, avoid jargon, and introduce any necessary concepts step by step. Use analogies where helpful.",
      intermediate:
        "Assume the reader has basic familiarity with the field. You may use standard terminology but briefly clarify non-obvious terms. Focus on the paper's contributions and how they fit into existing work.",
      expert:
        "Assume the reader is familiar with the domain. Be concise and precise. Emphasize novel contributions, methodological details, and limitations.",
    };
    const guidance = levelGuidance[level] ?? levelGuidance.intermediate;
  
    return `You are explaining research paper content to a reader. Target level: **${level}**.
  
  ${guidance}
  
  ---
  
  RESEARCH CONTENT TO EXPLAIN:
  
  ${text}
  
  ---
  
  Provide a clear, well-structured explanation. Use short paragraphs and optional bullet points or numbered steps. Do not invent information not present in the content.`;
  }
  
  /**
   * Prompt for turning research paper content into runnable Python code.
   */
  export function implementPrompt(text: string): string {
    return `You are converting research paper content into clean, runnable Python code.
  
  Requirements:
  - Reproduce algorithms, formulas, or procedures described in the text as faithfully as possible.
  - Use standard libraries (e.g., numpy, scipy, matplotlib) where appropriate; avoid obscure dependencies unless the paper specifies them.
  - Add brief comments for non-obvious steps.
  - Include comments mapping code to paper notation
  - Include a minimal example or usage at the end if it helps verify the implementation.
  - Do not add placeholder or TODO code; only output complete, executable code.
  
  ---
  
  RESEARCH CONTENT TO IMPLEMENT:
  
  ${text}
  
  ---
  
  Output only the Python code, with no surrounding markdown code fences unless the consumer explicitly expects them.`;
  }
  
  /**
   * Prompt for turning research paper content into a Google Colab notebook.
   */
  export function notebookPrompt(fullText: string): string {
    return `You are converting research paper content into a Google Colab notebook (Jupyter-style).
  
  Requirements:
  - Structure the notebook with a mix of Markdown and code cells.
  - Use Markdown cells for: title, section headers, and explanations of what each code block does and how it relates to the paper.
  - Use code cells for: imports, data loading, implementing algorithms/formulas from the paper, and visualizations.
  - Order content logically: intro → setup → method/algorithm → results/plots.
  - Code must be runnable in Colab (use common libraries: numpy, scipy, matplotlib, pandas). Avoid file paths that assume local disk unless the notebook explains how to upload data.
  - Output the notebook as valid JSON in the standard Jupyter notebook format: {"cells": [{"cell_type": "markdown"|"code", "source": ["line1", "line2"], "metadata": {}}, ...], "metadata": {...}, "nbformat": 4, "nbformat_minor": 4}.
  
  ---
  
  RESEARCH CONTENT FOR THE NOTEBOOK:
  
  ${fullText}
  
  ---
  
  Produce the full notebook JSON and nothing else (no surrounding explanation or markdown).`;
  }