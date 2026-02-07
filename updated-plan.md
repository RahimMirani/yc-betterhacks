# Better Papers — Updated Plan

## Context
Hackathon project: an interactive research paper reader that turns static PDFs into living documents. Not "chat with AI over PDF" — a genuinely new reading interface where explanations, code, and citations are embedded directly into the reading flow via inline popovers.

## Priority Features (Hackathon Scope)
1. **Highlight-to-Explain** — Select text, get instant contextual explanation in an inline popover
2. **Highlight-to-Implement** — Select equation/algorithm, get working code in a popover
3. **Smart Citations** — Click citation markers, see cited paper context + relevance + few paragraphs

## Removed / Deferred
- Knowledge Assessment — low priority, later if time
- Progress Tracking / Gamification — low priority, later if time

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **PDF:** react-pdf
- **Styling:** Tailwind CSS (light, minimal design system)
- **AI:** Claude API via @anthropic-ai/sdk
- **Citations:** Semantic Scholar API
- **Code highlighting:** react-syntax-highlighter

## Project Structure
```
app/
├── layout.tsx                  # Root layout, fonts, global styles
├── page.tsx                    # Landing page (upload PDF / pick demo)
├── reader/
│   └── page.tsx                # Main reader view
└── api/
    ├── explain/route.ts        # Claude: explain highlighted text
    ├── implement/route.ts      # Claude: generate code from selection
    ├── parse-pdf/route.ts      # Extract full text from uploaded PDF
    └── citation/route.ts       # Fetch citation via Semantic Scholar + Claude

components/
├── PdfViewer.tsx               # react-pdf wrapper, renders pages
├── SelectionToolbar.tsx        # Floating toolbar on text select
├── Popover.tsx                 # Positioned popover container
├── ExplainPopover.tsx          # Streams explanation
├── CodePopover.tsx             # Shows generated code with syntax highlighting
├── CitationPopover.tsx         # Shows citation context
├── PdfUpload.tsx               # Upload / drag-drop
└── DemoPaperCard.tsx           # Preloaded paper selector

lib/
├── claude.ts                   # Claude API helpers (streaming)
├── pdf.ts                      # PDF text extraction (pdf-parse)
├── citations.ts                # Semantic Scholar API client
└── prompts.ts                  # Claude prompt templates

public/papers/
└── attention.pdf               # Preloaded "Attention Is All You Need"
```

## Build Order

### Phase 1: Setup + PDF Viewer
- Init Next.js + Tailwind + dependencies
- Landing page with upload and preloaded demo
- PdfViewer rendering pages cleanly
- Clean design: white bg, good typography, spacing

### Phase 2: Text Selection + Toolbar
- Detect text selection on PDF pages
- Floating toolbar near selection: "Explain" and "Implement" buttons
- Dismisses on click elsewhere

### Phase 3: Highlight-to-Explain
- `/api/parse-pdf` — extract full paper text with pdf-parse
- `/api/explain` — selected text + paper context → Claude streams explanation
- ExplainPopover: inline popover near selection, streams response

### Phase 4: Highlight-to-Implement
- `/api/implement` — selected text + paper context → Claude streams code
- CodePopover: syntax-highlighted code, copy button, language label

### Phase 5: Smart Citations
- Parse references from PDF, build citation map
- Detect [1], [2] markers in text, make clickable
- `/api/citation` — query Semantic Scholar + Claude for context
- CitationPopover: title, authors, abstract, relevance explanation

### Phase 6: Polish
- Preloaded demo paper works perfectly
- Smooth popover fade-in
- Loading states, error handling
- Flawless demo flow end-to-end

## Key Details
- **Streaming:** All Claude routes stream responses for instant feedback
- **Context-aware:** Full paper text sent with every Claude call so explanations aren't generic
- **Popover positioning:** Calculated from selection bounding rect, uses portal to avoid clipping
- **Citation detection:** Regex for [1], [2, 3], (Smith et al., 2020) patterns
- **Semantic Scholar:** Free API, no auth needed

## Design System
- Background: #FFFFFF
- Primary text: #1a1a1a
- Secondary text: #6b7280
- Borders: #e5e7eb
- Code blocks: #f9fafb
- No gradients, no emojis, no unnecessary animations
- System fonts, 16-18px base, 1.6-1.8 line height
