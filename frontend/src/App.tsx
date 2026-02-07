import React, { useState, useCallback } from 'react';
import PdfUpload from './components/PdfUpload';
import PaperViewer from './components/PaperViewer';
import Toolbar from './components/Toolbar';
import ImplementPanel from './components/ImplementPanel';
import { extractPdf, implementPaper } from './services/api';

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

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isImplementing, setIsImplementing] = useState(false);

  // Implementation result (used in Step 6)
  const [implementResult, setImplementResult] = useState<ImplementationResult | null>(null);
  const [implementError, setImplementError] = useState<string>('');

  // Handle PDF file selection
  const handleFileSelected = useCallback(async (file: File) => {
    setIsUploading(true);
    setImplementError('');

    try {
      // Create a blob URL for the PDF viewer
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      // Extract text from the PDF via backend
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
    }
  }, []);

  // Handle "Implement Paper" button click
  const handleImplementPaper = useCallback(async () => {
    if (!paperText) return;

    setIsImplementing(true);
    setImplementError('');
    setImplementResult(null);

    try {
      const result = await implementPaper(paperText);
      setImplementResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate implementation';
      setImplementError(message);
    } finally {
      setIsImplementing(false);
    }
  }, [paperText]);

  // Reset to upload state
  const handleReset = useCallback(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl('');
    setPaperText('');
    setPaperTitle('');
    setNumPages(0);
    setImplementResult(null);
    setImplementError('');
    setAppState('upload');
  }, [pdfUrl]);

  // Upload screen
  if (appState === 'upload') {
    return <PdfUpload onFileSelected={handleFileSelected} isLoading={isUploading} />;
  }

  // Reading screen with PDF viewer
  return (
    <div className="h-screen flex flex-col bg-white">
      <Toolbar
        paperTitle={paperTitle}
        numPages={numPages}
        isImplementing={isImplementing}
        onImplementPaper={handleImplementPaper}
        onReset={handleReset}
      />

      <div className="flex-1 flex min-h-0">
        {/* PDF Viewer */}
        <div className={`flex-1 flex flex-col min-w-0 ${implementResult ? 'w-1/2' : 'w-full'}`}>
          <PaperViewer pdfUrl={pdfUrl} />
        </div>

        {/* Implementation Panel */}
        {(implementResult || isImplementing || implementError) && (
          <div className="w-[480px] border-l border-border flex flex-col bg-white flex-shrink-0">
            {isImplementing && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm font-medium text-primary">Generating implementation...</p>
                  <p className="text-xs text-secondary mt-1">This may take 20-30 seconds</p>
                </div>
              </div>
            )}

            {implementError && !isImplementing && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-3">{implementError}</p>
                  <button
                    onClick={handleImplementPaper}
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
                onClose={() => setImplementResult(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
