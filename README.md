# Better Papers

A browser-based interface for reading research papers that adapts to your knowledge level. Better Papers transforms static PDFs into an interactive, personalized reading experience with adaptive explanations, smart citations, and AI-assisted comprehension.

## 🚀 Overview

Reading research papers is often a linear and defying process. Better Papers solves this by:

- **Assessing your background** to tailor explanations to your level.
- **Contextualizing citations** inline, so you never lose your place.
- **Generating executable code** from theoretical concepts using AI.
- **Providing instant clarification** for complex terms and math.

## ✨ Key Features

- **Knowledge Assessment**: Adapts the reading experience based on your understanding of core concepts.
- **Progressive Depth**: Start with high-level summaries and drill down into technical details at your own pace.
- **Smart Citations**: Instantly view cited papers and their context without leaving the current page.
- **Highlight-to-Explain**: Select text to get AI-powered explanations, visualizations, or simplifications.
- **Code Implementation**:
  - **Full Paper**: Generate a complete Google Colab notebook for the entire paper.
  - **Partial**: Implement specific algorithms or equations with a single click.
- **📊 Progress Tracking**: Gamified reading experience with progress bars and comprehension checkpoints.

## 🛠️ Tech Stack

### Frontend

- **Framework**: React (TypeScript)
- **PDF Rendering**: React-PDF / PDF.js
- **Styling**: Tailwind CSS
- **Routing**: React Router

### Backend

- **Runtime**: Node.js
- **Framework**: Express (TypeScript)
- **AI Models**: OpenAI & Anthropic (Claude)
- **Database**: Neon (PostgreSQL pgVector)
- **PDF Processing**: PDF Parse

## 🏁 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API Keys for OpenAI and Anthropic
- Neon Database Connection String

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/RahimMirani/yc-betterhacks.git
   cd yc-betterhacks
   ```

2. **Setup Backend**

   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the `backend` directory based on `.env.example`:

   ```bash
   PORT=3001
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ANTHROPIC_API_KEY=your_anthropic_key
   OPENAI_API_KEY=your_openai_key
   GITHUB_TOKEN=your_github_token
   GITHUB_USERNAME=your_github_username
   ```

   Start the backend server:

   ```bash
   npm run dev
   ```

3. **Setup Frontend**
   Open a new terminal and navigate to the frontend directory:

   ```bash
   cd frontend
   npm install
   ```

   Start the React application:

   ```bash
   npm start
   ```

   The app should now be running at `http://localhost:3000`.

## 📂 Project Structure

```
yc-betterhacks/
├── backend/                # Node.js/Express API
│   ├── src/
│   │   ├── db/             # Database migrations and queries
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic & AI integration
│   │   └── index.ts        # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/               # React Client
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   └── App.tsx         # Main component
│   ├── public/
│   └── package.json
├── project-overview.md     # Detailed project documentation
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.
