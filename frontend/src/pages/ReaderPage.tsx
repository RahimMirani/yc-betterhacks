import React, { useCallback, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { fetchPdfUrl, explain } from '../api';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const numPagesLimit = 500;

export default function ReaderPage() {
  const { paperId } = useParams<{ paperId: string }>();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatSelectedText, setChatSelectedText] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const pdfUrl = paperId ? fetchPdfUrl(paperId) : '';

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(Math.min(n, numPagesLimit));
  }, []);

  const handleMouseUp = useCallback(() => {
    const sel = document.getSelection();
    if (!sel) return;
    const text = sel.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }
    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({ text, rect });
    } catch {
      setSelection(null);
    }
  }, []);

  const handleExplain = useCallback(() => {
    if (!selection?.text || !paperId) return;
    const selectedText = selection.text;
    setChatSelectedText(selectedText);
    setShowChat(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user' as const,
        content: `Explain: "${selectedText.slice(0, 200)}${selectedText.length > 200 ? '…' : ''}"`,
      },
    ]);
    setLoading(true);
    explain(paperId, selectedText, [])
      .then(({ reply }) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant' as const, content: reply },
        ]);
      })
      .catch((e) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant' as const, content: `Error: ${e instanceof Error ? e.message : 'Failed to get explanation'}` },
        ]);
      })
      .finally(() => setLoading(false));
    setSelection(null);
  }, [selection, paperId]);

  const sendFollowUp = useCallback(() => {
    const msg = input.trim();
    if (!msg || !paperId || !chatSelectedText) return;
    const newUserMsg = { role: 'user' as const, content: msg };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);
    const fullHistory = [...messages, newUserMsg];
    explain(paperId, chatSelectedText, fullHistory)
      .then(({ reply }) => {
        setMessages((prev) => [...prev, { role: 'assistant' as const, content: reply }]);
      })
      .catch((e) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant' as const, content: `Error: ${e instanceof Error ? e.message : 'Failed'}` },
        ]);
      })
      .finally(() => setLoading(false));
  }, [input, paperId, chatSelectedText, messages]);

  if (!paperId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary">Missing paper ID.</p>
        <Link to="/" className="ml-2 text-primary underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-secondary hover:text-primary text-sm">
          Back to upload
        </Link>
        <span className="text-primary font-medium truncate max-w-[200px]" title={paperId}>
          {paperId}
        </span>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div
          className="flex-1 overflow-auto p-6 flex flex-col items-center"
          onMouseUp={handleMouseUp}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="py-12 text-secondary">Loading PDF…</div>
            }
            error={
              <div className="py-12 text-red-600">
                Failed to load PDF. Check that the backend is running and the paper exists.
              </div>
            }
          >
            {numPages !== null &&
              Array.from(new Array(numPages), (_, i) => (
                <Page
                  key={i + 1}
                  pageNumber={i + 1}
                  width={Math.min(700, typeof window !== 'undefined' ? window.innerWidth - 48 : 700)}
                  className="mb-4"
                />
              ))}
          </Document>
        </div>

        {selection && !showChat && (
          <div
            className="fixed z-10 flex items-center gap-2 px-3 py-2 bg-primary text-white rounded shadow-lg"
            style={{
              left: selection.rect.left + selection.rect.width / 2 - 60,
              top: selection.rect.top - 44,
            }}
          >
            <button
              type="button"
              onClick={handleExplain}
              className="text-sm font-medium hover:opacity-90"
            >
              Explain
            </button>
          </div>
        )}

        {showChat && (
          <div className="w-[360px] border-l border-border bg-background flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Explain</span>
              <button
                type="button"
                onClick={() => { setShowChat(false); setMessages([]); setChatSelectedText(''); }}
                className="text-secondary hover:text-primary text-sm"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-sm ${m.role === 'user' ? 'text-primary' : 'text-secondary'}`}
                >
                  <span className="font-medium">{m.role === 'user' ? 'You' : 'Assistant'}: </span>
                  <span className="whitespace-pre-wrap">{m.content}</span>
                </div>
              ))}
              {loading && (
                <div className="text-secondary text-sm">Thinking…</div>
              )}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendFollowUp()}
                placeholder="Ask a follow-up…"
                className="flex-1 border border-border rounded px-3 py-2 text-sm text-primary placeholder-secondary focus:outline-none focus:ring-1 focus:ring-success"
              />
              <button
                type="button"
                onClick={sendFollowUp}
                disabled={loading}
                className="px-3 py-2 bg-primary text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
