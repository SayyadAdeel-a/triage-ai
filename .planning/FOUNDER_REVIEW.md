# Founder Review & Core Philosophy

This document contains the critical founder-level review and product philosophy for TriageAI. All AI agents working on this project MUST read and understand this context to avoid hallucinating incorrect scope or generic features.

## 1. The Core Wedge
**Target Market:** Founders and freelancers who are drowning in inbound money/admin/sales emails.
- High email volume, high urgency, high willingness to pay.
- Do NOT build a "generic productivity tool" for everyone.

## 2. The #1 Bottleneck: Adoption Friction
- **The Reality:** Users will NOT easily configure IMAP, create app passwords, or trust an unknown system with their inbox.
- **The Solution:** The MVP success depends entirely on the **demo experience**, not real integration.
- We must provide a "try without connecting email" mode (demo inbox/sample data). This is the MAIN conversion engine.

## 3. Temporary Architecture
- **MCP Server:** Using an Email MCP Server is fine for development speed, but it is a **temporary acceleration layer**, not a core long-term dependency.
- **Avoid Backend Hell:** Do not spend 70% of time on syncing, edge cases, IMAP bugs, and provider differences. Focus on the "wow moment".

## 4. The Killer Loop
- What makes the user come back? A daily inbox digest, a morning briefing, or an action list.
- **The Output:** "What needs my attention today."
- **The Action Layer:** "Reply Needed", "Ignore", "Important".
- Do not overengineer AI behavior (confidence scoring, fallback logic, correction loops) until the core 60-second clarity loop is proven.

## 5. UI/UX Philosophy
- You cannot "fully postpone UI thinking" because turning messy emails into structured decisions *is* the UI.
- **Phase 1:** Build "ugly UI but correct flow" (plain list, 3-4 buttons max, no styling obsession) to validate flow.
- If it affects what the user sees first, understands in 5 seconds, or clicks 👉 design it now.
- If it affects colors, spacing, animations, branding 👉 ignore it for now.

## 6. The Real Product Truth
TriageAI is **NOT** an "email processing system".
TriageAI **IS** a "60-second inbox clarity generator for overwhelmed founders".
