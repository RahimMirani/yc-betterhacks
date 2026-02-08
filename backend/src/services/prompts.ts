/**
 * Prompt for explaining research paper content at a given comprehension level.
 * Optimized for short, crisp, to-the-point explanations.
 */
export function explainPrompt(text: string, level: string): string {
  const levelGuidance: Record<string, string> = {
    beginner:
      "Assume no prior background. Use plain language and one simple analogy if it helps. No long intros.",
    intermediate:
      "Assume basic familiarity. Use standard terms; clarify only non-obvious ones in a few words.",
    expert:
      "Assume domain familiarity. Be precise; emphasize what's novel or non-obvious in the selection.",
  };
  const guidance = levelGuidance[level] ?? levelGuidance.intermediate;

  return `You explain short excerpts from research papers. Target level: **${level}**.

${guidance}

Brevity rules:
- Answer in 2–5 sentences. One short paragraph is ideal.
- Do not repeat the selected text. Do not add long preamble or recap.
- State the main idea first, then one key detail or implication if needed.
- Do not invent information; stick to what the content says.

---
RESEARCH EXCERPT TO EXPLAIN:

${text}

---
Reply with a short, crisp explanation only. No bullet lists unless the excerpt explicitly lists items.`;
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