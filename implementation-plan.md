# Implement Paper → Google Colab: Implementation Plan

## What We're Building

When a user uploads a research paper PDF, they can click "Implement Paper". The system will:
1. Extract text from the PDF
2. Use Claude to deeply analyze the paper
3. Use Claude to create an implementation plan
4. Use Claude to generate a full `.ipynb` notebook with explanations + code
5. Upload the notebook to a GitHub Gist
6. Present a preview panel + "Open in Google Colab" link

The user sees: **click button → watch notebook being built → open in Colab**

---

## Step-by-Step Breakdown

### Step 1: Backend — PDF Text Extraction Endpoint

**What:** Create a POST `/api/extract-pdf` endpoint that accepts a PDF file upload and returns the extracted text.

**Details:**
- Install `multer` (file upload handling) and `pdf-parse` (PDF text extraction)
- Create the endpoint that accepts multipart/form-data with a PDF file
- Extract all text from the PDF, preserving section structure as much as possible
- Return the extracted text as JSON
- Add basic validation (file type, file size limit ~50MB)

**Files to create/modify:**
- `backend/src/index.ts` — add multer middleware
- `backend/src/routes/pdf.ts` — new route file for PDF endpoints
- `backend/src/services/pdfExtractor.ts` — PDF extraction logic

**New dependencies:** `multer`, `pdf-parse`, `@types/multer`

---

### Step 2: Backend — Claude AI Analysis Pipeline

**What:** Create a service that takes paper text and runs it through a 3-step Claude pipeline (analyze → plan → generate notebook).

**Details:**
- Install `@anthropic-ai/sdk`
- Create the Claude service with three methods:
  1. `analyzePaper(text)` — Returns structured analysis (methods, algorithms, equations, hyperparameters, datasets, key insights)
  2. `createImplementationPlan(text, analysis)` — Returns ordered implementation roadmap
  3. `generateNotebook(text, analysis, plan)` — Returns `.ipynb` JSON
- Each step uses carefully crafted prompts
- Each step passes its output to the next step for richer context
- Store the `.ipynb` format builder (helper to construct valid Jupyter notebook JSON)

**Files to create/modify:**
- `backend/src/services/claude.ts` — Claude API client + 3 pipeline methods
- `backend/src/services/notebookBuilder.ts` — Helper to construct valid `.ipynb` JSON structure
- `backend/src/config.ts` — API keys and config (reads from env vars)
- `backend/.env` — Environment variables (ANTHROPIC_API_KEY)

**New dependencies:** `@anthropic-ai/sdk`, `dotenv`

---

### Step 3: Backend — GitHub Gist Upload Service

**What:** Create a service that uploads a generated `.ipynb` file to GitHub Gist and returns the Colab URL.

**Details:**
- Install `octokit` (GitHub API client)
- Create a service that:
  1. Takes the `.ipynb` JSON content
  2. Uploads it as a GitHub Gist (using a server-side GitHub token)
  3. Returns the Gist URL and the Colab URL (`https://colab.research.google.com/gist/{user}/{gist_id}`)
- Gists are created as public (so Colab can access them without auth)

**Files to create/modify:**
- `backend/src/services/gist.ts` — Gist upload logic
- `backend/.env` — Add GITHUB_TOKEN, GITHUB_USERNAME

**New dependencies:** `octokit`

---

### Step 4: Backend — Implement Paper Endpoint (Ties It All Together)

**What:** Create a POST `/api/implement-paper` endpoint that orchestrates the full pipeline.

**Details:**
- Accepts a paper ID or the extracted text
- Calls the Claude pipeline (analyze → plan → notebook)
- Uploads the notebook to Gist
- Returns: notebook preview data + Colab URL + Gist URL
- Add error handling for each step
- Add a timeout (Claude calls can take 15-30 seconds)

**Files to create/modify:**
- `backend/src/routes/implement.ts` — new route file
- `backend/src/index.ts` — register the new route

**Flow:**
```
POST /api/implement-paper { paperText: string }
  → claude.analyzePaper(paperText)
  → claude.createImplementationPlan(paperText, analysis)
  → claude.generateNotebook(paperText, analysis, plan)
  → gist.upload(notebook)
  → Response: { colabUrl, gistUrl, notebook, analysis, plan }
```

---

### Step 5: Frontend — PDF Upload + Paper Viewer (Basic)

**What:** Create the basic UI — a page where users can upload a PDF, and it displays with a toolbar.

**Details:**
- Install Tailwind CSS and configure it
- Create a clean upload page (drag-and-drop or file picker)
- After upload, show the PDF in a viewer area (can use `react-pdf` or an iframe initially)
- Add a top toolbar with an "Implement Paper" button
- Wire up the upload to call `POST /api/extract-pdf`
- Store the extracted text in state

**Files to create/modify:**
- `frontend/src/App.tsx` — main layout
- `frontend/src/components/PdfUpload.tsx` — upload component
- `frontend/src/components/PaperViewer.tsx` — PDF display component
- `frontend/src/components/Toolbar.tsx` — top toolbar with actions
- Tailwind CSS configuration files

**New dependencies:** `react-pdf` (or `@react-pdf-viewer/core`), Tailwind CSS packages

---

### Step 6: Frontend — "Implement Paper" Flow + Preview Panel

**What:** When the user clicks "Implement Paper", show a right-side panel with the generated notebook preview and a Colab link.

**Details:**
- Click "Implement Paper" → call `POST /api/implement-paper`
- Show loading state: "Analyzing paper..." → "Creating implementation plan..." → "Generating notebook..."
- When done, open a right-side panel showing:
  - The implementation plan summary (from Step 2 of the pipeline)
  - Rendered notebook preview (markdown cells rendered, code cells syntax-highlighted)
  - "Open in Google Colab" button (primary, prominent)
  - "Download .ipynb" button (secondary)
- The panel sits side-by-side with the PDF viewer

**Files to create/modify:**
- `frontend/src/components/ImplementPanel.tsx` — right-side panel
- `frontend/src/components/NotebookPreview.tsx` — renders notebook cells
- `frontend/src/components/NotebookCell.tsx` — individual cell renderer (markdown or code)
- `frontend/src/services/api.ts` — API client for backend calls

**New dependencies:** `react-syntax-highlighter` (for code cells), `react-markdown` (for markdown cells)

---

### Step 7: Polish + Error Handling + Loading States

**What:** Make it feel production-quality.

**Details:**
- Add proper error states (PDF too large, extraction failed, Claude API error, Gist upload failed)
- Add a progress indicator that shows which pipeline step is active
- Add smooth panel open/close transitions (CSS only, no heavy animation libraries)
- Ensure the layout is responsive and doesn't break on resize
- Add a toast/notification when notebook is ready
- Test with 2-3 real research papers end-to-end

**Files to modify:**
- Various existing components
- `frontend/src/components/LoadingStates.tsx` — new loading/error components

---

## File Structure After All Steps

```
backend/
  src/
    index.ts                    — Express app setup + route registration
    config.ts                   — Environment variables + configuration
    routes/
      pdf.ts                    — PDF upload + extraction endpoint
      implement.ts              — Implement paper endpoint (orchestrator)
    services/
      pdfExtractor.ts           — PDF text extraction logic
      claude.ts                 — Claude API pipeline (analyze, plan, generate)
      notebookBuilder.ts        — .ipynb JSON construction helpers
      gist.ts                   — GitHub Gist upload service
  .env                          — API keys (ANTHROPIC_API_KEY, GITHUB_TOKEN)

frontend/
  src/
    App.tsx                     — Main layout (PDF viewer + side panel)
    components/
      PdfUpload.tsx             — Drag-and-drop PDF upload
      PaperViewer.tsx           — PDF display
      Toolbar.tsx               — Top toolbar with "Implement Paper" button
      ImplementPanel.tsx        — Right-side implementation panel
      NotebookPreview.tsx       — Renders full notebook preview
      NotebookCell.tsx          — Individual cell (markdown or code)
      LoadingStates.tsx         — Loading/error UI components
    services/
      api.ts                    — Backend API client
```

---

## Environment Variables Needed

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ |
| `GITHUB_TOKEN` | https://github.com/settings/tokens (needs "gist" scope only) |
| `GITHUB_USERNAME` | Your GitHub username |

---

## Estimated Time Per Step

| Step | What | Time |
|---|---|---|
| 1 | PDF text extraction endpoint | ~15 min |
| 2 | Claude AI analysis pipeline | ~45 min |
| 3 | GitHub Gist upload service | ~15 min |
| 4 | Implement paper endpoint (orchestrator) | ~15 min |
| 5 | Frontend — upload + PDF viewer + toolbar | ~30 min |
| 6 | Frontend — implement panel + notebook preview | ~45 min |
| 7 | Polish + error handling | ~30 min |
| **Total** | | **~3 hours** |

---

## Order Matters

Steps 1-4 are backend, Steps 5-6 are frontend. We build backend first so the API is ready when the frontend needs it. Step 7 is polish across both.

**Ready to start Step 1?**
