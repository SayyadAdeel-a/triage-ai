# TriageAI Project Context

## Architecture
- **Monorepo:** Contains two main packages.
  - `apps/web`: The core desktop application built with Next.js (App Router), Tailwind CSS, Prisma, and wrapped in Electron.
  - `apps/landing`: The marketing landing page built with Vite + React + Tailwind CSS.
- **Database:** Supabase PostgreSQL managed via Prisma.
- **Data Integration:** We use MCP (Model Context Protocol) to fetch data. `lib/mcp-client.ts` spawns a local email server, and `lib/linkedin-mcp-client.ts` spawns a local LinkedIn scraper server.
- **AI Processing:** 
  - `lib/ai-processor.ts` fetches emails via MCP, runs a RAG pipeline against user `Knowledge` from the database, and uses an LLM (via `generateTextWithFallback`) to categorize emails and generate draft replies.
  - `lib/linkedin-processor.ts` does the exact same for LinkedIn.

## Core Data Models
- **Email & LinkedInMessage:** Stores the message ID, original body, sender info, LLM-generated summary, priority (1-5), and draft reply.
- **Category:** User-defined and default folders (e.g., "Needs Reply", "Promotions", "Important").
- **Knowledge & Rule:** User-defined documents embedded using `generateEmbedding` for vector search during email summarization to give the AI context.
- **AppConfig:** Stores IMAP credentials, LinkedIn connection state, and AutoSync preferences.

## UI & Design System Guidelines
- **Vibe:** Playful, vibrant, and colorful. The user specifically loves colors similar to Gemini and Spotify.
- **Prohibited Aesthetics:** DO NOT use dark, futuristic, or "all-black" themes. The UI should be a clean mix of light/dark with vibrant pops of color (Primary brand color: Neon Green `#1ed43c`).
- **Components:** Standardized shadcn UI components should be used whenever possible.

## Current State
- The landing page is finished, separated into `apps/landing`, and deployed to Vercel.
- The Vibe-Code cleanup has been completed on the backend (deduplicated server actions, consolidated LLM prompt processing).
- **Pending Task:** Finish the full design of the Dashboard UI (`apps/web/src/app/page.tsx` and related components) to match the vibrant aesthetic.

## Important Engineering Rules
1. Server actions must be wrapped in `withAuthAndRateLimit` from `app/actions.ts`.
2. Do not rewrite existing working business logic. If you need to refactor, make it small, targeted, and reversible.
3. The Next.js app is wrapped in Electron (`apps/web/main/index.js`), so do not rely exclusively on standard browser APIs without fallback.
