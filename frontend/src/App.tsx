import React, { useState, useCallback, useMemo } from 'react';
import PdfUpload from './components/PdfUpload';
import PaperViewer from './components/PaperViewer';
import OutlineSidebar, { OutlineItem } from './components/OutlineSidebar';
import Toolbar from './components/Toolbar';
import ImplementPanel from './components/ImplementPanel';
import { extractPdf, extractPdfFromUrl, implementPaper, StepProgress } from './services/api';

// Types for the implementation result
interface ImplementationResult {
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
}

// App states
type AppState = 'upload' | 'reading';

export default function App() {
  // App state
  const [appState, setAppState] = useState<AppState>('upload');

  // PDF data
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [paperText, setPaperText] = useState<string>('');
  const [paperTitle, setPaperTitle] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);

  // Outline & navigation
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scrollToPage, setScrollToPage] = useState<number | null>(null);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isImplementing, setIsImplementing] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepProgress | null>(null);

  // Implementation result
  const [implementResult, setImplementResult] = useState<ImplementationResult | null>(null);
  const [implementError, setImplementError] = useState<string>('');

  // Panel visibility
  const [showImplementPanel, setShowImplementPanel] = useState(false);

  // Derive current section from page + outline
  const currentSection = useMemo(() => {
    if (!outline.length || !currentPage) return '';
    let section = '';
    for (const item of outline) {
      if (item.pageNumber <= currentPage) {
        section = item.title;
      }
    }
    return section;
  }, [currentPage, outline]);

  // ── PDF Upload Handlers ──

  const handleFileSelected = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadMessage('Extracting text from PDF...');
    setImplementError('');

    try {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      const result = await extractPdf(file);
      setPaperText(result.text);
      setPaperTitle(result.title || file.name.replace('.pdf', ''));
      setNumPages(result.numPages);
      setAppState('reading');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process PDF';
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
    }
  }, []);

  const handleUrlSubmitted = useCallback(async (url: string) => {
    setIsUploading(true);
    setUploadMessage('Fetching PDF from URL...');
    setImplementError('');

    try {
      const result = await extractPdfFromUrl(url);
      setPdfUrl(result.pdfBlobUrl);
      setPaperText(result.text);
      setPaperTitle(result.title || new URL(url).pathname.split('/').pop() || 'Research Paper');
      setNumPages(result.numPages);
      setAppState('reading');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load PDF from URL';
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
    }
  }, []);

  // ── Implement Paper ──

  const handleImplementPaper = useCallback(async () => {
    if (!paperText) return;

    // If result already exists, just toggle the panel
    if (implementResult) {
      setShowImplementPanel((prev) => !prev);
      return;
    }

    setIsImplementing(true);
    setImplementError('');
    setImplementResult(null);
    setCurrentStep(null);
    setShowImplementPanel(true);

    try {
      const result = await implementPaper(paperText, (step) => {
        setCurrentStep(step);
      });
      setImplementResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate implementation';
      setImplementError(message);
    } finally {
      setIsImplementing(false);
    }
  }, [paperText, implementResult]);

  // ── Outline & Navigation ──

  const handleOutlineExtracted = useCallback(
    (extractedOutline: OutlineItem[]) => {
      if (extractedOutline.length > 0) {
        setOutline(extractedOutline);
      } else if (paperText && numPages > 0) {
        // Fallback: extract headings from the paper text
        const fallback = extractOutlineFromText(paperText, numPages);
        setOutline(fallback);
      }
    },
    [paperText, numPages]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleNavigateToPage = useCallback((page: number) => {
    setScrollToPage(page);
    // Reset after short delay so clicking the same item again still works
    setTimeout(() => setScrollToPage(null), 500);
  }, []);

  const handleDocumentLoad = useCallback(
    (np: number) => {
      if (!numPages) setNumPages(np);
    },
    [numPages]
  );

  // ── Reset ──

  const handleReset = useCallback(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl('');
    setPaperText('');
    setPaperTitle('');
    setNumPages(0);
    setOutline([]);
    setCurrentPage(1);
    setScrollToPage(null);
    setImplementResult(null);
    setImplementError('');
    setShowImplementPanel(false);
    setAppState('upload');
  }, [pdfUrl]);

  // ── Upload screen ──

  if (appState === 'upload') {
    return (
      <PdfUpload
        onFileSelected={handleFileSelected}
        onUrlSubmitted={handleUrlSubmitted}
        isLoading={isUploading}
        loadingMessage={uploadMessage}
      />
    );
  }

  // ── Reading screen ──

  const showPanel = showImplementPanel && (implementResult || isImplementing || implementError);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Toolbar
        paperTitle={paperTitle}
        currentSection={currentSection}
        isImplementing={isImplementing}
        hasResult={!!implementResult}
        onImplementPaper={handleImplementPaper}
        onReset={handleReset}
      />

      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <OutlineSidebar
          outline={outline}
          currentPage={currentPage}
          onNavigateToPage={handleNavigateToPage}
        />

        {/* PDF Viewer */}
        <PaperViewer
          pdfUrl={pdfUrl}
          onDocumentLoad={handleDocumentLoad}
          onOutlineExtracted={handleOutlineExtracted}
          onPageChange={handlePageChange}
          scrollToPage={scrollToPage}
        />

        {/* Implementation Panel (right side) */}
        {showPanel && (
          <div className="w-[480px] border-l border-border flex flex-col bg-white flex-shrink-0">
            {isImplementing && (
              <div className="flex-1 flex items-center justify-center px-8">
                <div className="w-full max-w-xs">
                  <p className="text-sm font-medium text-primary mb-6 text-center">
                    Generating implementation
                  </p>
                  <div className="space-y-3">
                    {[
                      { step: 1, label: 'Analyzing paper' },
                      { step: 2, label: 'Creating implementation plan' },
                      { step: 3, label: 'Generating notebook' },
                      { step: 4, label: 'Uploading to Colab' },
                    ].map(({ step, label }) => {
                      const isActive = currentStep?.step === step && !currentStep?.done;
                      const isDone = currentStep
                        ? currentStep.step > step ||
                          (currentStep.step === step && currentStep.done)
                        : false;
                      const isPending = !currentStep || currentStep.step < step;

                      return (
                        <div key={step} className="flex items-center gap-3">
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {isDone && (
                              <svg
                                className="w-4 h-4 text-success"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            {isActive && (
                              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}
                            {isPending && (
                              <div className="w-2 h-2 rounded-full bg-gray-200" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isActive
                                ? 'text-primary font-medium'
                                : isDone
                                ? 'text-secondary'
                                : 'text-gray-300'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {implementError && !isImplementing && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-3">{implementError}</p>
                  <button
                    onClick={() => {
                      setImplementResult(null);
                      handleImplementPaper();
                    }}
                    className="text-sm text-primary underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {implementResult && !isImplementing && (
              <ImplementPanel
                result={implementResult}
                onClose={() => setShowImplementPanel(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Fallback: extract section headings from paper text when PDF has no embedded outline.
 * Estimates page numbers based on character position in the text.
 */
function extractOutlineFromText(text: string, totalPages: number): OutlineItem[] {
  const items: OutlineItem[] = [];
  const lines = text.split('\n');
  const totalLength = text.length;
  let charPos = 0;
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();

    let matched = false;
    let level = 0;

    // Abstract
    if (/^Abstract$/i.test(trimmed)) {
      matched = true;
      level = 0;
    }
    // Numbered sections: "1 Introduction", "1. Introduction"
    else if (/^\d+\.?\s+[A-Z]/.test(trimmed) && trimmed.length > 4 && trimmed.length < 80) {
      matched = true;
      level = 0;
    }
    // Sub-sections: "3.1 Architecture", "3.1. Architecture"
    else if (/^\d+\.\d+\.?\s+[A-Z]/.test(trimmed) && trimmed.length > 4 && trimmed.length < 80) {
      matched = true;
      level = 1;
    }
    // Common end sections
    else if (/^(References|Acknowledgments?|Appendix.*)$/i.test(trimmed)) {
      matched = true;
      level = 0;
    }

    if (matched && !seen.has(trimmed)) {
      seen.add(trimmed);
      const estimatedPage = Math.max(1, Math.ceil((charPos / totalLength) * totalPages));
      items.push({ title: trimmed, pageNumber: estimatedPage, level });
    }

    charPos += line.length + 1;
  }

  return items;
}
