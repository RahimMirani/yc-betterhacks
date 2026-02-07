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
- Frontend: React + PDF.js (all TypeScript)
- Backend: Node.js / Python (all TypeScript)
- AI: Claude API for comprehension, explanation, and code generation
- Code execution: Google Colab API integration
- Storage: Simple DB for user progress (at the end if needed)
- Styling: Tailwind CSS (configured for minimal design system)

