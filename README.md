# Better Papers

A browser-based interface for reading research papers that adapts to your knowledge level. Upload a PDF and get a personalized reading experience with adaptive explanations, interactive citations, AI-assisted comprehension, and executable code implementations.

## Demo

[![Demo Video](https://img.youtube.com/vi/d1YbuB0d1KE/0.jpg)](https://www.youtube.com/watch?v=d1YbuB0d1KE)

## Features

- **Knowledge Assessment**: The system gauges your understanding before reading and provides necessary background.
- **Progressive Depth**: Explanations start simple and reveal technical depth as you proceed.
- **Smart Citations**: Inline fetching and contextualization of cited works.
- **Highlight-to-Explain**: Select text for instant AI explanations, diagrams, or examples.
- **Code Implementation**: 
  - **Full Paper**: Generates a complete Google Colab notebook implementing the paper's methodology.
  - **Partial**: Implement specific algorithms or equations with a click.
- **Progress Tracking**: Visual progress bars and comprehension checkpoints.

## Tech Stack

- **Frontend**: React (TypeScript), Tailwind CSS, PDF.js (`react-pdf`)
- **Backend**: Node.js (TypeScript), Express
- **AI**: Anthropic Claude (Analysis & Code Gen), OpenAI (Embeddings/Completions)
- **Database**: Neon (Serverless PostgreSQL)
- **Infrastructure**: GitHub Gists (for storing generated notebooks)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Accounts/API Keys for:
  - Anthropic (Claude)
  - OpenAI
  - Neon Database (PostgreSQL string)
  - GitHub (Personal Access Token with `gist` scope)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository_url>
cd yc-betterhacks
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
PORT=3001
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENAI_API_KEY=sk-xxx
GITHUB_TOKEN=ghp_xxx  # Needs 'gist' scope
GITHUB_USERNAME=your_username
```

Start the backend server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:3001`.

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Start the React development server:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

1. **Upload a Paper**: Drag and drop a research paper (PDF) onto the upload area.
2. **Read & Interact**: 
   - Highlight text to get explanations.
   - Click citations to see context.
3. **Implement**: 
   - Click the "Implement Paper" button to generate a full code implementation.
   - The system will analyze the paper, create a plan, generate a Jupyter notebook, and upload it as a GitHub Gist.
   - You can then open the notebook directly in Google Colab.

## License

[ISC](LICENSE)
