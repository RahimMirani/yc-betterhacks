import React, { useState } from 'react';
import NotebookPreview from './NotebookPreview';

interface ImplementPanelProps {
  result: {
    colabUrl: string;
    gistUrl: string;
    downloadUrl: string;
    analysis: {
      title: string;
      domain: string;
      coreProblem: string;
      coreContribution: string;
      paperComplexity: string;
      methods: Array<{ name: string; description: string; section: string }>;
      requiredLibraries: string[];
    };
    plan: {
      summary: string;
      framework: string;
      frameworkReasoning: string;
      simplifications: string[];
      steps: Array<{
        order: number;
        title: string;
        description: string;
        components: string[];
        estimatedLines: number;
      }>;
      demoDataStrategy: string;
    };
    notebookCells: Array<{
      cell_type: 'markdown' | 'code';
      source: string;
    }>;
    meta: {
      totalCells: number;
      codeCells: number;
      markdownCells: number;
      pipelineDurationSeconds: number;
    };
  };
  onClose: () => void;
}

type Tab = 'notebook' | 'plan';

export default function ImplementPanel({ result, onClose }: ImplementPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('notebook');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-primary">Implementation Ready</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors"
            title="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Primary CTA: Open in Colab */}
        <a
          href={result.colabUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Open in Google Colab
        </a>

        {/* Secondary actions */}
        <div className="flex gap-2 mt-2">
          <a
            href={result.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-1.5 border border-border rounded-md text-xs text-secondary hover:text-primary hover:border-gray-400 transition-colors"
          >
            Download .ipynb
          </a>
          <a
            href={result.gistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-1.5 border border-border rounded-md text-xs text-secondary hover:text-primary hover:border-gray-400 transition-colors"
          >
            View on GitHub
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 border-b border-border -mb-3">
          <button
            onClick={() => setActiveTab('notebook')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'notebook'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Notebook
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'plan'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Plan
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'notebook' && (
          <NotebookPreview cells={result.notebookCells} />
        )}

        {activeTab === 'plan' && (
          <div className="overflow-y-auto h-full p-4 space-y-5">
            {/* Summary */}
            <div>
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                Summary
              </h3>
              <p className="text-sm text-primary leading-relaxed">
                {result.plan.summary}
              </p>
            </div>

            {/* Framework */}
            <div>
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                Framework
              </h3>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-primary capitalize">
                  {result.plan.framework}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-secondary rounded">
                  {result.analysis.paperComplexity} complexity
                </span>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                {result.plan.frameworkReasoning}
              </p>
            </div>

            {/* Analysis */}
            <div>
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                Paper Analysis
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-secondary">Domain: </span>
                  <span className="text-primary">{result.analysis.domain}</span>
                </div>
                <div>
                  <span className="text-xs text-secondary">Problem: </span>
                  <span className="text-primary">{result.analysis.coreProblem}</span>
                </div>
                <div>
                  <span className="text-xs text-secondary">Contribution: </span>
                  <span className="text-primary">{result.analysis.coreContribution}</span>
                </div>
              </div>
            </div>

            {/* Methods */}
            {result.analysis.methods.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                  Key Methods
                </h3>
                <div className="space-y-2">
                  {result.analysis.methods.map((method, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-primary">{method.name}</span>
                      <span className="text-xs text-secondary ml-1">({method.section})</span>
                      <p className="text-xs text-secondary mt-0.5">{method.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Implementation Steps */}
            <div>
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                Implementation Steps
              </h3>
              <div className="space-y-3">
                {result.plan.steps.map((step) => (
                  <div key={step.order} className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-medium text-secondary">{step.order}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary">{step.title}</p>
                      <p className="text-xs text-secondary mt-0.5">{step.description}</p>
                      {step.components.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {step.components.map((comp, j) => (
                            <span
                              key={j}
                              className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 text-secondary rounded"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simplifications */}
            {result.plan.simplifications.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                  Simplifications
                </h3>
                <ul className="space-y-1">
                  {result.plan.simplifications.map((s, i) => (
                    <li key={i} className="text-xs text-secondary leading-relaxed flex gap-1.5">
                      <span className="text-gray-400 flex-shrink-0">—</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Libraries */}
            <div>
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1.5">
                Libraries
              </h3>
              <div className="flex flex-wrap gap-1">
                {result.analysis.requiredLibraries.map((lib, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-2 py-0.5 bg-gray-100 text-secondary rounded"
                  >
                    {lib}
                  </span>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div className="text-xs text-secondary border-t border-border pt-3">
              Generated in {result.meta.pipelineDurationSeconds}s — {result.meta.totalCells} cells
              ({result.meta.codeCells} code, {result.meta.markdownCells} markdown)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
