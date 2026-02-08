import React, { useState, useCallback, useMemo } from 'react';
import PdfUpload from './components/PdfUpload';
import PaperViewer from './components/PaperViewer';
import OutlineSidebar, { OutlineItem } from './components/OutlineSidebar';
import Toolbar from './components/Toolbar';
import ImplementPanel from './components/ImplementPanel';
import { uploadPdf } from './api';
import {
  extractPdf,
  extractPdfFromUrl,
  implementPaper,
  storePaper,
  StepProgress,
  CitationSummary,
} from './services/api';


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

type AppState = 'upload' | 'reading';

export default function App() {
  // App state
  const [appState, setAppState] = useState<AppState>('upload');

  // PDF / paper data
  const [paperText, setPaperText] = useState<string>('');
  const [paperTitle, setPaperTitle] = useState<string>('');
  const [paperPdfUrl, setPaperPdfUrl] = useState<string>('');
  const [paperNumPages, setPaperNumPages] = useState<number>(0);
  const [paperId, setPaperId] = useState<string | null>(null);

  // Outline & navigation
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [scrollToSectionId, setScrollToSectionId] = useState<string | null>(null);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isImplementing, setIsImplementing] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepProgress | null>(null);

  // Implementation result
  const [implementResult, setImplementResult] = useState<ImplementationResult | null>(null);
  const [implementError, setImplementError] = useState<string>('');

  // Citation state
  const [paperId, setPaperId] = useState<string | null>(null);
  const [citations, setCitations] = useState<CitationSummary[]>([]);

  // Panel visibility
  const [showImplementPanel, setShowImplementPanel] = useState(false);

  // Derive current section name for breadcrumb
  const currentSectionName = useMemo(() => {
    if (!activeSectionId || !outline.length) return '';
    const item = outline.find((o) => o.id === activeSectionId);
    return item?.title || '';
  }, [activeSectionId, outline]);

  // ── PDF Upload Handlers ──

  const handleFileSelected = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadMessage('Extracting text from PDF...');
    setImplementError('');

    try {
      const nextPdfUrl = URL.createObjectURL(file);
      setPaperPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextPdfUrl;
      });

      const result = await extractPdf(file);
      const extractedText = result.text;
      const extractedTitle = result.title || file.name.replace('.pdf', '');
      setPaperText(extractedText);
      setPaperTitle(extractedTitle);
      setPaperNumPages(result.numPages || 0);
      setPaperId(uploadResult?.paperId ?? null);
      setAppState('reading');

      // Fire-and-forget: store paper for citation extraction
      storePaper(extractedText, extractedTitle)
        .then((stored) => {
          setPaperId(stored.id);
          setCitations(stored.citations);
        })
        .catch(() => {
          // Graceful degradation — paper still renders normally
        });
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
      const extractedText = result.text;
      const extractedTitle =
        result.title || new URL(url).pathname.split('/').pop() || 'Research Paper';
      setPaperText(extractedText);
      setPaperTitle(extractedTitle);
      setPaperNumPages(result.numPages || 0);
      setPaperPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return result.pdfBlobUrl || '';
      });
      setAppState('reading');

      // Fire-and-forget: store paper for citation extraction
      storePaper(extractedText, extractedTitle)
        .then((stored) => {
          setPaperId(stored.id);
          setCitations(stored.citations);
        })
        .catch(() => {
          // Graceful degradation — paper still renders normally
        });
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
      const message =
        error instanceof Error ? error.message : 'Failed to generate implementation';
      setImplementError(message);
    } finally {
      setIsImplementing(false);
    }
  }, [paperText, implementResult]);

  // ── Outline & Navigation ──

  const handleOutlineExtracted = useCallback((extractedOutline: OutlineItem[]) => {
    setOutline(extractedOutline);
    if (extractedOutline.length > 0) {
      setActiveSectionId(extractedOutline[0].id);
    }
  }, []);

  const handleSectionChange = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
  }, []);

  const handleNavigateToSection = useCallback((sectionId: string) => {
    setScrollToSectionId(sectionId);
    setTimeout(() => setScrollToSectionId(null), 500);
  }, []);

  // ── Reset ──

  const handleReset = useCallback(() => {
    setPaperText('');
    setPaperTitle('');
    setPaperNumPages(0);
    setPaperId(null);
    setPaperPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setOutline([]);
    setActiveSectionId('');
    setScrollToSectionId(null);
    setImplementResult(null);
    setImplementError('');
    setShowImplementPanel(false);
    setPaperId(null);
    setCitations([]);
    setAppState('upload');
  }, []);

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
        currentSection={currentSectionName}
        isImplementing={isImplementing}
        hasResult={!!implementResult}
        onImplementPaper={handleImplementPaper}
        onReset={handleReset}
      />

      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar — Outline */}
        <OutlineSidebar
          outline={outline}
          activeSectionId={activeSectionId}
          onNavigateToSection={handleNavigateToSection}
        />

        {/* Paper Content Viewer */}
        <PaperViewer
          paperText={paperText}
          paperTitle={paperTitle}
          pdfUrl={paperPdfUrl}
          numPages={paperNumPages}
          paperId={paperId}
          citations={citations}
          onOutlineExtracted={handleOutlineExtracted}
          onSectionChange={handleSectionChange}
          scrollToSectionId={scrollToSectionId}
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
