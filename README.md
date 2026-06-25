# TriageAI

TriageAI is a self-hosted, AI-powered desktop application built to help founders and executives aggressively manage their inbox. By directly integrating with your email (IMAP) and LinkedIn, TriageAI acts as an autonomous assistant to categorize, draft replies, and execute bulk actions using local MCP tools and LLMs.

## Architecture

This project is a monorepo that houses:

- **Web / Desktop App (`apps/web`)**: A Next.js 14 App Router application that doubles as a web dashboard and an Electron desktop app using `electron-builder`.
- **Proxy Server (`apps/proxy`)**: A local Express proxy server that facilitates secure, cross-origin communication with IMAP and other local services.
- **Background Sync (`apps/background_sync`)**: Headless Python automation scripts (e.g., Playwright for LinkedIn scraping/syncing).

## Key Features

- **Multi-Inbox Support**: Seamlessly sync and manage both Email and LinkedIn messages.
- **Smart Categorization**: Automatically categorizes emails (Needs Reply, Important, Newsletters, Spam) using an AI pipeline.
- **Autonomous Drafting**: AI pre-drafts replies based on historical context.
- **Live Sync**: Real-time IMAP IDLE watcher to sync new emails instantly.
- **Bulk Archive & Trashing**: Quickly clean up low-priority categories.

## Getting Started

1. **Install Dependencies:**
   Run `npm install` inside the `apps/web` directory (and other app directories).

2. **Environment Variables:**
   Rename `.env.example` to `.env` in `apps/web` and fill in your Supabase and LLM API keys.

3. **Run the Development Server:**
   Inside `apps/web`, run:
   ```bash
   npm run dev
   ```
   This command starts the Next.js development server and launches the Electron desktop app concurrently.

4. **Building for Production:**
   To package the app as a standalone executable:
   ```bash
   npm run build
   ```

## Deployment (Landing Page)

The landing page can be deployed directly to Vercel. 
- Ensure your Vercel project's **Root Directory** is set to `apps/web`.
- Vercel will automatically detect the Next.js framework and build the public-facing site.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Shadcn UI
- **Desktop Wrapper**: Electron
- **Database / Auth**: Prisma + Supabase
- **AI / LLMs**: Vercel AI SDK, Groq, OpenRouter
- **Local Services**: Node.js Proxy, Python Playwright
