# StudyAI — Your personal AI-powered study companion

A production-quality AI study assistant that helps students ask questions, explain concepts, summarize material, generate quizzes, and create personalized study plans.

## Project Overview

StudyAI is an AI-powered web application designed for students. It provides a clean, modern interface where you can interact with an AI tutor across five study modes — chat, explain, summarize, quiz, and plan — all backed by a secure server-side AI integration.

## Features

- **AI Chat** — Conversational AI tutor with markdown rendering, copy, regenerate, and retry
- **Explain Mode** — Get structured explanations of any concept at beginner/intermediate/advanced levels
- **Summarizer** — Turn long study material into concise notes with key points and quick revision
- **Quiz Generator** — Generate practice quizzes (multiple choice, true/false, mixed) with scoring and answer review
- **Study Planner** — Create personalized study plans with daily sessions, priorities, and completion tracking
- **History** — Browse, search, and delete past conversations
- **Settings** — Toggle dark/light mode, set AI difficulty and response style, manage data
- **Dashboard** — Track stats: questions asked, topics studied, quizzes generated, study sessions
- **Dark Mode** — Polished light and dark themes, persisted across sessions
- **Responsive** — Full sidebar on desktop, drawer + bottom nav on mobile
- **LocalStorage** — Conversations, quizzes, plans, settings, and stats persist across refreshes

## Tech Stack

- **React** + **TypeScript** — type-safe UI
- **Next.js** (App Router) — server-side API routes for secure AI calls
- **Tailwind CSS** + **shadcn/ui** — premium design system
- **Lucide React** — icons
- **react-markdown** + **remark-gfm** — markdown rendering with GFM support
- **sonner** — toast notifications
- **LocalStorage** — client-side persistence for history, plans, and preferences

## Setup

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
AI_API_KEY=your_api_key_here
```

### Optional overrides

```env
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

The app uses any OpenAI-compatible Chat Completions API. If no `AI_API_KEY` is set, a built-in offline fallback generates structured study responses so the app remains usable for demos.

## Architecture

```
Frontend (React) → /api/ai (Next.js API route) → AI Provider API → Response → Frontend
```

1. The frontend sends user messages to the `/api/ai` server-side endpoint.
2. The endpoint reads `AI_API_KEY` from environment variables (never exposed to the browser).
3. The server calls the AI provider and returns the response.
4. The frontend renders the AI response with markdown formatting.

### Provider abstraction

The AI provider logic lives in `lib/ai-provider.ts`. It supports any OpenAI-compatible API and can be swapped by changing the environment variables — no frontend changes needed.

## Security

- **API keys are never exposed to the browser.** They are read from environment variables on the server only.
- The frontend calls `/api/ai` (a Next.js API route), which proxies the request to the AI provider.
- No credentials are stored in LocalStorage, client-side JavaScript, or URLs.
- `.env` is listed in `.gitignore` and will never be committed.

## Internship Requirements

This application demonstrates:

| Requirement | Implementation |
|---|---|
| **AI API integration** | Server-side `/api/ai` route calls an OpenAI-compatible API |
| **User-friendly prompt/response interface** | Chat with markdown, explain, summarize, quiz, and planner modes |
| **AI-generated responses** | All AI responses rendered with markdown, copy, and regenerate |
| **Loading states** | Animated "Thinking…" indicators on every AI request |
| **Error handling** | Friendly error messages with retry buttons for failed requests |
| **Input validation** | Empty prompts, invalid quiz counts, invalid study hours all validated |
| **Secure API credentials** | API key server-side only, never in frontend code |
| **Documentation** | This README with setup, architecture, and security explanations |
