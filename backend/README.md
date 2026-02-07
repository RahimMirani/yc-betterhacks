# Better Papers Backend

TypeScript backend API for the Better Papers application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run production build:
   ```bash
   npm start
   ```

## Project Structure

```
backend/
├── src/
│   └── index.ts          # Main server entry point
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint

## Environment Variables

Create a `.env` file for environment-specific configuration:
- `PORT` - Server port (default: 3001)
